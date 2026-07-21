import { ethers } from "ethers";

/**
 * Mantle Testnet (Sepolia) Configuration
 * 
 * Network Details:
 * - Chain ID: 5003
 * - Token Symbol: MNT
 * - RPC Endpoints:
 *   - https://rpc.sepolia.mantle.xyz
 * - Blockchain Explorer: https://sepolia.mantlescan.xyz
 */

export const MANTLE_TESTNET_CONFIG = {
  chainId: 5003,
  chainIdHex: "0x138B",
  chainName: "Mantle Testnet (Sepolia)",
  nativeCurrency: {
    name: "Mantle",
    symbol: "MNT",
    decimals: 18,
  },
  rpcUrls: [
    "https://rpc.sepolia.mantle.xyz"
  ],
  blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
};

/**
 * All supported network configurations
 */
export const NETWORK_CONFIGS = {
  MantleTestnet: MANTLE_TESTNET_CONFIG,
} as const;

export type NetworkKey = keyof typeof NETWORK_CONFIGS;

/**
 * Switch wallet to Mantle Testnet
 * @returns Promise that resolves when the network is switched
 */
export const switchToMantleTestnet = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("MetaMask or compatible wallet not detected");
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MANTLE_TESTNET_CONFIG.chainIdHex }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network to MetaMask
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [MANTLE_TESTNET_CONFIG],
        });
      } catch (addError: any) {
        console.error("Failed to add Mantle Testnet:", addError);
        throw new Error("Failed to add Mantle Testnet to wallet");
      }
    } else {
      console.error("Failed to switch to Mantle Testnet:", switchError);
      throw new Error("Failed to switch to Mantle Testnet");
    }
  }
};

/**
 * Switch wallet to a specific network
 * @param networkKey - The network key (e.g., MantleTestnet)
 * @returns Promise that resolves when the network is switched
 */
export const switchToNetwork = async (networkKey: NetworkKey): Promise<void> => {
  const config = NETWORK_CONFIGS[networkKey];
  
  if (!window.ethereum) {
    throw new Error("MetaMask or compatible wallet not detected");
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainIdHex }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network to MetaMask
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [config],
        });
      } catch (addError: any) {
        console.error(`Failed to add ${config.chainName}:`, addError);
        throw new Error(`Failed to add ${config.chainName} to wallet`);
      }
    } else {
      console.error(`Failed to switch to ${config.chainName}:`, switchError);
      throw new Error(`Failed to switch to ${config.chainName}`);
    }
  }
};

/**
 * Get ethers provider for Mantle Testnet
 * @returns ethers.JsonRpcProvider instance
 */
export const getMantleTestnetProvider = (): ethers.JsonRpcProvider => {
  return new ethers.JsonRpcProvider(MANTLE_TESTNET_CONFIG.rpcUrls[0]);
};

/**
 * Get ethers provider for a specific network
 * @param networkKey - The network key (e.g., MantleTestnet)
 * @returns ethers.JsonRpcProvider instance
 */
export const getNetworkProvider = (networkKey: NetworkKey): ethers.JsonRpcProvider => {
  const config = NETWORK_CONFIGS[networkKey];
  return new ethers.JsonRpcProvider(config.rpcUrls[0]);
};

/**
 * Check if current network is Mantle Testnet
 * @returns Promise<boolean> indicating if connected to Mantle Testnet
 */
export const isMantleTestnet = async (): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId) === MANTLE_TESTNET_CONFIG.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Check if current network is a supported Mantle network
 * @returns Promise<NetworkKey | null> indicating the current network key or null if not supported
 */
export const getCurrentNetworkKey = async (): Promise<NetworkKey | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId === MANTLE_TESTNET_CONFIG.chainId) {
      return "MantleTestnet";
    }
    return null;
  } catch (error) {
    console.error("Error checking network:", error);
    return null;
  }
};

/**
 * Get current network information
 * @returns Promise with network details
 */
export const getCurrentNetwork = async (): Promise<{
  chainId: number;
  name: string;
  isTestnet: boolean;
  networkKey: NetworkKey | null;
}> => {
  if (!window.ethereum) {
    throw new Error("No wallet detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  return {
    chainId,
    name: network.name || `Chain ${chainId}`,
    isTestnet: chainId === MANTLE_TESTNET_CONFIG.chainId,
    networkKey: await getCurrentNetworkKey(),
  };
};
