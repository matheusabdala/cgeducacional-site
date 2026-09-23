import "server-only";
import { env, storageClient } from "./deps";
import { EsignError } from "./errors";

/**
 * Armazenamento dos arquivos do módulo (PDFs e PNGs de assinatura), por caminho.
 * Interface própria e pequena para poder trocar de provedor sem tocar no resto.
 * Os bytes nunca saem por URL pública: sempre via rotas com autorização.
 */
export interface EsignStorage {
  put(path: string, body: Uint8Array, contentType: string): Promise<void>;
  get(path: string): Promise<Buffer>;
  remove(paths: string[]): Promise<void>;
}

class SupabaseEsignStorage implements EsignStorage {
  private ready: Promise<void> | null = null;

  private bucket() {
    return storageClient().storage.from(env.bucket());
  }

  /** Cria o bucket privado na primeira escrita (idempotente). */
  private ensureBucket(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const client = storageClient();
        const name = env.bucket();
        const { data } = await client.storage.getBucket(name);
        if (data) return;
        const { error } = await client.storage.createBucket(name, {
          public: false,
          fileSizeLimit: "30MB",
        });
        if (error && !/already exists/i.test(error.message)) {
          throw new EsignError("storage", `Falha ao preparar o armazenamento: ${error.message}`);
        }
      })().catch((e) => {
        this.ready = null;
        throw e;
      });
    }
    return this.ready;
  }

  async put(path: string, body: Uint8Array, contentType: string) {
    await this.ensureBucket();
    const { error } = await this.bucket().upload(path, body, { contentType, upsert: true });
    if (error) throw new EsignError("storage", `Falha ao salvar o arquivo: ${error.message}`);
  }

  async get(path: string) {
    const { data, error } = await this.bucket().download(path);
    if (error || !data) throw new EsignError("storage", "Arquivo não encontrado no armazenamento.");
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(paths: string[]) {
    if (paths.length === 0) return;
    await this.bucket().remove(paths);
  }
}

let instance: EsignStorage | null = null;
export function storage(): EsignStorage {
  return (instance ??= new SupabaseEsignStorage());
}

export const paths = {
  original: (code: string) => `docs/${code}/original.pdf`,
  signed: (code: string) => `docs/${code}/signed.pdf`,
  signature: (code: string, signerId: string) => `docs/${code}/signatures/${signerId}.png`,
  phoneSignature: (sessionId: string) => `tmp/signatures/${sessionId}.png`,
};
