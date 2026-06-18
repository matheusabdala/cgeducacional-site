/**
 * Templates de e-mail transacional (HTML inline + fallback texto).
 * Identidade visual simples e responsiva; azul institucional CG como acento.
 */

const BRAND = "CG Educacional";
const PRIMARY = "#1d4ed8"; // azul institucional CG
const TAGLINE =
  "Neurociência, educação inclusiva e formação de professores.";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[c],
  );
}

function layout(
  title: string,
  bodyHtml: string,
  cta?: { label: string; url: string },
): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-weight:700;font-size:18px;color:${PRIMARY};margin-bottom:20px">${BRAND}</div>
    <div style="background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(15,23,42,.08)">
      <h1 style="font-size:20px;line-height:1.3;margin:0 0 14px">${title}</h1>
      ${bodyHtml}
      ${
        cta
          ? `<div style="margin-top:24px"><a href="${cta.url}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${cta.label}</a></div>`
          : ""
      }
    </div>
    <p style="font-size:12px;color:#64748b;margin-top:22px;text-align:center">${TAGLINE}</p>
  </div>
</body></html>`;
}

/** Matrícula confirmada (admin ativou um curso para o aluno). */
export function enrollmentEmail(opts: {
  name: string;
  courseTitle: string;
  url: string;
}) {
  const subject = `Matrícula confirmada: ${opts.courseTitle}`;
  const html = layout(
    "Sua matrícula foi confirmada 🎓",
    `<p style="margin:0 0 10px">Olá, ${escapeHtml(opts.name)}!</p>
     <p style="margin:0;color:#334155;line-height:1.6">Você foi matriculado(a) no curso <strong>${escapeHtml(opts.courseTitle)}</strong>. O conteúdo já está liberado — comece quando quiser.</p>`,
    { label: "Acessar o curso", url: opts.url },
  );
  const text = `Olá, ${opts.name}! Sua matrícula no curso "${opts.courseTitle}" foi confirmada. Acesse: ${opts.url}`;
  return { subject, html, text };
}

/** Certificado emitido (aluno concluiu 100% do curso). */
export function certificateEmail(opts: {
  name: string;
  courseTitle: string;
  pdfUrl: string;
  code: string;
}) {
  const subject = `Seu certificado: ${opts.courseTitle}`;
  const html = layout(
    "Parabéns pela conclusão! 🏆",
    `<p style="margin:0 0 10px">Olá, ${escapeHtml(opts.name)}!</p>
     <p style="margin:0 0 10px;color:#334155;line-height:1.6">Você concluiu o curso <strong>${escapeHtml(opts.courseTitle)}</strong> e seu certificado já está disponível.</p>
     <p style="margin:0;color:#334155">Código de validação: <strong>${escapeHtml(opts.code)}</strong></p>`,
    { label: "Baixar certificado (PDF)", url: opts.pdfUrl },
  );
  const text = `Parabéns, ${opts.name}! Você concluiu "${opts.courseTitle}". Baixe seu certificado: ${opts.pdfUrl} (código ${opts.code}).`;
  return { subject, html, text };
}
