import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build enxuto para deploy em container (Coolify).
  output: "standalone",
  // Mantém o Prisma fora do bundle (carregado de node_modules + engine).
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    // Assinaturas (PNG em base64) passam por Server Actions.
    serverActions: { bodySizeLimit: "3mb" },
  },
  async headers() {
    return [
      {
        // Service worker do PWA: sempre revalidar (atualiza no próximo acesso).
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        // Páginas de assinatura: sem indexação e sem vazar o link no Referer.
        source: "/assinar/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
