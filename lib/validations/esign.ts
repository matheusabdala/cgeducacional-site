import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";

/** Schemas do módulo de assinatura — usados no editor (client) e no servidor. */

export const FIELD_KINDS = ["signature", "name", "cpf", "date"] as const;

export const FIELD_KIND_LABEL: Record<(typeof FIELD_KINDS)[number], string> = {
  signature: "Assinatura",
  name: "Nome",
  cpf: "CPF",
  date: "Data",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const unit = z.number().finite().min(0).max(1);

export const signerInputSchema = z.object({
  key: z.string().min(1).max(64),
  id: z.string().max(64).optional(),
  name: optionalText(120),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido"),
  cpf: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, "") : undefined))
    .refine((v) => !v || isValidCpf(v), "CPF inválido"),
});

export const fieldInputSchema = z
  .object({
    signerKey: z.string().min(1).max(64),
    kind: z.enum(FIELD_KINDS),
    page: z.number().int().min(0).max(5000),
    x: unit,
    y: unit,
    w: unit.refine((v) => v > 0.005, "Campo muito pequeno"),
    h: unit.refine((v) => v > 0.004, "Campo muito pequeno"),
  })
  .refine((f) => f.x + f.w <= 1.0001 && f.y + f.h <= 1.0001, "Campo fora da página");

export const draftSchema = z.object({
  title: z.string().trim().min(2, "Dê um título ao documento").max(160),
  requireOtp: z.boolean(),
  message: optionalText(1000),
  signers: z.array(signerInputSchema).max(20, "Máximo de 20 signatários"),
  fields: z.array(fieldInputSchema).max(300, "Campos demais"),
});

export type DraftInput = z.input<typeof draftSchema>;
export type SignerInput = z.input<typeof signerInputSchema>;
export type FieldInput = z.input<typeof fieldInputSchema>;

export const identifySchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Informe o nome completo")
    .max(120)
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome"),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => isValidCpf(v), "CPF inválido"),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido"),
});

export type IdentifyInput = z.input<typeof identifySchema>;

export const geoSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(1_000_000).optional(),
  })
  .nullable()
  .optional();

export const signatureSubmitSchema = identifySchema.extend({
  method: z.enum(["draw", "type", "phone"]),
  pngBase64: z.string().max(1_500_000).optional(),
  sessionCode: z.string().max(100).optional(),
  typedText: z.string().trim().max(120).optional(),
  consent: z.literal(true, { error: "Confirme que leu e concorda com o documento" }),
  geo: geoSchema,
});

export type SignatureSubmitInput = z.input<typeof signatureSubmitSchema>;
