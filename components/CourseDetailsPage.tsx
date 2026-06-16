"use client";


import React, { useState } from 'react';
import { Course } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createWhatsAppLink } from '../constants';
import { 
  Clock, 
  Book, 
  Award, 
  Star, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  ArrowLeft,
  Share2,
  ShieldCheck,
  User
} from 'lucide-react';

interface CourseDetailsPageProps {
  course: Course;
  onBack: () => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ course, onBack }) => {
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);

  const toggleModule = (index: number) => {
    setOpenModuleIndex(openModuleIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-300">

      {/* Breadcrumb / Back Navigation */}
      <div className="bg-secondary/30 border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar para cursos
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-cg-900 text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
               <Badge variant="teal">
                 {course.category}
               </Badge>
               <div className="flex items-center text-amber-400 text-sm">
                 <Star size={16} fill="currentColor" />
                 <span className="ml-1 font-medium">{course.rating}</span>
                 <span className="text-gray-400 ml-1">({course.students} alunos)</span>
               </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-cg-100 max-w-2xl mb-8">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-cg-200">
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{course.duration} de conteúdo</span>
              </div>
              <div className="flex items-center gap-2">
                <Book size={18} />
                <span>{course.modules} módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>Por {course.instructor.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>Última atualização: Out 2023</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Sobre o Curso</h2>
              <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed">
                <p>{course.fullDescription}</p>
                <p className="mt-4">
                  Este curso foi desenhado para profissionais que buscam excelência. Combinando teoria robusta e prática aplicável, você sairá apto a transformar sua atuação profissional.
                </p>
              </div>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-teal mt-1 shrink-0" size={20} />
                  <span className="text-foreground">Acesso vitalício ao conteúdo</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-teal mt-1 shrink-0" size={20} />
                  <span className="text-foreground">Certificado oficial de conclusão</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-teal mt-1 shrink-0" size={20} />
                  <span className="text-foreground">Materiais de apoio em PDF</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-teal mt-1 shrink-0" size={20} />
                  <span className="text-foreground">Suporte direto com a equipe</span>
                </div>
              </div>
            </section>

            {/* Syllabus (Accordion) */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Book className="text-primary" /> Conteúdo Programático
              </h2>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
                {course.syllabus && course.syllabus.length > 0 ? (
                  course.syllabus.map((module, idx) => (
                    <div key={idx} className="border-b border-border last:border-0">
                      <button
                        onClick={() => toggleModule(idx)}
                        className="w-full flex items-center justify-between p-5 bg-secondary/50 hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                           <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                             openModuleIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                           }`}>
                             {idx + 1}
                           </span>
                           <span className="font-semibold text-foreground text-lg">
                             {module.title}
                           </span>
                        </div>
                        {openModuleIndex === idx ? (
                          <ChevronUp className="text-muted-foreground" />
                        ) : (
                          <ChevronDown className="text-muted-foreground" />
                        )}
                      </button>

                      {openModuleIndex === idx && (
                        <div className="bg-secondary/30 p-5 pt-0 border-t border-border">
                          <ul className="space-y-3 mt-4">
                            {module.lessons.map((lesson, lIdx) => (
                              <li key={lIdx} className="flex items-center justify-between text-sm text-muted-foreground pl-9">
                                <div className="flex items-center gap-2">
                                  <PlayCircle size={16} className="text-primary" />
                                  <span>{lesson.title}</span>
                                </div>
                                <span className="text-muted-foreground text-xs">{lesson.duration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Conteúdo programático em breve.
                  </div>
                )}
              </div>
            </section>

            {/* Instructor */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Conheça seu Instrutor</h2>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col sm:flex-row gap-6">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-border"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground">{course.instructor.name}</h3>
                  <p className="text-primary font-medium mb-3">{course.instructor.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {course.instructor.bio || "Especialista com vasta experiência na área educacional."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Enrollment Card */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                   <img
                     src={course.thumbnail}
                     alt={course.title}
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <div className="bg-card/95 backdrop-blur rounded-lg px-3 py-1 flex items-center gap-2 shadow-card">
                         <PlayCircle size={16} className="text-primary fill-primary" />
                         <span className="text-xs font-bold text-foreground">Prévia disponível</span>
                      </div>
                   </div>
                </div>

                <div className="p-6">
                   <div className="mb-6">
                      <span className="text-muted-foreground text-sm line-through">R$ {(course.price * 1.5).toFixed(2).replace('.',',')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-extrabold text-teal">
                           R$ {course.price.toFixed(2).replace('.',',')}
                        </span>
                        <Badge variant="teal">
                           -33% OFF
                        </Badge>
                      </div>
                   </div>

                   <Button
                      size="lg"
                      variant="glow"
                      className="w-full mb-3 text-lg"
                      onClick={() => window.open(createWhatsAppLink(`Olá, gostaria de comprar o curso ${course.title}.`), "_blank")}
                   >
                      Comprar Agora
                   </Button>
                   <p className="text-xs text-center text-muted-foreground mb-6">
                     Garantia de 7 dias ou seu dinheiro de volta.
                   </p>

                   <div className="space-y-4 pt-6 border-t border-border">
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                           <Award size={16} /> Certificado
                        </span>
                        <span className="font-semibold text-foreground">Incluso (40h)</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                           <ShieldCheck size={16} /> Acesso
                        </span>
                        <span className="font-semibold text-foreground">Vitalício</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                           <Book size={16} /> Material
                        </span>
                        <span className="font-semibold text-foreground">Digital (PDF)</span>
                     </div>
                   </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-center justify-between">
                 <span className="font-medium text-foreground">Compartilhar curso</span>
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira este curso: ${course.title}`)}`, "_blank")}
                 >
                    <Share2 size={18} />
                 </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};