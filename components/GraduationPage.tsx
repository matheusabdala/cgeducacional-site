import React from 'react';
import { Button } from './Button';
import { createWhatsAppLink } from '../constants';
import { University, Check, BookOpen, Award, HelpCircle, Coins, Laptop, TrendingUp, MessageCircle, MonitorPlay, FileText, ShieldCheck, Building2 } from 'lucide-react';

export const GraduationPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-cg-900 py-20 lg:py-28 overflow-hidden">
        {/* Changed background image to university setting */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-15"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cg-900 via-cg-900/90 to-transparent"></div>
        
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-teal-300 border border-white/20">
                <University size={16} className="mr-2" />
                Parceria Oficial UNIMES
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                Sua Graduação de Excelência Começa Aqui
              </h1>
              <p className="text-lg text-cg-100 max-w-xl leading-relaxed">
                A CG Educacional traz para você a tradição e qualidade da UNIMES. Cursos de graduação 100% online, com diploma reconhecido pelo MEC e valores que cabem no seu bolso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-teal-500 hover:bg-teal-600 border-none text-white text-lg h-14 px-8"
                  onClick={() => window.open(createWhatsAppLink("Olá, gostaria de ver os cursos de Graduação disponíveis."), "_blank")}
                >
                  Ver Cursos Disponíveis
                </Button>
              </div>
            </div>
            
             <div className="hidden lg:block relative">
               <div className="bg-white p-2 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                 <img 
                   src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" 
                   alt="Alunos estudando" 
                   className="rounded-xl w-full object-cover"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs text-center">
                    <span className="block text-4xl font-bold text-cg-600 mb-1">MEC</span>
                    <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Nota Máxima no Conceito Institucional</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Highlight Section */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Investimento Acessível</h2>
            <p className="text-gray-600">Educação de qualidade não precisa custar caro. Confira nossas condições especiais.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Promo Card - Starting At */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg hover:border-cg-300 hover:shadow-xl transition-all flex flex-col">
              <div className="absolute top-0 right-0 bg-cg-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                Promoção Especial
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-cg-100 p-3 rounded-full text-cg-600">
                  <Coins size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900">Condições Promocionais</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6 flex-grow">
                Diversos cursos de graduação com valores iniciais reduzidos. Entre em contato para descobrir se o seu curso desejado está nesta campanha.
              </p>
              <div className="mb-6">
                <span className="text-sm text-gray-500">Mensalidades a partir de</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">R$ 49,00</span>
                  <span className="text-lg font-medium text-gray-500">/mês*</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  *Consulte os cursos participantes desta oferta.
                </p>
              </div>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-cg-500" /> Diploma com mesma validade do presencial
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-cg-500" /> Flexibilidade total de horário
                </li>
              </ul>
              <Button 
                className="w-full bg-cg-600 hover:bg-cg-700 gap-2"
                onClick={() => window.open(createWhatsAppLink("Olá, gostaria de consultar os cursos de Graduação em oferta."), "_blank")}
              >
                 <MessageCircle size={18} /> Consultar Cursos em Oferta
              </Button>
            </div>

            {/* Fixed Price Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-teal-500 bg-white p-8 shadow-xl flex flex-col">
               <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                Mensalidade Fixa
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900">Planos com Mensalidade Fixa</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6 flex-grow">
                Previsibilidade e segurança para o seu bolso. Temos uma seleção de cursos com mensalidade fixa do início ao fim da graduação.
              </p>
              <div className="mb-6">
                <span className="text-sm text-gray-500">Valores a partir de</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">R$ 128,00</span>
                  <span className="text-lg font-medium text-gray-500">/mês</span>
                </div>
                <p className="text-xs text-teal-600 font-semibold mt-2 bg-teal-50 inline-block px-2 py-1 rounded">
                  Consulte a lista de cursos participantes
                </p>
              </div>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-teal-500" /> Sem surpresas na mensalidade
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-teal-500" /> Foco na sua formação
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                onClick={() => window.open(createWhatsAppLink("Olá, gostaria de saber quais cursos de Graduação participam da mensalidade fixa."), "_blank")}
              >
                 <MessageCircle size={18} /> Saber quais cursos participam
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center px-4">
             <p className="text-xs text-gray-400 max-w-3xl mx-auto leading-relaxed border-t border-gray-100 pt-4">
               *Os valores informados são referenciais. As campanhas promocionais e os valores de mensalidade fixa variam de acordo com o curso escolhido e o período de matrícula.
               Existem cursos com mensalidade fixa a partir de R$ 128,00, mas outros cursos podem ter valores superiores.
               Para obter o valor exato e as condições vigentes para o curso de seu interesse, é imprescindível falar com um de nossos consultores.
             </p>
          </div>
        </div>
      </section>

      {/* Course Types */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
               <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <BookOpen size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Licenciatura</h3>
               <p className="text-sm text-gray-500 font-medium mb-4">Duração: 3 a 4 anos</p>
               <p className="text-gray-600 text-sm">
                 Formação focada para quem deseja atuar como professor na Educação Básica (Fundamental e Médio).
               </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
               <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <Award size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Bacharelado</h3>
               <p className="text-sm text-gray-500 font-medium mb-4">Duração: 4 a 5 anos</p>
               <p className="text-gray-600 text-sm">
                 Formação generalista que prepara o profissional para atuar em diversos setores do mercado de trabalho.
               </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
               <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 mb-4">
                  <TrendingUp size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Tecnólogo</h3>
               <p className="text-sm text-gray-500 font-medium mb-4">Duração: 2 a 3 anos</p>
               <p className="text-gray-600 text-sm">
                 Curso superior de menor duração, focado na prática e nas necessidades imediatas do mercado de trabalho.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expanded FAQ Section */}
      <section className="py-20 bg-cg-50">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Dúvidas Frequentes</h2>
            <p className="text-gray-600">Tire suas dúvidas sobre a metodologia EAD, validade dos cursos e matrícula.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-slate-900 flex items-start gap-3 mb-3">
                 <MonitorPlay size={24} className="text-cg-600 shrink-0 mt-0.5" /> 
                 Como funcionam as aulas no EAD?
               </h4>
               <div className="pl-9">
                 <p className="text-gray-600 leading-relaxed">
                   As aulas são 100% online através de um Ambiente Virtual de Aprendizagem (AVA) moderno. Você terá acesso a videoaulas, materiais em PDF, biblioteca virtual e fóruns para tirar dúvidas com tutores. Você estuda no seu ritmo, nos horários que preferir.
                 </p>
               </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-slate-900 flex items-start gap-3 mb-3">
                 <FileText size={24} className="text-cg-600 shrink-0 mt-0.5" /> 
                 O diploma EAD é diferente do presencial?
               </h4>
               <div className="pl-9">
                 <p className="text-gray-600 leading-relaxed">
                   <strong>Não.</strong> O diploma emitido em um curso a distância tem exatamente a mesma validade jurídica de um curso presencial. No documento, não há especificação da modalidade de ensino, garantindo igualdade de condições no mercado de trabalho e em concursos públicos.
                 </p>
               </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-slate-900 flex items-start gap-3 mb-3">
                 <HelpCircle size={24} className="text-cg-600 shrink-0 mt-0.5" /> 
                 O curso tecnólogo é considerado curso superior?
               </h4>
               <div className="pl-9">
                 <p className="text-gray-600 leading-relaxed">
                   <strong>Sim!</strong> O diploma de Tecnólogo é de nível superior. Ele permite que você faça pós-graduação, mestrado e doutorado. É a opção ideal para quem busca uma inserção rápida no mercado.
                 </p>
               </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-slate-900 flex items-start gap-3 mb-3">
                 <Building2 size={24} className="text-cg-600 shrink-0 mt-0.5" /> 
                 Posso prestar concurso público com diploma de Tecnólogo?
               </h4>
               <div className="pl-9">
                 <p className="text-gray-600 leading-relaxed">
                   <strong>Com certeza.</strong> O diploma de tecnólogo é válido para concursos públicos que exijam nível superior. A menos que o edital do concurso especifique obrigatoriedade de Bacharelado ou Licenciatura em uma área específica, o diploma de tecnólogo é plenamente aceito para posse em cargos públicos.
                 </p>
               </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-slate-900 flex items-start gap-3 mb-3">
                 <Award size={24} className="text-cg-600 shrink-0 mt-0.5" /> 
                 Quais os documentos para matrícula?
               </h4>
               <div className="pl-9">
                 <p className="text-gray-600 leading-relaxed">
                   O processo é simples e pode ser feito online. Geralmente são necessários: RG, CPF, Certidão de Nascimento ou Casamento, Histórico Escolar do Ensino Médio, Certificado de Conclusão do Ensino Médio e Comprovante de Residência.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Comece sua Graduação Hoje Mesmo</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg" 
                  className="px-8 shadow-xl shadow-cg-500/20"
                  onClick={() => window.open(createWhatsAppLink("Olá, gostaria de falar com um consultor sobre a Graduação."), "_blank")}
                >
                    Falar com um Consultor
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8"
                  onClick={() => window.open(createWhatsAppLink("Olá, gostaria de ver a grade curricular dos cursos de Graduação."), "_blank")}
                >
                    Ver Grade Curricular
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
};