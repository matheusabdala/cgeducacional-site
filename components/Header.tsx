"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "./Button";
import { NAV_ITEMS } from "@/lib/navigation";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cg-600 text-white">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            CG Educacional
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.href)
                  ? "text-cg-600 bg-cg-50"
                  : "text-slate-600 hover:text-cg-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-2">
          <Link href="/validar-certificado" className="hidden lg:block">
            <Button variant="ghost" size="sm">
              Área do Aluno
            </Button>
          </Link>
          <Link href="/cursos" className="hidden sm:flex">
            <Button size="sm">Matricule-se</Button>
          </Link>
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <nav className="lg:hidden border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                  isActive(item.href)
                    ? "text-cg-600 bg-cg-50"
                    : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
