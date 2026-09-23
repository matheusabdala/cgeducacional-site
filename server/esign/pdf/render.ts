import "server-only";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { EsignFieldKind, EsignSignatureMethod } from "@prisma/client";
import { displaySize, toDisplayRect, toPdfPoint } from "./geometry";
import { fitText, pdfSafe } from "./text";
import { appendReport } from "./report";
import { formatCpfFull, formatDate, formatDateTime, maskCpf } from "../format";
import type { Geo, PageBox } from "../types";

export type RenderSigner = {
  id: string;
  order: number;
  label: string; // nome pré-definido ou "Signatário N"
  status: "pending" | "signed";
  signedName: string | null;
  signedCpf: string | null;
  signedEmail: string | null;
  signedAt: Date | null;
  method: EsignSignatureMethod | null;
  ip: string | null;
  device: string | null;
  phoneIp: string | null;
  phoneDevice: string | null;
  otpEmail: string | null;
  otpVerifiedAt: Date | null;
  geo: Geo | null;
  signatureSha256: string | null;
  png: Uint8Array | null;
};

export type RenderInput = {
  original: Uint8Array;
  code: string;
  title: string;
  originalName: string;
  originalSha256: string;
  pageCount: number;
  pageSizes: PageBox[];
  status: "draft" | "pending" | "completed" | "cancelled";
  createdByName: string;
  createdAt: Date;
  completedAt: Date | null;
  requireOtp: boolean;
  signers: RenderSigner[];
  fields: { signerId: string; kind: EsignFieldKind; page: number; x: number; y: number; w: number; h: number }[];
  validationUrl: string;
  logoPng: Uint8Array | null;
};

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);
const LINE = rgb(0.75, 0.78, 0.84);

type Ctx = { page: PDFPage; box: PageBox };

function drawTextAt(c: Ctx, text: string, u: number, vBaseline: number, size: number, font: PDFFont, color = INK) {
  const p = toPdfPoint(c.box, u, vBaseline);
  c.page.drawText(text, { x: p.x, y: p.y, size, font, color, rotate: degrees(c.box.rotate) });
}

function drawImageAt(c: Ctx, img: PDFImage, u: number, vBottom: number, w: number, h: number) {
  const p = toPdfPoint(c.box, u, vBottom);
  c.page.drawImage(img, { x: p.x, y: p.y, width: w, height: h, rotate: degrees(c.box.rotate) });
}

function drawLineAt(c: Ctx, u1: number, v1: number, u2: number, v2: number) {
  const a = toPdfPoint(c.box, u1, v1);
  const b = toPdfPoint(c.box, u2, v2);
  c.page.drawLine({ start: a, end: b, thickness: 0.5, color: LINE });
}

/**
 * Gera o PDF assinado a partir do ORIGINAL (idempotente): carimba cada assinatura
 * já feita no seu campo, preenche campos de nome/CPF/data, marca o rodapé de cada
 * página e anexa o "Relatório de assinaturas".
 */
export async function renderSignedPdf(input: RenderInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input.original, { updateMetadata: false });
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  const signed = new Map(input.signers.filter((s) => s.status === "signed").map((s) => [s.id, s]));
  const images = new Map<string, PDFImage>();
  for (const s of signed.values()) {
    if (s.png) images.set(s.id, await pdf.embedPng(s.png));
  }

  for (const f of input.fields) {
    const s = signed.get(f.signerId);
    const page = pages[f.page];
    const box = input.pageSizes[f.page];
    if (!s || !page || !box) continue;
    const c: Ctx = { page, box };
    const r = toDisplayRect(box, f);

    if (f.kind === "signature") {
      const img = images.get(s.id);
      const capSize = Math.max(4.2, Math.min(6.2, r.h * 0.11));
      const capH = capSize * 2.35;
      const imgArea = Math.max(r.h - capH - 1, r.h * 0.45);
      if (img) {
        const scale = Math.min(r.w / img.width, imgArea / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        drawImageAt(c, img, r.u + (r.w - dw) / 2, r.v + imgArea, dw, dh);
      }
      drawLineAt(c, r.u, r.v + imgArea + 0.5, r.u + r.w, r.v + imgArea + 0.5);
      const line1 = fitText(helv, `Assinado eletronicamente por ${s.signedName ?? ""}`, capSize, r.w);
      const line2 = fitText(
        helv,
        `CPF ${maskCpf(s.signedCpf)} · ${s.signedAt ? formatDateTime(s.signedAt) : ""} · ${input.code}`,
        capSize,
        r.w,
      );
      drawTextAt(c, line1, r.u, r.v + imgArea + capSize * 1.2, capSize, helv, MUTED);
      drawTextAt(c, line2, r.u, r.v + imgArea + capSize * 2.3, capSize, helv, MUTED);
      continue;
    }

    const value =
      f.kind === "name"
        ? s.signedName ?? ""
        : f.kind === "cpf"
          ? formatCpfFull(s.signedCpf ?? "")
          : s.signedAt
            ? formatDate(s.signedAt)
            : "";
    const size = Math.max(6, Math.min(11, r.h * 0.62));
    drawTextAt(c, fitText(helv, value, size, r.w), r.u + 1, r.v + r.h / 2 + size * 0.35, size, helv);
  }

  // Marca discreta no rodapé de cada página do original (como Autentique/ZapSign).
  if (signed.size > 0) {
    const mark = pdfSafe(
      `Documento assinado eletronicamente · ${input.code} · valide em ${input.validationUrl.replace(/^https?:\/\//, "").split("?")[0]}`,
    );
    pages.forEach((page, i) => {
      const box = input.pageSizes[i];
      if (!box) return;
      const d = displaySize(box);
      const size = 5.5;
      const text = fitText(helv, mark, size, d.w - 36);
      drawTextAt({ page, box }, text, 18, d.h - 9, size, helv, MUTED);
    });
  }

  await appendReport(pdf, input, { helv, helvBold });
  return pdf.save({ useObjectStreams: true });
}
