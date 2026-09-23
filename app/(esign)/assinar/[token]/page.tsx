import { FileX2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { requestMeta } from "@/lib/request-meta";
import { EsignError, getSigningView } from "@/server/esign";
import { SignFlow, type SigningView } from "@/components/esign/sign/sign-flow";

export const dynamic = "force-dynamic";

export default async function AssinarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let view: SigningView;
  try {
    view = (await getSigningView(token, await requestMeta())) as SigningView;
  } catch (e) {
    const message =
      e instanceof EsignError ? e.message : "Não foi possível abrir este documento agora. Tente novamente em instantes.";
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
        <BrandLogo variant="stacked" className="h-16" sizes="110px" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <FileX2 size={28} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Link indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">Se precisar, peça um novo link a quem enviou o documento.</p>
        </div>
      </div>
    );
  }
  return <SignFlow token={token} view={JSON.parse(JSON.stringify(view))} />;
}
