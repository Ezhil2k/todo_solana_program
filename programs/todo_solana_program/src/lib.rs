use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("hS4TFJW9MdMsCS3c7QWfvjfjEJBnm1pc6wfVAiBnzar");

#[program]
pub mod todo_solana_program {
    use super::*;

    pub fn create_todo(
        ctx: Context<CreateTodo>,
        task_id: u64,
        description: String,
        due_date: i64,
    ) -> Result<()> {
        // Validate description length
        require!(
            description.len() <= 280,
            TodoError::DescriptionTooLong
        );

        // Initialize the todo account
        let todo = &mut ctx.accounts.todo;
        todo.task_id = task_id;
        todo.description = description;
        todo.completed = false;
        todo.due_date = due_date;
        todo.owner = ctx.accounts.owner.key();

        msg!("Created a new todo with ID: {}", task_id);
        Ok(())
    }

    pub fn update_description(
        
        ctx: Context<UpdateTodo>,
        description: String,
    ) -> Result<()> {
        // Validate description length
        require!(
            description.len() <= 280,
            TodoError::DescriptionTooLong
        );

        // Update the description
        let todo = &mut ctx.accounts.todo;
        todo.description = description;

        msg!("Updated description for todo ID: {}", todo.task_id);
        Ok(())
    }

    pub fn toggle_completed(ctx: Context<UpdateTodo>) -> Result<()> {
        // Toggle the completed status
        let todo = &mut ctx.accounts.todo;
        todo.completed = !todo.completed;

        let status = if todo.completed { "completed" } else { "incomplete" };
        msg!("Marked todo ID: {} as {}", todo.task_id, status);
        Ok(())
    }

    pub fn delete_todo(ctx: Context<DeleteTodo>) -> Result<()> {
        msg!("Deleted todo ID: {}", ctx.accounts.todo.task_id);
        // The account will be closed and lamports returned to the owner
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct CreateTodo<'info> {
    #[account(
        init,
        payer = owner,
        space = TodoAccount::LEN,
        seeds = [b"todo", owner.key().as_ref(), task_id.to_le_bytes().as_ref()],
        bump
    )]
    pub todo: Account<'info, TodoAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTodo<'info> {
    #[account(
        mut,
        seeds = [b"todo", owner.key().as_ref(), todo.task_id.to_le_bytes().as_ref()],
        bump,
        has_one = owner @ TodoError::Unauthorized
    )]
    pub todo: Account<'info, TodoAccount>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteTodo<'info> {
    #[account(
        mut,
        seeds = [b"todo", owner.key().as_ref(), todo.task_id.to_le_bytes().as_ref()],
        bump,
        has_one = owner @ TodoError::Unauthorized,
        close = owner
    )]
    pub todo: Account<'info, TodoAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct TodoAccount {
    pub task_id: u64,
    pub description: String,
    pub completed: bool,
    pub due_date: i64, // Unix timestamp
    pub owner: Pubkey,
}

impl TodoAccount {
    // Calculate the space required for the account
    pub const LEN: usize = 8 + // discriminator
        8 + // task_id
        4 + 280 + // description (4 bytes for the string length + max 280 chars)
        1 + // completed
        8 + // due_date
        32; // owner
}

#[error_code]
pub enum TodoError {
    #[msg("Description must be 280 characters or less")]
    DescriptionTooLong,
    #[msg("Only the owner can modify this todo")]
    Unauthorized,
}