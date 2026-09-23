"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Fingerprint,
  Keyboard,
  Loader2,
  Lock,
  MapPin,
  PenLine,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCpf, isValidCpf } from "@/lib/cpf";
import { cn } from "@/lib/utils";
import {
  identifyAction,
  requestOtpAction,
  submitSignatureAction,
  verifyOtpAction,
} from "@/app/(esign)/assinar/[token]/actions";
import type { PageBox } from "../pdf-pages";
import { SignatureCanvas, type SignaturePadHandle } from "./signature-pad";
import { TypedSignature, renderTypedSignature } from "./typed-signature";
import { PhoneSignature, type PhoneResult } from "./phone-signature";

const PdfPages = dynamic(() => import("../pdf-pages").then((m) => m.PdfPages), {
  ssr: false,
  loading: () => <div className="h-[60vh] w-full animate-pulse rounded-2xl bg-muted/40" />,
});

type Kind = "signature" | "name" | "cpf" | "date";
const FIELD_LABEL: Record<Kind, string> = {
  signature: "Sua assinatura",
  name: "Seu nome",
  cpf: "Seu CPF",
  date: "Data",
};

export type SigningView = {
  document: {
    id: string;
    code: string;
    title: string;
    status: "draft" | "pending" | "completed" | "cancelled";
    pageCount: number;
    pageSizes: PageBox[];
    originalSha256: string;
    requireOtp: boolean;
    message: string | null;
    senderName: string;
    hasSigned: boolean;
  };
  signer: {
    status: "pending" | "signed";
    presetName: string | null;
    presetEmail: string | null;
    presetCpfMasked: string | null;
    signedName: string | null;
    signedAt: string | Date | null;
    otpVerified: boolean;
    fields: { id: string; kind: Kind; page: number; x: number; y: number; w: number; h: number }[];
  };
  consentText: string;
};

type Step = "review" | "identify" | "otp" | "sign" | "done";

export function SignFlow({ token, view }: { token: string; view: SigningView }) {
  const d = view.document;
  const alreadySigned = view.signer.status === "signed";
  const [step, setStep] = React.useState<Step>(alreadySigned ? "done" : "review");
  const [completed, setCompleted] = React.useState(d.status === "completed");

  // Identificação
  const [name, setName] = React.useState(view.signer.presetName ?? "");
  const [cpf, setCpf] = React.useState("");
  const [email, setEmail] = React.useState(view.signer.presetEmail ?? "");
  const [idError, setIdError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Código por e-mail
  const [sentTo, setSentTo] = React.useState("");
  const [devMode, setDevMode] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  // Assinatura
  const [method, setMethod] = React.useState<"draw" | "type" | "phone">("draw");
  const padRef = React.useRef<SignaturePadHandle>(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const typedRef = React.useRef<HTMLDivElement>(null);
  const [phone, setPhone] = React.useState<PhoneResult | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [shareGeo, setShareGeo] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const fieldsByPage = React.useMemo(() => {
    const m = new Map<number, SigningView["signer"]["fields"]>();
    for (const f of view.signer.fields) m.set(f.page, [...(m.get(f.page) ?? []), f]);
    return m;
  }, [view.signer.fields]);
  const sigPages = [...new Set(view.signer.fields.filter((f) => f.kind === "signature").map((f) => f.page + 1))];

  async function submitIdentity(e: React.FormEvent) {
    e.preventDefault();
    setIdError(null);
    if (name.trim().split(/\s+/).length < 2) return setIdError("Informe seu nome completo.");
    if (!isValidCpf(cpf)) return setIdError("CPF inválido. Confira os números.");
    if (d.requireOtp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setIdError("Informe um e-mail válido.");
    setBusy(true);
    const res = await identifyAction(token, { name, cpf, email: email.trim() || undefined });
    setBusy(false);
    if (res.error) return setIdError(res.error);
    if (res.needsOtp) {
      setSentTo(res.sentTo ?? email);
      setDevMode(Boolean(res.devMode));
      setOtp("");
      setOtpError(null);
      setCooldown(45);
      setStep("otp");
    } else {
      setTyped((t) => t || name.trim());
      setStep("sign");
    }
  }

  async function confirmOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    if (otp.replace(/\D/g, "").length !== 6) return setOtpError("Digite os 6 números do código.");
    setBusy(true);
    const res = await verifyOtpAction(token, otp);
    setBusy(false);
    if (res.error) return setOtpError(res.error);
    toast.success("E-mail confirmado");
    setTyped((t) => t || name.trim());
    setStep("sign");
  }

  async function resend() {
    setBusy(true);
    const res = await requestOtpAction(token, email);
    setBusy(false);
    if (res.error) return setOtpError(res.error);
    setOtpError(null);
    setCooldown(45);
    toast.success("Enviamos um novo código");
  }

  function getGeo(): Promise<{ lat: number; lng: number; accuracy?: number } | null> {
    if (!shareGeo || !("geolocation" in navigator)) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => resolve(null),
        { timeout: 6000, maximumAge: 60_000 },
      );
    });
  }

  const ready =
    consent &&
    ((method === "draw" && hasInk) || (method === "type" && typed.trim().length >= 2) || (method === "phone" && !!phone));

  async function sign() {
    if (!ready) return;
    setBusy(true);
    let pngBase64: string | undefined;
    if (method === "draw") pngBase64 = padRef.current?.toPng() ?? undefined;
    if (method === "type") pngBase64 = (await renderTypedSignature(typed, typedRef.current)) ?? undefined;
    if (method !== "phone" && !pngBase64) {
      setBusy(false);
      toast.error("Faça sua assinatura antes de continuar.");
      return;
    }
    const geo = await getGeo();
    const res = await submitSignatureAction(token, {
      name,
      cpf,
      email: email.trim() || undefined,
      method,
      pngBase64,
      sessionCode: phone?.sessionCode,
      typedText: method === "type" ? typed.trim() : undefined,
      consent: true,
      geo,
    });
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      if (/código/i.test(res.error)) setStep("identify");
      return;
    }
    setCompleted(Boolean(res.completed));
    setStep("done");
  }

  const stepIndex = { review: 0, identify: 1, otp: 1, sign: 2, done: 3 }[step];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <BrandLogo className="h-7" sizes="60px" priority />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
          <Lock size={12} /> Ambiente seguro
        </span>
      </header>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-pretty text-lg font-semibold leading-snug text-foreground sm:text-xl">{d.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Enviado por {d.senderName} · CG Educacional · <span className="font-mono text-xs">{d.code}</span>
            </p>
          </div>
        </div>
        {d.message && step === "review" && (
          <p className="mt-4 rounded-xl bg-secondary/60 px-4 py-3 text-sm leading-relaxed text-foreground">{d.message}</p>
        )}
        {step !== "done" && <Stepper index={stepIndex} />}
      </section>

      {step === "review" && (
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <PenLine size={16} className="mt-0.5 shrink-0 text-primary" />
            Leia o documento com atenção. Você vai assinar{" "}
            {sigPages.length === 1 ? `na página ${sigPages[0]}` : `nas páginas ${sigPages.join(", ")}`} (em destaque).
          </p>
          <PdfPages
            url={`/api/esign/s/${token}/original`}
            pageSizes={d.pageSizes}
            renderOverlay={(page) =>
              (fieldsByPage.get(page) ?? []).map((f) => (
                <div
                  key={f.id}
                  className="absolute flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10 text-[10px] font-medium text-primary motion-safe:animate-pulse sm:text-xs"
                  style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` }}
                >
                  <span className="truncate px-1">{FIELD_LABEL[f.kind]}</span>
                </div>
              ))
            }
          />
          <details className="rounded-xl border border-border bg-card/60 px-4 py-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none font-medium text-foreground">Impressão digital do documento (SHA-256)</summary>
            <p className="mt-2 break-all font-mono">{d.originalSha256}</p>
            <p className="mt-1">Qualquer alteração no arquivo muda este código.</p>
          </details>
          <StickyBar>
            <a
              href={`/api/esign/s/${token}/original?download=1`}
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <Download size={15} /> Baixar PDF
            </a>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep("identify")}>
              Li o documento e quero assinar <ArrowRight size={18} />
            </Button>
          </StickyBar>
        </div>
      )}

      {step === "identify" && (
        <form onSubmit={submitIdentity} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6" noValidate>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Identifique-se</h2>
            <p className="mt-1 text-sm text-muted-foreground">Esses dados ficam registrados junto com a sua assinatura.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sig-name">Nome completo</Label>
            <Input id="sig-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sig-cpf">CPF</Label>
            <Input
              id="sig-cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              required
            />
            {view.signer.presetCpfMasked && (
              <p className="text-xs text-muted-foreground">Use o CPF cadastrado pelo remetente ({view.signer.presetCpfMasked}).</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sig-email">E-mail{d.requireOtp ? "" : " (opcional)"}</Label>
            <Input
              id="sig-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={d.requireOtp}
            />
            <p className="text-xs text-muted-foreground">
              {d.requireOtp
                ? "Vamos enviar um código de 6 números para confirmar que é você."
                : "Para receber a cópia final quando todos assinarem."}
            </p>
          </div>
          {idError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {idError}
            </p>
          )}
          <p className="flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
            Seus dados (nome, CPF, e-mail, IP e dispositivo) são usados apenas como evidência desta assinatura, conforme a LGPD.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep("review")}>
              <ArrowLeft size={16} /> Voltar ao documento
            </Button>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : null} Continuar <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={confirmOtp} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Confirme seu e-mail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enviamos um código de 6 números para <strong className="text-foreground">{sentTo}</strong>. Confira também o spam.
            </p>
            {devMode && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Ambiente de testes: o e-mail está desligado e o código aparece no log do servidor.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="otp">Código</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
              autoFocus
            />
          </div>
          {otpError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {otpError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep("identify")}>
              Trocar e-mail
            </button>
            <button
              type="button"
              className="font-medium text-primary disabled:text-muted-foreground"
              disabled={cooldown > 0 || busy}
              onClick={resend}
            >
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
            </button>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy || otp.length !== 6}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />} Confirmar código
          </Button>
        </form>
      )}

      {step === "sign" && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Faça sua assinatura</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assinando como <strong className="text-foreground">{name}</strong> · CPF {formatCpf(cpf)}
            </p>
          </div>
          <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="gap-1.5">
                <PenLine size={15} /> Desenhar
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-1.5">
                <Keyboard size={15} /> Digitar
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-1.5">
                <Smartphone size={15} /> <span className="hidden sm:inline">No</span> celular
              </TabsTrigger>
            </TabsList>
            <TabsContent value="draw" forceMount className={cn("mt-4", method !== "draw" && "hidden")}>
              <SignatureCanvas ref={padRef} onChange={setHasInk} />
            </TabsContent>
            <TabsContent value="type" className="mt-4">
              <TypedSignature value={typed} onChange={setTyped} previewRef={typedRef} />
            </TabsContent>
            <TabsContent value="phone" className="mt-4">
              <PhoneSignature token={token} result={phone} onResult={setPhone} />
            </TabsContent>
          </Tabs>

          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span className="leading-relaxed text-foreground">{view.consentText}</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox checked={shareGeo} onCheckedChange={(v) => setShareGeo(v === true)} className="mt-0.5" />
              <span className="text-muted-foreground">
                <MapPin size={14} className="mr-1 inline" />
                Registrar minha localização como evidência adicional (opcional)
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep("identify")} disabled={busy}>
              <ArrowLeft size={16} /> Voltar
            </Button>
            <Button size="lg" onClick={sign} disabled={!ready || busy}>
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Registrando assinatura…
                </>
              ) : (
                <>
                  <PenLine size={18} /> Assinar documento
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-5 py-10 text-center shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {alreadySigned ? "Você já assinou este documento" : "Documento assinado!"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {completed
                ? "Todas as assinaturas foram coletadas. Baixe a versão final com o relatório de assinaturas."
                : "Sua assinatura foi registrada. Quando todos assinarem, a versão final fica disponível neste mesmo link" +
                  (email ? " e enviamos para o seu e-mail." : ".")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <a href={`/api/esign/s/${token}/signed?download=1`}>
                <Download size={18} /> {completed ? "Baixar documento assinado" : "Baixar minha via"}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`/validar-documento?codigo=${d.code}`}>
                <ShieldCheck size={18} /> Validar autenticidade
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Código de validação: <span className="font-mono">{d.code}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function Stepper({ index }: { index: number }) {
  const steps = ["Documento", "Identificação", "Assinatura"];
  return (
    <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Etapas">
      {steps.map((s, i) => (
        <li key={s} className="space-y-1.5" aria-current={i === index ? "step" : undefined}>
          <div className={cn("h-1.5 rounded-full transition-colors", i <= index ? "bg-primary" : "bg-secondary")} />
          <p className={cn("text-xs", i === index ? "font-medium text-foreground" : "text-muted-foreground")}>
            {i + 1}. {s}
          </p>
        </li>
      ))}
    </ol>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-xl [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">{children}</div>
    </div>
  );
}
