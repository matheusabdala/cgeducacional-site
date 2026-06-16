"use client";

import * as React from "react";
import { Plyr } from "plyr-react";
import "plyr-react/plyr.css";
import type { VideoSource } from "@/server/media/types";

/**
 * Player de aula (Plyr). Skin própria para Drive (html5) e YouTube não listado.
 * No YouTube usa controles próprios + overlay transparente na faixa superior
 * para cobrir título/logo/"Assistir no YouTube" (mitiga, não é 100% — ver
 * CLAUDE.md). play/seek seguem pelos controles do Plyr.
 */
export function LessonPlayer({
  source,
  poster,
}: {
  source: VideoSource;
  poster?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const plyrSource = React.useMemo(() => {
    if (source.kind === "youtube") {
      return {
        type: "video" as const,
        sources: [{ src: source.videoId, provider: "youtube" as const }],
        poster,
      };
    }
    return {
      type: "video" as const,
      sources: [{ src: source.src, type: source.mimeType ?? "video/mp4" }],
      poster,
    };
  }, [source, poster]);

  const options = React.useMemo(
    () => ({
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "captions",
        "settings",
        "fullscreen",
      ],
      // Esconde o máximo da UI nativa do YouTube.
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
      },
    }),
    [],
  );

  // Evita SSR/hidratação do Plyr (depende de window).
  if (!mounted) {
    return (
      <div className="aspect-video w-full animate-pulse rounded-xl border border-border bg-muted" />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-card">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Plyr source={plyrSource as any} options={options as any} />
      {source.kind === "youtube" && (
        // Cobre a faixa superior (título/logo do YouTube no pause/hover).
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-14"
          style={{ pointerEvents: "auto" }}
        />
      )}
    </div>
  );
}
