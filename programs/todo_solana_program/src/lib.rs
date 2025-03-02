use anchor_lang::prelude::*;

declare_id!("ETwb2Fvp1FXCdky5homxbpBAh6kfsTFkW9dYNchy6ASY");

#[program]
pub mod todo_solana_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
