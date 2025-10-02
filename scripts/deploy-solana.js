#!/usr/bin/env node

/**
 * Automated Solana Program Deployment Script
 * Uses modern deployment tools and APIs for efficient deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SolanaDeploymentAutomation {
    constructor() {
        this.network = process.env.SOLANA_NETWORK || 'devnet';
        this.walletPath = process.env.ANCHOR_WALLET || '~/.config/solana/id.json';
        this.programIds = {};
    }

    async deploy() {
        console.log('🚀 Starting Automated Solana Deployment...');

        try {
            // Step 1: Configure Solana CLI
            await this.configureSolana();

            // Step 2: Fund wallet if needed
            await this.fundWallet();

            // Step 3: Build programs
            await this.buildPrograms();

            // Step 4: Deploy programs
            await this.deployPrograms();

            // Step 5: Update environment
            await this.updateEnvironment();

            // Step 6: Verify deployment
            await this.verifyDeployment();

            console.log('✅ Deployment completed successfully!');
            this.printSuccessInfo();

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async configureSolana() {
        console.log('⚙️ Configuring Solana CLI...');

        const solanaPath = process.platform === 'win32'
            ? '%USERPROFILE%\\.local\\share\\solana\\active_release\\bin\\solana'
            : 'solana';

        execSync(`"${solanaPath}" config set --url ${this.network}`, { stdio: 'inherit' });

        if (!fs.existsSync(this.walletPath.replace('~', process.env.HOME || process.env.USERPROFILE))) {
            console.log('🔑 Generating new wallet...');
            execSync(`"${solanaPath}-keygen" new --no-passphrase`, { stdio: 'inherit' });
        }
    }

    async fundWallet() {
        console.log('💰 Funding wallet...');

        const solanaPath = process.platform === 'win32'
            ? '%USERPROFILE%\\.local\\share\\solana\\active_release\\bin\\solana'
            : 'solana';

        try {
            const balance = execSync(`"${solanaPath}" balance`, { encoding: 'utf8' });
            const currentBalance = parseFloat(balance.split(' ')[0]);

            if (currentBalance < 2) {
                execSync(`"${solanaPath}" airdrop 2`, { stdio: 'inherit' });
            }
        } catch (error) {
            console.log('Note: Airdrop might not be available in production');
        }
    }

    async buildPrograms() {
        console.log('🔨 Building Anchor programs...');

        const anchorPath = process.platform === 'win32'
            ? '%USERPROFILE%\\.local\\share\\solana\\active_release\\bin\\anchor'
            : 'anchor';

        // Check if Anchor CLI is available
        try {
            execSync(`"${anchorPath}" --version`, { stdio: 'pipe' });
        } catch (error) {
            console.log('⚠️ Anchor CLI not found. Please install it first.');
            console.log('Run: npm install -g @project-serum/anchor-cli');
            throw new Error('Anchor CLI not installed');
        }

        execSync(`"${anchorPath}" build`, { stdio: 'inherit' });
    }

    async deployPrograms() {
        console.log(`🌐 Deploying to ${this.network}...`);

        const anchorPath = process.platform === 'win32'
            ? 'C:\\Users\\mahas\\AppData\\Roaming\\npm\\anchor.cmd'
            : process.env.HOME + '/.npm-global/bin/anchor';

        const result = execSync(`"${anchorPath}" deploy --provider.cluster ${this.network}`, { encoding: 'utf8' });

        // Extract program IDs from deployment output
        this.extractProgramIds(result);
    }

    extractProgramIds(deployOutput) {
        console.log('📋 Extracting program IDs...');

        const lines = deployOutput.split('\n');
        let currentProgram = '';

        for (const line of lines) {
            if (line.includes('Deploying program')) {
                currentProgram = line.match(/Deploying program "([^"]+)"/)?.[1];
            }

            if (line.includes('Program Id:') && currentProgram) {
                const programId = line.split('Program Id:')[1]?.trim();
                if (programId) {
                    this.programIds[currentProgram] = programId;
                    console.log(`✅ ${currentProgram}: ${programId}`);
                }
            }
        }
    }

    async updateEnvironment() {
        console.log('🔧 Updating environment configuration...');

        const envPath = '.env';
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add program IDs
        for (const [programName, programId] of Object.entries(this.programIds)) {
            const envVar = `${programName.toUpperCase()}_PROGRAM_ID`;
            const regex = new RegExp(`${envVar}=.*`, 'g');

            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${envVar}=${programId}`);
            } else {
                envContent += `\n${envVar}=${programId}`;
            }
        }

        // Add network configuration
        envContent += `\nSOLANA_NETWORK=${this.network}`;
        envContent += `\nVITE_SOLANA_NETWORK=${this.network}`;

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Environment updated');
    }

    async verifyDeployment() {
        console.log('🔍 Verifying deployment...');

        const solanaPath = process.platform === 'win32'
            ? '%USERPROFILE%\\.local\\share\\solana\\active_release\\bin\\solana'
            : 'solana';

        for (const [programName, programId] of Object.entries(this.programIds)) {
            try {
                execSync(`"${solanaPath}" program show ${programId}`, { stdio: 'pipe' });
                console.log(`✅ ${programName} verified on-chain`);
            } catch (error) {
                console.log(`⚠️ Could not verify ${programName}`);
            }
        }
    }

    printSuccessInfo() {
        console.log('\n🎉 Deployment Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Network: ${this.network}`);
        console.log(`Wallet: ${this.walletPath}`);

        for (const [programName, programId] of Object.entries(this.programIds)) {
            console.log(`${programName}: ${programId}`);
            console.log(`Explorer: https://explorer.solana.com/address/${programId}?cluster=${this.network}`);
        }

        console.log('\n🚀 Next Steps:');
        console.log('1. Update your frontend .env file with the program IDs');
        console.log('2. Test your application');
        console.log('3. Deploy frontend to Vercel/Netlify');
        console.log('4. Monitor program performance');
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new SolanaDeploymentAutomation();
    deployment.deploy().catch(console.error);
}

module.exports = SolanaDeploymentAutomation;