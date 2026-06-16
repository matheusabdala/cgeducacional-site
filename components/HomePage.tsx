"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "./Hero";
import { CourseCard } from "./CourseCard";
import { COURSES } from "@/constants";
import { Course, CourseCategory } from "@/types";
import { routeFor } from "@/lib/navigation";
import {
  LayoutGrid,
  GraduationCap,
  Zap,
  MonitorCheck,
  ArrowRight,
  University,
  ScrollText,
  Check,
  Brain,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PILLARS = [
  {
    page: "courses",
    icon: BookOpen,
    title: "Cursos Livres",
    subtitle: "Capacitação Rápida",
    tint: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    page: "graduation",
    icon: University,
    title: "Graduação",
    subtitle: "Parceria Unimes",
    tint: "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-teal-foreground",
  },
  {
    page: "postgraduation",
    icon: ScrollText,
    title: "Pós-Graduação",
    subtitle: "Especialize-se",
    tint: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    page: "eja",
    icon: GraduationCap,
    title: "EJA Supletivo",
    subtitle: "Termine os Estudos",
    tint: "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-teal-foreground",
  },
] as const;

const POS_CARDS = [
  {
    icon: Brain,
    title: "Neurociência e Educação",
    text: "Aprofunde-se no funcionamento do cérebro e aplique técnicas científicas para potencializar a aprendizagem.",
  },
  {
    icon: GraduationCap,
    title: "Psicopedagogia Clínica",
    text: "Capacite-se para diagnosticar e tratar dificuldades de aprendizagem em diversos contextos educacionais.",
  },
  {
    icon: LayoutGrid,
    title: "Gestão e Supervisão",
    text: "Desenvolva habilidades de liderança para coordenar equipes pedagógicas e gerir instituições de ensino.",
  },
];

const HomePage: React.FC = () => {
  const router = useRouter();
  const [filterCategory] = useState<CourseCategory | "Todos">("Todos");

  const handleNavigate = (page: string) => router.push(routeFor(page));
  const handleViewCourse = (course: Course) =>
    router.push(`/cursos/${course.id}`);

  const filteredCoursesHome =
    filterCategory === "Todos"
      ? COURSES
      : COURSES.filter((c) => c.category === filterCategory);

  return (
    <>
      <Hero />

      {/* Pilares de navegação rápida */}
      <section className="relative z-10 -mt-8 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <button
                  key={pillar.page}
                  onClick={() => handleNavigate(pillar.page)}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 ease-expo-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
                >
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${pillar.tint}`}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="font-semibold text-foreground">
                    {pillar.title}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {pillar.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cursos em destaque */}
      <section id="courses" className="container mx-auto px-4 py-16 md:px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                Desenvolvimento Profissional
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Cursos Livres em Destaque
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Cursos de curta duração focados em Neurociência, Inclusão e
              Práticas Educacionais. Certificados válidos para horas
              complementares, concursos e progressão de carreira.
            </p>
          </div>

          <Button variant="ghost" onClick={() => handleNavigate("courses")}>
            Ver catálogo completo <ArrowRight size={16} />
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCoursesHome.slice(0, 4).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onViewDetails={handleViewCourse}
            />
          ))}
        </div>
      </section>

      {/* Banda EJA (destaque institucional escuro) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cg-800 to-cg-950 py-20 text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-cg-500/20 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-500/20 px-3 py-1 text-sm font-medium text-teal-200">
                <GraduationCap size={16} className="mr-2" />
                Supletivo Acelerado
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Termine seus Estudos em{" "}
                <span className="text-teal-300">até 1 mês</span>
              </h2>
              <p className="max-w-lg text-lg text-cg-100">
                Não perca mais oportunidades de trabalho. Conclua o Ensino
                Fundamental ou Médio com o nosso EJA 100% online. Rápido, seguro
                e reconhecido.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="rounded-lg bg-teal-500/20 p-2 text-teal-300">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Ultra Rápido</h4>
                    <p className="text-sm text-cg-200">
                      Certificado em mãos em tempo recorde.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="rounded-lg bg-teal-500/20 p-2 text-teal-300">
                    <MonitorCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">100% Online</h4>
                    <p className="text-sm text-cg-200">
                      Estude pelo celular ou computador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  variant="teal"
                  className="w-full sm:w-auto"
                  onClick={() => handleNavigate("eja")}
                >
                  Quero meu Certificado <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative mx-auto lg:mr-0">
              <div
                className="relative rotate-2 cursor-pointer rounded-2xl bg-card p-2 shadow-2xl transition-transform duration-500 hover:rotate-0"
                onClick={() => handleNavigate("eja")}
              >
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
                  alt="Estudante feliz com certificado"
                  className="aspect-[4/3] w-full max-w-md rounded-xl object-cover"
                />
                <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-xl glass p-4 shadow-card">
                  <div className="rounded-full bg-teal/15 p-2 text-teal">
                    <MonitorCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Status
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      Matrículas Abertas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Graduação — Parceria Unimes */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="relative z-10 rounded-2xl border border-border bg-card p-2 shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"
                  alt="Estudantes universitários"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
              <div className="absolute -top-6 -left-6 -z-10 h-32 w-32 rounded-full bg-teal/20 blur-2xl" />
            </div>

            <div className="order-1 space-y-6 lg:order-2">
              <Badge>
                <University size={16} />
                Parceria Oficial
              </Badge>

              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Graduação a Distância com a qualidade{" "}
                <span className="text-primary">UNIMES</span>
              </h2>

              <p className="text-lg leading-relaxed text-muted-foreground">
                Amplie seus horizontes com cursos de graduação e licenciatura
                reconhecidos pelo MEC. Tecnologia, Pedagogia, Letras e muito
                mais.
              </p>

              <ul className="space-y-4">
                {[
                  "Mensalidades acessíveis e condições especiais.",
                  "Cursos Tecnólogos rápidos (2 anos) para o mercado.",
                  "Flexibilidade para estudar onde e quando quiser.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleNavigate("graduation")}
                >
                  Conhecer Cursos de Graduação
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pós-Graduação */}
      <section className="border-y border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <ScrollText size={24} />
            </div>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Especialize-se com nossa Pós-Graduação
            </h2>
            <p className="text-lg text-muted-foreground">
              Dê o próximo passo na sua carreira. Cursos de especialização Lato
              Sensu com foco em Neurociência, Educação Especial e Gestão Escolar.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {POS_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 ease-expo-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {card.text}
                  </p>
                  <button
                    onClick={() => handleNavigate("postgraduation")}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Saiba mais <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              variant="glow"
              onClick={() => handleNavigate("postgraduation")}
            >
              Ver todos os cursos de Pós
            </Button>
          </div>
        </div>
      </section>

      {/* CTA para escolas (banda institucional escura) */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="overflow-hidden rounded-3xl border border-cg-800/50 bg-gradient-to-br from-cg-900 to-cg-950 text-white shadow-card-hover">
            <div className="grid lg:grid-cols-2">
              <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
                <h2 className="mb-4 text-3xl font-semibold">
                  Leve o CG Educacional para sua Escola
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-cg-100">
                  Oferecemos pacotes especiais para formação continuada de corpo
                  docente. Monitore o progresso da sua equipe e garanta um
                  ensino de excelência com base na neurociência.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button variant="teal" size="lg">
                    Falar com Consultor
                  </Button>
                  <Button
                    size="lg"
                    className="border border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    Conhecer Planos
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 border-t border-white/10 bg-white/5 p-8 md:p-12 lg:border-l lg:border-t-0">
                {[
                  { value: "+50", label: "Escolas Parceiras" },
                  { value: "98%", label: "Aprovação dos Prof." },
                  { value: "24h", label: "Suporte Pedagógico" },
                  { value: "Online", label: "100% Flexível" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/5 bg-cg-900/50 p-6 backdrop-blur-sm"
                  >
                    <span className="mb-1 block text-3xl font-bold text-teal-300">
                      {stat.value}
                    </span>
                    <span className="text-sm text-cg-200">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
