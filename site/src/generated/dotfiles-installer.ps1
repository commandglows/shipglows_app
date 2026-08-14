# Native Windows Dotfiles bootstrap.
# Safe for managed Windows hosts: no WSL, profile edits, credentials, or
# machine-wide execution-policy change are required.
[CmdletBinding()]
param(
    [string]$RepoUrl = 'https://github.com/dianedef/dotfiles.git',
    [string]$Branch = 'master',
    [string]$DotfilesDir = (Join-Path $env:USERPROFILE '.dotfiles'),
    [switch]$ConfigureWezTerm,
    [switch]$SkipWezTerm,
    [switch]$ConfigureTools,
    [switch]$SkipTools
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

function Publish-EnvironmentChange {
    if (-not ('DotfilesNativeMethods' -as [type])) {
        Add-Type @'
using System;
using System.Runtime.InteropServices;

public static class DotfilesNativeMethods {
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(
        IntPtr hWnd, uint msg, UIntPtr wParam, string lParam,
        uint flags, uint timeout, out UIntPtr result);
}
'@
    }
    $result = [UIntPtr]::Zero
    [void][DotfilesNativeMethods]::SendMessageTimeout([IntPtr]0xffff, 0x001a, [UIntPtr]::Zero, 'Environment', 0x0002, 5000, [ref]$result)
}

function Add-UserPathEntry([string]$PathEntry) {
    $resolvedEntry = [IO.Path]::GetFullPath($PathEntry).TrimEnd('\')
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($currentPath -split ';' | Where-Object { $_ })
    if (-not ($entries | Where-Object { [IO.Path]::GetFullPath($_).TrimEnd('\') -ieq $resolvedEntry })) {
        [Environment]::SetEnvironmentVariable('Path', (@($entries) + $resolvedEntry) -join ';', 'User')
        Update-ProcessPath
        Write-Success "Added Dotfiles shortcuts to the user PATH."
    }
    Publish-EnvironmentChange
}

function Get-Application([string]$Name) {
    return Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Get-WinGet {
    $winget = Get-Application 'winget.exe'
    if (-not $winget) { throw 'WinGet is required to install Windows applications. Install App Installer from Microsoft, then rerun this command.' }
    return $winget.Source
}

function Install-WinGetPackage([string]$Name, [string]$PackageId, [string]$Command) {
    if (Get-Application $Command) {
        Write-Success "$Name is already installed."
        return
    }
    $winget = Get-WinGet
    Write-Info "Installing $Name. This can take a few minutes; keep this window open."
    & $winget install --id $PackageId --exact --source winget --accept-package-agreements --accept-source-agreements --silent --disable-interactivity | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "$Name installation returned exit code $LASTEXITCODE." }
    Update-ProcessPath
    Write-Success "$Name installed."
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
    & $winget.Source install --id Git.Git --exact --source winget --accept-package-agreements --accept-source-agreements --silent --disable-interactivity | Out-Null
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
        if ($LASTEXITCODE -ne 0) {
            throw "Could not determine the current branch in $DotfilesDir."
        }
        if ($currentBranch -ne $Branch) {
            Write-Info "Switching the installed runtime from '$currentBranch' to '$Branch'..."
            Invoke-Git $Git @('-C', $DotfilesDir, 'fetch', 'origin', $Branch)
            Invoke-Git $Git @('-C', $DotfilesDir, 'checkout', '-B', $Branch, 'FETCH_HEAD')
        }

        Write-Info "Updating the existing $Branch checkout..."
        Invoke-Git $Git @('-C', $DotfilesDir, 'pull', '--ff-only', 'origin', $Branch)
        return
    }

    Write-Info 'Cloning the public Dotfiles repository...'
    Invoke-Git $Git @('clone', '--branch', $Branch, '--single-branch', $RepoUrl, $DotfilesDir)
}

function Set-InstalledRootHidden {
    $defaultRoot = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.dotfiles')).TrimEnd('\')
    if ([IO.Path]::GetFullPath($DotfilesDir).TrimEnd('\') -ne $defaultRoot) { return }
    $rootItem = Get-Item -LiteralPath $DotfilesDir -Force
    $rootItem.Attributes = $rootItem.Attributes -bor [IO.FileAttributes]::Hidden
}

function Show-LegacyCheckoutNotice {
    $legacyRoot = Join-Path $env:USERPROFILE 'dotfiles'
    if ([IO.Path]::GetFullPath($legacyRoot).TrimEnd('\') -eq [IO.Path]::GetFullPath($DotfilesDir).TrimEnd('\')) { return }
    if (Test-Path -LiteralPath $legacyRoot) {
        Write-Info "Legacy checkout left unchanged: $legacyRoot"
        Write-Info 'Use %USERPROFILE%\ShipGlows\dotfiles for development and .dotfiles only as the installed runtime.'
    }
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

function Confirm-Choice([string]$Prompt, [bool]$DefaultYes = $true) {
    $suffix = if ($DefaultYes) { '[Y/n]' } else { '[y/N]' }
    $answer = (Read-Host "$Prompt $suffix").Trim().ToLowerInvariant()
    if (-not $answer) { return $DefaultYes }
    return $answer -in @('y', 'yes')
}

function Should-ConfigureTools {
    if ($SkipTools) { return $false }
    if ($ConfigureTools) { return $true }
    if ([Console]::IsInputRedirected) {
        Write-Info 'Non-interactive run: developer tools skipped. Use -ConfigureTools to install them explicitly.'
        return $false
    }
    return Confirm-Choice 'Install the recommended Windows terminal toolkit (Neovim, Starship, Zoxide, fzf, ripgrep, fd, bat, and Yazi)?'
}

function Install-DeveloperTools {
    $tools = @(
        @{ Name = 'Neovim'; Package = 'Neovim.Neovim'; Command = 'nvim.exe' },
        @{ Name = 'Starship'; Package = 'Starship.Starship'; Command = 'starship.exe' },
        @{ Name = 'Zoxide'; Package = 'ajeetdsouza.zoxide'; Command = 'zoxide.exe' },
        @{ Name = 'fzf'; Package = 'junegunn.fzf'; Command = 'fzf.exe' },
        @{ Name = 'ripgrep'; Package = 'BurntSushi.ripgrep.MSVC'; Command = 'rg.exe' },
        @{ Name = 'fd'; Package = 'sharkdp.fd'; Command = 'fd.exe' },
        @{ Name = 'bat'; Package = 'sharkdp.bat'; Command = 'bat.exe' },
        @{ Name = 'WinLibs GCC'; Package = 'BrechtSanders.WinLibs.POSIX.UCRT'; Command = 'gcc.exe' },
        @{ Name = 'Yazi'; Package = 'sxyazi.yazi'; Command = 'yazi.exe' }
    )
    foreach ($tool in $tools) { Install-WinGetPackage $tool.Name $tool.Package $tool.Command }
}

function Copy-ConfigWithBackup([string]$Source, [string]$Target) {
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Configuration file not found: $Source" }
    New-Item -ItemType Directory -Path (Split-Path -Parent $Target) -Force | Out-Null
    if (Test-Path -LiteralPath $Target -PathType Leaf) {
        $sourceText = [IO.File]::ReadAllText($Source).Replace("`r`n", "`n")
        $targetText = [IO.File]::ReadAllText($Target).Replace("`r`n", "`n")
        $sameContents = $sourceText -ceq $targetText
        if ($sameContents) { return }
        $backup = "$Target.dotfiles-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Move-Item -LiteralPath $Target -Destination $backup
        Write-Info "Existing configuration backed up to $backup"
    }
    Copy-Item -LiteralPath $Source -Destination $Target -Force
}

function Install-DirectoryJunction([string]$Source, [string]$Target) {
    if (-not (Test-Path -LiteralPath $Source -PathType Container)) { throw "Configuration directory not found: $Source" }

    $sourcePath = [IO.Path]::GetFullPath($Source).TrimEnd('\')
    $targetItem = Get-Item -LiteralPath $Target -Force -ErrorAction SilentlyContinue
    if ($targetItem -and $targetItem.LinkType -in @('Junction', 'SymbolicLink')) {
        $linkTarget = @($targetItem.Target)[0]
        if ($linkTarget -and [IO.Path]::GetFullPath($linkTarget).TrimEnd('\') -eq $sourcePath) { return }
    }

    if ($targetItem) {
        $backup = "$Target.dotfiles-backup-$(Get-Date -Format 'yyyyMMdd-HHmmssfff')"
        Move-Item -LiteralPath $Target -Destination $backup
        Write-Info "Existing configuration backed up to $backup"
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $Target) -Force | Out-Null
    New-Item -ItemType Junction -Path $Target -Target $sourcePath | Out-Null
}

function Install-NeovimConfig {
    $sourceDirectory = Join-Path $DotfilesDir 'nvim\MyNeovim'
    $targetDirectory = Join-Path $env:LOCALAPPDATA 'nvim'
    Install-DirectoryJunction $sourceDirectory $targetDirectory
    Write-Success "Neovim config linked at $targetDirectory"
}

function Install-YaziConfig {
    $sourceDirectory = Join-Path $DotfilesDir 'yazi'
    $targetDirectory = Join-Path $env:APPDATA 'yazi\config'
    foreach ($name in @('init.lua', 'keymap.toml', 'yazi.toml', 'package.toml')) {
        Copy-ConfigWithBackup (Join-Path $sourceDirectory $name) (Join-Path $targetDirectory $name)
    }

    $ya = Get-Application 'ya.exe'
    if (-not $ya) {
        Write-Info 'Yazi configuration installed; run again with -ConfigureTools to install its plugins.'
        return
    }
    & $ya.Source pkg install | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Yazi plugin installation returned exit code $LASTEXITCODE." }
    Write-Success 'Yazi configuration and locked plugins installed.'
}

function Install-YaziShortcut {
    $shortcutDirectory = Join-Path $DotfilesDir 'bin'
    $shortcut = Join-Path $shortcutDirectory 'y.cmd'
    if (-not (Test-Path -LiteralPath $shortcut -PathType Leaf)) { throw "Yazi shortcut was not found in the checkout: $shortcut" }
    Add-UserPathEntry $shortcutDirectory
    Write-Success 'Yazi shortcut installed: y (available in newly opened terminals).'
}

function Install-TerminalConfigs {
    Install-NeovimConfig
    Copy-ConfigWithBackup (Join-Path $DotfilesDir 'starship\starship.toml') (Join-Path $env:USERPROFILE '.config\starship.toml')
    Copy-ConfigWithBackup (Join-Path $DotfilesDir 'powershell\ShipGlows.Profile.ps1') (Join-Path $env:USERPROFILE '.config\shipglows\profile.ps1')
    Install-YaziConfig
    Install-YaziShortcut
    Write-Success 'Neovim, Starship, PowerShell, and Yazi terminal configuration installed.'
}

function Install-WezTermConfig {
    $wezterm = Get-Application 'wezterm.exe'
    if (-not $wezterm) {
        Install-WinGetPackage 'WezTerm' 'wez.wezterm' 'wezterm.exe'
    } else {
        Write-Success 'WezTerm is already installed.'
    }

    $source = Join-Path $DotfilesDir 'wezterm\wezterm.lua'
    $targetDirectory = Join-Path $env:USERPROFILE '.config\wezterm'
    $target = Join-Path $targetDirectory 'wezterm.lua'
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "WezTerm config was not found in the checkout: $source" }
    Copy-ConfigWithBackup $source $target
    Write-Success "WezTerm config installed at $target"
}

if ($ConfigureWezTerm -and $SkipWezTerm) { throw 'Choose only one of -ConfigureWezTerm or -SkipWezTerm.' }
if ($ConfigureTools -and $SkipTools) { throw 'Choose only one of -ConfigureTools or -SkipTools.' }
Write-Host ''
Write-Host 'Dotfiles Windows Bootstrap' -ForegroundColor Cyan
Write-Host '==========================' -ForegroundColor Cyan
Write-Host 'This installs the public Dotfiles checkout and your selected native Windows terminal tools.' -ForegroundColor DarkGray
Write-Host 'It does not edit your PowerShell profile, change execution policy, or install the legacy application catalogue.' -ForegroundColor DarkGray

Update-ProcessPath
$git = Ensure-Git
Sync-DotfilesCheckout $git
Set-InstalledRootHidden
Show-LegacyCheckoutNotice
Write-Success "Dotfiles installed runtime ready: $DotfilesDir"

$installTools = Should-ConfigureTools
$installWezTerm = Should-ConfigureWezTerm
if ($installTools) {
    Install-DeveloperTools
}
Install-TerminalConfigs
if ($installWezTerm) { Install-WezTermConfig }

Write-Host ''
Write-Success 'Dotfiles Windows bootstrap completed.'
Write-Host 'Open a new WezTerm window to use Neovim, Yazi, Starship, and the native pane shortcuts.' -ForegroundColor Green
