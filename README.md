# Zera - Smart Contract Security Audit Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Open source under the [MIT License](LICENSE).**

A comprehensive platform for auditing smart contracts with AI-powered security analysis and on-chain audit registration on **Mantle Testnet (Sepolia)**.

## Blockchain Network

This project is deployed on **Mantle Testnet (Sepolia)** — an Ethereum Layer 2 scaling solution. All on-chain operations (audit registration, contract queries) are performed on this network.

### Adding Mantle Testnet to MetaMask

The application will automatically prompt you to add Mantle Testnet to your MetaMask wallet when you try to perform on-chain operations. Alternatively, you can add it manually:

| Field | Value |
|-------|-------|
| **Network Name** | Mantle Testnet (Sepolia) |
| **RPC URL** | `https://rpc.sepolia.mantle.xyz` |
| **Chain ID** | `5003` |
| **Currency Symbol** | `MNT` |
| **Block Explorer** | `https://sepolia.mantlescan.xyz` |

## Smart Contract

The `AuditRegistry` smart contract is deployed on Mantle Testnet (Sepolia):

- **Contract Address**: [`0x5cA23Cd0D991257cA55AcCd8E749b138E77440eC`](https://sepolia.mantlescan.xyz/address/0x5cA23Cd0D991257cA55AcCd8E749b138E77440eC)
- **Deployer**: `0x3a18f9f0E07269D2a9161A0E83745b4e8BbAdEE8`
- **Explorer**: [View on MantleScan](https://sepolia.mantlescan.xyz/address/0x5cA23Cd0D991257cA55AcCd8E749b138E77440eC)

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/mimimoneydev/Zera-AI-Agent.git
cd Zera-AI-Agent
npm install --legacy-peer-deps
```

Set up your environment variables:

```bash
# Create a .env file with your QwenCloud API configuration
cp .env.example .env
# Edit .env and set QWEN_CLOUD_API_KEY to your server-side API key
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **AI-Powered Security Analysis**: Analyze smart contracts for vulnerabilities using **QwenCloud (GLM 5.2)** through Alibaba Cloud Model Studio
- **On-Chain Audit Registration**: Register audit results on Mantle Testnet (Sepolia)
- **Comprehensive Reports**: View detailed audit reports with severity ratings and recommendations
- **Wallet Integration**: Connect with MetaMask or compatible wallets
- **Smart Contract Generation**: Generate secure Solidity contracts with AI assistance
- **Contract Documentation**: Auto-generate documentation for your smart contracts
- **Test Case Generation**: Create comprehensive test suites for contract validation

## Project Structure

- `contracts/` - Solidity smart contract source files
- `scripts/` - Deployment and verification scripts for Mantle Testnet
  - `deploy-mantle.js` - Full compile + deploy to Mantle Testnet
  - `deploy.js` - Hardhat-based deployment script
  - `verify-deployment.js` - Contract verification utility
  - `fund-contract.js` - Contract funding script
- `src/app/` - Next.js app directory with pages and layouts
- `src/components/` - React components organized by feature
  - `ui/` - Reusable UI components (including NetworkSelector)
- `src/hooks/` - Custom React hooks for wallet and state management
- `src/services/` - Service layer for wallet and blockchain interactions
- `src/store/` - Zustand/Redux store for state management
- `utils/` - Utility functions and blockchain configuration
  - `Contract.ts` - Smart contract configuration and ABI for Mantle Testnet
  - `web3.ts` - Web3 utilities and Mantle network configuration with switching functions
  - `qwenCloudAI.ts` - Browser-safe client for the internal QwenCloud API route
- `src/app/api/qwen-cloud/` - Server-only QwenCloud (GLM 5.2) integration

## Network Configuration

The project uses a centralized configuration system in [`utils/web3.ts`](utils/web3.ts) and [`utils/Contract.ts`](utils/Contract.ts):

- [`MANTLE_TESTNET_CONFIG`](utils/web3.ts:14) - Mantle Testnet configuration (Chain ID: 5003)
- [`switchToMantleTestnet()`](utils/web3.ts:40) - Function to switch wallet to Mantle Testnet
- [`switchToNetwork()`](utils/web3.ts:90) - Generic network switching function
- [`isMantleTestnet()`](utils/web3.ts:145) - Check if connected to Mantle Testnet
- [`getCurrentNetworkKey()`](utils/web3.ts:166) - Function to get current network
- [`CHAIN_CONFIG`](utils/Contract.ts:1) - Contract configuration for Mantle Testnet

## AI Integration

This project uses **QwenCloud (GLM 5.2)** for all AI-powered features:

- **Smart Contract Security Analysis** — `analyzeContractSecurity()`
- **Smart Contract Generation** — `generateSmartContract()`
- **Contract Documentation** — `generateContractDocumentation()`
- **Test Case Generation** — `generateContractTests()`

Configure QwenCloud in the `.env` file. The API key stays on the server and must
not use a `NEXT_PUBLIC_` prefix:

```env
QWEN_CLOUD_API_KEY=your_qwen_cloud_api_key_here
QWEN_CLOUD_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_CLOUD_MODEL=glm-5.2
```

The API key and base URL must belong to the same Alibaba Cloud Model Studio
region and billing plan. The example uses the Singapore/international DashScope
endpoint. For a workspace-dedicated Singapore key, use
`https://YOUR_WORKSPACE_ID.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`;
for US (Virginia), use
`https://dashscope-us.aliyuncs.com/compatible-mode/v1`; and for China (Beijing),
use `https://dashscope.aliyuncs.com/compatible-mode/v1`. In Vercel, configure
the same three variables in Project Settings → Environment Variables; do not
commit your `.env` file.

Contract deployment additionally requires `MANTLE_PRIVATE_KEY` in `.env`.
Never commit a wallet private key to source control.

## Development Notes

### Network
- The application is configured exclusively for **Mantle Testnet (Sepolia)** (Chain ID: 5003)
- All contract interactions use `https://rpc.sepolia.mantle.xyz` as the RPC endpoint
- Block explorer: `https://sepolia.mantlescan.xyz`

### Deployment
To deploy the contract to Mantle Testnet:

```bash
node scripts/deploy-mantle.js
```

Or using Hardhat:

```bash
npx hardhat run scripts/deploy.js --network mantleTestnet
```

### Testing
- Ensure your wallet has sufficient MNT balance for transactions
- Get testnet MNT from the Mantle faucet at `https://www.mantle.xyz/faucet`
- Use [`scripts/verify-deployment.js`](scripts/verify-deployment.js) to verify the deployed contract

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| [`deploy-mantle.js`](scripts/deploy-mantle.js) | Compile and deploy AuditRegistry using solc + ethers |
| [`deploy.js`](scripts/deploy.js) | Hardhat-based deployment to Mantle Testnet |
| [`deploy-contract.js`](scripts/deploy-contract.js) | Deployment with detailed instructions |
| [`fund-contract.js`](scripts/fund-contract.js) | Fund the deployed contract with MNT |
| [`verify-deployment.js`](scripts/verify-deployment.js) | Verify contract is deployed and functional |

---

## License

This project is open-source software licensed under the **[MIT License](LICENSE)**.

Copyright © 2026 Zera contributors.
