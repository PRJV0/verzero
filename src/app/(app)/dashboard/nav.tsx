"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Route,
  Settings,
  ShieldCheck,
} from "lucide-react";

/**
 * Le otto sezioni fisse del portale (SPEC §12.H) — identiche per tutti:
 * navigazione laterale su desktop, barra inferiore scorrevole su mobile.
 * Il parametro ?cliente= (selettore del consulente) viaggia con i link.
 */
const SEZIONI = [
  { href: "/dashboard", label: "Panoramica", icon: LayoutDashboard },
  { href: "/dashboard/impresa", label: "La tua impresa", icon: Building2 },
  { href: "/dashboard/percorsi", label: "I tuoi percorsi", icon: Route },
  { href: "/dashboard/documenti", label: "Documenti", icon: FolderOpen },
  { href: "/dashboard/sigillo", label: "Sigillo", icon: ShieldCheck },
  { href: "/dashboard/bandi", label: "Bandi", icon: Megaphone },
  { href: "/dashboard/consulenza", label: "Consulenza", icon: CalendarDays },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
];

export function NavPortale() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cliente = searchParams.get("cliente");
  const conCliente = (href: string) =>
    cliente ? `${href}?cliente=${cliente}` : href;

  const voci = SEZIONI.map((s) => {
    const attiva =
      s.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(s.href);
    return { ...s, attiva };
  });

  return (
    <>
      {/* Desktop: colonna laterale fissa */}
      <nav
        aria-label="Sezioni dell'ecosistema"
        className="hidden w-56 shrink-0 md:block"
      >
        <ul className="sticky top-20 space-y-1">
          {voci.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={conCliente(s.href)}
                  aria-current={s.attiva ? "page" : undefined}
                  className={
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
                    (s.attiva
                      ? "bg-pine font-semibold text-white"
                      : "text-gray-warm hover:bg-moss hover:text-pine")
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: barra inferiore fissa, scorrevole in orizzontale */}
      <nav
        aria-label="Sezioni dell'ecosistema"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden"
      >
        <ul className="flex overflow-x-auto px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1">
          {voci.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href} className="shrink-0">
                <Link
                  href={conCliente(s.href)}
                  aria-current={s.attiva ? "page" : undefined}
                  className={
                    "flex w-[4.5rem] flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition-colors " +
                    (s.attiva ? "text-pine" : "text-gray-warm")
                  }
                >
                  <span
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-lg " +
                      (s.attiva ? "bg-moss" : "")
                    }
                  >
                    <Icon size={18} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight">
                    {s.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
