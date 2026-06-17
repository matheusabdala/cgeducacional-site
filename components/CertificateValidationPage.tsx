"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Hash,
  Clock,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { formatCpf } from "@/lib/cpf";
import { validateCertificate } from "@/app/(marketing)/validar-certificado/actions";
import type { CmValidation } from "@/server/certimaker/client";

type Status = "idle" | "loading" | "success" | "empty" | "error";

export const CertificateValidationPage: React.FC = () => {
  const [searchType, setSearchType] = useState<"cpf" | "code">("cpf");
  const [searchValue, setSearchValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<CmValidation[]>([]);

  function onTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSearchType(e.target.value as "cpf" | "code");
    setSearchValue("");
    setStatus("idle");
    setResults([]);
  }

  function onValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(
      searchType === "cpf" ? formatCpf(e.target.value) : e.target.value,
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setStatus("loading");
    setResults([]);
    const r = await validateCertificate({ type: searchType, value: searchValue });
    if (r.error) {
      setStatus("error");
      return;
    }
    const valid = (r.results ?? []).filter((x) => x.valid);
    setResults(valid);
    setStatus(valid.length ? "success" : "empty");
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <section className="relative overflow-hidden bg-gradient-to-br from-cg-800 to-cg-950 py-16 text-white">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-teal-500/20 p-3 ring-1 ring-teal-400/30">
            <ShieldCheck size={32} className="text-teal-300" />
          </div>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Validação de Certificado
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-cg-100">
            Verifique a autenticidade dos certificados emitidos pela CG
            Educacional. Informe o CPF do aluno ou o código de verificação.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-10 px-4 py-12">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="tipoBusca"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Tipo de busca
                  </label>
                  <select
                    id="tipoBusca"
                    value={searchType}
                    onChange={onTypeChange}
                    className="block h-12 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="cpf">CPF</option>
                    <option value="code">Código</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="valorBusca"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    {searchType === "cpf" ? "CPF do aluno" : "Código de autenticidade"}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                      {searchType === "cpf" ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      )}
                    </span>
                    <Input
                      id="valorBusca"
                      className="h-12 pl-10 text-base"
                      placeholder={
                        searchType === "cpf" ? "000.000.000-00" : "Ex.: ES26FMA4"
                      }
                      value={searchValue}
                      onChange={onValueChange}
                      maxLength={searchType === "cpf" ? 14 : 12}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="glow"
                size="lg"
                className="w-full"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Verificando…" : "Validar"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-2xl space-y-4">
          {status === "success" &&
            results.map((res) => (
              <div
                key={res.id}
                className="rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-card"
              >
                <div className="mb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Certificado válido
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código {res.id}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Field icon={User} label="Aluno" value={res.alunoNome} />
                  <Field
                    icon={GraduationCap}
                    label="Curso"
                    value={res.cursoNome}
                  />
                  <Field
                    icon={Clock}
                    label="Carga horária"
                    value={`${res.cargaHoraria}h`}
                  />
                  {res.dataEmissao && (
                    <Field
                      icon={CalendarCheck}
                      label="Emitido em"
                      value={res.dataEmissao}
                    />
                  )}
                </dl>
              </div>
            ))}

          {status === "empty" && (
            <Result
              tone="warn"
              title="Certificado não encontrado"
              text="Não encontramos um certificado válido para os dados informados. Confira se digitou corretamente."
            />
          )}
          {status === "error" && (
            <Result
              tone="error"
              title="Não foi possível validar"
              text="Ocorreu um erro na consulta. Tente novamente em instantes."
            />
          )}
        </div>
      </section>
    </div>
  );
};

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function Result({
  tone,
  title,
  text,
}: {
  tone: "warn" | "error";
  title: string;
  text: string;
}) {
  const cls =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return (
    <div className={`rounded-2xl border p-8 text-center shadow-card ${cls}`}>
      <AlertCircle size={40} className="mx-auto mb-3" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
