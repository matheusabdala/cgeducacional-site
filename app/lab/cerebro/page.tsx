import type { Metadata } from "next";
import { BrainHero } from "@/components/v2/brain/BrainHero";
import { ThemeSwitch } from "@/components/v2/brain/ThemeSwitch";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lab: rede neural (protótipo)",
  robots: { index: false, follow: false },
};

/**
 * Protótipo isolado do hero da landing v2. Não é rota de produto: existe para
 * julgar o conjunto antes de construir a página. Tudo em CSS Module — nenhuma
 * classe do Tailwind.
 */
export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.labBar}>
        <span className={styles.labTag}>lab</span>
        <span className={styles.labText}>
          protótipo do hero da v2, em canvas 2D
        </span>
        <ThemeSwitch />
      </div>
      <BrainHero showHud />
    </div>
  );
}
