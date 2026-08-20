"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  Inbox,
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

/** Voce riservata: compare solo a chi ha il ruolo amministratore. */
const VOCE_LEAD = {
  href: "/dashboard/lead",
  label: "Lead",
  icon: Inbox,
};

export function NavPortale({ amministratore = false }: { amministratore?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cliente = searchParams.get("cliente");
  const conCliente = (href: string) =>
    cliente ? `${href}?cliente=${cliente}` : href;

  const elenco = amministratore ? [...SEZIONI, VOCE_LEAD] : SEZIONI;
  const voci = elenco.map((s) => {
    const attiva =
      s.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(s.href);
    return { ...s, attiva };
  });

  return (
    <>
      {/* Desktop: pannello in pino pieno; la voce attiva è marcata dal
          segmento menta del Sigillo, non da una barretta qualunque. */}
      <nav
        aria-label="Sezioni dell'ecosistema"
        className="hidden w-56 shrink-0 md:block"
      >
        <ul className="sticky top-20 space-y-0.5 rounded-2xl bg-pine p-2.5 shadow-soft">
          {voci.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={conCliente(s.href)}
                  aria-current={s.attiva ? "page" : undefined}
                  className={
                    "relative flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm transition-colors " +
                    (s.attiva
                      ? "bg-pine-dark font-semibold text-white"
                      : "text-moss hover:bg-pine-dark/60 hover:text-white")
                  }
                >
                  {/* Il segmento del Sigillo sulla voce attiva */}
                  {s.attiva && (
                    <span
                      aria-hidden
                      className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-mint-bright"
                    />
                  )}
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-pine-deep md:hidden"
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
                    "relative flex w-[4.5rem] flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition-colors " +
                    (s.attiva ? "text-mint-bright" : "text-moss")
                  }
                >
                  {/* Il segmento del Sigillo, orizzontale, sopra la voce attiva */}
                  {s.attiva && (
                    <span
                      aria-hidden
                      className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-mint-bright"
                    />
                  )}
                  <span
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-lg " +
                      (s.attiva ? "bg-white/10" : "")
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
