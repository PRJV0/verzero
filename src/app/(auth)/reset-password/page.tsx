import type { Metadata } from "next";

import { NuovaPasswordForm } from "./form";

/** Fuori dall'indice: si arriva solo dal link di recupero. */
export const metadata: Metadata = {
  title: "Scegli una nuova password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <NuovaPasswordForm />;
}
