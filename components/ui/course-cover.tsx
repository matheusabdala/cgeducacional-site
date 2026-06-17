import { Brain, BookOpen, LayoutGrid, HeartHandshake, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Capa em gradiente por categoria (substitui fotos placeholder dos cursos).
const STYLES: Record<string, { grad: string; icon: React.ElementType }> = {
  Neurociência: { grad: "from-cg-600 via-cg-700 to-cg-900", icon: Brain },
  Pedagogia: { grad: "from-teal-500 via-teal-600 to-teal-800", icon: BookOpen },
  "Gestão Escolar": {
    grad: "from-indigo-500 via-indigo-600 to-purple-800",
    icon: LayoutGrid,
  },
  Inclusão: {
    grad: "from-amber-500 via-orange-500 to-rose-600",
    icon: HeartHandshake,
  },
};

const FALLBACK = { grad: "from-cg-600 to-cg-800", icon: GraduationCap };

export function CourseCover({
  category,
  className,
  iconSize = 48,
}: {
  category: string;
  className?: string;
  iconSize?: number;
}) {
  const s = STYLES[category] ?? FALLBACK;
  const Icon = s.icon;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        s.grad,
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <Icon
        className="relative text-white/90 transition-transform duration-500 ease-expo-out group-hover:scale-110"
        size={iconSize}
        strokeWidth={1.5}
      />
    </div>
  );
}
