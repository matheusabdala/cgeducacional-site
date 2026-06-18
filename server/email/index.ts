type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

const FROM =
  process.env.EMAIL_FROM ?? "CG Educacional <no-reply@cgeducacional.com.br>";

/**
 * Envia e-mail transacional via **Resend** (HTTP, sem dependência extra).
 *
 * Degradação graciosa: sem `RESEND_API_KEY` apenas loga e retorna `skipped`.
 * **Nunca lança** — falha de e-mail não pode quebrar o fluxo que a chamou
 * (matrícula, emissão de certificado). Use server-side apenas.
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = Array.isArray(args.to) ? args.to : [args.to];

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY ausente — pulando "${args.subject}" para ${to.join(", ")}`,
    );
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: args.subject,
        html: args.html,
        ...(args.text ? { text: args.text } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend ${res.status}: ${detail.slice(0, 200)}`);
      return { ok: false, error: `Resend ${res.status}` };
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id };
  } catch (e) {
    console.error("[email] falha no envio:", e);
    return { ok: false, error: e instanceof Error ? e.message : "erro" };
  }
}
