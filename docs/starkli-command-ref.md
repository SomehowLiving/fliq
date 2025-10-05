# Starkli Commands Reference

This guide provides a reference for common `starkli` commands used for account management and contract operations on Starknet, along with solutions for common issues and optional environment variable configurations.

## Account Management

### Create Keystore (Private Key)
```bash
starkli signer keystore new starkli-wallets/deployer.json
```
**Purpose**: Creates an encrypted private key file for signing transactions.

### Initialize Account
```bash
starkli account oz init starkli-wallets/account.json --keystore starkli-wallets/deployer.json
```
**Purpose**: Creates an account configuration file linked to the specified keystore.

### Deploy Account
```bash
starkli account deploy starkli-wallets/account.json --keystore starkli-wallets/deployer.json
```
**Purpose**: Deploys the account contract to Starknet. Note: The account must be funded before deployment.

### Fetch Account Info
```bash
starkli account fetch <ADDRESS>
```
**Purpose**: Retrieves the latest account state from the Starknet blockchain.

### Update Account Config
```bash
starkli account fetch <ADDRESS> --output starkli-wallets/account.json --force
```
**Purpose**: Updates the local account configuration file with the latest blockchain state.

## Contract Operations

### Declare Contract
```bash
starkli declare target/dev/fliq_contracts_UsernameRegistry.contract_class.json
```
**Purpose**: Uploads the contract code to Starknet, returning a class hash.

### Deploy Contract
```bash
starkli deploy <CLASS_HASH>
```
**Purpose**: Creates a contract instance from the specified class hash.

### Deploy Contract with Constructor
```bash
starkli deploy <CLASS_HASH> <CONSTRUCTOR_ARG>
```
**Purpose**: Deploys a contract instance with the specified constructor arguments.


## Environment Variables (Optional)
Set environment variables to avoid repeating `--keystore` and account file paths in commands.
```bash
export STARKNET_ACCOUNT=starkli-wallets/account.json
export STARKNET_KEYSTORE=starkli-wallets/deployer.json
```
**Purpose**: Simplifies command execution by setting default paths for the account and keystore files.