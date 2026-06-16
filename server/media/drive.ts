import "server-only";
import { Readable } from "node:stream";
import { drive, auth, type drive_v3 } from "@googleapis/drive";
import { serverEnv } from "@/lib/env";
import type {
  FileStream,
  ResolveContext,
  StorageProvider,
  StoredFile,
  UploadInput,
  VideoProvider,
  VideoSource,
} from "./types";

// Escopo completo para listar/baixar arquivos de uma pasta compartilhada com a
// Service Account (drive.file só enxerga o que o app cria).
const SCOPES = ["https://www.googleapis.com/auth/drive"];

let _client: drive_v3.Drive | undefined;

/** Client autenticado do Drive (Service Account, JWT). Singleton lazy. */
function driveClient(): drive_v3.Drive {
  if (_client) return _client;
  const jwt = new auth.JWT({
    email: serverEnv.googleServiceAccountEmail(),
    key: serverEnv.googlePrivateKey(),
    scopes: SCOPES,
  });
  _client = drive({ version: "v3", auth: jwt });
  return _client;
}

const FILE_FIELDS = "id,name,mimeType,size,modifiedTime,webViewLink";

function toStoredFile(f: drive_v3.Schema$File): StoredFile {
  return {
    id: f.id!,
    name: f.name ?? "",
    mimeType: f.mimeType ?? "application/octet-stream",
    size: f.size ? Number(f.size) : undefined,
    modifiedTime: f.modifiedTime ?? undefined,
    webViewLink: f.webViewLink ?? undefined,
  };
}

export class DriveStorageProvider implements StorageProvider {
  private get rootFolderId(): string {
    return serverEnv.googleDriveFolderId();
  }

  async upload(input: UploadInput): Promise<StoredFile> {
    const client = driveClient();
    const body =
      input.body instanceof Buffer || input.body instanceof Uint8Array
        ? Readable.from(input.body as Uint8Array)
        : input.body;

    const res = await client.files.create({
      requestBody: {
        name: input.name,
        parents: [input.parentFolderId ?? this.rootFolderId],
      },
      media: { mimeType: input.mimeType, body },
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });
    return toStoredFile(res.data);
  }

  async list(folderId?: string): Promise<StoredFile[]> {
    const client = driveClient();
    const res = await client.files.list({
      q: `'${folderId ?? this.rootFolderId}' in parents and trashed = false`,
      fields: `files(${FILE_FIELDS})`,
      pageSize: 100,
      orderBy: "folder,name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    return (res.data.files ?? []).map(toStoredFile);
  }

  async getMetadata(fileId: string): Promise<StoredFile> {
    const client = driveClient();
    const res = await client.files.get({
      fileId,
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });
    return toStoredFile(res.data);
  }

  async getStream(fileId: string, range?: string): Promise<FileStream> {
    const client = driveClient();
    const meta = await this.getMetadata(fileId);
    const res = await client.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      {
        responseType: "stream",
        headers: range ? { Range: range } : {},
        // Não tratar 206 como erro.
        validateStatus: (s) => s >= 200 && s < 400,
      },
    );
    const headers = res.headers as Record<string, string | undefined>;
    const contentLength = headers["content-length"];
    return {
      stream: res.data as unknown as NodeJS.ReadableStream,
      mimeType: meta.mimeType,
      name: meta.name,
      status: res.status,
      contentLength: contentLength ? Number(contentLength) : meta.size,
      contentRange: headers["content-range"],
    };
  }

  async delete(fileId: string): Promise<void> {
    const client = driveClient();
    await client.files.delete({ fileId, supportsAllDrives: true });
  }
}

/**
 * Vídeo via Drive: o player não fala com o Drive direto — toca o arquivo pelo
 * nosso proxy de stream (que valida matrícula). `videoRef` = file id do Drive.
 */
export class DriveVideoProvider implements VideoProvider {
  readonly kind = "drive" as const;

  resolve(_videoRef: string, ctx: ResolveContext): VideoSource {
    return { provider: "drive", kind: "html5", src: ctx.streamUrl };
  }
}
