import type { ResolveContext, VideoProvider, VideoSource } from "./types";

/**
 * YouTube (opção, não padrão). Reproduz vídeos **não listados** pelo videoId.
 * O upload (Data API v3 via OAuth do canal) é fase futura — só ativar quando
 * for usar; por ora só resolvemos a reprodução de um videoRef existente.
 */
export class YouTubeVideoProvider implements VideoProvider {
  readonly kind = "youtube" as const;

  resolve(videoRef: string, _ctx: ResolveContext): VideoSource {
    return { provider: "youtube", kind: "youtube", videoId: videoRef };
  }
}
