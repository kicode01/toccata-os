# ==============================================================================
# Toccata OS - Automated Foundation Installer
# Downloads and prepares the clean Arch Linux engine (SteamOS base) for Tier 2 execution.
# ==============================================================================

param (
    [string]$TargetDir = "$PSScriptRoot\..\foundation\ArchEngine"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Toccata OS - Fetching Arch Linux & SteamOS Base Engine             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create foundation directory
if (-not (Test-Path $TargetDir)) {
    Write-Host "[1/3] Creating foundation directory at $TargetDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
} else {
    Write-Host "[1/3] Foundation directory exists at $TargetDir." -ForegroundColor Green
}

# 2. Fetch Latest ArchWSL Release metadata
Write-Host "[2/3] Resolving latest Arch Linux base release from GitHub..." -ForegroundColor Yellow
$ApiUrl = "https://api.github.com/repos/yuk7/ArchWSL/releases/latest"
$Release = Invoke-RestMethod -Uri $ApiUrl
$Asset = $Release.assets | Where-Object { $_.name -eq "Arch.zip" } | Select-Object -First 1

if (-not $Asset) {
    Write-Host "Error: Could not locate Arch.zip asset in release." -ForegroundColor Red
    exit 1
}

$ZipPath = Join-Path $TargetDir "Arch.zip"
Write-Host "Found Arch Base v$($Release.tag_name) ($([math]::Round($Asset.size / 1MB, 1)) MB)" -ForegroundColor Green

# 3. Download if not already present
if (-not (Test-Path $ZipPath) -and -not (Test-Path (Join-Path $TargetDir "Arch.exe"))) {
    Write-Host "[3/3] Downloading clean Arch Linux foundation..." -ForegroundColor Yellow
    Write-Host "Source: $($Asset.browser_download_url)" -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $Asset.browser_download_url -OutFile $ZipPath
    Write-Host "Extracting Arch.zip..." -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath $TargetDir -Force
    Remove-Item -Path $ZipPath -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
} else {
    Write-Host "[3/3] Arch Linux foundation is already downloaded and ready in $TargetDir." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   Foundation Downloaded Successfully!                                " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Files available in ${TargetDir}:" -ForegroundColor Cyan
Get-ChildItem -Path $TargetDir | Select-Object Name, Length | Format-Table -AutoSize
Write-Host "Next Step:" -ForegroundColor Yellow
Write-Host "  1. Ensure WSL is enabled on Windows (run 'wsl --install' in an Admin Terminal if not done yet)."
Write-Host "  2. Double-click '$TargetDir\Arch.exe' to register the Toccata OS Arch engine!"
Write-Host ""
