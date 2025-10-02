use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler(ctx: Context<crate::Initialize>, authority: Pubkey) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    
    global_state.authority = authority;
    global_state.total_vaults = 0;
    global_state.total_transactions = 0;
    global_state.bump = ctx.bumps.global_state;
    
    emit!(ProgramInitializedEvent {
        authority,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

#[event]
pub struct ProgramInitializedEvent {
    pub authority: Pubkey,
    pub timestamp: i64,
}
