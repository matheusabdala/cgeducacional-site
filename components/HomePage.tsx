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
    ListFilter,
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
import { Button } from "./Button";

const HomePage: React.FC = () => {
    const router = useRouter();
    const [filterCategory, setFilterCategory] = useState<
        CourseCategory | "Todos"
    >("Todos");

    // Navegação via rotas reais do App Router.
    const handleNavigate = (page: string) => {
        router.push(routeFor(page));
    };

    // Abre a página de detalhes do curso.
    const handleViewCourse = (course: Course) => {
        router.push(`/cursos/${course.id}`);
    };

    const filteredCoursesHome =
        filterCategory === "Todos"
            ? COURSES
            : COURSES.filter((c) => c.category === filterCategory);

    return (
        <>
                <Hero />

                {/* Quick Navigation / Pillars */}
                <section className="py-12 bg-white relative z-10 -mt-8">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleNavigate("courses")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-cg-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                            >
                                <div className="h-12 w-12 rounded-xl bg-blue-50 text-cg-600 flex items-center justify-center mb-3 group-hover:bg-cg-600 group-hover:text-white transition-colors">
                                    <BookOpen size={24} />
                                </div>
                                <span className="font-bold text-slate-800">
                                    Cursos Livres
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Capacitação Rápida
                                </span>
                            </button>

                            <button
                                onClick={() => handleNavigate("graduation")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-cg-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                            >
                                <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                    <University size={24} />
                                </div>
                                <span className="font-bold text-slate-800">
                                    Graduação
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Parceria Unimes
                                </span>
                            </button>

                            <button
                                onClick={() => handleNavigate("postgraduation")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-cg-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                            >
                                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <ScrollText size={24} />
                                </div>
                                <span className="font-bold text-slate-800">
                                    Pós-Graduação
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Especialize-se
                                </span>
                            </button>

                            <button
                                onClick={() => handleNavigate("eja")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-cg-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                            >
                                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <GraduationCap size={24} />
                                </div>
                                <span className="font-bold text-slate-800">
                                    EJA Supletivo
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Termine os Estudos
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Featured Courses Preview on Home - NOW TOP PRIORITY */}
                <section
                    id="courses"
                    className="container mx-auto px-4 py-16 md:px-6"
                >
                    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={18} className="text-cg-600" />
                                <span className="text-sm font-semibold text-cg-600 uppercase tracking-wider">
                                    Desenvolvimento Profissional
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                Cursos Livres em Destaque
                            </h2>
                            <p className="mt-2 text-gray-500 max-w-2xl">
                                Cursos de curta duração focados em Neurociência,
                                Inclusão e Práticas Educacionais. Certificados
                                válidos para horas complementares, concursos e
                                progressão de carreira.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <Button
                                variant="ghost"
                                className="text-cg-600"
                                onClick={() => handleNavigate("courses")}
                            >
                                Ver catálogo completo{" "}
                                <ArrowRight size={16} className="ml-1" />
                            </Button>
                        </div>
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

                {/* EJA Special Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-cg-800 to-cg-900 py-20 text-white">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-cg-500/20 blur-3xl"></div>

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="grid gap-10 lg:grid-cols-2 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center rounded-full bg-teal-500/20 px-3 py-1 text-sm font-medium text-teal-300 border border-teal-500/30">
                                    <GraduationCap size={16} className="mr-2" />
                                    Supletivo Acelerado
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                    Termine seus Estudos em{" "}
                                    <span className="text-teal-400">
                                        até 1 mês
                                    </span>
                                </h2>
                                <p className="text-lg text-cg-100 max-w-lg">
                                    Não perca mais oportunidades de trabalho.
                                    Conclua o Ensino Fundamental ou Médio com o
                                    nosso EJA 100% online. Rápido, seguro e
                                    reconhecido.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">
                                                Ultra Rápido
                                            </h4>
                                            <p className="text-sm text-cg-200">
                                                Certificado em mãos em tempo
                                                recorde.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                                            <MonitorCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">
                                                100% Online
                                            </h4>
                                            <p className="text-sm text-cg-200">
                                                Estude pelo celular ou
                                                computador.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        size="lg"
                                        onClick={() => handleNavigate("eja")}
                                        className="bg-teal-500 hover:bg-teal-600 text-white border-none w-full sm:w-auto"
                                    >
                                        Quero meu Certificado{" "}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="relative mx-auto lg:mr-0">
                                <div
                                    className="relative rounded-2xl bg-white p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 cursor-pointer"
                                    onClick={() => handleNavigate("eja")}
                                >
                                    <img
                                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
                                        alt="Estudante feliz com certificado"
                                        className="aspect-[4/3] w-full max-w-md rounded-xl object-cover"
                                    />
                                    <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                                            <MonitorCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">
                                                Status
                                            </p>
                                            <p className="text-sm font-bold text-slate-900">
                                                Matrículas Abertas
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Graduação Section - Unimes Partnership */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1 relative">
                                <div className="relative z-10 rounded-2xl bg-slate-50 p-2 shadow-xl ring-1 ring-slate-100">
                                    <img
                                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"
                                        alt="Estudantes universitários"
                                        className="rounded-xl w-full object-cover aspect-[4/3]"
                                    />
                                </div>
                                {/* Decorative element */}
                                <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-cg-100 rounded-full blur-2xl -z-10 opacity-70"></div>
                                <div className="absolute -top-6 -left-6 h-32 w-32 bg-teal-100 rounded-full blur-2xl -z-10 opacity-70"></div>
                            </div>

                            <div className="order-1 lg:order-2 space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                    <University size={16} />
                                    Parceria Oficial
                                </div>

                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                                    Graduação a Distância com a qualidade{" "}
                                    <span className="text-cg-600">UNIMES</span>
                                </h2>

                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Amplie seus horizontes com cursos de
                                    graduação e licenciatura reconhecidos pelo
                                    MEC. Tecnologia, Pedagogia, Letras e muito
                                    mais.
                                </p>

                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-cg-100 text-cg-600">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-gray-700">
                                            Mensalidades acessíveis e condições
                                            especiais.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-cg-100 text-cg-600">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-gray-700">
                                            Cursos Tecnólogos rápidos (2 anos)
                                            para o mercado.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-cg-100 text-cg-600">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-gray-700">
                                            Flexibilidade para estudar onde e
                                            quando quiser.
                                        </span>
                                    </li>
                                </ul>

                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="border-cg-600 text-cg-600 hover:bg-cg-50"
                                        onClick={() =>
                                            handleNavigate("graduation")
                                        }
                                    >
                                        Conhecer Cursos de Graduação
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pós-Graduação Section */}
                <section className="py-20 bg-cg-50 border-y border-cg-100">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-teal-100 text-teal-600 mb-4">
                                <ScrollText size={24} />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl mb-4">
                                Especialize-se com nossa Pós-Graduação
                            </h2>
                            <p className="text-lg text-gray-600">
                                Dê o próximo passo na sua carreira. Cursos de
                                especialização Lato Sensu com foco em
                                Neurociência, Educação Especial e Gestão
                                Escolar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-cg-200 hover:-translate-y-1">
                                <div className="mb-6 h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    Neurociência e Educação
                                </h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                                    Aprofunde-se no funcionamento do cérebro e
                                    aplique técnicas científicas para
                                    potencializar a aprendizagem.
                                </p>
                                <button
                                    onClick={() =>
                                        handleNavigate("postgraduation")
                                    }
                                    className="inline-flex items-center text-sm font-semibold text-cg-600 hover:text-cg-700"
                                >
                                    Saiba mais{" "}
                                    <ArrowRight size={16} className="ml-1" />
                                </button>
                            </div>

                            {/* Card 2 */}
                            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-cg-200 hover:-translate-y-1">
                                <div className="mb-6 h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    Psicopedagogia Clínica
                                </h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                                    Capacite-se para diagnosticar e tratar
                                    dificuldades de aprendizagem em diversos
                                    contextos educacionais.
                                </p>
                                <button
                                    onClick={() =>
                                        handleNavigate("postgraduation")
                                    }
                                    className="inline-flex items-center text-sm font-semibold text-cg-600 hover:text-cg-700"
                                >
                                    Saiba mais{" "}
                                    <ArrowRight size={16} className="ml-1" />
                                </button>
                            </div>

                            {/* Card 3 */}
                            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-cg-200 hover:-translate-y-1">
                                <div className="mb-6 h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    Gestão e Supervisão
                                </h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                                    Desenvolva habilidades de liderança para
                                    coordenar equipes pedagógicas e gerir
                                    instituições de ensino.
                                </p>
                                <button
                                    onClick={() =>
                                        handleNavigate("postgraduation")
                                    }
                                    className="inline-flex items-center text-sm font-semibold text-cg-600 hover:text-cg-700"
                                >
                                    Saiba mais{" "}
                                    <ArrowRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <Button
                                size="lg"
                                className="shadow-lg shadow-cg-500/20"
                                onClick={() => handleNavigate("postgraduation")}
                            >
                                Ver todos os cursos de Pós
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section for Schools */}
                <section className="bg-slate-50 border-t border-slate-200 py-16">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="overflow-hidden rounded-3xl bg-cg-900 text-white shadow-xl">
                            <div className="grid lg:grid-cols-2">
                                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                                    <h2 className="text-3xl font-bold mb-4">
                                        Leve o CG Educacional para sua Escola
                                    </h2>
                                    <p className="text-cg-100 mb-8 text-lg leading-relaxed">
                                        Oferecemos pacotes especiais para
                                        formação continuada de corpo docente.
                                        Monitore o progresso da sua equipe e
                                        garanta um ensino de excelência com base
                                        na neurociência.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-teal-500/20">
                                            Falar com Consultor
                                        </button>
                                        <button className="bg-transparent border border-white/20 hover:bg-white/10 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                                            Conhecer Planos
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-cg-800 p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-cg-900/50 p-6 rounded-xl backdrop-blur-sm border border-white/5">
                                            <span className="block text-3xl font-bold text-teal-400 mb-1">
                                                +50
                                            </span>
                                            <span className="text-sm text-cg-200">
                                                Escolas Parceiras
                                            </span>
                                        </div>
                                        <div className="bg-cg-900/50 p-6 rounded-xl backdrop-blur-sm border border-white/5">
                                            <span className="block text-3xl font-bold text-teal-400 mb-1">
                                                98%
                                            </span>
                                            <span className="text-sm text-cg-200">
                                                Aprovação dos Prof.
                                            </span>
                                        </div>
                                        <div className="bg-cg-900/50 p-6 rounded-xl backdrop-blur-sm border border-white/5">
                                            <span className="block text-3xl font-bold text-teal-400 mb-1">
                                                24h
                                            </span>
                                            <span className="text-sm text-cg-200">
                                                Suporte Pedagógico
                                            </span>
                                        </div>
                                        <div className="bg-cg-900/50 p-6 rounded-xl backdrop-blur-sm border border-white/5">
                                            <span className="block text-3xl font-bold text-teal-400 mb-1">
                                                Online
                                            </span>
                                            <span className="text-sm text-cg-200">
                                                100% Flexível
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
        </>
    );
};

export default HomePage;
