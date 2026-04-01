#!/bin/bash
# Run all backend and frontend tests from the project root

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  Running Backend Tests with Coverage"
echo "========================================="
cd "$ROOT_DIR/src/backend"
source venv/bin/activate
python -m pytest
deactivate

echo ""
echo "========================================="
echo "  Running Frontend Tests with Coverage"
echo "========================================="
cd "$ROOT_DIR/src/frontend"
npm run test:coverage

echo ""
echo "========================================="
echo "  ✅ All tests passed!"
echo "========================================="
