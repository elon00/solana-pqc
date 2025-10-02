use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("QCust1111111111111111111111111111111111111");

#[program]
pub mod quantum_custody {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, authority)
    }

    pub fn create_vault(
        ctx: Context<CreateVault>,
        algorithm: u8,
        public_key: Vec<u8>,
    ) -> Result<()> {
        instructions::create_vault::handler(ctx, algorithm, public_key)
    }

    pub fn sign_transaction(
        ctx: Context<SignTransaction>,
        message: Vec<u8>,
        signature: Vec<u8>,
    ) -> Result<()> {
        instructions::sign_transaction::handler(ctx, message, signature)
    }

    pub fn rotate_keys(
        ctx: Context<RotateKeys>,
        new_public_key: Vec<u8>,
        signature: Vec<u8>,
    ) -> Result<()> {
        instructions::rotate_keys::handler(ctx, new_public_key, signature)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + state::GlobalState::SPACE,
        seeds = [b"global"],
        bump
    )]
    pub global_state: Account<'info, state::GlobalState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + state::QuantumVault::SPACE,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, state::QuantumVault>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignTransaction<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault: Account<'info, state::QuantumVault>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RotateKeys<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault: Account<'info, state::QuantumVault>,
    
    pub owner: Signer<'info>,
}
