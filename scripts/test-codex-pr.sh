#!/usr/bin/env bash
set -euo pipefail

# CONFIG: numero PR o filtri automatici
PR_NUMBER="${1:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Errore: GitHub CLI (gh) non installato"; exit 1
fi

# Prendi l'ultima PR aperta da Codex se non hai passato un numero
if [[ -z "$PR_NUMBER" ]]; then
  echo "Nessun numero PR passato: cerco l'ultima PR aperta da Codex…"
  # Filtra le PR aperte, ordina per aggiornamento e prendi la prima
  PR_NUMBER=$(gh pr list --state open --json number,author,updatedAt \
    --jq '[.[] | select(.author.login | test("codex|openai|chatgpt"; "i"))] | sort_by(.updatedAt) | reverse | .[0].number' \
    || true)
fi

if [[ -z "$PR_NUMBER" || "$PR_NUMBER" == "null" ]]; then
  echo "Nessuna PR aperta trovata (autore Codex). Esci."; exit 1
fi

echo "→ Checkout PR #$PR_NUMBER"
git fetch origin
gh pr checkout "$PR_NUMBER"

echo "→ Installa dipendenze"
npm ci || npm i

# Se hai Supabase locale e vuoi test DB/migrazioni/seed
if command -v supabase >/dev/null 2>&1; then
  echo "→ Avvio Supabase locale (se non già attivo)"
  supabase status >/dev/null 2>&1 || supabase start

  if [[ -d "supabase/migrations" ]]; then
    echo "→ Applico migrazioni locali"
    supabase db reset --no-interaction || supabase db push
  fi

  if [[ -f "supabase/seed.sql" ]]; then
    echo "→ Applico seed"
    supabase db seed
  fi
fi

echo "→ Build / Test"
if npm run -s test >/dev/null 2>&1; then
  npm run test
fi
if npm run -s build >/dev/null 2>&1; then
  npm run build
fi

echo
echo "✅ PR #$PR_NUMBER pronta da provare con 'npm run dev'"
echo "   Quando sei soddisfatto, puoi fare merge direttamente:"
echo "   gh pr merge $PR_NUMBER --merge"
