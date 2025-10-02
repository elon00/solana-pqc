#!/bin/bash

# Modern Cloud Deployment Script for Solana PQC
# This script automates deployment across multiple cloud platforms

set -e

echo "🚀 Modern Cloud Deployment for Solana PQC"
echo "=========================================="

# Configuration
NETWORK=${1:-devnet}
FRONTEND_DIR="app"
BUILD_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found. Docker deployment will be skipped."
    fi

    log_success "Prerequisites check completed"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying frontend to Vercel..."

    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    fi

    cd $FRONTEND_DIR

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $FRONTEND_DIR"
        exit 1
    fi

    log_info "Building frontend..."
    npm run build

    log_info "Deploying to Vercel..."
    vercel --prod --yes

    cd ..
    log_success "Frontend deployed to Vercel"
}

# Deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway..."

    if ! command -v railway &> /dev/null; then
        log_info "Installing Railway CLI..."
        npm install -g @railway/cli
    fi

    log_info "Deploying with Railway..."
    railway login --token $RAILWAY_TOKEN
    railway deploy

    log_success "Application deployed to Railway"
}

# Deploy Solana programs
deploy_solana_programs() {
    log_info "Deploying Solana programs..."

    if ! command -v anchor &> /dev/null; then
        log_info "Installing Anchor CLI..."
        npm install -g @project-serum/anchor-cli
    fi

    log_info "Building Anchor programs..."
    anchor build

    log_info "Deploying to $NETWORK..."
    anchor deploy --provider.cluster $NETWORK

    log_success "Solana programs deployed"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."

    if [ -f "Dockerfile" ]; then
        docker build -t solana-pqc:latest .
        log_success "Docker image built"
    else
        log_warning "Dockerfile not found. Skipping Docker build."
    fi
}

# Main deployment flow
main() {
    check_prerequisites

    log_info "Starting deployment process..."

    # Deploy frontend to Vercel
    deploy_to_vercel

    # Deploy Solana programs
    deploy_solana_programs

    # Build Docker image (optional)
    if [ "$SKIP_DOCKER" != "true" ]; then
        build_docker_image
    fi

    # Deploy to Railway (if token is provided)
    if [ ! -z "$RAILWAY_TOKEN" ]; then
        deploy_to_railway
    fi

    log_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Your Solana PQC application is now deployed!"
    echo ""
    echo "Next steps:"
    echo "1. Set up your environment variables in the deployed services"
    echo "2. Update your program IDs in the frontend configuration"
    echo "3. Test your application"
    echo "4. Monitor deployment status"
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --skip-docker)
            SKIP_DOCKER="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --network NETWORK    Solana network (devnet, testnet, mainnet)"
            echo "  --skip-docker        Skip Docker image building"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  RAILWAY_TOKEN        Railway authentication token"
            echo "  VERCEL_TOKEN         Vercel authentication token"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run deployment
main