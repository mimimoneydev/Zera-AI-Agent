"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { switchToNetwork, getCurrentNetworkKey, NETWORK_CONFIGS, type NetworkKey } from "@utils/web3";
import { toast } from "sonner";

interface NetworkSelectorProps {
  className?: string;
}

const NetworkSelector = ({ className = "" }: NetworkSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkKey | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const networkKey = await getCurrentNetworkKey();
      setCurrentNetwork(networkKey);
    };

    checkNetwork();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on("chainChanged", checkNetwork);
      window.ethereum.on("accountsChanged", checkNetwork);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", checkNetwork);
        window.ethereum.removeListener("accountsChanged", checkNetwork);
      }
    };
  }, []);

  const handleNetworkSwitch = async (networkKey: NetworkKey) => {
    if (currentNetwork === networkKey) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchToNetwork(networkKey);
      setCurrentNetwork(networkKey);
      toast.success(`Switched to ${NETWORK_CONFIGS[networkKey].chainName}`);
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast.error("Failed to switch network. Please try again.");
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  const getNetworkLabel = (networkKey: NetworkKey | null) => {
    if (!networkKey) return "Select Network";
    return NETWORK_CONFIGS[networkKey].chainName;
  };

  const getNetworkColor = (networkKey: NetworkKey) => {
    return "bg-blue-500";
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {currentNetwork && (
          <div className={`w-2 h-2 rounded-full ${getNetworkColor(currentNetwork)}`} />
        )}
        <span className="text-sm font-medium">{getNetworkLabel(currentNetwork)}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/20 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2">
              <p className="text-xs text-gray-400 px-3 py-2 font-medium">Select Network</p>
              {Object.entries(NETWORK_CONFIGS).map(([key, config]) => {
                const networkKey = key as NetworkKey;
                return (
                  <button
                    key={key}
                    onClick={() => handleNetworkSwitch(networkKey)}
                    disabled={isSwitching}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div className={`w-2 h-2 rounded-full ${getNetworkColor(networkKey)}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{config.chainName}</p>
                      <p className="text-xs text-gray-400">Chain ID: {config.chainId}</p>
                    </div>
                    {currentNetwork === networkKey && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;
