import { DriveStorageProvider, DriveVideoProvider } from "./drive";
import { YouTubeVideoProvider } from "./youtube";
import type {
  StorageProvider,
  VideoProvider,
  VideoProviderKind,
  VideoSource,
} from "./types";

// Padrão = Drive. Trocar/adicionar host pago depois = novo provider aqui.
let _storage: StorageProvider | undefined;
const _driveVideo = new DriveVideoProvider();
const _youtubeVideo = new YouTubeVideoProvider();

/** StorageProvider padrão (Google Drive). */
export function getStorageProvider(): StorageProvider {
  return (_storage ??= new DriveStorageProvider());
}

/** VideoProvider por tipo (default = drive). */
export function getVideoProvider(kind: VideoProviderKind): VideoProvider {
  return kind === "youtube" ? _youtubeVideo : _driveVideo;
}

/**
 * Monta a fonte de reprodução de uma aula para o player. Vídeo do Drive passa
 * pelo nosso proxy `/api/video/<lessonId>` (que valida matrícula).
 */
export function resolveVideoSource(lesson: {
  id: string;
  videoProvider: VideoProviderKind;
  videoRef: string | null;
}): VideoSource | null {
  if (!lesson.videoRef) return null;
  return getVideoProvider(lesson.videoProvider).resolve(lesson.videoRef, {
    streamUrl: `/api/video/${lesson.id}`,
  });
}

export type {
  VideoSource,
  VideoProvider,
  StorageProvider,
  VideoProviderKind,
} from "./types";
