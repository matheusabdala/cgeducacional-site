"use client";

import { useRouter } from "next/navigation";
import { EJAPage } from "@/components/EJAPage";
import { routeFor } from "@/lib/navigation";

export default function Page() {
  const router = useRouter();
  return <EJAPage onNavigate={(page: string) => router.push(routeFor(page))} />;
}
