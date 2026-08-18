import type { Metadata } from "next";

import { RichiestaResetForm } from "./form";

/** Fuori dall'indice: pagina di servizio dell'accesso. */
export const metadata: Metadata = {
  title: "Password dimenticata",
  description:
    "Reimposta la password del tuo accesso a Ver0: ti mandiamo un link via email.",
  robots: { index: false, follow: false },
};

export default function PasswordDimenticataPage() {
  return <RichiestaResetForm />;
}
