
<#
.SYNOPSIS
Script de test E2E - GoAI Editor Phase 2A

.DESCRIPTION
Commandes de test E2E Playwright pour valider Board.tsx

.PARAMETER TestType
Type de test à exécuter (all, chromium, firefox, webkit, mobile, debug, ui, headed)

.EXAMPLE
.\run-e2e-tests.ps1
Exécute tous les tests sur tous les navigateurs

.\run-e2e-tests.ps1 -TestType chromium
Exécute tests Chromium uniquement

.\run-e2e-tests.ps1 -TestType debug
Mode DEBUG interactif

#>

param(
    [string]$TestType = "all"
)

# Couleurs
$Green = "Green"
$Blue = "Cyan"
$Yellow = "Yellow"
$Red = "Red"

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Check-Prerequisites {
    Write-Info "Vérification prérequis..."
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Node.js n'est pas installé"
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "npm n'est pas installé"
        exit 1
    }
    
    Write-Success "Node.js et npm OK"
}

function Install-Dependencies {
    Write-Info "Installation dépendances..."
    
    if (-not (Test-Path "node_modules")) {
        npm ci
    }
    
    Write-Success "Dépendances OK"
}

function Install-Browsers {
    Write-Info "Installation navigateurs Playwright..."
    npx playwright install --with-deps
    Write-Success "Navigateurs OK"
}

function Run-Tests {
    param([string]$TestOption)
    
    switch ($TestOption) {
        "all" {
            Write-Info "Exécution : Tous les tests (tous navigateurs)"
            npx playwright test tests/e2e/board.spec.ts
        }
        "chromium" {
            Write-Info "Exécution : Tests Chromium uniquement"
            npx playwright test --project=chromium tests/e2e/board.spec.ts
        }
        "firefox" {
            Write-Info "Exécution : Tests Firefox uniquement"
            npx playwright test --project=firefox tests/e2e/board.spec.ts
        }
        "webkit" {
            Write-Info "Exécution : Tests WebKit (Safari) uniquement"
            npx playwright test --project=webkit tests/e2e/board.spec.ts
        }
        "mobile" {
            Write-Info "Exécution : Tests Mobile uniquement"
            npx playwright test --project="Mobile Chrome" --project="Mobile Safari" tests/e2e/board.spec.ts
        }
        "debug" {
            Write-Info "Exécution : Mode DEBUG (interactive)"
            npx playwright test --debug tests/e2e/board.spec.ts
        }
        "ui" {
            Write-Info "Exécution : Mode UI (Playwright Inspector)"
            npx playwright test --ui tests/e2e/board.spec.ts
        }
        "headed" {
            Write-Info "Exécution : Mode HEADED (voir navigateurs)"
            npx playwright test --headed tests/e2e/board.spec.ts
        }
        default {
            Write-Error-Custom "Option inconnue: $TestOption"
            Print-Usage
            exit 1
        }
    }
}

function Show-Report {
    if (Test-Path "test-results/index.html") {
        Write-Info "Ouverture du rapport HTML..."
        npx playwright show-report test-results
    } else {
        Write-Warning "Rapport HTML non trouvé (aucun test exécuté)"
    }
}

function Clean-Results {
    Write-Info "Nettoyage résultats précédents..."
    
    if (Test-Path "test-results") {
        Remove-Item -Path "test-results" -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path "test-results" -Force | Out-Null
    Write-Success "Nettoyé"
}

function Print-Usage {
    Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║             GoAI Editor - E2E Test Suite                       ║
╚════════════════════════════════════════════════════════════════╝

USAGE: .\run-e2e-tests.ps1 -TestType [option]

OPTIONS:
  all          Tous les tests (tous navigateurs) - DÉFAUT
  chromium     Tests Chromium uniquement
  firefox      Tests Firefox uniquement
  webkit       Tests WebKit (Safari) uniquement
  mobile       Tests Mobile uniquement
  debug        Mode DEBUG (interactive)
  ui           Mode UI (Playwright Inspector)
  headed       Mode HEADED (voir navigateurs)

EXEMPLES:

  # Tous les tests
  .\run-e2e-tests.ps1

  # Tests Chrome uniquement
  .\run-e2e-tests.ps1 -TestType chromium

  # Mode debug interactif
  .\run-e2e-tests.ps1 -TestType debug

  # Mode UI avec inspector
  .\run-e2e-tests.ps1 -TestType ui

RAPPORT:
  Après exécution, rapport disponible à : test-results/index.html
  Commande pour ouvrir : npx playwright show-report test-results

"@
}

# Main execution
function Main {
    Write-Host ""
    
    # Afficher option sélectionnée
    if ($TestType -eq "help" -or $TestType -eq "-h" -or $TestType -eq "--help") {
        Print-Usage
        exit 0
    }
    
    # Pré-checks
    Check-Prerequisites
    Write-Host ""
    
    Install-Dependencies
    Write-Host ""
    
    Install-Browsers
    Write-Host ""
    
    Clean-Results
    Write-Host ""
    
    # Exécuter tests
    Write-Info "Démarrage tests E2E..."
    Write-Host ""
    
    try {
        Run-Tests $TestType
        Write-Host ""
        Write-Success "Tests terminés avec succès ✅"
    } catch {
        Write-Host ""
        Write-Error-Custom "Erreur lors de l'exécution des tests"
        exit 1
    }
    
    Write-Host ""
    Show-Report
    Write-Host ""
    
    Write-Success "Terminé!"
    Write-Host ""
    Write-Host "📊 Résultats disponibles à: test-results/"
    Write-Host "📈 Report HTML: test-results/index.html"
    Write-Host ""
}

# Lancer Main
Main

