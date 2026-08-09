#!/usr/bin/env sh
# Bootstrap dotfiles without a manual git clone.

set -eu

REPO_URL="${DOTFILES_REPO_URL:-https://github.com/dianedef/dotfiles.git}"
BRANCH="${DOTFILES_BRANCH:-master}"
DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
BOOTSTRAP_LOG="${DOTFILES_BOOTSTRAP_LOG:-$HOME/dotfiles-bootstrap.log}"

log() {
    printf '%s\n' "$*"
}

prepare_log() {
    mkdir -p "$(dirname "$BOOTSTRAP_LOG")" 2>/dev/null || true
    : > "$BOOTSTRAP_LOG" 2>/dev/null || true
}

run_or_explain() {
    label=$1
    shift

    if "$@" </dev/null >>"$BOOTSTRAP_LOG" 2>&1; then
        return 0
    fi

    log "Échec: $label."
    log "Détails: $BOOTSTRAP_LOG"
    log "Dernières lignes:"
    tail -n 8 "$BOOTSTRAP_LOG" 2>/dev/null || true
    return 1
}

has_cmd() {
    command -v "$1" >/dev/null 2>&1
}

install_bootstrap_deps() {
    if has_cmd git && has_cmd curl && has_cmd bash; then
        return 0
    fi

    log "Installation des dépendances de bootstrap..."

    if has_cmd apt-get; then
        if [ "$(id -u)" -eq 0 ]; then
            run_or_explain "mise à jour apt" apt-get update -qq
            run_or_explain "installation de git/curl/bash" apt-get install -y -qq git curl bash ca-certificates
        elif has_cmd sudo && sudo -n true >>"$BOOTSTRAP_LOG" 2>&1; then
            run_or_explain "mise à jour apt" sudo apt-get update -qq
            run_or_explain "installation de git/curl/bash" sudo apt-get install -y -qq git curl bash ca-certificates
        else
            log "git, curl et bash sont requis."
            log "Installez-les d'abord, ou relancez depuis un utilisateur avec sudo sans prompt."
            return 1
        fi
    elif has_cmd brew; then
        run_or_explain "installation des dépendances avec Homebrew" brew install git curl bash
    else
        log "Impossible d'installer automatiquement git/curl/bash sur ce système."
        log "Installez ces dépendances puis relancez la commande."
        return 1
    fi
}

stash_dotfiles_changes() {
    if [ -z "$(git -C "$DOTFILES_DIR" status --porcelain 2>/dev/null)" ]; then
        return 0
    fi

    log "Modifications locales détectées dans ~/dotfiles; sauvegarde temporaire..."
    run_or_explain "sauvegarde des modifications locales dotfiles" env \
        GIT_AUTHOR_NAME="Dotfiles Bootstrap" \
        GIT_AUTHOR_EMAIL="dotfiles-bootstrap@example.invalid" \
        GIT_COMMITTER_NAME="Dotfiles Bootstrap" \
        GIT_COMMITTER_EMAIL="dotfiles-bootstrap@example.invalid" \
        git -C "$DOTFILES_DIR" stash push -u -m "dotfiles-bootstrap backup $(date -u +%Y%m%dT%H%M%SZ)"
}

prepare_log
log "Préparation de l'installation dotfiles..."
install_bootstrap_deps

if [ -d "$DOTFILES_DIR/.git" ]; then
    log "Mise à jour du dépôt dotfiles..."
    stash_dotfiles_changes
    run_or_explain "récupération de la dernière version dotfiles" git -C "$DOTFILES_DIR" fetch origin "$BRANCH"
    run_or_explain "sélection de la branche $BRANCH" git -C "$DOTFILES_DIR" checkout "$BRANCH"
    run_or_explain "mise à jour du dépôt dotfiles" git -C "$DOTFILES_DIR" pull --ff-only origin "$BRANCH"
elif [ -e "$DOTFILES_DIR" ]; then
    log "$DOTFILES_DIR existe déjà mais ce n'est pas un dépôt git."
    log "Déplacez-le ou définissez DOTFILES_DIR vers un autre chemin, puis relancez."
    exit 1
else
    log "Téléchargement des dotfiles..."
    run_or_explain "téléchargement des dotfiles" git clone --quiet --branch "$BRANCH" "$REPO_URL" "$DOTFILES_DIR"
fi

exec bash "$DOTFILES_DIR/dotfiles/install.sh" "$@"
