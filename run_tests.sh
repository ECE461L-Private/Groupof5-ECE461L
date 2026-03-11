#!/bin/bash
# Run all backend and frontend tests from the project root

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  Running Backend Tests (pytest)"
echo "========================================="
cd "$ROOT_DIR/src/backend"
source venv/bin/activate
python -m pytest -v
deactivate

echo ""
echo "========================================="
echo "  Running Frontend Tests (vitest)"
echo "========================================="
cd "$ROOT_DIR/src/frontend"
npx vitest run

echo ""
echo "========================================="
echo "  ✅ All tests passed!"
echo "========================================="
