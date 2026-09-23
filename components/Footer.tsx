import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-block" aria-label="CG Educacional — início">
              <BrandLogo variant="stacked" className="h-16" sizes="110px" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Transformando vidas através da educação de qualidade. Cursos
              livres, graduação, pós e EJA.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Cursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/cursos"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Cursos Livres
                </Link>
              </li>
              <li>
                <Link
                  href="/eja"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  EJA Supletivo
                </Link>
              </li>
              <li>
                <Link
                  href="/graduacao"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Graduação
                </Link>
              </li>
              <li>
                <Link
                  href="/pos-graduacao"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Pós-Graduação
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Institucional</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Área do Aluno
                </Link>
              </li>
              <li>
                <Link
                  href="/validar-certificado"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Validar Certificado
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/556792001722"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Fale no WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contato</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-primary" /> (67) 9200-1722
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />{" "}
                contato@cgeducacional.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-primary" /> Campo
                Grande, MS
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CG Educacional. Todos os direitos
          reservados.
          <span className="mt-1 block">CNPJ 53.123.217/0001-55</span>
        </div>
      </div>
    </footer>
  );
};
