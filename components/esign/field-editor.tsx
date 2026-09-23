"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  CircleAlert,
  IdCard,
  Loader2,
  MousePointerClick,
  PenLine,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCpf, isValidCpf } from "@/lib/cpf";
import { cn } from "@/lib/utils";
import { FIELD_KIND_LABEL } from "@/lib/validations/esign";
import { saveDraftAction, sendDocumentAction } from "@/app/admin/documentos/actions";
import type { PageBox } from "./pdf-pages";
import { SIGNER_COLORS } from "./signer-colors";

const PdfPages = dynamic(() => import("./pdf-pages").then((m) => m.PdfPages), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse rounded-2xl bg-muted/40" />,
});

type Kind = "signature" | "name" | "cpf" | "date";
type SignerState = { key: string; id?: string; name: string; email: string; cpf: string };
type FieldState = { key: string; signerKey: string; kind: Kind; page: number; x: number; y: number; w: number; h: number };

/** Tamanho padrão de cada campo, em pontos (convertido p/ fração da página). */
const DEFAULT_PT: Record<Kind, { w: number; h: number }> = {
  signature: { w: 170, h: 58 },
  name: { w: 170, h: 18 },
  cpf: { w: 105, h: 18 },
  date: { w: 80, h: 18 },
};
const KIND_ICON: Record<Kind, React.ElementType> = {
  signature: PenLine,
  name: User,
  cpf: IdCard,
  date: CalendarDays,
};

let seq = 0;
const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function displayPt(box: PageBox) {
  return box.rotate === 90 || box.rotate === 270 ? { w: box.h, h: box.w } : { w: box.w, h: box.h };
}

export type EditorDoc = {
  id: string;
  title: string;
  requireOtp: boolean;
  message: string | null;
  pageCount: number;
  pageSizes: PageBox[];
};

export function FieldEditor({
  doc,
  initialSigners,
  initialFields,
}: {
  doc: EditorDoc;
  initialSigners: { id: string; name: string | null; email: string | null; cpf: string | null }[];
  initialFields: { signerId: string; kind: Kind; page: number; x: number; y: number; w: number; h: number }[];
}) {
  const [title, setTitle] = React.useState(doc.title);
  const [requireOtp, setRequireOtp] = React.useState(doc.requireOtp);
  const [message, setMessage] = React.useState(doc.message ?? "");
  const [signers, setSigners] = React.useState<SignerState[]>(() =>
    initialSigners.length
      ? initialSigners.map((s) => ({
          key: s.id,
          id: s.id,
          name: s.name ?? "",
          email: s.email ?? "",
          cpf: s.cpf ? formatCpf(s.cpf) : "",
        }))
      : [{ key: newKey(), name: "", email: "", cpf: "" }],
  );
  const [fields, setFields] = React.useState<FieldState[]>(() =>
    initialFields.map((f) => ({ key: newKey(), signerKey: f.signerId, kind: f.kind, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h })),
  );
  const [active, setActive] = React.useState<string>(() => signers[0]?.key);
  const [placing, setPlacing] = React.useState<Kind | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);

  // --- Salvamento automático ----------------------------------------------------
  const version = React.useRef(0);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const touch = React.useCallback(() => {
    version.current += 1;
    setDirty(true);
  }, []);

  const validSignerFor = React.useCallback((s: SignerState) => {
    const cpf = s.cpf.replace(/\D/g, "");
    return !cpf || isValidCpf(cpf);
  }, []);

  const save = React.useCallback(async (): Promise<boolean> => {
    const v = version.current;
    setSaving(true);
    const res = await saveDraftAction(doc.id, {
      title: title.trim() || "Documento",
      requireOtp,
      message: message.trim() || undefined,
      signers: signers.map((s) => ({
        key: s.key,
        id: s.id,
        name: s.name.trim() || undefined,
        email: s.email.trim() || undefined,
        cpf: validSignerFor(s) ? s.cpf.replace(/\D/g, "") || undefined : undefined,
      })),
      fields: fields.map((f) => ({ signerKey: f.signerKey, kind: f.kind, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h })),
    });
    setSaving(false);
    if (res.error) {
      setSaveError(res.error);
      return false;
    }
    setSaveError(null);
    if (res.signers) {
      const ids = new Map(res.signers.map((s) => [s.key, s.id]));
      setSigners((prev) => prev.map((s) => (ids.has(s.key) ? { ...s, id: ids.get(s.key) } : s)));
    }
    if (version.current === v) setDirty(false);
    return true;
  }, [doc.id, title, requireOtp, message, signers, fields, validSignerFor]);

  React.useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => void save(), 1200);
    return () => clearTimeout(t);
  }, [dirty, save]);

  // Avisa ao sair com alterações não salvas (exceto na saída intencional após enviar).
  const leaving = React.useRef(false);
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!leaving.current && (dirty || saving)) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saving]);

  // Esc cancela o modo "posicionar".
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlacing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Signatários -------------------------------------------------------------
  function addSigner() {
    const s = { key: newKey(), name: "", email: "", cpf: "" };
    setSigners((prev) => [...prev, s]);
    setActive(s.key);
    touch();
  }
  function updateSigner(key: string, patch: Partial<SignerState>) {
    setSigners((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    touch();
  }
  function removeSigner(key: string) {
    setSigners((prev) => prev.filter((s) => s.key !== key));
    setFields((prev) => prev.filter((f) => f.signerKey !== key));
    if (active === key) setActive(signers.find((s) => s.key !== key)?.key ?? "");
    touch();
  }

  // --- Campos ------------------------------------------------------------------
  function placeAt(page: number, relX: number, relY: number) {
    if (!placing || !active) return;
    const box = doc.pageSizes[page];
    const d = displayPt(box);
    const size = DEFAULT_PT[placing];
    const w = Math.min(0.9, size.w / d.w);
    const h = Math.min(0.5, size.h / d.h);
    const f: FieldState = {
      key: newKey(),
      signerKey: active,
      kind: placing,
      page,
      w,
      h,
      x: clamp(relX - w / 2, 0, 1 - w),
      y: clamp(relY - h / 2, 0, 1 - h),
    };
    setFields((prev) => [...prev, f]);
    setSelected(f.key);
    setPlacing(null);
    touch();
  }
  const updateField = React.useCallback(
    (key: string, patch: Partial<FieldState>) => {
      setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
      touch();
    },
    [touch],
  );
  const removeField = React.useCallback(
    (key: string) => {
      setFields((prev) => prev.filter((f) => f.key !== key));
      setSelected(null);
      touch();
    },
    [touch],
  );

  // --- Validação e envio -------------------------------------------------------
  const signerLabel = (s: SignerState, i: number) => s.name.trim() || `Signatário ${i + 1}`;
  const issues: string[] = [];
  if (signers.length === 0) issues.push("Adicione pelo menos um signatário.");
  signers.forEach((s, i) => {
    if (!fields.some((f) => f.signerKey === s.key && f.kind === "signature")) {
      issues.push(`Posicione a assinatura de ${signerLabel(s, i)}.`);
    }
    if (s.cpf && !validSignerFor(s)) issues.push(`CPF de ${signerLabel(s, i)} é inválido.`);
    if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) {
      issues.push(`E-mail de ${signerLabel(s, i)} é inválido.`);
    }
  });
  if (title.trim().length < 2) issues.push("Dê um título ao documento.");

  const [sendOpen, setSendOpen] = React.useState(false);
  const [sendEmails, setSendEmails] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const withEmail = signers.filter((s) => s.email.trim());

  async function confirmSend() {
    setSending(true);
    const ok = await save();
    if (!ok) {
      setSending(false);
      toast.error("Corrija o rascunho antes de enviar.");
      return;
    }
    const res = await sendDocumentAction(doc.id, { sendEmails: sendEmails && withEmail.length > 0 });
    setSending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      res.emailed ? `Documento enviado · ${res.emailed} convite(s) por e-mail` : "Documento pronto! Copie os links para enviar.",
    );
    setSendOpen(false);
    // Recarga completa para a tela de acompanhamento: a navegação suave logo após
    // esta action (que revalida a rota) não trocava o editor pela página nova.
    leaving.current = true;
    window.location.assign(`/admin/documentos/${doc.id}?enviado=1`);
  }

  const activeIndex = signers.findIndex((s) => s.key === active);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Páginas */}
      <div className="min-w-0 space-y-3">
        <div
          className={cn(
            "sticky top-16 z-20 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-sm backdrop-blur-xl transition-colors",
            placing
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border bg-background/80 text-muted-foreground",
          )}
          role="status"
        >
          {placing ? (
            <>
              <span className="flex items-center gap-2">
                <MousePointerClick size={16} className="text-primary" />
                Clique no documento onde deve ficar o campo <strong>{FIELD_KIND_LABEL[placing]}</strong> de{" "}
                <strong>{activeIndex >= 0 ? signerLabel(signers[activeIndex], activeIndex) : ""}</strong>.
              </span>
              <Button size="sm" variant="ghost" onClick={() => setPlacing(null)}>
                Cancelar <kbd className="ml-1 rounded border px-1 text-[10px]">Esc</kbd>
              </Button>
            </>
          ) : (
            <>
              <span>Escolha um signatário e um tipo de campo ao lado, depois clique no documento.</span>
              <SaveStatus dirty={dirty} saving={saving} error={saveError} />
            </>
          )}
        </div>

        <PdfPages
          url={`/api/esign/files/${doc.id}/original`}
          pageSizes={doc.pageSizes}
          pageClassName={placing ? "cursor-crosshair ring-2 ring-primary/30" : undefined}
          onPageClick={(page, rx, ry) => {
            if (placing) placeAt(page, rx, ry);
            else setSelected(null);
          }}
          renderOverlay={(page) =>
            fields
              .filter((f) => f.page === page)
              .map((f) => {
                const si = signers.findIndex((s) => s.key === f.signerKey);
                return (
                  <FieldBox
                    key={f.key}
                    field={f}
                    color={SIGNER_COLORS[si % SIGNER_COLORS.length]}
                    label={`${FIELD_KIND_LABEL[f.kind]} · ${si >= 0 ? signerLabel(signers[si], si) : ""}`}
                    selected={selected === f.key}
                    onSelect={() => {
                      setSelected(f.key);
                      setActive(f.signerKey);
                    }}
                    onChange={(patch) => updateField(f.key, patch)}
                    onRemove={() => removeField(f.key)}
                  />
                );
              })
          }
        />
      </div>

      {/* Painel lateral */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <Label htmlFor="doc-title">Título do documento</Label>
          <Input
            id="doc-title"
            className="mt-1.5"
            value={title}
            maxLength={160}
            onChange={(e) => {
              setTitle(e.target.value);
              touch();
            }}
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Quem vai assinar</h2>
            <Button size="sm" variant="outline" onClick={addSigner} disabled={signers.length >= 20}>
              <Plus size={15} /> Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {signers.map((s, i) => {
              const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
              const isActive = s.key === active;
              const count = fields.filter((f) => f.signerKey === s.key).length;
              const cpfInvalid = Boolean(s.cpf) && !validSignerFor(s);
              return (
                <div
                  key={s.key}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    isActive ? "border-transparent ring-2" : "border-border",
                  )}
                  style={isActive ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 text-left text-sm font-medium text-foreground"
                      onClick={() => setActive(s.key)}
                      aria-pressed={isActive}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                      <span className="truncate">{signerLabel(s, i)}</span>
                      <span className="shrink-0 text-xs font-normal text-muted-foreground">
                        · {count} campo{count === 1 ? "" : "s"}
                      </span>
                    </button>
                    {signers.length > 1 && (
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={() => removeSigner(s.key)}
                        aria-label={`Remover ${signerLabel(s, i)}`}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2" onFocus={() => setActive(s.key)}>
                    <Input
                      placeholder="Nome (opcional)"
                      aria-label="Nome do signatário"
                      value={s.name}
                      onChange={(e) => updateSigner(s.key, { name: e.target.value })}
                    />
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="E-mail p/ enviar o convite (opcional)"
                      aria-label="E-mail do signatário"
                      value={s.email}
                      onChange={(e) => updateSigner(s.key, { email: e.target.value })}
                    />
                    <Input
                      inputMode="numeric"
                      placeholder="CPF exigido (opcional)"
                      aria-label="CPF do signatário"
                      aria-invalid={cpfInvalid}
                      className={cpfInvalid ? "border-destructive" : undefined}
                      value={s.cpf}
                      onChange={(e) => updateSigner(s.key, { cpf: formatCpf(e.target.value) })}
                    />
                  </div>
                  {isActive && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(Object.keys(DEFAULT_PT) as Kind[]).map((k) => {
                        const Icon = KIND_ICON[k];
                        return (
                          <Button
                            key={k}
                            size="sm"
                            variant={placing === k ? "default" : k === "signature" ? "secondary" : "outline"}
                            onClick={() => setPlacing(placing === k ? null : k)}
                            className="justify-start"
                          >
                            <Icon size={15} /> {FIELD_KIND_LABEL[k]}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label htmlFor="req-otp">Exigir código por e-mail</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Recomendado para links enviados à distância. Desligue para assinatura presencial.
              </p>
            </div>
            <Switch
              id="req-otp"
              checked={requireOtp}
              onCheckedChange={(v) => {
                setRequireOtp(v);
                touch();
              }}
            />
          </div>
          <div>
            <Label htmlFor="doc-msg">Mensagem no convite (opcional)</Label>
            <Textarea
              id="doc-msg"
              rows={3}
              className="mt-1.5"
              maxLength={1000}
              placeholder="Ex.: Segue o contrato da sua matrícula para assinatura."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                touch();
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          {issues.length > 0 ? (
            <ul className="mb-3 space-y-1.5 text-sm">
              {issues.slice(0, 5).map((m) => (
                <li key={m} className="flex gap-2 text-muted-foreground">
                  <CircleAlert size={15} className="mt-0.5 shrink-0 text-amber-500" /> {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check size={16} /> Tudo pronto para enviar.
            </p>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={issues.length > 0 || sending}
            onClick={() => setSendOpen(true)}
          >
            <Send size={16} /> Enviar para assinatura
          </Button>
        </section>
      </aside>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar para assinatura</DialogTitle>
            <DialogDescription>
              Depois de enviado, o documento não pode mais ser editado. Cada pessoa recebe um link pessoal.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {signers.map((s, i) => (
              <li key={s.key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SIGNER_COLORS[i % SIGNER_COLORS.length] }} />
                <span className="font-medium text-foreground">{signerLabel(s, i)}</span>
                <span className="truncate text-muted-foreground">{s.email ? `· ${s.email}` : "· sem e-mail (copie o link)"}</span>
              </li>
            ))}
          </ul>
          {withEmail.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 text-sm">
              <Checkbox checked={sendEmails} onCheckedChange={(v) => setSendEmails(v === true)} className="mt-0.5" />
              <span>
                Enviar o convite por e-mail para {withEmail.length} pessoa{withEmail.length === 1 ? "" : "s"}
                <span className="block text-xs text-muted-foreground">Você também poderá copiar os links para mandar pelo WhatsApp.</span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)} disabled={sending}>
              Voltar
            </Button>
            <Button onClick={confirmSend} disabled={sending}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaveStatus({ dirty, saving, error }: { dirty: boolean; saving: boolean; error: string | null }) {
  if (error) return <span className="shrink-0 text-destructive">{error}</span>;
  if (saving) {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <Loader2 size={14} className="animate-spin" /> Salvando…
      </span>
    );
  }
  if (dirty) return <span className="shrink-0">Alterações não salvas</span>;
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
      <Check size={14} /> Salvo
    </span>
  );
}

/** Campo arrastável/redimensionável (mouse, toque e teclado). */
function FieldBox({
  field,
  color,
  label,
  selected,
  onSelect,
  onChange,
  onRemove,
}: {
  field: FieldState;
  color: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<FieldState>) => void;
  onRemove: () => void;
}) {
  const drag = React.useRef<{ mode: "move" | "resize"; sx: number; sy: number; f: FieldState; pw: number; ph: number } | null>(null);

  function start(e: React.PointerEvent, mode: "move" | "resize") {
    e.stopPropagation();
    e.preventDefault();
    const pageEl = (e.currentTarget as HTMLElement).closest("[data-page]") as HTMLElement | null;
    if (!pageEl) return;
    const r = pageEl.getBoundingClientRect();
    drag.current = { mode, sx: e.clientX, sy: e.clientY, f: field, pw: r.width, ph: r.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelect();
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.pw;
    const dy = (e.clientY - d.sy) / d.ph;
    if (d.mode === "move") {
      onChange({ x: clamp(d.f.x + dx, 0, 1 - d.f.w), y: clamp(d.f.y + dy, 0, 1 - d.f.h) });
    } else {
      onChange({ w: clamp(d.f.w + dx, 0.04, 1 - d.f.x), h: clamp(d.f.h + dy, 0.012, 1 - d.f.y) });
    }
  }
  function end() {
    drag.current = null;
  }
  function onKey(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.02 : 0.004;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (map[e.key]) {
      e.preventDefault();
      const [dx, dy] = map[e.key];
      if (e.altKey) onChange({ w: clamp(field.w + dx, 0.04, 1 - field.x), h: clamp(field.h + dy, 0.012, 1 - field.y) });
      else onChange({ x: clamp(field.x + dx, 0, 1 - field.w), y: clamp(field.y + dy, 0, 1 - field.h) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove();
    }
  }

  const Icon = KIND_ICON[field.kind];
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}. Setas movem, Alt+setas redimensionam, Delete remove.`}
      onPointerDown={(e) => start(e, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={onKey}
      onFocus={onSelect}
      className={cn(
        "group pointer-events-auto absolute flex touch-none select-none items-center justify-center rounded-md border-2 border-dashed text-[11px] font-medium outline-none",
        selected ? "z-10 border-solid shadow-lg" : "hover:border-solid",
      )}
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.w * 100}%`,
        height: `${field.h * 100}%`,
        borderColor: color,
        background: `${color}1f`,
        color,
        cursor: "move",
      }}
    >
      <span className="flex max-w-full items-center gap-1 truncate px-1">
        <Icon size={12} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <button
        type="button"
        aria-label="Remover campo"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          "absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 shadow ring-1 ring-black/10 transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Trash2 size={11} />
      </button>
      <span
        aria-hidden
        onPointerDown={(e) => start(e, "resize")}
        className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 bg-white"
        style={{ borderColor: color }}
      />
    </div>
  );
}
