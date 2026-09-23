import { apiHandler } from "@/lib/esign-http";
import { getSignerLink, rotateSignerLink } from "@/server/esign";

export const dynamic = "force-dynamic";

/** GET — link atual do signatário. POST — gera um novo (o anterior para de funcionar). */
export const GET = apiHandler<{ id: string; signerId: string }>(async (_req, _ctx, { signerId }) => ({
  link: await getSignerLink(signerId),
}));

export const POST = apiHandler<{ id: string; signerId: string }>(async (_req, ctx, { signerId }) => ({
  link: await rotateSignerLink(signerId, ctx),
}));
