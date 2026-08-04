import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Regione UE per le funzioni serverless (requisito GDPR, SPEC §8).
  // Su Vercel si imposta anche da dashboard: Functions > Region > fra1.
  experimental: {},
  // Rebranding: "bollino" -> "Sigillo Ver0". La vecchia rotta reindirizza
  // permanentemente alla nuova, così link e segnalibri esistenti non si rompono.
  async redirects() {
    return [
      { source: "/bollino", destination: "/sigillo", permanent: true },
      // Carbon in due tagli (SPEC §12.Z): la vecchia pagina unica punta a Light.
      {
        source: "/servizi/carbon-footprint-base",
        destination: "/servizi/carbon-light",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
