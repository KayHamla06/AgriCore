# ============================================
# AgriCore — Deployment & Rollback (PowerShell)
# ============================================

param(
    [Parameter(Position=0)]
    [ValidateSet('tag', 'deploy', 'rollback', 'releases')]
    [string]$Action,

    [Parameter(Position=1)]
    [string]$Version
)

function Tag-Release {
    param([string]$Ver)
    if (-not $Ver) {
        Write-Host "Usage: .\deploy.ps1 tag <version>" -ForegroundColor Red
        return
    }
    git tag -a $Ver -m "Release $Ver"
    git push origin $Ver
    Write-Host "Tagged and pushed release: $Ver" -ForegroundColor Green
}

function Start-Deploy {
    Write-Host "Running pre-deploy checks..." -ForegroundColor Cyan

    # 1. Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "ERROR: Uncommitted changes detected. Commit or stash first." -ForegroundColor Red
        return
    }

    # 2. Run tests
    Write-Host "Running tests..."
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Tests failed. Aborting deployment." -ForegroundColor Red
        return
    }

    # 3. Build
    Write-Host "Building..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed. Aborting deployment." -ForegroundColor Red
        return
    }

    Write-Host "Pre-deploy checks passed. Ready to push." -ForegroundColor Green
    Write-Host "Run: git push origin main"
}

function Start-Rollback {
    param([string]$Ver)
    if (-not $Ver) {
        Write-Host "Usage: .\deploy.ps1 rollback <version>" -ForegroundColor Red
        Write-Host "Available tags:"
        git tag --sort=-creatordate | Select-Object -First 10
        return
    }

    Write-Host "Rolling back to $Ver..." -ForegroundColor Yellow
    git checkout $Ver
    npm install
    npm run build
    Write-Host "Rolled back to $Ver" -ForegroundColor Green
    Write-Host "To make permanent: git checkout -b hotfix/$Ver"
}

function Show-Releases {
    Write-Host "Recent releases:" -ForegroundColor Cyan
    git tag --sort=-creatordate | Select-Object -First 20
}

switch ($Action) {
    'tag'      { Tag-Release -Ver $Version }
    'deploy'   { Start-Deploy }
    'rollback' { Start-Rollback -Ver $Version }
    'releases' { Show-Releases }
    default {
        Write-Host "AgriCore Deploy Script" -ForegroundColor Cyan
        Write-Host "Usage:"
        Write-Host "  .\deploy.ps1 tag <version>    - Tag a release"
        Write-Host "  .\deploy.ps1 deploy           - Run pre-deploy checks"
        Write-Host "  .\deploy.ps1 rollback <ver>   - Rollback to version"
        Write-Host "  .\deploy.ps1 releases         - List recent releases"
    }
}
