import React from "react";
import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cg-600 text-white">
                <GraduationCap size={22} />
              </div>
              <span className="text-xl font-bold text-white">
                CG Educacional
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transformando vidas através da educação de qualidade. Cursos
              livres, graduação, pós e EJA.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Cursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cursos" className="hover:text-cg-400 transition-colors">
                  Cursos Livres
                </Link>
              </li>
              <li>
                <Link href="/eja" className="hover:text-cg-400 transition-colors">
                  EJA Supletivo
                </Link>
              </li>
              <li>
                <Link href="/graduacao" className="hover:text-cg-400 transition-colors">
                  Graduação
                </Link>
              </li>
              <li>
                <Link href="/pos-graduacao" className="hover:text-cg-400 transition-colors">
                  Pós-Graduação
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cg-400 transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone size={16} /> (67) 9200-1722</li>
              <li className="flex items-center gap-2"><Mail size={16} /> contato@cgeducacional.com</li>
              <li className="flex items-start gap-2"><MapPin size={16} className="mt-1" /> Campo Grande, MS</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} CG Educacional. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
};
