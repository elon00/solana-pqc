$ErrorActionPreference = "Stop"
Write-Host "Starting SCSTOBCMinority AI full stack on Solana Testnet..."
docker compose -f docker-compose.testnet.yml up --build
