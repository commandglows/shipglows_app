# Native Windows Dotfiles bootstrap.
# Safe for managed Windows hosts: no WSL, profile edits, credentials, or
# machine-wide execution-policy change are required.
[CmdletBinding()]
param(
    [string]$RepoUrl = 'https://github.com/dianedef/dotfiles.git',
    [string]$Branch = 'master',
    [string]$DotfilesDir = (Join-Path $env:USERPROFILE 'dotfiles'),
    [switch]$ConfigureWezTerm,
    [switch]$SkipWezTerm
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Info([string]$Message) { Write-Host "[Dotfiles] $Message" -ForegroundColor Cyan }
function Write-Success([string]$Message) { Write-Host "[Dotfiles] $Message" -ForegroundColor Green }

function Update-ProcessPath {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = @($userPath, $machinePath) -join ';'
}

function Get-Application([string]$Name) {
    return Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Ensure-Git {
    $git = Get-Application 'git.exe'
    if ($git) {
        Write-Success 'git.exe is already installed.'
        return $git.Source
    }

    $winget = Get-Application 'winget.exe'
    if (-not $winget) {
        throw 'Git is required but neither git.exe nor WinGet is available. Install Git for Windows, then rerun this command.'
    }

    Write-Info 'Installing Git for Windows. This can take a few minutes; keep this window open.'
    & $winget.Source install --id Git.Git --exact --source winget --accept-package-agreements --accept-source-agreements --silent | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Git installation returned exit code $LASTEXITCODE." }
    Update-ProcessPath
    $git = Get-Application 'git.exe'
    if (-not $git) { throw 'Git installed but is not available in this session yet. Open a new terminal and rerun the installer.' }
    Write-Success 'Git for Windows installed.'
    return $git.Source
}

function Invoke-Git([string]$Git, [string[]]$Arguments) {
    & $Git @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Git command failed: git $($Arguments -join ' ')" }
}

function Sync-DotfilesCheckout([string]$Git) {
    if (Test-Path -LiteralPath $DotfilesDir) {
        if (-not (Test-Path -LiteralPath (Join-Path $DotfilesDir '.git') -PathType Container)) {
            throw "$DotfilesDir already exists and is not a Git checkout. It was left unchanged; choose another -DotfilesDir or move it yourself."
        }

        $changes = @(& $Git -C $DotfilesDir status --porcelain)
        if ($LASTEXITCODE -ne 0) { throw "Could not inspect the existing checkout at $DotfilesDir." }
        if ($changes.Count -gt 0) {
            throw "Local changes were found in $DotfilesDir. They were left untouched; commit, stash, or resolve them before rerunning."
        }

        $currentBranch = (& $Git -C $DotfilesDir branch --show-current | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $currentBranch -ne $Branch) {
            throw "The existing checkout is on '$currentBranch', not '$Branch'. It was left untouched. Switch it yourself before rerunning."
        }

        Write-Info "Updating the existing $Branch checkout..."
        Invoke-Git $Git @('-C', $DotfilesDir, 'pull', '--ff-only', 'origin', $Branch)
        return
    }

    Write-Info 'Cloning the public Dotfiles repository...'
    Invoke-Git $Git @('clone', '--branch', $Branch, '--single-branch', $RepoUrl, $DotfilesDir)
}

function Should-ConfigureWezTerm {
    if ($SkipWezTerm) { return $false }
    if ($ConfigureWezTerm) { return $true }
    if ([Console]::IsInputRedirected) {
        Write-Info 'Non-interactive run: WezTerm setup skipped. Use -ConfigureWezTerm to enable it explicitly.'
        return $false
    }
    $answer = (Read-Host 'Install/configure WezTerm now? [Y/n]').Trim().ToLowerInvariant()
    return $answer -notin @('n', 'no')
}

function Install-WezTermConfig {
    $wezterm = Get-Application 'wezterm.exe'
    if (-not $wezterm) {
        $winget = Get-Application 'winget.exe'
        if (-not $winget) { throw 'WezTerm setup was selected but WinGet is unavailable. Install WezTerm manually, then rerun with -ConfigureWezTerm.' }
        Write-Info 'Installing WezTerm. This can take a few minutes; keep this window open.'
        & $winget.Source install --id wez.wezterm --exact --source winget --accept-package-agreements --accept-source-agreements --silent | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "WezTerm installation returned exit code $LASTEXITCODE." }
        Update-ProcessPath
        Write-Success 'WezTerm installed.'
    } else {
        Write-Success 'WezTerm is already installed.'
    }

    $source = Join-Path $DotfilesDir 'wezterm\wezterm.lua'
    $targetDirectory = Join-Path $env:USERPROFILE '.config\wezterm'
    $target = Join-Path $targetDirectory 'wezterm.lua'
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "WezTerm config was not found in the checkout: $source" }
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null

    if (Test-Path -LiteralPath $target -PathType Leaf) {
        $sameContents = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
        if (-not $sameContents) {
            $backup = "$target.dotfiles-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Move-Item -LiteralPath $target -Destination $backup
            Write-Info "Existing WezTerm config backed up to $backup"
        }
    }
    Copy-Item -LiteralPath $source -Destination $target -Force
    Write-Success "WezTerm config installed at $target"
}

if ($ConfigureWezTerm -and $SkipWezTerm) { throw 'Choose only one of -ConfigureWezTerm or -SkipWezTerm.' }
Write-Host ''
Write-Host 'Dotfiles Windows Bootstrap' -ForegroundColor Cyan
Write-Host '==========================' -ForegroundColor Cyan
Write-Host 'This installs only the public Dotfiles checkout and optional WezTerm configuration.' -ForegroundColor DarkGray
Write-Host 'It does not edit your PowerShell profile or install the legacy full-machine application catalogue.' -ForegroundColor DarkGray

Update-ProcessPath
$git = Ensure-Git
Sync-DotfilesCheckout $git
Write-Success "Dotfiles checkout ready: $DotfilesDir"

if (Should-ConfigureWezTerm) { Install-WezTermConfig }

Write-Host ''
Write-Success 'Dotfiles Windows bootstrap completed.'
Write-Host 'Open a new WezTerm window to use the installed configuration.' -ForegroundColor Green
