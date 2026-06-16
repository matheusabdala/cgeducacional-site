import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CG Educacional — Plataforma de Ensino",
  description:
    "Plataforma de ensino focada em neurociência, inclusão e formação de professores. Cursos livres, graduação, pós-graduação e EJA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AmbientBackground />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
