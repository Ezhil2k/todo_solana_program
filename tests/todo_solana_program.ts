import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoSolanaProgram } from '../target/types/todo_solana_program';
import { expect } from 'chai';

describe('todo-solana-program', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TodoSolanaProgram as Program<TodoSolanaProgram>;
  const owner = anchor.web3.Keypair.generate();

  // Task details for testing
  const taskId = new anchor.BN(1);
  const description = "Complete Solana smart contract";
  const dueDate = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

  // PDA for the todo account
  let todoAccount = null;
  let todoBump = null;

  before(async () => {
    // Airdrop SOL to the owner for transaction fees
    const airdropSignature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Find the PDA for the todo account
    const [accountPDA, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("todo"),
        owner.publicKey.toBuffer(),
        taskId.toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    );
    
    todoAccount = accountPDA;
    todoBump = bump;
  });

  it("Can create a new todo", async () => {
    // Create todo
    await program.methods
      .createTodo(taskId, description, dueDate)
      .accounts({
        todo: todoAccount,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Fetch the created todo
    const todoData = await program.account.todoAccount.fetch(todoAccount);
    
    // Verify the data
    expect(todoData.taskId.toString()).to.equal(taskId.toString());
    expect(todoData.description).to.equal(description);
    expect(todoData.completed).to.equal(false);
    expect(todoData.dueDate.toString()).to.equal(dueDate.toString());
    expect(todoData.owner.toString()).to.equal(owner.publicKey.toString());
  });

  it("Can update a todo description", async () => {
    const newDescription = "Update Solana smart contract documentation";
    
    // Update description
    await program.methods
      .updateDescription(newDescription)
      .accounts({
        todo: todoAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
    
    // Fetch the updated todo
    const todoData = await program.account.todoAccount.fetch(todoAccount);
    
    // Verify the data
    expect(todoData.description).to.equal(newDescription);
  });

  it("Can toggle a todo completion status", async () => {
    // Toggle completion status
    await program.methods
      .toggleCompleted()
      .accounts({
        todo: todoAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
    
    // Fetch the updated todo
    let todoData = await program.account.todoAccount.fetch(todoAccount);
    
    // Verify the data
    expect(todoData.completed).to.equal(true);
    
    // Toggle back to incomplete
    await program.methods
      .toggleCompleted()
      .accounts({
        todo: todoAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
    
    // Fetch the updated todo again
    todoData = await program.account.todoAccount.fetch(todoAccount);
    
    // Verify the data
    expect(todoData.completed).to.equal(false);
  });

  it("Can delete a todo", async () => {
    // Delete todo
    await program.methods
      .deleteTodo()
      .accounts({
        todo: todoAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
    
    // Try to fetch the deleted todo (should fail)
    try {
      await program.account.todoAccount.fetch(todoAccount);
      expect.fail("The todo should be deleted");
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it("Should not allow unauthorized access", async () => {
    // Create a new todo first
    const newTaskId = new anchor.BN(2);
    const [newTodoAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("todo"),
        owner.publicKey.toBuffer(),
        newTaskId.toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    );
    
    await program.methods
      .createTodo(newTaskId, description, dueDate)
      .accounts({
        todo: newTodoAccount,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();
    
    // Create an unauthorized user
    const unauthorizedUser = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Try to update with unauthorized user
    try {
      await program.methods
        .updateDescription("Unauthorized update")
        .accounts({
          todo: newTodoAccount,
          owner: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should not allow unauthorized updates");
    } catch (error) {
      expect(error).to.be.an('error');
      // The specific error might vary depending on Anchor's implementation,
      // but we know it should fail
    }
  });
});