import { Suspense } from "react";
import type { Metadata } from "next";
import { DocumentValidationPage } from "@/components/esign/document-validation";

export const metadata: Metadata = {
  title: "Validar documento assinado — CG Educacional",
  description: "Confira a autenticidade de documentos assinados eletronicamente pela CG Educacional.",
};

export default function Page() {
  return (
    <Suspense>
      <DocumentValidationPage />
    </Suspense>
  );
}
