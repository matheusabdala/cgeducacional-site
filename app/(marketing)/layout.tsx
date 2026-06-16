import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/** Chrome do site institucional (header + footer). O /admin tem o seu próprio. */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
