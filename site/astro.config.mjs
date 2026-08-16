import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import { studioPreviewIntegration } from "./src/integrations/studioPreview";

export default defineConfig({
  site: "https://shipglows.com",
  adapter: vercel(),
  integrations: [studioPreviewIntegration("http://127.0.0.1:3005")],
  server: {
    host: true
  }
});
