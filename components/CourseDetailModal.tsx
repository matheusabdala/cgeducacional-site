import React from 'react';
import { Course } from '../types';
import { X, CheckCircle, Calendar, Book, Award } from 'lucide-react';
import { Button } from './Button';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 backdrop-blur-sm transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative h-64 w-full">
           <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="h-full w-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-8 text-white">
                <span className="inline-block rounded-md bg-cg-600/90 px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
                    {course.category}
                </span>
                <h2 className="text-3xl font-bold">{course.title}</h2>
              </div>
           </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Sobre o Curso</h3>
                <p className="text-gray-600 leading-relaxed">
                  {course.fullDescription}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">O que você vai aprender</h3>
                <ul className="grid gap-2 text-gray-600 sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-teal-500 shrink-0" />
                    <span>Fundamentos da Neuroeducação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-teal-500 shrink-0" />
                    <span>Metodologias Ativas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-teal-500 shrink-0" />
                    <span>Análise Comportamental</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-teal-500 shrink-0" />
                    <span>Práticas Inclusivas</span>
                  </li>
                </ul>
              </div>
              
              <div className="rounded-xl bg-slate-50 p-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <img 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">{course.instructor.name}</h4>
                    <p className="text-sm text-cg-600 font-medium">{course.instructor.role}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Especialista com mais de 10 anos de experiência em sala de aula e pesquisa acadêmica.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                 <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">R$ {course.price.toFixed(2).replace('.',',')}</span>
                    <span className="block text-sm text-gray-500">Pagamento único, acesso vitalício</span>
                 </div>
                 <Button className="w-full mb-3 shadow-lg shadow-cg-500/20" size="lg">
                    Matricular-se Agora
                 </Button>
                 <p className="text-xs text-center text-gray-400">Garantia de 7 dias ou seu dinheiro de volta</p>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cg-50 text-cg-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Carga Horária</p>
                    <p>{course.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cg-50 text-cg-600">
                    <Book size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Módulos</p>
                    <p>{course.modules} Módulos completos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cg-50 text-cg-600">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Certificado</p>
                    <p>Incluso na conclusão</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};