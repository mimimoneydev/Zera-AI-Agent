import { ethers } from "ethers";

// Mantle Testnet (Sepolia) Configuration
const MANTLE_TESTNET_RPC = "https://rpc.sepolia.mantle.xyz";
const PRIVATE_KEY = process.env.MANTLE_PRIVATE_KEY?.trim();
const CONTRACT_ADDRESS = "0x5cA23Cd0D991257cA55AcCd8E749b138E77440eC";

async function fundContract() {
  console.log("=".repeat(60));
  console.log("  Funding AuditRegistry Contract on Mantle Testnet");
  console.log("=".repeat(60));
  console.log();

  try {
    if (!PRIVATE_KEY) {
      throw new Error("Set MANTLE_PRIVATE_KEY before funding.");
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`📝 Funding from: ${wallet.address}`);
    console.log(`📝 Funding to: ${CONTRACT_ADDRESS}`);
    console.log();

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInMNT = ethers.formatEther(balance);
    console.log(`💰 Wallet Balance: ${balanceInMNT} MNT`);

    // Check contract balance
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    const contractBalanceInMNT = ethers.formatEther(contractBalance);
    console.log(`💰 Contract Balance: ${contractBalanceInMNT} MNT`);
    console.log();

    // Amount to send (0.1 MNT)
    const amountToSend = ethers.parseEther("0.1");
    console.log(`💸 Sending: ${ethers.formatEther(amountToSend)} MNT`);
    console.log();

    // Send transaction
    console.log("⏳ Sending transaction...");
    const tx = await wallet.sendTransaction({
      to: CONTRACT_ADDRESS,
      value: amountToSend
    });

    console.log(`📋 Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log(`🔗 Mantle Testnet Explorer: https://sepolia.mantlescan.xyz/tx/${tx.hash}`);
    console.log();

    // Check new contract balance
    const newContractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    const newContractBalanceInMNT = ethers.formatEther(newContractBalance);
    console.log(`💰 New Contract Balance: ${newContractBalanceInMNT} MNT`);
    console.log();

    console.log("=".repeat(60));
    console.log("  Funding Complete!");
    console.log("=".repeat(60));
    console.log();

  } catch (error) {
    console.error("❌ Funding failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute funding
fundContract()
  .then(() => {
    console.log("✅ Funding successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Funding failed:");
    console.error(error);
    process.exit(1);
  });
