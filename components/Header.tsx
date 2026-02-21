import React from 'react';
import { Button } from './Button';
import { createWhatsAppLink } from '../constants';
import { Brain, Menu, Search } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-cg-600 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Brain size={20} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cg-700 to-cg-500">
            CG Educacional
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <button 
             onClick={() => onNavigate('eja')}
             className={`transition-colors hover:text-cg-600 ${currentPage === 'eja' ? 'text-cg-600 font-bold' : ''}`}
          >
            EJA
          </button>

          <button 
             onClick={() => onNavigate('graduation')}
             className={`transition-colors hover:text-cg-600 ${currentPage === 'graduation' ? 'text-cg-600 font-bold' : ''}`}
          >
            Graduação
          </button>

          <button 
             onClick={() => onNavigate('postgraduation')}
             className={`transition-colors hover:text-cg-600 ${currentPage === 'postgraduation' ? 'text-cg-600 font-bold' : ''}`}
          >
            Pós-Graduação
          </button>
          
          <button 
            onClick={() => onNavigate('courses')}
            className={`transition-colors hover:text-cg-600 ${currentPage === 'courses' ? 'text-cg-600 font-bold' : ''}`}
          >
            Cursos Livres
          </button>

          <button 
            onClick={() => onNavigate('certificate')}
            className={`transition-colors hover:text-cg-600 ${currentPage === 'certificate' ? 'text-cg-600 font-bold' : ''}`}
          >
            Validar Certificado
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-48 rounded-md border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none focus:border-cg-500 focus:ring-1 focus:ring-cg-500 transition-all focus:w-64"
            />
          </div>
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Entrar
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => window.open(createWhatsAppLink("Olá, gostaria de começar agora."), "_blank")}
          >
            Começar Agora
          </Button>
          <button className="md:hidden text-gray-600">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};