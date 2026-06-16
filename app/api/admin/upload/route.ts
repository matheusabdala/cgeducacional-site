import { getCurrentProfile } from "@/lib/auth";
import { getStorageProvider } from "@/server/media";

export const dynamic = "force-dynamic";

/** Upload de arquivo (vídeo/material) para o Drive. Só admin/instrutor. */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "instructor")) {
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Arquivo ausente" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await getStorageProvider().upload({
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      body: buffer,
    });
    return Response.json({ id: stored.id, name: stored.name });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Falha desconhecida no upload";
    // SA em pasta comum pode falhar por quota → usar Shared Drive.
    return Response.json(
      { error: `Falha no upload: ${message}` },
      { status: 500 },
    );
  }
}
