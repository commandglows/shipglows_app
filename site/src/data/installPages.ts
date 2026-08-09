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

const shipglowsVariants = (fr: boolean): InstallVariant[] => [
  { id: "unix-local", platform: "unix", mode: "local", command: `${shell} | SHIPGLOWS_INSTALL_MODE=local sh`, note: fr ? "Client local et tunnels. Les prérequis manquants peuvent demander une confirmation sudo sur Debian/Ubuntu." : "Local client and tunnels. Missing prerequisites may request sudo confirmation on Debian/Ubuntu.", available: true },
  { id: "unix-full", platform: "unix", mode: "full", command: `${shell} | sudo env SHIPGLOWS_INSTALL_MODE=full sh`, note: fr ? "Couche serveur complète pour Ubuntu avec les privilèges root." : "Complete Ubuntu server layer with root privileges.", available: true },
  { id: "windows-local", platform: "windows", mode: "local", command: windows, note: fr ? "L’invite permet de choisir les tunnels SSH." : "Choose SSH tunnels at the prompt.", available: true },
  { id: "windows-full", platform: "windows", mode: "full", command: windows, note: fr ? "Choisissez le DevServer local pour Astro, Python et Flutter Web sans WSL." : "Choose Local DevServer for Astro, Python and Flutter Web without WSL.", available: true },
  { id: "termux-local", platform: "termux", mode: "local", command: `${shell} | SHIPGLOWS_INSTALL_MODE=local sh`, note: fr ? "Profil Android local, sans sudo." : "Local Android profile, without sudo.", available: true },
  { id: "termux-full", platform: "termux", mode: "full", command: "", note: fr ? "Le mode full n’est pas disponible dans Termux." : "Full mode is not available in Termux.", available: false },
];

export const installPages: Record<"shipglows" | "dotfiles", Record<Locale, InstallPageContent>> = {
  shipglows: {
    en: { slug: "shipglows", kicker: "Local or server setup", title: "Install the right ShipGlows layer for this machine.", description: "Set up local tunnels, a complete Ubuntu server, or a native Windows DevServer for Astro, Python and Flutter Web. Windows full mode works without WSL and offers coding agents individually.", fitTitle: "Best for", fit: ["native Windows development without WSL", "Ubuntu project servers", "Termux and local tunnel clients"], installedTitle: "What full Windows prepares", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm and uv", "optional Flutter Web SDK", "optional Codex, Claude Code, OpenCode and KiloCode", "PowerShell-safe commands plus s and shipglows-dev"], limitsTitle: "Important boundaries", limits: ["Ubuntu full requires root; Windows full installs in the user profile", "Flutter and coding agents are explicit choices", "ShipGlows never asks for or stores GitHub or agent credentials"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "ShipGlows repository", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(false) },
    fr: { slug: "shipglows", kicker: "Setup local ou serveur", title: "Installez la bonne couche ShipGlows pour cette machine.", description: "Configurez les tunnels locaux, un serveur Ubuntu complet ou un DevServer Windows natif pour Astro, Python et Flutter Web. Le mode full Windows fonctionne sans WSL et propose chaque agent séparément.", fitTitle: "Idéal pour", fit: ["développement Windows natif sans WSL", "serveurs de projets Ubuntu", "Termux et clients de tunnels locaux"], installedTitle: "Ce que Windows full prépare", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm et uv", "SDK Flutter Web optionnel", "Codex, Claude Code, OpenCode et KiloCode optionnels", "commandes compatibles PowerShell, s et shipglows-dev"], limitsTitle: "Limites importantes", limits: ["Ubuntu full exige root ; Windows full s’installe dans le profil utilisateur", "Flutter et les agents restent des choix explicites", "ShipGlows ne demande ni ne stocke les identifiants GitHub ou des agents"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt ShipGlows", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(true) },
  },
  dotfiles: {
    en: { slug: "dotfiles", kicker: "Personal workstation setup", title: "Install the dotfiles profile without cloning first.", description: "Bootstrap the canonical dotfiles repository and run its real installer for editor, shell and terminal configuration.", fitTitle: "Best for", fit: ["Linux workstations", "user-level shell and editor setup", "reproducible dotfiles updates"], installedTitle: "Installed by the profile", installed: ["Neovim configuration", "Starship, Zoxide, FZF and Ranger", "shell aliases, PATH and backed-up config links"], limitsTitle: "Boundary", limits: ["ShipGlows system setup keeps its own installer", "system services are not silently enabled", "private secrets are never created"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "Dotfiles repository", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clones or updates ~/dotfiles, then runs the canonical installer.", available: true }] },
    fr: { slug: "dotfiles", kicker: "Configuration du poste utilisateur", title: "Installez les dotfiles sans commencer par cloner le dépôt.", description: "Bootstrappez le dépôt dotfiles canonique et lancez son véritable installateur pour configurer éditeur, shell et terminal.", fitTitle: "Idéal pour", fit: ["postes Linux", "configuration shell et éditeur utilisateur", "mises à jour reproductibles"], installedTitle: "Installé par le profil", installed: ["configuration Neovim", "Starship, Zoxide, FZF et Ranger", "alias, PATH et liens de configuration sauvegardés"], limitsTitle: "Limite claire", limits: ["le setup système ShipGlows garde son propre installateur", "les services système ne sont pas activés silencieusement", "aucun secret privé n’est créé"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt dotfiles", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clone ou met à jour ~/dotfiles, puis lance l’installateur canonique.", available: true }] },
  },
};
