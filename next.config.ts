import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build enxuto para deploy em container (Coolify).
  output: "standalone",
  // Mantém o Prisma fora do bundle (carregado de node_modules + engine).
  serverExternalPackages: ["@prisma/client", "prisma"],
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
