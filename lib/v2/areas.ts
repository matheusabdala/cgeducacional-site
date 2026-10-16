/**
 * Vocabulário do catálogo, compartilhado entre servidor e cliente.
 *
 * Mora separado de `catalog.ts` de propósito: aquele é `server-only` por causa
 * do Prisma, e o buscador roda no cliente. Importar os tipos de lá arrastaria a
 * trava para o bundle do navegador e quebraria o build inteiro.
 */

export const AREAS = {
  neurociencia: "Neurociência",
  pedagogia: "Pedagogia",
  inclusao: "Educação inclusiva",
  gestao: "Gestão escolar",
  seguranca_trabalho: "Segurança do trabalho",
  seguranca_publica: "Segurança pública",
  musica: "Música",
  artes_visuais: "Artes visuais",
  letras: "Letras",
  historia: "História",
  hotelaria: "Hotelaria",
  outros: "Outras áreas",
} as const;

export type AreaKey = keyof typeof AREAS;

export const LEVELS = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
} as const;

export type LevelKey = keyof typeof LEVELS;

export type FinderCourse = {
  id: string;
  title: string;
  area: AreaKey;
  level: LevelKey;
  hours: number | null;
  /** false = ainda não publicado. O protótipo mostra, a página real não. */
  live: boolean;
};

export type FeaturedCourse = FinderCourse & {
  description: string;
  duration: string | null;
};

/**
 * Correção estreita e auditável de categoria.
 *
 * Hoje 138 cursos estão como "outros", e parte deles tem área própria no enum.
 * A única regra aplicada aqui é a que dá para defender sem achismo: título que
 * começa com "NR " seguido de número é norma regulamentadora, logo segurança do
 * trabalho. O resto fica em "outras áreas" até alguém categorizar de verdade,
 * em vez de inventar taxonomia a partir de palavra-chave.
 */
export function resolveArea(category: string, title: string): AreaKey {
  if (category === "outros" && /^NR[\s-]?\d+/i.test(title.trim())) return "seguranca_trabalho";
  return (category in AREAS ? category : "outros") as AreaKey;
}
