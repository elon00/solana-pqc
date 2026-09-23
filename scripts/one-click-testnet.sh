#!/usr/bin/env sh
set -eu

echo "Starting SCSTOBCMinority AI full stack on Solana Testnet..."
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:8080/scstobcminority-ai/"
docker compose -f docker-compose.testnet.yml up --build
