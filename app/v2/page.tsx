import type { Metadata } from "next";
import { BrainHero } from "@/components/v2/brain/BrainHero";
import { ThemeSwitch } from "@/components/v2/brain/ThemeSwitch";
import { CourseFinder } from "@/components/v2/CourseFinder";
import { SectionStub } from "@/components/v2/SectionStub";
import { getFinderCourses } from "@/lib/v2/catalog";
import styles from "./v2.module.css";

export const metadata: Metadata = {
  title: "CG Educacional (v2)",
  robots: { index: false, follow: false },
};

// o catálogo muda quando alguém publica um curso no admin
export const dynamic = "force-dynamic";

/**
 * Landing v2.
 *
 * Convive com a página atual: esta é `/v2`, a de produção segue intocada em
 * `/`. Quando for aprovada, as duas trocam de lugar e a antiga fica em
 * `/classico` por um tempo.
 *
 * Tudo aqui é CSS Module. Nenhuma classe do Tailwind, que continua mandando no
 * LMS (admin, área do aluno, checkout, assinatura).
 */
export default async function Page() {
  // No protótipo o buscador mostra o catálogo inteiro, inclusive o que ainda
  // não foi publicado, senão não dá para ver a coisa funcionando: hoje só 5 dos
  // 265 cursos estão no ar. Na página real este argumento sai.
  const courses = await getFinderCourses({ includeDrafts: true });
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

      <div className={styles.body}>
        <CourseFinder courses={courses} />

        <SectionStub
          index="02"
          name="As quatro frentes"
          intent="Cursos livres, graduação com a Unimes, pós-graduação e EJA supletivo, cada uma com o que ela resolve, para quem é e quanto tempo leva."
        />
        <SectionStub
          index="03"
          name="Como o cérebro aprende"
          intent="A curva do esquecimento interativa: a pessoa arrasta quantas revisões faz e vê a retenção subir, com o lobo temporal acendendo junto. É conteúdo do curso de Neurociência da Aprendizagem funcionando como amostra."
        />
        <SectionStub
          index="04"
          name="Seu certificado"
          intent="Prévia do certificado se desenhando com o nome que a pessoa digita, mais o campo de validação ligado ao Certimaker. Mostrar derrota argumentar que o certificado vale."
        />
        <SectionStub
          index="05"
          name="Quem já estudou aqui"
          intent="Depoimentos com nome, curso e cidade. A home de hoje não tem uma linha de prova social."
          height={180}
        />
        <SectionStub
          index="06"
          name="Rodapé"
          intent="Contato, endereço, redes e os links institucionais."
          height={150}
        />
      </div>
    </div>
  );
}
