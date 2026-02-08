#!/bin/bash

#######################################################################
# SCRIPT DE TEST E2E - GoAI Editor Phase 2A
# 
# Commandes de test E2E Playwright pour valider Board.tsx
# 
# Usage: bash run-e2e-tests.sh [option]
#######################################################################

set -e

echo "=================================="
echo "🧪 GoAI Editor - E2E Test Suite"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Options
TEST_TYPE=${1:-"all"}

# Fonctions
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Vérifications préalables
check_prerequisites() {
  print_info "Vérification prérequis..."
  
  if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
  fi
  
  print_success "Node.js et npm OK"
}

# Installation dépendances
install_dependencies() {
  print_info "Installation dépendances..."
  
  if [ ! -d "node_modules" ]; then
    npm ci
  fi
  
  if ! npm list @playwright/test > /dev/null 2>&1; then
    print_warning "Playwright non trouvé, installation..."
    npm install @playwright/test
  fi
  
  print_success "Dépendances OK"
}

# Installation navigateurs Playwright
install_browsers() {
  print_info "Vérification navigateurs Playwright..."
  npx playwright install --with-deps
  print_success "Navigateurs OK"
}

# Tests E2E
run_tests() {
  local test_option=$1
  
  case $test_option in
    "all")
      print_info "Exécution : Tous les tests (tous navigateurs)"
      npx playwright test tests/e2e/board.spec.ts
      ;;
    
    "chromium")
      print_info "Exécution : Tests Chromium uniquement"
      npx playwright test --project=chromium tests/e2e/board.spec.ts
      ;;
    
    "firefox")
      print_info "Exécution : Tests Firefox uniquement"
      npx playwright test --project=firefox tests/e2e/board.spec.ts
      ;;
    
    "webkit")
      print_info "Exécution : Tests WebKit (Safari) uniquement"
      npx playwright test --project=webkit tests/e2e/board.spec.ts
      ;;
    
    "mobile")
      print_info "Exécution : Tests Mobile uniquement"
      npx playwright test --project="Mobile Chrome" --project="Mobile Safari" tests/e2e/board.spec.ts
      ;;
    
    "debug")
      print_info "Exécution : Mode DEBUG (interactive)"
      npx playwright test --debug tests/e2e/board.spec.ts
      ;;
    
    "ui")
      print_info "Exécution : Mode UI (Playwright Inspector)"
      npx playwright test --ui tests/e2e/board.spec.ts
      ;;
    
    "headed")
      print_info "Exécution : Mode HEADED (voir navigateurs)"
      npx playwright test --headed tests/e2e/board.spec.ts
      ;;
    
    *)
      print_error "Option inconnue: $test_option"
      print_usage
      exit 1
      ;;
  esac
}

# Affichage du rapport
show_report() {
  if [ -f "test-results/index.html" ]; then
    print_info "Ouverture du rapport HTML..."
    npx playwright show-report test-results
  else
    print_warning "Rapport HTML non trouvé (aucun test exécuté)"
  fi
}

# Nettoyage résultats
clean_results() {
  print_info "Nettoyage résultats précédents..."
  rm -rf test-results/
  mkdir -p test-results
  print_success "Nettoyé"
}

# Affichage aide
print_usage() {
  cat <<EOF

USAGE: $0 [option]

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
  $0

  # Tests Chrome uniquement
  $0 chromium

  # Mode debug interactif
  $0 debug

  # Mode UI avec inspector
  $0 ui

RAPPORT:
  Après exécution, rapport disponible à : test-results/index.html
  Commande pour ouvrir : npx playwright show-report test-results

EOF
}

# Main execution
main() {
  echo ""
  
  # Afficher option sélectionnée
  case $TEST_TYPE in
    "help"|"-h"|"--help")
      print_usage
      exit 0
      ;;
  esac
  
  # Pré-checks
  check_prerequisites
  echo ""
  
  install_dependencies
  echo ""
  
  install_browsers
  echo ""
  
  clean_results
  echo ""
  
  # Exécuter tests
  print_info "Démarrage tests E2E..."
  echo ""
  
  if run_tests "$TEST_TYPE"; then
    echo ""
    print_success "Tests terminés avec succès ✅"
  else
    echo ""
    print_error "Erreur lors de l'exécution des tests"
    exit 1
  fi
  
  echo ""
  show_report
  echo ""
  
  print_success "Terminé!"
  echo ""
  echo "📊 Résultats disponibles à: test-results/"
  echo "📈 Report HTML: test-results/index.html"
  echo ""
}

# Lancer main
main

