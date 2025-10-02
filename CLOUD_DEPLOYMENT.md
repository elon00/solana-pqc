# 🚀 Modern Cloud Deployment Guide

This guide explains how to deploy your Solana PQC application using modern cloud-based tools and services, avoiding local environment setup issues.

## 🎯 Quick Start

### Option 1: GitHub Actions (Recommended)

1. **Set up GitHub Secrets:**
   ```bash
   # Go to your repository Settings > Secrets and variables > Actions
   # Add these secrets:

   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_vercel_org_id
   VERCEL_PROJECT_ID=your_vercel_project_id
   RAILWAY_TOKEN=your_railway_token
   DOCKER_USERNAME=your_docker_hub_username
   DOCKER_PASSWORD=your_docker_hub_password
   ```

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Configure modern cloud deployment"
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to Actions tab in your GitHub repository
   - Watch the "Complete Deployment Pipeline" workflow

### Option 2: Manual Deployment

```bash
# Deploy everything at once
chmod +x scripts/deploy-cloud.sh
./scripts/deploy-cloud.sh --network devnet

# Or deploy specific components
./scripts/deploy-solana.js
```

## 🛠️ Deployment Options

### 1. Vercel (Frontend)

**Best for:** Static frontend deployment with automatic HTTPS and global CDN.

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd app
vercel --prod
```

**Features:**
- ✅ Automatic builds on git push
- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Custom domains

### 2. Railway (Full-Stack)

**Best for:** Full-stack applications with databases and background jobs.

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway deploy
```

**Features:**
- ✅ Automatic Docker builds
- ✅ Database provisioning
- ✅ Environment management
- ✅ Horizontal scaling
- ✅ Custom domains

### 3. Docker (Containerized)

**Best for:** Consistent deployment across environments.

```bash
# Build image
docker build -t solana-pqc .

# Run locally
docker run -p 3000:80 solana-pqc

# Push to registry
docker tag solana-pqc your-registry/solana-pqc
docker push your-registry/solana-pqc
```

### 4. GitHub Actions (CI/CD)

**Best for:** Automated deployment pipelines with testing.

**Features:**
- ✅ Automated testing
- ✅ Multi-environment deployment
- ✅ Rollback capabilities
- ✅ Integration notifications
- ✅ Secret management

## 🔧 Configuration Files

### `.github/workflows/ci.yml`
Complete CI/CD pipeline that:
- Deploys frontend to Vercel
- Builds and deploys Solana programs
- Creates Docker images
- Deploys to Railway
- Sends notifications

### `Dockerfile`
Multi-stage build for optimal image size:
- Development stage with hot reload
- Production stage with nginx
- Frontend asset optimization

### `vercel.json`
Vercel-specific configuration:
- Build settings
- Routing rules
- Header configuration
- API routes

### `railway.toml`
Railway deployment configuration:
- Service definitions
- Environment variables
- Port configurations
- Database connections

## 🌐 Environment Management

### Development
```bash
cp .env.example .env.local
# Edit .env.local with your local settings
```

### Production
```bash
cp .env.production .env
# Edit .env with production values
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_NETWORK` | Solana cluster | `devnet`, `testnet`, `mainnet-beta` |
| `VITE_PROGRAM_ID` | Quantum custody program ID | `QCust...` |
| `VITE_TOKEN_PROGRAM_ID` | Token program ID | `SPQC...` |
| `DATABASE_URL` | Database connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |

## 🔍 Monitoring & Debugging

### Vercel Dashboard
- **URL:** `https://vercel.com/your-team`
- **Features:** Real-time logs, performance metrics, error tracking

### Railway Dashboard
- **URL:** `https://railway.app/project/your-project`
- **Features:** Service monitoring, logs, database management

### Solana Explorer
- **Devnet:** `https://explorer.solana.com/?cluster=devnet`
- **Mainnet:** `https://explorer.solana.com/?cluster=mainnet`

### Program Logs
```bash
# Check program logs
solana logs --url devnet

# Check specific program
solana program show YOUR_PROGRAM_ID
```

## 🚨 Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm install
npm run build
```

**2. Deployment Timeouts**
```bash
# Increase timeout in vercel.json
{
  "functions": {
    "app/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

**3. Environment Variables Not Loading**
```bash
# Check if variables are set
railway variables
vercel env ls
```

**4. Solana Program Deployment Issues**
```bash
# Check wallet balance
solana balance

# Request airdrop if needed
solana airdrop 2

# Check program logs
solana program show YOUR_PROGRAM_ID
```

## 📊 Performance Optimization

### Frontend
- Enable gzip compression in `vercel.json`
- Use CDN for static assets
- Implement code splitting
- Optimize images

### Backend
- Use connection pooling for databases
- Implement caching strategies
- Monitor resource usage
- Scale horizontally when needed

### Solana Programs
- Optimize compute unit usage
- Batch transactions when possible
- Use program-derived addresses efficiently
- Monitor account rent exemption

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to code
   - Use different secrets per environment
   - Rotate secrets regularly

2. **Access Control**
   - Implement proper authentication
   - Use rate limiting
   - Monitor for suspicious activity

3. **Data Protection**
   - Encrypt sensitive data
   - Use secure communication (HTTPS/TLS)
   - Implement proper input validation

## 🎯 Next Steps

1. **Set up monitoring** with services like Sentry or LogRocket
2. **Configure custom domains** for production
3. **Set up database backups** for data safety
4. **Implement automated testing** in CI/CD pipeline
5. **Configure alerting** for critical issues

## 📞 Support

For deployment issues:
- Check service dashboards first
- Review GitHub Actions logs
- Check application logs
- Verify environment variables

---

**Happy Deploying! 🚀**