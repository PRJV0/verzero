/**
 * Foto-duotone (Registro A, SPEC §12.W): immagine + overlay verde brand.
 * Due intensità:
 * - "full": scatti fotografici veri — scala di grigi + multiply pino sulle
 *   ombre + screen menta sulle luci (duotone classico).
 * - "soft": illustrazioni già chiare/in palette (come le attuali immagini in
 *   /public/photos) — niente grigio, solo un velo pino/menta che armonizza
 *   col brand senza infangare i toni chiari.
 *
 * FOTO: gli scatti attuali sono in /public/photos (jpg ottimizzati per il
 * web, generati dai png del fondatore). Per sostituirli basta rimpiazzare i
 * file mantenendo gli stessi path — il trattamento resta identico. Se un
 * nuovo scatto è una fotografia vera, passare intensity="full".
 */
export function PhotoDuotone({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  intensity = "full",
}: {
  src: string;
  /** Vuoto per immagini decorative (default). */
  alt?: string;
  className?: string;
  imgClassName?: string;
  intensity?: "full" | "soft";
}) {
  const soft = intensity === "soft";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset statico locale con filtri CSS; nessuna ottimizzazione runtime necessaria */}
      <img
        src={src}
        alt={alt}
        className={
          "h-full w-full object-cover " +
          (soft ? "saturate-[0.85] " : "grayscale contrast-110 ") +
          imgClassName
        }
      />
      {soft ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-tr from-pine/30 via-transparent to-mint/20 mix-blend-multiply"
        />
      ) : (
        <>
          {/* Ombre in pino */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-pine-dark via-pine/80 to-pine/40 mix-blend-multiply"
          />
          {/* Luci in menta */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tl from-mint/35 to-transparent mix-blend-screen"
          />
        </>
      )}
    </div>
  );
}
