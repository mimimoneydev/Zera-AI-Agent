import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mantle Testnet (Sepolia) Configuration
const MANTLE_TESTNET_RPC = "https://rpc.sepolia.mantle.xyz";
const CHAIN_ID = 5003;

const PRIVATE_KEY = process.env.MANTLE_PRIVATE_KEY?.trim();

// Read the contract source
const contractSource = fs.readFileSync(
  path.join(__dirname, "..", "contracts", "AuditContract.sol"),
  "utf8"
);

// Contract ABI (extracted from the contract)
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "contractHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "stars",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "summary",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "auditor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AuditRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contractHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "stars",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "summary",
        "type": "string"
      }
    ],
    "name": "registerAudit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getAllAudits",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "contractHashes",
        "type": "bytes32[]"
      },
      {
        "internalType": "uint8[]",
        "name": "stars",
        "type": "uint8[]"
      },
      {
        "internalType": "string[]",
        "name": "summaries",
        "type": "string[]"
      },
      {
        "internalType": "address[]",
        "name": "auditors",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "timestamps",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "auditor",
        "type": "address"
      }
    ],
    "name": "getAuditorHistory",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contractHash",
        "type": "bytes32"
      }
    ],
    "name": "getContractAudits",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "stars",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "summary",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "auditor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct AuditRegistry.AuditEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contractHash",
        "type": "bytes32"
      }
    ],
    "name": "getLatestAudit",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "stars",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "summary",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "auditor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct AuditRegistry.AuditEntry",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalContracts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function deployContract() {
  console.log("🚀 Starting deployment to Mantle Testnet (Sepolia)...\n");

  if (!PRIVATE_KEY) {
    throw new Error("Set MANTLE_PRIVATE_KEY before deploying.");
  }

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📝 Deployer Address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInMNT = ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceInMNT} MNT\n`);

  if (balance === 0n) {
    console.error("❌ Insufficient balance. Please fund the wallet with MNT.");
    process.exit(1);
  }

  // Contract bytecode (you need to compile the contract first)
  // For now, we'll use a placeholder - you need to compile the contract
  console.log("⚠️  Note: You need to compile the contract first to get the bytecode.");
  console.log("⚠️  Please use Hardhat, Foundry, or Remix to compile AuditContract.sol");
  console.log("⚠️  Then update the CONTRACT_BYTECODE variable in this script.\n");

  // Since we don't have the compiled bytecode, let's use an alternative approach
  // We'll use a simple deployment script that can be run with Hardhat or Foundry
  console.log("📋 Creating deployment configuration...\n");

  const deploymentInfo = {
    network: "Mantle Testnet (Sepolia)",
    chainId: CHAIN_ID,
    rpc: MANTLE_TESTNET_RPC,
    deployer: wallet.address,
    contractName: "AuditRegistry",
    timestamp: new Date().toISOString()
  };

  // Save deployment info
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("✅ Deployment info saved to deployment-info.json");
  console.log("\n📝 Next steps:");
  console.log("1. Compile the contract using Hardhat, Foundry, or Remix");
  console.log("2. Get the contract bytecode");
  console.log("3. Update this script with the bytecode");
  console.log("4. Run the deployment script again");
  console.log("\n🔗 Mantle Testnet Explorer: https://sepolia.mantlescan.xyz");
}

// Alternative: Use Hardhat-style deployment
async function deployWithHardhat() {
  console.log("🚀 Deploying AuditRegistry to Mantle Testnet using Hardhat...\n");

  // This would require Hardhat to be installed and configured
  console.log("⚠️  To deploy with Hardhat:");
  console.log("1. Install Hardhat: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox");
  console.log("2. Initialize Hardhat: npx hardhat init");
  console.log("3. Create hardhat.config.js with Mantle Testnet configuration");
  console.log("4. Create scripts/deploy.js");
  console.log("5. Run: npx hardhat run scripts/deploy.js --network mantleTestnet");
}

// Alternative: Use Foundry-style deployment
async function deployWithFoundry() {
  console.log("🚀 Deploying AuditRegistry to Mantle Testnet using Foundry...\n");

  // This would require Foundry to be installed
  console.log("⚠️  To deploy with Foundry:");
  console.log("1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash");
  console.log("2. Initialize Foundry: forge init");
  console.log("3. Copy AuditContract.sol to src/");
  console.log("4. Set MANTLE_PRIVATE_KEY in .env");
  console.log("5. Run: forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast");
}

// Main execution
(async () => {
  try {
    console.log("=".repeat(60));
    console.log("  AuditRegistry Contract Deployment");
    console.log("  Mantle Testnet (Sepolia)");
    console.log("=".repeat(60));
    console.log();

    // For now, let's provide instructions since we need to compile the contract
    console.log("📋 Deployment Options:\n");
    console.log("Option 1: Use Hardhat (Recommended)");
    console.log("Option 2: Use Foundry");
    console.log("Option 3: Use Remix IDE\n");

    console.log("🔧 Quick Start with Hardhat:\n");
    console.log("1. Install dependencies:");
    console.log("   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers\n");
    console.log("2. Create hardhat.config.js:");
    console.log(`
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    mantleTestnet: {
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: [process.env.MANTLE_PRIVATE_KEY]
    }
  }
};
    `);
    console.log("3. Create scripts/deploy.js:");
    console.log(`
const hre = require("hardhat");

async function main() {
  console.log("Deploying AuditRegistry to Mantle Testnet...");
  
  const AuditRegistry = await hre.ethers.getContractFactory("AuditRegistry");
  const auditRegistry = await AuditRegistry.deploy();
  
  await auditRegistry.waitForDeployment();
  const address = await auditRegistry.getAddress();
  
  console.log("AuditRegistry deployed to:", address);
  console.log("Verify on Mantle Testnet Explorer: https://sepolia.mantlescan.xyz/address/" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
    `);
    console.log("4. Run deployment:");
    console.log("   npx hardhat run scripts/deploy.js --network mantleTestnet\n");

    console.log("=".repeat(60));
    console.log("✅ Instructions provided. Please follow the steps above.");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
