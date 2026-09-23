import "server-only";
import { PDFDocument } from "pdf-lib";
import { EsignError } from "../errors";
import type { PageBox } from "../types";

function hasPdfMagic(bytes: Uint8Array): boolean {
  // "%PDF-" deve aparecer no início (alguns geradores põem lixo antes; aceita até 1 KB).
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  return head.includes("%PDF-");
}

function normRotation(angle: number): PageBox["rotate"] {
  const r = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  return r as PageBox["rotate"];
}

/** Valida o PDF e extrai páginas/tamanhos. Recusa arquivos cifrados. */
export async function inspectPdf(bytes: Uint8Array): Promise<{ pageCount: number; pageSizes: PageBox[] }> {
  if (!hasPdfMagic(bytes)) {
    throw new EsignError("invalid_pdf", "O arquivo não é um PDF válido.");
  }
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const msg = e instanceof Error ? `${e.name} ${e.message}` : "";
    if (/encrypt/i.test(msg)) {
      throw new EsignError(
        "encrypted_pdf",
        "Este PDF está protegido por senha. Remova a proteção e envie de novo.",
      );
    }
    throw new EsignError("invalid_pdf", "Não foi possível ler este PDF. Ele pode estar corrompido.");
  }
  const pages = pdf.getPages();
  if (pages.length === 0) throw new EsignError("invalid_pdf", "O PDF não tem páginas.");
  const pageSizes = pages.map((p) => {
    const box = p.getCropBox();
    return {
      x: box.x,
      y: box.y,
      w: box.width,
      h: box.height,
      rotate: normRotation(p.getRotation().angle),
    };
  });
  return { pageCount: pages.length, pageSizes };
}
