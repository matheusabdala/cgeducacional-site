"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createWhatsAppLink } from "../constants";
import { ArrowRight, PlayCircle, Star, Brain } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex animate-fade-up flex-col justify-center space-y-8">
            <div className="space-y-5">
              <Badge>
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                Matrículas abertas para 2026
              </Badge>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                <span className="text-gradient">A Plataforma Completa para sua </span>
                <span className="bg-gradient-to-r from-primary via-teal to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                  Evolução Profissional
                </span>
              </h1>
              <p className="max-w-[600px] text-base text-muted-foreground md:text-xl">
                Da Graduação à Pós-Graduação. A capacitação ideal para
                educadores, estudantes e profissionais que buscam se destacar
                com foco em Neurociência e Desenvolvimento Humano.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button
                size="lg"
                variant="glow"
                onClick={() =>
                  window.open(
                    createWhatsAppLink(
                      "Olá, gostaria de começar minha jornada na CG Educacional.",
                    ),
                    "_blank",
                  )
                }
              >
                Começar Agora <ArrowRight size={18} />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  window.open(
                    createWhatsAppLink(
                      "Olá, gostaria de conhecer a plataforma da CG Educacional.",
                    ),
                    "_blank",
                  )
                }
              >
                <PlayCircle size={18} /> Conhecer a Plataforma
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
                    src={`https://picsum.photos/id/${i + 50}/32/32`}
                    alt="Aluno"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <span className="font-medium text-foreground">4.9/5</span>
                <span>(2.5k+ alunos)</span>
              </div>
            </div>
          </div>

          <div className="relative hidden animate-fade-up lg:block [animation-delay:120ms]">
            <div className="relative rounded-2xl border border-border bg-card p-2 shadow-card-hover">
              <img
                src="https://picsum.photos/id/4/800/600"
                alt="Profissional estudando"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
              <div className="absolute -bottom-6 -left-6 max-w-xs rounded-xl glass p-4 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-teal/15 p-2 text-teal">
                    <Brain size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Certificado Reconhecido
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Válido para horas complementares e currículo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
