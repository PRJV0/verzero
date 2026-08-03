import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Layout delle pagine pubbliche (home, servizi, sigillo, partner): header e
 * footer condivisi, contenuto in mezzo. Le aree (auth) e (app) hanno chrome
 * proprio e non passano di qui.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
