import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import { studioPreviewIntegration } from "./src/integrations/studioPreview";

export default defineConfig({
  site: "https://shipglows.com",
  adapter: vercel(),
  integrations: [studioPreviewIntegration()],
  server: {
    host: true
  }
});
