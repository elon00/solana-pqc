use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn, Transfer};

declare_id!("SPQC1111111111111111111111111111111111111");

pub const TOTAL_SUPPLY: u64 = 2_100_000_000_000_000;
pub const DECIMALS: u8 = 9;

#[program]
pub mod solana_pqc_token {
    use super::*;

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        token_info.authority = ctx.accounts.authority.key();
        token_info.mint = ctx.accounts.mint.key();
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.uri = uri;
        token_info.total_supply = TOTAL_SUPPLY;
        token_info.circulating_supply = 0;
        token_info.decimals = DECIMALS;
        token_info.is_paused = false;
        token_info.is_quantum_secured = true;
        token_info.created_at = Clock::get()?.unix_timestamp;
        token_info.bump = ctx.bumps.token_info;

        emit!(TokenInitializedEvent {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            total_supply: TOTAL_SUPPLY,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        require!(!token_info.is_paused, TokenError::TokenPaused);
        require!(
            token_info.circulating_supply.checked_add(amount).unwrap() <= TOTAL_SUPPLY,
            TokenError::ExceedsTotalSupply
        );

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        token_info.circulating_supply = token_info.circulating_supply.checked_add(amount).unwrap();

        emit!(TokenMintedEvent {
            mint: ctx.accounts.mint.key(),
            recipient: ctx.accounts.destination.key(),
            amount,
            circulating_supply: token_info.circulating_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn transfer_quantum_safe(
        ctx: Context<TransferQuantumSafe>,
        amount: u64,
        quantum_signature: Vec<u8>,
    ) -> Result<()> {
        let token_info = &ctx.accounts.token_info;
        
        require!(!token_info.is_paused, TokenError::TokenPaused);
        require!(token_info.is_quantum_secured, TokenError::QuantumSecurityRequired);
        require!(quantum_signature.len() >= 32, TokenError::InvalidQuantumSignature);

        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(QuantumTransferEvent {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to.key(),
            amount,
            quantum_secured: true,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        require!(!token_info.is_paused, TokenError::TokenPaused);

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        token_info.circulating_supply = token_info.circulating_supply.saturating_sub(amount);

        emit!(TokenBurnedEvent {
            mint: ctx.accounts.mint.key(),
            from: ctx.accounts.from.key(),
            amount,
            circulating_supply: token_info.circulating_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = DECIMALS,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenInfo::SPACE,
        seeds = [b"token-info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"token-info", mint.key().as_ref()],
        bump = token_info.bump,
        has_one = authority,
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferQuantumSafe<'info> {
    #[account(
        seeds = [b"token-info", token_info.mint.as_ref()],
        bump = token_info.bump,
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"token-info", mint.key().as_ref()],
        bump = token_info.bump,
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TokenInfo {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub decimals: u8,
    pub is_paused: bool,
    pub is_quantum_secured: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl TokenInfo {
    pub const SPACE: usize = 32 + 32 + 64 + 16 + 256 + 8 + 8 + 1 + 1 + 1 + 8 + 1;
}

#[error_code]
pub enum TokenError {
    #[msg("Token transfers are currently paused")]
    TokenPaused,
    
    #[msg("Amount exceeds total supply")]
    ExceedsTotalSupply,
    
    #[msg("Quantum security verification required")]
    QuantumSecurityRequired,
    
    #[msg("Invalid quantum signature")]
    InvalidQuantumSignature,
}

#[event]
pub struct TokenInitializedEvent {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokenMintedEvent {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct QuantumTransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub quantum_secured: bool,
    pub timestamp: i64,
}

#[event]
pub struct TokenBurnedEvent {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}
