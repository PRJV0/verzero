import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SERVIZI, getServizio } from "@/lib/catalog";

import { FunnelAcquisto } from "./funnel";

/** Pre-genera le rotte di acquisto per i servizi a listino. */
export function generateStaticParams() {
  return SERVIZI.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) return { title: "Acquisto — Ver0" };
  return {
    title: `Acquista ${s.name} — Ver0`,
    description: `Attiva ${s.name} in pochi passaggi: riepilogo, registrazione, consensi e pagamento. Prezzi in chiaro per fascia dimensionale.`,
  };
}

export default async function AcquistaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) notFound();

  return (
    // Suspense richiesto da useSearchParams nel client component.
    <Suspense>
      <FunnelAcquisto slug={s.slug} nome={s.name} short={s.short} />
    </Suspense>
  );
}
