import { z } from "zod";

export const COURSE_CATEGORIES = [
  { value: "neurociencia", label: "Neurociência" },
  { value: "pedagogia", label: "Pedagogia" },
  { value: "gestao", label: "Gestão Escolar" },
  { value: "inclusao", label: "Inclusão" },
] as const;

export const COURSE_LEVELS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
] as const;

export const COURSE_MODALITIES = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
] as const;

export const courseSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  description: z.string().min(10, "Descrição muito curta (mín. 10 caracteres)"),
  fullDescription: z.string().optional().or(z.literal("")),
  category: z.enum(["neurociencia", "pedagogia", "gestao", "inclusao"]),
  level: z.enum(["iniciante", "intermediario", "avancado"]),
  price: z.coerce.number().min(0, "Preço inválido"),
  durationLabel: z.string().optional().or(z.literal("")),
  thumbnailUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  // Dados acadêmicos (espelham o Curso do Certimaker)
  programContent: z.string().optional().or(z.literal("")),
  workloadHours: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).optional(),
  ),
  modality: z.enum(["online", "presencial", "hibrido"]).default("online"),
  location: z.string().optional().or(z.literal("")),
  // Liberação de conteúdo (opcional)
  requireSequential: z.boolean().default(false),
  dripEnabled: z.boolean().default(false),
  dripInitialCount: z.coerce.number().int().min(0).default(0),
  dripDelayDays: z.coerce.number().int().min(0).default(7),
  // Modelo de certificado (id no Certimaker). "" = usar o padrão.
  certimakerTemplateId: z.string().optional().or(z.literal("")),
});

export const moduleSchema = z.object({
  title: z.string().min(2, "Título muito curto"),
});

export const lessonSchema = z.object({
  title: z.string().min(2, "Título muito curto"),
  description: z.string().optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  videoProvider: z.enum(["drive", "youtube"]).default("drive"),
  videoRef: z.string().optional().or(z.literal("")),
  documentFileId: z.string().optional().or(z.literal("")),
  materialFileId: z.string().optional().or(z.literal("")),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
