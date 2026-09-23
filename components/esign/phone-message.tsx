import { CheckCircle2, XCircle } from "lucide-react";

/** Tela cheia branca para as páginas abertas pelo QR code no celular. */
export function PhoneMessage({ kind, title, text }: { kind: "ok" | "error"; title: string; text: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white px-8 text-center text-slate-900">
      {kind === "ok" ? (
        <CheckCircle2 size={56} className="text-emerald-600" />
      ) : (
        <XCircle size={56} className="text-slate-400" />
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}
