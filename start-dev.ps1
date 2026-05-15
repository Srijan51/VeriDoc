param(
    [switch]$DryRun
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$pythonExe = Join-Path $repoRoot "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

$backendCommand = "cd /d `"$backendDir`" && `"$pythonExe`" run.py"
$frontendCommand = "cd /d `"$frontendDir`" && npm run dev"

if ($DryRun) {
    Write-Host "Backend:  $backendCommand"
    Write-Host "Frontend: $frontendCommand"
    exit 0
}

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $backendCommand
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $frontendCommand

Write-Host "Started backend at http://localhost:8000 and frontend at http://localhost:3000."