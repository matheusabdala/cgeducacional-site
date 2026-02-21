import React from 'react';
import { Button } from './Button';
import { createWhatsAppLink } from '../constants';
import { CheckCircle, TrendingUp, GraduationCap, Building2, BookOpen, Clock, Award, HelpCircle, ArrowRight } from 'lucide-react';

interface EJAPageProps {
  onNavigate: (page: string) => void;
}

export const EJAPage: React.FC<EJAPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white">
      {/* Hero Section EJA */}
      <section className="relative overflow-hidden bg-cg-900 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-10"></div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-sm font-medium text-teal-300">
                <Clock size={16} className="mr-2" />
                Conclusão Rápida e Segura
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                Seu Diploma do Ensino Médio em até <span className="text-teal-400">30 dias</span>
              </h1>
              <p className="text-lg text-cg-100 max-w-xl">
                Recupere o tempo perdido. O Supletivo EJA da CG Educacional é 100% online, reconhecido por Lei e válido em todo o Brasil. Estude pelo celular e faça as provas sem sair de casa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-teal-500 hover:bg-teal-600 border-none text-white text-lg h-14 px-8"
                  onClick={() => window.open(createWhatsAppLink("Olá, quero meu diploma do EJA agora."), "_blank")}
                >
                  Quero meu Diploma Agora
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/20 text-white hover:bg-white/10 h-14"
                  onClick={() => window.open(createWhatsAppLink("Olá, gostaria de falar sobre o EJA."), "_blank")}
                >
                  Falar no WhatsApp
                </Button>
              </div>
              <p className="text-sm text-cg-300 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" /> Certificado Válido pelo MEC/Sistec
              </p>
            </div>
            
            <div className="hidden lg:block relative">
               <div className="bg-white p-2 rounded-2xl shadow-2xl rotate-1">
                 <img 
                   src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=800" 
                   alt="Estudante EJA com Diploma" 
                   className="rounded-xl w-full object-cover" 
                 />
                 <div className="absolute bottom-8 -left-8 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                          <Award size={24} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 text-lg">Garantia Total</p>
                          <p className="text-xs text-gray-500">Acompanhamento pedagógico até a aprovação.</p>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Finish School? */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que terminar os estudos?</h2>
            <p className="text-gray-600 text-lg">
              O diploma do ensino médio é a chave que abre as portas para as melhores oportunidades da sua vida.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <TrendingUp size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Melhores Salários</h3>
               <p className="text-gray-500 text-sm">
                 Pesquisas indicam que quem conclui o Ensino Médio ganha, em média, 40% a mais do que quem não terminou.
               </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <GraduationCap size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Faculdade</h3>
               <p className="text-gray-500 text-sm">
                 Realize o sonho do Ensino Superior. Com o EJA, você pode prestar vestibular, ENEM e entrar na faculdade.
               </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <Building2 size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Concursos Públicos</h3>
               <p className="text-gray-500 text-sm">
                 Tenha a estabilidade que você sempre quis. A maioria dos concursos exige, no mínimo, o Ensino Médio completo.
               </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                  <Award size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Autoestima</h3>
               <p className="text-gray-500 text-sm">
                 Sinta o orgulho de dizer "Eu formei!". Concluir essa etapa é uma vitória pessoal que muda como você se vê.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-3xl font-bold text-slate-900 mb-6">Como funciona o EJA Online?</h2>
                 <p className="text-gray-600 mb-8">
                   Nossa metodologia foi desenhada para quem não tem tempo a perder. Tudo é feito de forma simples e direta.
                 </p>
                 
                 <div className="space-y-8">
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cg-600 text-white flex items-center justify-center font-bold">1</div>
                       <div>
                          <h4 className="font-bold text-lg text-slate-900">Matrícula Imediata</h4>
                          <p className="text-gray-500">Faça sua matrícula online e receba acesso à plataforma de estudos no mesmo dia.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cg-600 text-white flex items-center justify-center font-bold">2</div>
                       <div>
                          <h4 className="font-bold text-lg text-slate-900">Estude no seu Tempo</h4>
                          <p className="text-gray-500">Acesse apostilas digitais e videoaulas quando e onde quiser. O conteúdo é focado no essencial.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cg-600 text-white flex items-center justify-center font-bold">3</div>
                       <div>
                          <h4 className="font-bold text-lg text-slate-900">Avaliações Online</h4>
                          <p className="text-gray-500">Realize os simulados e provas pela plataforma assim que se sentir preparado.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">4</div>
                       <div>
                          <h4 className="font-bold text-lg text-slate-900">Certificado em Mãos</h4>
                          <p className="text-gray-500">Após aprovado, receba seu histórico escolar e certificado válido em todo território nacional.</p>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="bg-cg-50 p-8 rounded-3xl border border-cg-100">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">O que está incluso?</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                      <CheckCircle className="text-teal-500" size={20} />
                      <span className="font-medium text-slate-700">Material Didático Completo (PDF)</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                      <CheckCircle className="text-teal-500" size={20} />
                      <span className="font-medium text-slate-700">Videoaulas Explicativas</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                      <CheckCircle className="text-teal-500" size={20} />
                      <span className="font-medium text-slate-700">Suporte com Tutores</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                      <CheckCircle className="text-teal-500" size={20} />
                      <span className="font-medium text-slate-700">Taxa de Matrícula Grátis</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                      <CheckCircle className="text-teal-500" size={20} />
                      <span className="font-medium text-slate-700">Sem mensalidades (Valor Único)</span>
                    </li>
                  </ul>
                  
                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 mb-2">Oferta por tempo limitado</p>
                    <Button 
                      size="lg" 
                      className="w-full shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700"
                      onClick={() => window.open(createWhatsAppLink("Olá, gostaria de me matricular no EJA."), "_blank")}
                    >
                      Matricular-se Agora
                    </Button>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Dúvidas Frequentes</h2>
          
          <div className="space-y-4">
             <div className="bg-white rounded-xl p-6 shadow-sm">
               <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-2">
                 <HelpCircle size={20} className="text-cg-600" /> O certificado é reconhecido pelo MEC?
               </h4>
               <p className="text-gray-600 ml-7">
                 Sim! Trabalhamos com escolas credenciadas pelos Conselhos Estaduais de Educação e reconhecidas pelo MEC/Sistec. Seu diploma tem a mesma validade de uma escola presencial regular.
               </p>
             </div>
             
             <div className="bg-white rounded-xl p-6 shadow-sm">
               <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-2">
                 <HelpCircle size={20} className="text-cg-600" /> Qual a idade mínima?
               </h4>
               <p className="text-gray-600 ml-7">
                 Para o Ensino Fundamental é necessário ter 15 anos completos. Para o Ensino Médio, é necessário ter 18 anos completos.
               </p>
             </div>

             <div className="bg-white rounded-xl p-6 shadow-sm">
               <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-2">
                 <HelpCircle size={20} className="text-cg-600" /> Realmente consigo terminar em 1 mês?
               </h4>
               <p className="text-gray-600 ml-7">
                 Sim. Por se tratar de um curso supletivo EAD, o ritmo é definido por você. Se você já tem conhecimento prévio e dedicação para estudar o material, é possível realizar as provas e concluir todo o processo em 30 dias.
               </p>
             </div>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-16 bg-cg-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Pronto para mudar de vida?</h2>
          <p className="text-cg-100 text-lg mb-8 max-w-2xl mx-auto">
            Não deixe para depois. A oportunidade de conquistar seu diploma e transformar sua carreira está a um clique de distância.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-cg-700 hover:bg-gray-100 text-lg px-10"
            onClick={() => window.open(createWhatsAppLink("Olá, gostaria de iniciar minha matrícula no EJA."), "_blank")}
          >
            Iniciar Matrícula
          </Button>
        </div>
      </section>
    </div>
  );
};