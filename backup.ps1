# ==========================================================
# CampuSentry Safe Project Backup Script for PowerShell
# ==========================================================
$ErrorActionPreference = "SilentlyContinue"

$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }

$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "OneDrive\Desktop")
if (-not (Test-Path $DesktopPath)) {
    $DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
}

$ZipDestination = Join-Path $DesktopPath "CampuSentry_Current_Backup.zip"

Write-Host ">>> Creating CampuSentry Project Backup..." -ForegroundColor Cyan

# Use python backup script if virtualenv is available, or built-in safe zip
$PythonExe = Join-Path $ProjectRoot "backend\venv\Scripts\python.exe"
if (Test-Path $PythonExe) {
    & $PythonExe (Join-Path $ProjectRoot "backup_project.py") $ZipDestination
} else {
    python (Join-Path $ProjectRoot "backup_project.py") $ZipDestination
}
