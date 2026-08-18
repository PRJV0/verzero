import { Suspense } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

import { NavPortale } from "./nav";

/**
 * La shell del portale (SPEC §12.H): header essenziale, otto sezioni in
 * navigazione laterale (desktop) o barra inferiore (mobile), contenuto.
 * La struttura è UNIVOCA: identica per impresa e consulente partner.
 */
export default function PortaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-5 py-3">
        <Link href="/dashboard" aria-label="Ver0 — il tuo ecosistema">
          <Logo />
        </Link>
        <p className="hidden text-xs font-semibold tracking-widest text-pine sm:block">
          IL TUO ECOSISTEMA
        </p>
        <Link
          href="/servizi"
          className="rounded-lg border border-pine px-3.5 py-2 text-xs font-medium text-pine transition-colors hover:bg-moss"
        >
          Catalogo servizi
        </Link>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-5 pb-24 pt-8 md:pb-12">
        {/* useSearchParams nella nav richiede un confine di Suspense */}
        <Suspense fallback={<div className="hidden w-56 shrink-0 md:block" />}>
          <NavPortale />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
