export const prerender = false;

import type { APIRoute } from "astro";
import shellInstaller from "../generated/shipglows-installer.sh?raw";
import powershellInstaller from "../generated/shipglows-installer.ps1?raw";

export const GET: APIRoute = ({ url }) => {
  const format = url.searchParams.get("format");
  const usePowerShell = format === "powershell" || format === "ps1" || format === "windows";

  return new Response(usePowerShell ? powershellInstaller : shellInstaller, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
