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
  { id: "unix-full", platform: "unix", mode: "full", command: `${shell} | sudo env SHIPGLOWS_INSTALL_MODE=full sh`, note: fr ? "Couche serveur complète pour Ubuntu, Debian et leurs dérivées déclarées compatibles, avec les privilèges root." : "Complete server layer for Ubuntu, Debian, and derivatives that declare compatibility, with root privileges.", available: true },
  { id: "windows-local", platform: "windows", mode: "local", command: windows, note: fr ? "L’invite permet de choisir les tunnels SSH." : "Choose SSH tunnels at the prompt.", available: true },
  { id: "windows-full", platform: "windows", mode: "full", command: windows, note: fr ? "Choisissez le DevServer local pour préparer Astro, Python et Flutter pour le Web, Android et Windows sans WSL." : "Choose Local DevServer to prepare Astro, Python and Flutter for web, Android, and Windows without WSL.", available: true },
  { id: "termux-local", platform: "termux", mode: "local", command: `${shell} | SHIPGLOWS_INSTALL_MODE=local sh`, note: fr ? "Profil Android local, sans sudo. Le premier appairage peut utiliser un mot de passe, puis passer à une clé SSH propre à l’appareil pour les tunnels." : "Local Android profile, without sudo. A first password pairing can promote to a device-specific SSH key for later tunnels.", available: true },
  { id: "termux-full", platform: "termux", mode: "full", command: "", note: fr ? "Le mode full n’est pas disponible dans Termux." : "Full mode is not available in Termux.", available: false },
];

export const installPages: Record<"shipglows" | "dotfiles", Record<Locale, InstallPageContent>> = {
  shipglows: {
    en: { slug: "shipglows", kicker: "Local or server setup", title: "Install the right ShipGlows layer for this machine.", description: "Set up local tunnels, a complete Ubuntu- or Debian-compatible server, or a native Windows development environment for Astro, Python and Flutter for web, Android, and Windows. On Android Termux, a first password pairing can promote to a device-specific SSH key for later tunnels.", fitTitle: "Best for", fit: ["native Windows development without WSL, including Flutter Android and Windows desktop", "Ubuntu, Debian, and compatible project servers", "Termux and local tunnel clients"], installedTitle: "What full Windows prepares", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm, uv and a default Python runtime", "Flutter and Dart with the Android SDK and visible official license acceptance", "an optional Android emulator, plus Android Studio and Visual Studio Community C++ when missing", "PowerShell-safe commands, MCP preparation, and shared live tool context for already installed coding agents", "a durable environment report with separate readiness states and the exact next action"], limitsTitle: "Important boundaries", limits: ["Linux full requires root and supports Ubuntu, Debian, and derivatives that declare compatibility; Windows full installs in the user profile", "The default bootstrap uses the lightweight runtime surface; set SHIPGLOWS_INSTALL_COMPONENTS=all to fetch and synchronize the public skill corpus automatically", "The emulator needs hardware acceleration; otherwise use a real phone or Firebase Device Streaming", "Firebase Device Streaming requires your own sign-in, project, billing and device reservation in Android Studio", "Large IDE installs require confirmation; existing agent instructions are preserved, and ShipGlows does not authenticate GitHub, coding agents or Firebase"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "ShipGlows repository", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(false) },
    fr: { slug: "shipglows", kicker: "Setup local ou serveur", title: "Installez la bonne couche ShipGlows pour cette machine.", description: "Configurez les tunnels locaux, un serveur compatible Ubuntu ou Debian complet, ou un environnement de développement Windows natif pour Astro, Python et Flutter pour le Web, Android et Windows. Sur Android Termux, le premier appairage par mot de passe peut passer à une clé SSH propre à l’appareil pour les tunnels suivants.", fitTitle: "Idéal pour", fit: ["développement Windows natif sans WSL, y compris Flutter Android et Windows desktop", "serveurs de projets Ubuntu, Debian et compatibles", "Termux et clients de tunnels locaux"], installedTitle: "Ce que Windows full prépare", installed: ["Git, GitHub CLI, Node LTS, npm, pnpm, uv et un runtime Python par défaut", "Flutter et Dart avec le SDK Android et l’acceptation visible des licences officielles", "un émulateur Android optionnel, plus Android Studio et Visual Studio Community C++ lorsqu’ils manquent", "des commandes compatibles PowerShell, la préparation MCP et un contexte d’outils vivant partagé pour les agents déjà installés", "un rapport d’environnement durable avec des états séparés et la prochaine action exacte"], limitsTitle: "Limites importantes", limits: ["Linux full exige root et prend en charge Ubuntu, Debian et les dérivées qui déclarent cette compatibilité ; Windows full s’installe dans le profil utilisateur", "Le bootstrap utilise par défaut la surface runtime légère ; définissez SHIPGLOWS_INSTALL_COMPONENTS=all pour télécharger et synchroniser automatiquement le corpus public de skills", "L’émulateur nécessite l’accélération matérielle ; sinon utilisez un téléphone réel ou Firebase Device Streaming", "Firebase Device Streaming exige votre propre connexion, projet, facturation et réservation d’appareil dans Android Studio", "Les IDE volumineux demandent une confirmation ; les instructions existantes des agents sont préservées et ShipGlows n’authentifie ni GitHub, ni les agents, ni Firebase"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt ShipGlows", repositoryUrl: "https://github.com/commandglows/shipglows", rawUrl: "/shipglows-script", variants: shipglowsVariants(true) },
  },
  dotfiles: {
    en: { slug: "dotfiles", kicker: "Personal workstation setup", title: "Install the dotfiles profile without cloning first.", description: "Bootstrap the canonical Dotfiles repository for editor, shell and terminal configuration. Native Windows starts with a safe focused profile.", fitTitle: "Best for", fit: ["Linux workstations", "native Windows without WSL", "reproducible dotfiles updates"], installedTitle: "Installed by the profile", installed: ["Linux: the canonical shell and editor profile", "Windows: the public checkout and optional WezTerm configuration", "backup-safe terminal configuration"], limitsTitle: "Boundary", limits: ["Windows does not run the legacy full-machine application catalogue", "PowerShell profiles and private secrets are never modified", "ShipGlows system setup keeps its own installer"], copyLabel: "Copy command", copiedLabel: "Copied", rawLabel: "Open raw script", repositoryLabel: "Dotfiles repository", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clones or updates ~/dotfiles, then runs the canonical installer.", available: true }, { id: "windows-local", platform: "windows", mode: "local", command: dotfilesWindows, note: "Clones or updates the public profile, then optionally installs and configures WezTerm. No WSL or PowerShell profile change.", available: true }] },
    fr: { slug: "dotfiles", kicker: "Configuration du poste utilisateur", title: "Installez les dotfiles sans commencer par cloner le dépôt.", description: "Bootstrappez le dépôt Dotfiles canonique pour configurer éditeur, shell et terminal. Windows natif commence par un profil sûr et ciblé.", fitTitle: "Idéal pour", fit: ["postes Linux", "Windows natif sans WSL", "mises à jour reproductibles"], installedTitle: "Installé par le profil", installed: ["Linux : le profil shell et éditeur canonique", "Windows : le checkout public et la configuration WezTerm optionnelle", "configuration terminal sauvegardée avant remplacement"], limitsTitle: "Limite claire", limits: ["Windows ne lance pas l’ancien catalogue complet d’applications", "le profil PowerShell et les secrets privés ne sont jamais modifiés", "le setup système ShipGlows garde son propre installateur"], copyLabel: "Copier la commande", copiedLabel: "Copié", rawLabel: "Ouvrir le script brut", repositoryLabel: "Dépôt Dotfiles", repositoryUrl: "https://github.com/dianedef/dotfiles", rawUrl: "/dotfiles-script", variants: [{ id: "unix-local", platform: "unix", mode: "local", command: dotfiles, note: "Clone ou met à jour ~/dotfiles, puis lance l’installateur canonique.", available: true }, { id: "windows-local", platform: "windows", mode: "local", command: dotfilesWindows, note: "Clone ou met à jour le profil public, puis propose WezTerm. Ni WSL ni modification du profil PowerShell.", available: true }] },
  },
};

installPages.shipglows.en.installed[3] =
  "a grouped proposal for missing Codex, Claude, OpenCode, Kilo and Gemini CLIs, plus exact-version Firebase, FlutterFire, Convex, Vercel, Supabase and Clerk tooling when detected";
installPages.shipglows.en.installed.splice(
  4,
  0,
  "verified Dart, Playwright, Firebase, Convex and Clerk MCP readiness plus official read-only GitHub MCP for installed agents",
);
installPages.shipglows.en.installed[5] += " with shared live tool context";
installPages.shipglows.en.limits[3] =
  "Large tools and missing agents require confirmation; existing agent instructions are preserved, and ShipGlows offers a redacted authentication menu that launches official interactive CLI flows without collecting credentials, never runs clerk init, and never enables Developer Mode itself";
installPages.shipglows.fr.installed[3] =
  "une proposition groupée des CLIs Codex, Claude, OpenCode, Kilo et Gemini manquants, puis les outils Firebase, FlutterFire, Convex, Vercel, Supabase et Clerk en versions exactes lorsqu’ils sont détectés";
installPages.shipglows.fr.installed.splice(
  4,
  0,
  "un état MCP vérifié pour Dart, Playwright, Firebase, Convex et Clerk, plus le MCP GitHub officiel en lecture seule, dans chaque agent installé",
);
installPages.shipglows.fr.installed[5] += " avec un contexte d’outils vivant partagé";
installPages.shipglows.fr.limits[3] =
  "Les outils volumineux et agents manquants demandent confirmation ; les instructions existantes des agents sont préservées et ShipGlows propose un menu d’authentification expurgé qui lance les flux interactifs officiels des CLIs sans collecter d’identifiants, ne lance pas clerk init et n’active jamais lui-même Developer Mode";
