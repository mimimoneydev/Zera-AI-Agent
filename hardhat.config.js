const mantlePrivateKey = process.env.MANTLE_PRIVATE_KEY?.trim();

/** @type import('hardhat/config').HardhatUserConfig */
const hardhatConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mantleTestnet: {
      type: "http",
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: mantlePrivateKey ? [mantlePrivateKey] : []
    }
  }
};

export default hardhatConfig;
