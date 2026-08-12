/**
 * Skeleton dell'ecosistema: stessa geometria della pagina vera (titolo,
 * riga di contesto, due liste di card), così il caricamento non salta.
 */
export default function DashboardLoading() {
  return (
    <main aria-busy className="mx-auto max-w-3xl px-5 py-12">
      <span className="sr-only">Caricamento del tuo ecosistema…</span>
      <div className="h-9 w-64 max-w-full animate-pulse rounded bg-line/60" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-line/40" />

      <div className="mt-8 h-5 w-32 animate-pulse rounded bg-line/60" />
      <div className="mt-3 space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
      </div>

      <div className="mt-8 h-5 w-32 animate-pulse rounded bg-line/60" />
      <div className="mt-3 space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
        <div className="h-16 animate-pulse rounded-xl bg-line/40" />
      </div>
    </main>
  );
}
