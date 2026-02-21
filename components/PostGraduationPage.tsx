import React from 'react';
import { Button } from './Button';
import { createWhatsAppLink } from '../constants';
import { ScrollText, Award, TrendingUp, Brain, Users, Lightbulb, Clock, MonitorCheck, BookOpen, CheckCircle } from 'lucide-react';

export const PostGraduationPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cg-800 to-cg-900 py-20 lg:py-28 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full bg-teal-500/20 px-3 py-1 text-sm font-medium text-teal-300 border border-teal-500/30 mb-6">
              <ScrollText size={16} className="mr-2" />
              Pós-Graduação Lato Sensu
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6 leading-tight">
              Torne-se um Especialista e <span className="text-teal-400">Transforme sua Carreira</span>
            </h1>
            <p className="text-lg text-cg-100 max-w-2xl mb-8 leading-relaxed">
              Cursos de Pós-Graduação 100% online, focados na prática e nas tendências mais atuais da Neurociência e Educação. Estude com quem é referência na área.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-teal-500 hover:bg-teal-600 text-white border-none h-14 px-8 text-lg"
                onClick={() => window.open(createWhatsAppLink("Olá, gostaria de ver todas as especializações de Pós-Graduação."), "_blank")}
              >
                Ver Todas as Especializações
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/20 text-white hover:bg-white/10 h-14 px-8"
                onClick={() => window.open(createWhatsAppLink("Olá, gostaria de falar com um consultor sobre a Pós-Graduação."), "_blank")}
              >
                Falar com Consultor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Post-Grad? */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que fazer uma Pós-Graduação?</h2>
            <p className="text-gray-600">Investir em especialização é o caminho mais rápido para alcançar novos patamares profissionais.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Valorização Salarial</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Profissionais com especialização podem ter um aumento salarial de até 50% em comparação com quem possui apenas a graduação.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Título de Especialista</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Adquira autoridade na sua área de atuação. O título de especialista abre portas para cargos de liderança e consultoria.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Networking Qualificado</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Conecte-se com outros profissionais da área, troque experiências e expanda sua rede de contatos profissionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="py-20 bg-cg-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Nossas Áreas de Especialização</h2>
              <p className="text-gray-600">Escolha a trilha que mais se conecta com seus objetivos.</p>
            </div>
            <Button variant="outline">Ver lista completa</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Area 1 */}
            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-cg-600 group-hover:w-2 transition-all"></div>
              <div className="p-8">
                <div className="mb-4 text-cg-600">
                  <Brain size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Neurociência Aplicada</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Neuropsicopedagogia, Neurodidática e Neurociência Clínica. Entenda a mente para educar melhor.
                </p>
                <span className="text-xs font-semibold uppercase tracking-wider text-cg-600 flex items-center gap-1">
                  Saiba Mais <TrendingUp size={14} />
                </span>
              </div>
            </div>

            {/* Area 2 */}
            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 group-hover:w-2 transition-all"></div>
              <div className="p-8">
                <div className="mb-4 text-teal-500">
                  <Lightbulb size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Educação Especial</h3>
                <p className="text-sm text-gray-500 mb-6">
                  TEA (Autismo), Libras, Braille e Deficiência Intelectual. Torne-se um agente de inclusão.
                </p>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 flex items-center gap-1">
                  Saiba Mais <TrendingUp size={14} />
                </span>
              </div>
            </div>

            {/* Area 3 */}
            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div>
              <div className="p-8">
                <div className="mb-4 text-amber-500">
                  <BookOpen size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gestão Escolar</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Administração, Supervisão, Orientação e Inspeção Escolar. Lidere instituições com excelência.
                </p>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  Saiba Mais <TrendingUp size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology / Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-cg-900 rounded-2xl p-2 shadow-2xl">
                 <img 
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=800" 
                  alt="Profissional estudando em casa" 
                  className="rounded-xl w-full"
                 />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-2 rounded-full text-teal-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Formação Acelerada</p>
                    <p className="text-xs text-gray-500">Conclua a partir de 6 meses</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Metodologia Flexível e Moderna</h2>
              <p className="text-gray-600 text-lg mb-8">
                Nossa pós-graduação se adapta à sua rotina, não o contrário. Estude com materiais didáticos de alta qualidade e suporte pedagógico contínuo.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-cg-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">100% Online</h4>
                    <p className="text-sm text-gray-500">Acesse as aulas pelo computador, tablet ou celular, 24 horas por dia.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-cg-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">Certificado Reconhecido</h4>
                    <p className="text-sm text-gray-500">Válido em todo o território nacional para concursos e evolução funcional.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-cg-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">TCC Opcional</h4>
                    <p className="text-sm text-gray-500">Em muitos cursos, o Trabalho de Conclusão de Curso é facultativo. Foque no que importa.</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-8">
                 <Button 
                   className="shadow-lg shadow-cg-500/20"
                   onClick={() => window.open(createWhatsAppLink("Olá, gostaria de me matricular na Pós-Graduação."), "_blank")}
                 >
                   Quero me Matricular
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};