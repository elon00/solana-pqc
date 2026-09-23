@echo off
setlocal

echo SCSTOBCMinority AI - local Solana Testnet deploy helper

set "NETWORK=%~1"
if "%NETWORK%"=="" set "NETWORK=testnet"
if /I not "%NETWORK%"=="testnet" (
  echo Refusing network "%NETWORK%". This helper is Testnet-only; Mainnet is release-gated.
  exit /b 1
)

where solana >nul 2>nul
if errorlevel 1 (
  echo solana CLI is required.
  exit /b 1
)

where anchor >nul 2>nul
if errorlevel 1 (
  echo Anchor CLI 0.29.x is required.
  exit /b 1
)

solana config set --url https://api.testnet.solana.com
if errorlevel 1 exit /b 1

solana address
solana balance --url https://api.testnet.solana.com

anchor build
if errorlevel 1 exit /b 1
anchor keys sync
if errorlevel 1 exit /b 1
anchor build
if errorlevel 1 exit /b 1
anchor deploy --provider.cluster testnet
if errorlevel 1 exit /b 1

echo Deployment command completed. Verify executable program accounts on Testnet before claiming success.
echo Initialize only after verification:
echo set ANCHOR_PROVIDER_URL=https://api.testnet.solana.com
echo node scripts\initialize-testnet.mjs
