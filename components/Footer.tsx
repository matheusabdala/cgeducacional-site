import React from 'react';
import { Brain, Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

import { createWhatsAppLink } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded-lg bg-cg-600 flex items-center justify-center">
                <Brain size={20} />
              </div>
              <span className="text-xl font-bold">CG Educacional</span>
            </div>
            <p className="text-sm text-slate-400">
              Levando a neurociência para a prática. Formando profissionais, transformando o futuro.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Cursos</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cg-400 transition-colors">Neurociência Aplicada</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Educação Inclusiva</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Gestão Escolar</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Trilhas de Aprendizagem</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Institucional</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cg-400 transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Para Escolas</a></li>
              <li><a href="#" className="hover:text-cg-400 transition-colors">Blog</a></li>
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-cg-400 transition-colors text-left">Validar Certificado</button></li>
              <li>
                <a 
                  href={createWhatsAppLink("Olá, gostaria de entrar em contato com a CG Educacional.")} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-cg-400 transition-colors"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-cg-500" />
                <a 
                  href={createWhatsAppLink("Olá, gostaria de mais informações.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  (67) 9200-1722
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-cg-500" />
                <span>contato@cgeducacional.com.br</span>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CG Educacional. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};