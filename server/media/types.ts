/**
 * Abstrações de mídia (Fase 4). O resto do app só conhece estas interfaces —
 * nunca chama Google Drive / YouTube direto. Trocar/添加 um host pago depois
 * (Bunny/Cloudflare/Mux) = novo adapter, sem mexer no app.
 *
 * Padrão = Drive (grátis). YouTube unlisted é opção. Ver CLAUDE.md.
 */

/** Espelha o enum `VideoProvider` do Prisma. */
export type VideoProviderKind = "drive" | "youtube";

/** Fonte de reprodução pronta para o player (Plyr). */
export type VideoSource =
  | {
      provider: "drive";
      kind: "html5";
      /** URL que o player consome — nosso proxy de stream (checa matrícula). */
      src: string;
      mimeType?: string;
    }
  | {
      provider: "youtube";
      kind: "youtube";
      /** videoId do YouTube (vídeo não listado). */
      videoId: string;
    };

/** Contexto passado ao resolver (ex.: URL do nosso endpoint de stream). */
export interface ResolveContext {
  streamUrl: string;
}

/** Resolve `videoRef` (id no provider) numa fonte para o player. */
export interface VideoProvider {
  readonly kind: VideoProviderKind;
  resolve(videoRef: string, ctx: ResolveContext): VideoSource;
}

// ---------------------------------------------------------------------------

export interface StoredFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface UploadInput {
  name: string;
  mimeType: string;
  body: Buffer | Uint8Array | NodeJS.ReadableStream;
  /** Pasta destino; default = pasta raiz configurada. */
  parentFolderId?: string;
}

export interface FileStream {
  stream: NodeJS.ReadableStream;
  mimeType: string;
  name: string;
  /** 200 (completo) ou 206 (resposta parcial a um Range). */
  status: number;
  /** Bytes deste corpo (Content-Length). */
  contentLength?: number;
  /** Cabeçalho Content-Range, quando 206. */
  contentRange?: string;
}

/** Armazenamento de arquivos/materiais (e dos próprios vídeos do Drive). */
export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredFile>;
  list(folderId?: string): Promise<StoredFile[]>;
  getMetadata(fileId: string): Promise<StoredFile>;
  /**
   * Stream do conteúdo para proxy server-side (download/vídeo). Encaminha o
   * header `Range` quando informado (seeking de vídeo → 206).
   */
  getStream(fileId: string, range?: string): Promise<FileStream>;
  delete(fileId: string): Promise<void>;
}
