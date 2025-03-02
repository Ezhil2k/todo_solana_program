# Todo Solana Program

A Solana smart contract built with the Anchor framework that implements a decentralized todo list application.

## Setup Instructions

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.65.0 or later)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (1.14.0 or later)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (0.27.0 or later)
- [Node.js](https://nodejs.org/) (16.0 or later)
- [Yarn](https://yarnpkg.com/getting-started/install) or npm

<!-- ### Installation -->

1. Clone the repository
   ```bash
   git clone https://github.com/Ezhil2k/todo_solana_program.git
   cd todo_solana_program
   ```

2. Install dependencies
   ```bash
   yarn install
   ```

3. Update the program ID
   ```bash
   anchor keys sync
   ```
   This will automatically update the program ID in both `lib.rs` and `Anchor.toml`.

4. Build the program
   ```bash
   anchor build
   ```
5. Start a local Solana test validator in a separate terminal
   ```bash
   solana-test-validator
   ```

6. Deploy to local Solana validator
   ```bash
   anchor deploy --provider.cluster localnet
   ```

## Testing Instructions

### Run Tests

1. Start a local Solana test validator in a separate terminal (if not already running):
   ```bash
   solana-test-validator
   ```

2. Run the tests:
   ```bash
    anchor test --skip-local-validator
   ```

### Test Coverage

The test suite covers:
- Creating a new todo
- Updating a todo description
- Toggling completion status
- Deleting a todo
- Verifying access control (unauthorized users cannot modify todos)


 **For Devnet:**  
  Set `cluster = "devnet"` in `Anchor.toml` and run:  
  ```sh
    anchor build && anchor deploy --provider.cluster devnet
  ```
 **For Mainnet:**  
  Set `cluster = "mainnet"` in `Anchor.toml` and run:  
  ```sh
    anchor build && anchor deploy --provider.cluster mainnet
  ```