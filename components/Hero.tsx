"use client";

import React from "react";
import { Button } from "./Button";
import { createWhatsAppLink } from "../constants";
import { ArrowRight, PlayCircle, Star, Brain } from "lucide-react";

export const Hero: React.FC = () => {
    return (
        <section className="relative overflow-hidden bg-white py-16 md:py-24 lg:py-32">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/id/196/1920/1080')] bg-cover bg-center opacity-5"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>

            <div className="container relative mx-auto px-4 md:px-6">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center rounded-full border border-cg-200 bg-cg-50 px-3 py-1 text-sm font-medium text-cg-800">
                                <span className="flex h-2 w-2 rounded-full bg-cg-600 mr-2"></span>
                                Matrículas abertas para 2026
                            </div>
                            <h1 className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                                A Plataforma Completa para sua{" "}
                                <span className="text-cg-600">
                                    Evolução Profissional
                                </span>
                            </h1>
                            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Da Graduação à Pós-Graduação. A capacitação
                                ideal para educadores, estudantes e
                                profissionais que buscam se destacar com foco em
                                Neurociência e Desenvolvimento Humano.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 min-[400px]:flex-row">
                            <Button
                                size="lg"
                                className="gap-2"
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
                                variant="outline"
                                size="lg"
                                className="gap-2"
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

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <img
                                        key={i}
                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                                        src={`https://picsum.photos/id/${i + 50}/32/32`}
                                        alt="Aluno"
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex text-yellow-400">
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                    <Star size={16} fill="currentColor" />
                                </div>
                                <span className="font-medium text-slate-900">
                                    4.9/5
                                </span>
                                <span>(2.5k+ alunos)</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="relative rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-gray-200">
                            <img
                                src="https://picsum.photos/id/4/800/600"
                                alt="Profissional estudando"
                                className="aspect-[4/3] w-full rounded-xl object-cover"
                            />
                            <div className="absolute -bottom-6 -left-6 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-100 max-w-xs">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-full bg-teal-100 p-2 text-teal-600">
                                        <Brain size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Certificado Reconhecido
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Válido para horas complementares e
                                            currículo.
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