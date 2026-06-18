"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CardPreview } from "@/components/checkout/card-preview";
import {
  detectBrand,
  formatCardNumber,
  luhnValid,
  maxCardLen,
  cvvLen,
  type CardBrand,
} from "@/lib/card";
import { formatCpf, cleanCpf, isValidCpf } from "@/lib/cpf";
import { payWithCard } from "@/app/checkout/[courseId]/actions";

// Tipo mínimo do SDK MercadoPago.js v2.
export type MP = {
  createCardToken: (data: Record<string, string>) => Promise<{ id: string }>;
  getPaymentMethods: (a: { bin: string }) => Promise<{
    results: { id: string; payment_type_id: string; issuer?: { id: number | string } }[];
  }>;
  getInstallments: (a: {
    amount: string;
    bin: string;
    paymentTypeId: string;
  }) => Promise<{ payer_costs: InstallmentOption[] }[]>;
};
type InstallmentOption = {
  installments: number;
  recommended_message: string;
  installment_amount: number;
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CardForm({
  mp,
  orderId,
  amount,
  courseSlug,
  defaultCpf,
}: {
  mp: MP | null;
  orderId: string;
  amount: number; // valor do cartão (sem desconto)
  courseSlug: string;
  defaultCpf?: string;
}) {
  const router = useRouter();
  const [number, setNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [cpf, setCpf] = React.useState(defaultCpf ? formatCpf(defaultCpf) : "");
  const [flipped, setFlipped] = React.useState(false);

  const [paymentMethodId, setPaymentMethodId] = React.useState("");
  const [issuerId, setIssuerId] = React.useState<string | undefined>();
  const [installments, setInstallments] = React.useState(1);
  const [options, setOptions] = React.useState<InstallmentOption[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const brand: CardBrand = detectBrand(number);
  const digits = number.replace(/\D/g, "");
  const bin = digits.slice(0, 8);

  // BIN → bandeira/emissor + opções de parcelamento (via SDK do MP).
  React.useEffect(() => {
    if (!mp || bin.length < 6) {
      setPaymentMethodId("");
      setIssuerId(undefined);
      setOptions([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const pm = await mp.getPaymentMethods({ bin });
        const found = pm.results?.[0];
        if (active && found) {
          setPaymentMethodId(found.id);
          setIssuerId(found.issuer?.id != null ? String(found.issuer.id) : undefined);
        }
        const inst = await mp.getInstallments({
          amount: amount.toFixed(2),
          bin,
          paymentTypeId: "credit_card",
        });
        if (active) setOptions(inst?.[0]?.payer_costs ?? []);
      } catch {
        if (active) setOptions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [mp, bin, amount]);

  function onExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setExpiry(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  }

  function validate(): string | null {
    if (!luhnValid(digits) || digits.length < maxCardLen(brand))
      return "Número do cartão inválido";
    if (name.trim().length < 3) return "Informe o nome impresso no cartão";
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    if (!month || month < 1 || month > 12 || !yy || yy.length < 2)
      return "Validade inválida";
    if (cvv.length < cvvLen(brand)) return "CVV inválido";
    if (!isValidCpf(cpf)) return "CPF do titular inválido";
    if (!paymentMethodId) return "Não reconhecemos a bandeira do cartão";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mp) {
      toast.error("Pagamento indisponível no momento. Tente novamente.");
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const [mm, yy] = expiry.split("/");
      const token = await mp.createCardToken({
        cardNumber: digits,
        cardholderName: name.trim(),
        cardExpirationMonth: mm,
        cardExpirationYear: yy.length === 2 ? `20${yy}` : yy,
        securityCode: cvv,
        identificationType: "CPF",
        identificationNumber: cleanCpf(cpf),
      });

      const res = await payWithCard({
        orderId,
        token: token.id,
        paymentMethodId,
        issuerId,
        installments,
        cpf: cleanCpf(cpf),
      });

      if (res.error) {
        toast.error(res.error);
      } else if (res.status === "approved") {
        toast.success("Pagamento aprovado! Liberando seu acesso…");
        router.push(`/aprender/${courseSlug}`);
        router.refresh();
      } else if (res.status === "pending") {
        toast.info("Pagamento em processamento. Avisaremos por e-mail ao aprovar.");
      } else {
        toast.error("Pagamento recusado. Confira os dados ou tente outro cartão.");
      }
    } catch {
      toast.error("Não foi possível processar o cartão. Verifique os dados.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <CardPreview
        number={number}
        name={name}
        expiry={expiry}
        cvv={cvv}
        brand={brand}
        flipped={flipped}
      />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="cardNumber">Número do cartão</Label>
          <Input
            id="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={number}
            onFocus={() => setFlipped(false)}
            onChange={(e) => setNumber(formatCardNumber(e.target.value, detectBrand(e.target.value)))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cardName">Nome impresso no cartão</Label>
          <Input
            id="cardName"
            autoComplete="cc-name"
            placeholder="Como está no cartão"
            value={name}
            onFocus={() => setFlipped(false)}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cardExp">Validade</Label>
            <Input
              id="cardExp"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={expiry}
              onFocus={() => setFlipped(false)}
              onChange={(e) => onExpiry(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cardCvv">CVV</Label>
            <Input
              id="cardCvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cvvLen(brand) === 4 ? "0000" : "000"}
              value={cvv}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvLen(brand)))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cardCpf">CPF do titular</Label>
          <Input
            id="cardCpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onFocus={() => setFlipped(false)}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Parcelamento</Label>
          <Select
            value={String(installments)}
            onValueChange={(v) => setInstallments(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="À vista" />
            </SelectTrigger>
            <SelectContent>
              {options.length > 0 ? (
                options.map((o) => (
                  <SelectItem key={o.installments} value={String(o.installments)}>
                    {o.recommended_message}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="1">
                  À vista — {brl(amount)}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="lg" variant="glow" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando…
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Pagar {brl(amount)}
            </>
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock size={12} /> Pagamento criptografado. Não armazenamos os dados do
          seu cartão.
        </p>
      </form>
    </div>
  );
}
