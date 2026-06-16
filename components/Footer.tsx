import React from "react";
import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
                <GraduationCap size={22} />
              </div>
              <span className="text-lg font-semibold text-foreground">
                CG Educacional
              </span>
            </div>
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
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Sobre Nós
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Contato
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Política de Privacidade
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
        </div>
      </div>
    </footer>
  );
};
