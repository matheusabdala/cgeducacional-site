import "server-only";
import QRCode from "qrcode";
import { StandardFonts, rgb, type PDFDocument, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { ESIGN, LEGAL_BASIS } from "../config";
import { formatDateTime, maskCpf, maskEmail, METHOD_LABEL } from "../format";
import { fitText, pdfSafe, wrapText } from "./text";
import type { RenderInput, RenderSigner } from "./render";

const A4 = { w: 595.28, h: 841.89 };
const M = 44; // margem
const NAVY = rgb(5 / 255, 26 / 255, 97 / 255);
const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);
const BORDER = rgb(0.86, 0.88, 0.92);
const SOFT = rgb(0.965, 0.972, 0.988);
const GREEN = rgb(0.02, 0.52, 0.34);
const AMBER = rgb(0.72, 0.45, 0.02);
const FOOTER_H = 108;

type Fonts = { helv: PDFFont; helvBold: PDFFont };

const STATUS_LABEL: Record<RenderInput["status"], string> = {
  draft: "Rascunho",
  pending: "Aguardando assinaturas",
  completed: "Concluído — todas as assinaturas coletadas",
  cancelled: "Cancelado",
};

/** Anexa as páginas "Relatório de assinaturas" ao final do PDF. */
export async function appendReport(pdf: PDFDocument, input: RenderInput, fonts: Fonts) {
  const monoFont = await pdf.embedFont(StandardFonts.Courier);
  const logo = input.logoPng ? await pdf.embedPng(input.logoPng) : null;
  const qrPng = await QRCode.toBuffer(input.validationUrl, {
    type: "png",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
  });
  const qr = await pdf.embedPng(qrPng);
  const sigImages = new Map<string, PDFImage>();
  for (const s of input.signers) if (s.png) sigImages.set(s.id, await pdf.embedPng(s.png));

  const { helv, helvBold } = fonts;
  const reportPages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0; // cursor (coordenada do PDF, a partir do topo)
  const bottom = M + FOOTER_H;
  const contentW = A4.w - M * 2;

  const newPage = () => {
    page = pdf.addPage([A4.w, A4.h]);
    reportPages.push(page);
    y = A4.h - M;
    // Cabeçalho
    if (logo) {
      const h = 38;
      const w = (logo.width / logo.height) * h;
      page.drawImage(logo, { x: M, y: y - h, width: w, height: h });
    }
    page.drawText("Relatório de assinaturas", {
      x: A4.w - M - helvBold.widthOfTextAtSize("Relatório de assinaturas", 15),
      y: y - 15,
      size: 15,
      font: helvBold,
      color: NAVY,
    });
    const sub = pdfSafe(`${input.code} · ${input.title}`);
    const subFit = fitText(helv, sub, 8.5, 300);
    page.drawText(subFit, {
      x: A4.w - M - helv.widthOfTextAtSize(subFit, 8.5),
      y: y - 29,
      size: 8.5,
      font: helv,
      color: MUTED,
    });
    y -= 50;
    const company = `${ESIGN.company.name} · CNPJ ${ESIGN.company.cnpj} · ${ESIGN.company.site}`;
    page.drawText(pdfSafe(company), { x: M, y, size: 8, font: helv, color: MUTED });
    y -= 10;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: BORDER });
    y -= 18;
  };

  // Dentro de um bloco de signatário não quebra página (o bloco já reservou espaço).
  let noBreak = false;
  const ensure = (h: number) => {
    if (!noBreak && y - h < bottom) newPage();
  };

  const heading = (text: string) => {
    ensure(40);
    page.drawText(pdfSafe(text), { x: M, y, size: 11, font: helvBold, color: NAVY });
    y -= 16;
  };

  /** Linha chave/valor; valor pode quebrar em várias linhas. */
  const row = (x: number, width: number, label: string, value: string, opts?: { mono?: boolean; color?: ReturnType<typeof rgb> }) => {
    const labelW = 118;
    const font = opts?.mono ? monoFont : helv;
    const size = opts?.mono ? 7.2 : 8.6;
    const lines = wrapText(font, value || "—", size, width - labelW);
    const h = Math.max(12, lines.length * (size + 3)) + 2;
    ensure(h);
    page.drawText(pdfSafe(label), { x, y, size: 7.8, font: helv, color: MUTED });
    lines.forEach((l, i) =>
      page.drawText(l, { x: x + labelW, y: y - i * (size + 3), size, font, color: opts?.color ?? INK }),
    );
    y -= h;
  };

  newPage();

  // --- Documento ---------------------------------------------------------------
  heading("Documento");
  const signedCount = input.signers.filter((s) => s.status === "signed").length;
  row(M, contentW, "Título", input.title);
  row(M, contentW, "Código de validação", input.code);
  row(M, contentW, "Situação", `${STATUS_LABEL[input.status]} (${signedCount} de ${input.signers.length} assinaturas)`, {
    color: input.status === "completed" ? GREEN : input.status === "pending" ? AMBER : INK,
  });
  row(M, contentW, "Arquivo original", `${input.originalName} · ${input.pageCount} página(s)`);
  row(M, contentW, "Enviado por", `${input.createdByName} (${ESIGN.company.name})`);
  row(M, contentW, "Criado em", formatDateTime(input.createdAt));
  if (input.completedAt) row(M, contentW, "Concluído em", formatDateTime(input.completedAt));
  row(M, contentW, "SHA-256 do original", input.originalSha256, { mono: true });
  row(
    M,
    contentW,
    "Autenticação",
    input.requireOtp
      ? "Link pessoal e intransferível + código de verificação enviado ao e-mail do signatário"
      : "Link pessoal e intransferível enviado a cada signatário",
  );
  y -= 8;

  // --- Signatários --------------------------------------------------------------
  heading(`Assinaturas (${signedCount} de ${input.signers.length})`);
  const ordered = [...input.signers].sort((a, b) => a.order - b.order);
  for (const s of ordered) drawSigner(s);

  /** Altura que row() vai ocupar (mesma conta), para reservar o bloco inteiro. */
  function rowHeight(width: number, value: string, mono?: boolean) {
    const font = mono ? monoFont : helv;
    const size = mono ? 7.2 : 8.6;
    const lines = wrapText(font, value || "—", size, width - 118).length;
    return Math.max(12, lines * (size + 3)) + 2;
  }

  function drawSigner(s: RenderSigner) {
    const thumbW = 150;
    const leftW = contentW - thumbW - 16;
    const x = M + 10;

    type Row = [label: string, value: string, mono?: boolean];
    const rows: Row[] =
      s.status !== "signed"
        ? [["Situação", "Aguardando assinatura"]]
        : [
            ["CPF", maskCpf(s.signedCpf)],
            ...(s.signedEmail ? ([["E-mail", maskEmail(s.signedEmail)]] as Row[]) : []),
            ["Assinado em", s.signedAt ? `${formatDateTime(s.signedAt)} · UTC ${s.signedAt.toISOString()}` : "—"],
            ["Tipo de assinatura", s.method ? METHOD_LABEL[s.method] : "—"],
            ["Endereço IP", s.ip ?? "—"],
            ["Dispositivo", s.device ?? "—"],
            ...(s.method === "phone"
              ? ([["Celular usado", `${s.phoneDevice ?? "—"} · IP ${s.phoneIp ?? "—"}`]] as Row[])
              : []),
            [
              "Verificação",
              s.otpVerifiedAt && s.otpEmail
                ? `Código confirmado no e-mail ${maskEmail(s.otpEmail)} em ${formatDateTime(s.otpVerifiedAt)}`
                : "Acesso pelo link pessoal enviado ao signatário",
            ],
            [
              "Geolocalização",
              s.geo
                ? `${s.geo.lat.toFixed(5)}, ${s.geo.lng.toFixed(5)}${s.geo.accuracy ? ` (±${Math.round(s.geo.accuracy)} m)` : ""}`
                : "Não autorizada pelo signatário",
            ],
            ...(s.signatureSha256 ? ([["SHA-256 da assinatura", s.signatureSha256, true]] as Row[]) : []),
          ];
    const rowsH = rows.reduce((h, [, v, mono]) => h + rowHeight(leftW, v, mono), 0);
    const blockH = 20 + Math.max(rowsH, s.status === "signed" ? 70 : 0) + 18;
    ensure(blockH);
    noBreak = true;
    const top = y + 6;

    const title = s.status === "signed" ? s.signedName ?? s.label : s.label;
    page.drawText(fitText(helvBold, title, 10, leftW), { x, y: y - 4, size: 10, font: helvBold, color: INK });
    const badge = s.status === "signed" ? "ASSINOU" : "PENDENTE";
    page.drawText(badge, {
      x: M + contentW - 10 - helvBold.widthOfTextAtSize(badge, 7.5),
      y: y - 4,
      size: 7.5,
      font: helvBold,
      color: s.status === "signed" ? GREEN : AMBER,
    });
    y -= 20;

    const startY = y;
    for (const [label, value, mono] of rows) row(x, leftW, label, value, { mono });

    if (s.status === "signed") {
      // Miniatura da assinatura à direita
      const img = sigImages.get(s.id);
      const bx = M + contentW - thumbW - 8;
      const by = startY - 62;
      page.drawRectangle({ x: bx, y: by, width: thumbW, height: 64, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.7 });
      if (img) {
        const scale = Math.min((thumbW - 12) / img.width, 52 / img.height);
        page.drawImage(img, {
          x: bx + (thumbW - img.width * scale) / 2,
          y: by + (64 - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
        });
      }
      y = Math.min(y, by - 6);
    }

    // Moldura do bloco
    const bottomY = y - 4;
    page.drawRectangle({
      x: M,
      y: bottomY,
      width: contentW,
      height: top - bottomY,
      borderColor: BORDER,
      borderWidth: 0.7,
    });
    noBreak = false;
    y = bottomY - 12;
  }

  // --- Rodapés (depois de saber o total de páginas) -----------------------------
  const legal = wrapText(helv, LEGAL_BASIS, 7, contentW - 96);
  reportPages.forEach((p, i) => {
    const fy = M + FOOTER_H - 14;
    p.drawRectangle({ x: M, y: M, width: contentW, height: FOOTER_H - 14, color: SOFT, borderColor: BORDER, borderWidth: 0.6 });
    p.drawImage(qr, { x: A4.w - M - 84, y: M + 6, width: 78, height: 78 });
    let ly = fy - 14;
    p.drawText("Validação", { x: M + 10, y: ly, size: 8.5, font: helvBold, color: NAVY });
    ly -= 12;
    const vtext = fitText(helv, `Confira a autenticidade em ${input.validationUrl}`, 7.6, contentW - 110);
    p.drawText(vtext, { x: M + 10, y: ly, size: 7.6, font: helv, color: INK });
    ly -= 12;
    for (const l of legal) {
      p.drawText(l, { x: M + 10, y: ly, size: 7, font: helv, color: MUTED });
      ly -= 9;
    }
    const pg = `Relatório de assinaturas · página ${i + 1} de ${reportPages.length}`;
    p.drawText(pg, { x: M, y: M - 14, size: 7, font: helv, color: MUTED });
    const gen = pdfSafe(`Gerado em ${formatDateTime(new Date())}`);
    p.drawText(gen, { x: A4.w - M - helv.widthOfTextAtSize(gen, 7), y: M - 14, size: 7, font: helv, color: MUTED });
  });
}
