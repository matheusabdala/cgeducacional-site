import { apiHandler } from "@/lib/esign-http";
import { sendDocument } from "@/server/esign";

export const dynamic = "force-dynamic";

/** POST /api/esign/v1/documents/:id/send — body { sendEmails? } → links dos signatários. */
export const POST = apiHandler<{ id: string }>(async (req, ctx, { id }) => {
  const body = (await req.json().catch(() => ({}))) as { sendEmails?: boolean };
  const res = await sendDocument(id, { sendEmails: Boolean(body?.sendEmails) }, ctx);
  return {
    links: res.links.map((l) => ({
      signerId: l.signerId,
      name: l.name,
      email: l.email,
      link: l.link,
      emailSent: l.emailStatus?.sent ?? false,
    })),
  };
});
