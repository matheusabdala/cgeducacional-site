import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Circle,
  Award,
  MonitorPlay,
  Sparkles,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-28">
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div className="flex animate-fade-up flex-col justify-center space-y-7">
            <Badge>
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              Matrículas abertas para 2026
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-gradient">A plataforma completa para sua </span>
              <span className="bg-gradient-to-r from-primary via-teal to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                evolução profissional
              </span>
            </h1>
            <p className="max-w-[600px] text-base text-muted-foreground md:text-xl">
              Da Graduação à Pós-Graduação. Capacitação para educadores e
              profissionais que buscam se destacar, com foco em Neurociência e
              Desenvolvimento Humano.
            </p>

            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button asChild size="lg" variant="glow">
                <Link href="/cadastro">
                  Começar agora <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/cursos">
                  <PlayCircle size={18} /> Explorar cursos
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Award size={16} className="text-teal" /> Certificados
                reconhecidos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MonitorPlay size={16} className="text-primary" /> 100% online
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={16} className="text-primary" /> Comece grátis
              </span>
            </div>
          </div>

          {/* Visual do produto (preview de aula) */}
          <div className="relative hidden animate-fade-up lg:block [animation-delay:120ms]">
            <div className="relative rounded-2xl border border-border bg-card p-3 shadow-card-hover">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-cg-600 via-cg-700 to-cg-900">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <Badge
                  variant="secondary"
                  className="absolute left-3 top-3 bg-background/80 backdrop-blur"
                >
                  <Brain size={12} /> Neurociência
                </Badge>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur transition-transform duration-500 ease-expo-out hover:scale-105">
                    <PlayCircle className="text-white" size={32} />
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div>
                  <p className="font-semibold text-foreground">
                    Neurociência da Aprendizagem
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Módulo 2 · Atenção e Funções Executivas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={65} className="h-1.5" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    65%
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 size={15} className="text-teal" /> Como o
                    cérebro aprende
                  </div>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <PlayCircle size={15} className="text-primary" /> Tipos de
                    atenção
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <Circle size={15} /> Estratégias para TDAH
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-xl glass p-3 shadow-card">
                <div className="rounded-full bg-teal/15 p-2 text-teal">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Ao concluir
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    Certificado válido
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
