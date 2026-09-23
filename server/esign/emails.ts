import "server-only";
import { ESIGN } from "./config";

/** E-mails do módulo (HTML inline + texto). Visual alinhado ao da CG. */

const NAVY = "#051A61";
const PRIMARY = "#2A4DC0";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-weight:700;font-size:18px;color:${NAVY};margin-bottom:20px">${ESIGN.company.name}</div>
    <div style="background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(15,23,42,.08)">
      <h1 style="font-size:20px;line-height:1.3;margin:0 0 14px">${title}</h1>
      ${body}
      ${cta ? `<div style="margin-top:24px"><a href="${cta.url}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${cta.label}</a></div>` : ""}
    </div>
    <p style="font-size:12px;color:#64748b;margin-top:22px;text-align:center">${ESIGN.company.name} · CNPJ ${ESIGN.company.cnpj}</p>
  </div>
</body></html>`;
}

export function inviteEmail(o: { name?: string | null; title: string; url: string; sender: string; message?: string | null }) {
  const subject = `Documento para assinar: ${o.title}`;
  const html = layout(
    "Você tem um documento para assinar ✍️",
    `<p style="margin:0 0 10px">Olá${o.name ? `, ${esc(o.name)}` : ""}!</p>
     <p style="margin:0 0 10px;color:#334155;line-height:1.6">${esc(o.sender)}, da ${ESIGN.company.name}, enviou o documento <strong>${esc(o.title)}</strong> para você assinar eletronicamente. Leva menos de 2 minutos e funciona no celular.</p>
     ${o.message ? `<p style="margin:0 0 10px;padding:12px 14px;background:#f1f5f9;border-radius:10px;color:#334155;line-height:1.6">${esc(o.message)}</p>` : ""}
     <p style="margin:0;color:#64748b;font-size:13px">Este link é pessoal. Não o encaminhe.</p>`,
    { label: "Revisar e assinar", url: o.url },
  );
  const text = `Olá${o.name ? `, ${o.name}` : ""}! ${o.sender} (${ESIGN.company.name}) enviou "${o.title}" para você assinar: ${o.url}`;
  return { subject, html, text };
}

export function otpEmail(o: { code: string; title: string }) {
  const subject = `${o.code} é o seu código para assinar "${o.title}"`;
  const html = layout(
    "Seu código de verificação",
    `<p style="margin:0 0 14px;color:#334155;line-height:1.6">Use o código abaixo para confirmar sua identidade e assinar <strong>${esc(o.title)}</strong>.</p>
     <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:${NAVY};padding:14px 0">${o.code}</div>
     <p style="margin:0;color:#64748b;font-size:13px">O código vale por 10 minutos. Se não foi você, ignore este e-mail.</p>`,
  );
  const text = `Seu código para assinar "${o.title}": ${o.code} (válido por 10 minutos).`;
  return { subject, html, text };
}

export function completedEmail(o: { name?: string | null; title: string; code: string; url: string }) {
  const subject = `Documento assinado por todos: ${o.title}`;
  const html = layout(
    "Documento concluído ✅",
    `<p style="margin:0 0 10px">Olá${o.name ? `, ${esc(o.name)}` : ""}!</p>
     <p style="margin:0 0 10px;color:#334155;line-height:1.6">Todas as assinaturas de <strong>${esc(o.title)}</strong> foram coletadas. A versão final, com o relatório de assinaturas, está disponível no link abaixo.</p>
     <p style="margin:0;color:#334155">Código de validação: <strong>${esc(o.code)}</strong></p>`,
    { label: "Baixar documento assinado", url: o.url },
  );
  const text = `Todas as assinaturas de "${o.title}" foram coletadas. Baixe: ${o.url} (código ${o.code}).`;
  return { subject, html, text };
}
