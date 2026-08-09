export type Locale = "en" | "fr";
export type Platform = "unix" | "windows" | "termux";
export type InstallMode = "local" | "full";

export interface InstallVariant {
  id: string;
  platform: Platform;
  mode: InstallMode;
  command: string;
  note: string;
  available: boolean;
}

export interface InstallPageContent {
  slug: "shipglows" | "dotfiles";
  title: string;
  kicker: string;
  description: string;
  fitTitle: string;
  fit: string[];
  installedTitle: string;
  installed: string[];
  limitsTitle: string;
  limits: string[];
  copyLabel: string;
  copiedLabel: string;
  rawLabel: string;
  repositoryLabel: string;
  repositoryUrl: string;
  rawUrl: string;
  variants: InstallVariant[];
}

const shell = "curl -fsSL https://shipglows.com/shipglows-script";
const windows = `$installer = Join-Path $env:TEMP 'shipglows-install.ps1'\ncurl.exe -fsSL 'https://shipglows.com/shipglows-script?format=powershell' -o $installer\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer`;
const dotfiles = "curl -fsSL https://shipglows.com/dotfiles-script | sh";
const dotfilesWindows = `$installer = Join-Path $env:TEMP 'dotfiles-install.ps1'\ncurl.exe -fsSL 'https://shipglows.com/dotfiles-script?format=powershell' -o $installer\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer`;

const shipglowsVariants = (fr: boolean): InstallVariant[] => [
  { id: "unix-local", platform: "unix", mode: "local", command: `${shell} | SHIPGLOWS_INSTALL_MODE=local sh`, note: fr ? "Client local et tunnels. Les prérequis manquants peuvent demander une confirmation sudo sur Debian/Ubuntu." : "Local client and tunnels. Missing prerequisites may request sudo confirmation on Debian/Ubuntu.", available: true },
  { id: "unix-full", platform: "unix", mode: "full", command: `${shell} | sudo env SHIPGLOWS_INSTALL_MODE=full sh`, note: fr ? "Couche serveur complète pour Ubuntu avec les privilèges root." : "Complete Ubuntu server layer with root privileges.", available: true },
  { id: "windows-local", platform: "windows", mode: "local", command: windows, note: fr ? "L’invite permet de choisir les tunnels SSH." : "Choose SSH tunnels at the prompt.", available: true },
  { id: "windows-full", platform: "windows", mode: "full", command: windows, note: fr ? "Choisissez le DevServer local pour Astro, Python et Flutter Web sans WSL." : "Choose Local DevServer for Astro, Python and Flutter Web without WSL.", available: true },
  { id: "termux-local", platform: "termux", mode: "local", command: `${shell} | SHIPGLOWS_INSTALL_MODE=local sh`, note: fr ? "Profil Android local, sans sudo. Le premier appairage peut utiliser un mot de passe, puis passer à une clé SSH propre à l’appareil pour les tunnels." : "Local Android profile, without sudo. A first password pairing can promote to a device-specific SSH key for later tunnels.", available: true },
  { id: "termux-full", platform: "termux", mode: "full", command: "", note: fr ? "Le mode full n’est pas disponible dans Termux." : "Full mode is not available in Termux.", available: false },
];

export const installPages: Record<"shipglows" | "dotfiles", Record<Locale, InstallPageContent>> = {
  shipglows: {
    en: { slug: "shipglows", kicker: "Local or server setup", title: "Install the right ShipGlows layer for this machine.", description: "Set up local tunnels, a complete Ubuntu server, or a native Windows DevServer for Astro, Python and Flutter Web. On Android Termux, a first password pairing can promote to a device-specific SSH key for later tunnels.", fitTitle: "Best for", fit: ["native Windows development without WSL", "Ubuntu project servers", "Termux and local tunnel clients"], installedTitle: "What full Windows prepares", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm and uv", "optional Flutter Web SDK", "optional Codex, Claude Code, OpenCode and KiloCode", "PowerShell-safe commands plus s and shipglows-dev"], limitsTitle: "Important boundaries", limits: ["Ubuntu full requires root; Windows full installs in the user profile", "Flutter and coding agents are explicit choices", "ShipGlows never asks for or stores GitHub or agent credentials"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "ShipGlows repository", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(false) },
    fr: { slug: "shipglows", kicker: "Setup local ou serveur", title: "Installez la bonne couche ShipGlows pour cette machine.", description: "Configurez les tunnels locaux, un serveur Ubuntu complet ou un DevServer Windows natif pour Astro, Python et Flutter Web. Sur Android Termux, le premier appairage par mot de passe peut passer à une clé SSH propre à l’appareil pour les tunnels suivants.", fitTitle: "Idéal pour", fit: ["développement Windows natif sans WSL", "serveurs de projets Ubuntu", "Termux et clients de tunnels locaux"], installedTitle: "Ce que Windows full prépare", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm et uv", "SDK Flutter Web optionnel", "Codex, Claude Code, OpenCode et KiloCode optionnels", "commandes compatibles PowerShell, s et shipglows-dev"], limitsTitle: "Limites importantes", limits: ["Ubuntu full exige root ; Windows full s’installe dans le profil utilisateur", "Flutter et les agents restent des choix explicites", "ShipGlows ne demande ni ne stocke les identifiants GitHub ou des agents"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt ShipGlows", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(true) },
  },
  dotfiles: {
    en: { slug: "dotfiles", kicker: "Personal workstation setup", title: "Install the dotfiles profile without cloning first.", description: "Bootstrap the canonical Dotfiles repository for editor, shell and terminal configuration. Native Windows starts with a safe focused profile.", fitTitle: "Best for", fit: ["Linux workstations", "native Windows without WSL", "reproducible dotfiles updates"], installedTitle: "Installed by the profile", installed: ["Linux: the canonical shell and editor profile", "Windows: the public checkout and optional WezTerm configuration", "backup-safe terminal configuration"], limitsTitle: "Boundary", limits: ["Windows does not run the legacy full-machine application catalogue", "PowerShell profiles and private secrets are never modified", "ShipGlows system setup keeps its own installer"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "Dotfiles repository", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clones or updates ~/dotfiles, then runs the canonical installer.", available: true }, { id: "windows-local", platform: "windows", mode: "local", command: dotfilesWindows, note: "Clones or updates the public profile, then optionally installs and configures WezTerm. No WSL or PowerShell profile change.", available: true }] },
    fr: { slug: "dotfiles", kicker: "Configuration du poste utilisateur", title: "Installez les dotfiles sans commencer par cloner le dépôt.", description: "Bootstrappez le dépôt Dotfiles canonique pour configurer éditeur, shell et terminal. Windows natif commence par un profil sûr et ciblé.", fitTitle: "Idéal pour", fit: ["postes Linux", "Windows natif sans WSL", "mises à jour reproductibles"], installedTitle: "Installé par le profil", installed: ["Linux : le profil shell et éditeur canonique", "Windows : le checkout public et la configuration WezTerm optionnelle", "configuration terminal sauvegardée avant remplacement"], limitsTitle: "Limite claire", limits: ["Windows ne lance pas l’ancien catalogue complet d’applications", "le profil PowerShell et les secrets privés ne sont jamais modifiés", "le setup système ShipGlows garde son propre installateur"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt Dotfiles", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clone ou met à jour ~/dotfiles, puis lance l’installateur canonique.", available: true }, { id: "windows-local", platform: "windows", mode: "local", command: dotfilesWindows, note: "Clone ou met à jour le profil public, puis propose WezTerm. Ni WSL ni modification du profil PowerShell.", available: true }] },
  },
};
