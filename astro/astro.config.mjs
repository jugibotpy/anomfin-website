import { defineConfig } from "astro/config";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  server: { port: 4321 },
  site: 'https://anomfin.github.io/anomfin-website',
});

