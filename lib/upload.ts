/**
 * Upload com progresso real via XHR (o fetch não expõe progresso de upload).
 * Usado no painel admin para enviar vídeo/material ao Drive.
 */
export function uploadFileWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ id: string; name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let json: { id?: string; name?: string; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Resposta inválida do servidor"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.id) {
        resolve({ id: json.id, name: json.name ?? file.name });
      } else {
        reject(new Error(json.error ?? "Falha no upload"));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Erro de rede no upload")),
    );

    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}
