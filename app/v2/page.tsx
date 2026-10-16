import type { Metadata } from "next";
import { BrainHero } from "@/components/v2/brain/BrainHero";
import { ThemeSwitch } from "@/components/v2/brain/ThemeSwitch";
import { CourseFinder } from "@/components/v2/CourseFinder";
import { SectionStub } from "@/components/v2/SectionStub";
import { Section, SectionHead } from "@/components/v2/ui/Section";
import { Action } from "@/components/v2/ui/Action";
import { CourseCard } from "@/components/v2/ui/CourseCard";
import { getFeaturedCourses, getFinderCourses } from "@/lib/v2/catalog";
import { createWhatsAppLink } from "@/constants";
import styles from "./v2.module.css";

export const metadata: Metadata = {
  title: "CG Educacional (v2)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const POS_AREAS = [
  {
    name: "Neurociência e Educação",
    text: "Como o cérebro aprende e o que fazer com isso em sala de aula.",
  },
  {
    name: "Psicopedagogia Clínica",
    text: "Avaliação e intervenção em dificuldades de aprendizagem.",
  },
  {
    name: "Gestão e Supervisão",
    text: "Coordenação de equipe pedagógica e direção de instituição de ensino.",
  },
];

const GRAD_POINTS = [
  "Licenciaturas e tecnólogos reconhecidos pelo MEC",
  "Tecnólogos em dois anos",
  "Aulas a distância, no horário que der",
];

/**
 * Landing v2.
 *
 * Convive com a página atual: esta é `/v2`, a de produção segue em `/`.
 *
 * As faixas usam `Section`, que só conhece três superfícies. A invertida
 * aparece uma vez na página inteira, no bloco do EJA. A home antiga tinha seis
 * fundos alternando sem critério, e era metade da sensação de bagunça.
 */
export default async function Page() {
  // No protótipo o buscador mostra o catálogo inteiro, inclusive o que ainda
  // não foi publicado, senão não dá para ver a coisa funcionando. Na página
  // real este argumento sai.
  const [courses, featured] = await Promise.all([
    getFinderCourses({ includeDrafts: true }),
    getFeaturedCourses(4),
  ]);
  const live = courses.filter((c) => c.live).length;

  return (
    <div className={styles.root}>
      <div className={styles.labBar}>
        <span className={styles.labTag}>v2</span>
        <span className={styles.labText}>
          proposta da landing · {live} de {courses.length} cursos publicados
        </span>
        <ThemeSwitch />
      </div>

      <div className={styles.heroSlot}>
        <BrainHero />
      </div>

      <Section id="buscar">
        <CourseFinder courses={courses} />
      </Section>

      {featured.length > 0 && (
        <Section surface="sunken" id="destaques">
          <SectionHead
            eyebrow="Cursos livres"
            title="Já disponíveis na plataforma"
            lede="Cursos de curta duração, com certificado, que valem como horas complementares e para progressão de carreira."
            aside={<Action href="/cursos" variant="quiet">Ver o catálogo</Action>}
          />
          <div className={styles.cards}>
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </Section>
      )}

      {/* A única faixa invertida da página. */}
      <Section surface="inverted" id="eja">
        <div className={styles.split}>
          <div className={styles.splitText}>
            <SectionHead
              eyebrow="EJA supletivo"
              title="Conclua o ensino fundamental ou o médio"
              lede="Para quem precisa do certificado e não consegue voltar para a sala de aula. Você estuda pelo celular ou pelo computador e faz as provas pela plataforma."
            />
            <div className={styles.actions}>
              <Action
                href={createWhatsAppLink("Olá, gostaria de saber mais sobre o EJA supletivo.")}
                external
              >
                Falar sobre o EJA
              </Action>
              <Action href="/eja" variant="secondary">
                Como funciona
              </Action>
            </div>
          </div>
          <ul className={styles.facts}>
            <li>
              <strong>Online</strong>
              <span>Material e provas pela plataforma</span>
            </li>
            <li>
              <strong>Certificado</strong>
              <span>Válido em todo o território nacional</span>
            </li>
            <li>
              <strong>Acompanhamento</strong>
              <span>Suporte de tutores até a aprovação</span>
            </li>
          </ul>
        </div>
      </Section>

      <Section id="graduacao">
        <div className={styles.split}>
          <div className={styles.splitText}>
            <SectionHead
              eyebrow="Graduação"
              title="Licenciaturas e tecnólogos com a Unimes"
              lede="Parceria com a Universidade Metropolitana de Santos para graduação a distância."
            />
            <ul className={styles.points}>
              {GRAD_POINTS.map((p) => (
                <li key={p}>
                  <span className={styles.check} aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Action href="/graduacao">Conhecer os cursos</Action>
            </div>
          </div>
          <div className={styles.partner}>
            <p className={styles.partnerLabel}>Parceria</p>
            <p className={styles.partnerName}>Unimes</p>
            <p className={styles.partnerNote}>
              Universidade Metropolitana de Santos. Cursos reconhecidos pelo MEC.
            </p>
          </div>
        </div>
      </Section>

      <Section surface="sunken" id="pos">
        <SectionHead
          eyebrow="Pós-graduação"
          title="Especialização lato sensu"
          lede="Para quem já tem graduação e quer se aprofundar numa área."
          aside={<Action href="/pos-graduacao" variant="quiet">Ver todas</Action>}
        />
        <div className={styles.areas}>
          {POS_AREAS.map((a) => (
            <article key={a.name} className={styles.area}>
              <h3>{a.name}</h3>
              <p>{a.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="escolas">
        <div className={styles.cta}>
          <SectionHead
            eyebrow="Para escolas"
            title="Formação continuada para o corpo docente"
            lede="Pacotes para instituições que querem formar a equipe inteira, com acompanhamento do progresso de cada professor."
          />
          <div className={styles.actions}>
            <Action
              href={createWhatsAppLink(
                "Olá, represento uma escola e gostaria de saber sobre formação para a equipe.",
              )}
              external
            >
              Falar com a equipe
            </Action>
          </div>
        </div>
      </Section>

      <Section surface="sunken" tight>
        <SectionStub
          index="07"
          name="Rodapé"
          intent="Contato, endereço, redes e os links institucionais. Entra junto com o cabeçalho, que ainda é o antigo."
          height={130}
        />
      </Section>
    </div>
  );
}
