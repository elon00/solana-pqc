@echo off
setlocal enabledelayedexpansion

echo 🚀 SOLANA-PQC Complete Deployment (Windows)
echo ==================================
echo.

set "NETWORK=%~1"
if "%NETWORK%"=="" set "NETWORK=devnet"

echo 📋 Configuration:
echo    Network: %NETWORK%
echo    Wallet: VUfEUgFkniFAw2kWGPuDCZZiSGk7zHsAiFhxTewv7GR
echo.

echo ⚙️  Configuring Solana...
"%USERPROFILE%\.local\share\solana\active_release\bin\solana" config set --url %NETWORK%
if errorlevel 1 (
    echo ❌ Failed to configure Solana
    exit /b 1
)

echo.
echo 🔨 Building programs...
if not exist "%USERPROFILE%\.local\share\solana\active_release\bin\anchor" (
    echo ❌ Anchor CLI not found. Please install Anchor CLI first.
    echo    Visit: https://book.anchor-lang.com/getting_started/installation.html
    exit /b 1
)

"%USERPROFILE%\.local\share\solana\active_release\bin\anchor" build
if errorlevel 1 (
    echo ❌ Failed to build programs
    exit /b 1
)

echo.
echo 🌐 Deploying to %NETWORK%...
"%USERPROFILE%\.local\share\solana\active_release\bin\anchor" deploy --provider.cluster %NETWORK%
if errorlevel 1 (
    echo ❌ Failed to deploy programs
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo.
echo 🔗 You can view your programs on Solana Explorer:
echo    https://explorer.solana.com/?cluster=%NETWORK%
echo.
echo 📝 Next steps:
echo    1. Copy the Program IDs from the deployment output above
echo    2. Update your .env file with the new Program IDs
echo    3. Update your frontend configuration if needed
echo.