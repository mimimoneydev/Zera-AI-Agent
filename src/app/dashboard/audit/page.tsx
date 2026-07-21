"use client";

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/dashlayout/dashlayout";
import CodeAnalyzer from "@/components/dashboard/audit/codeAnalyzer";
import AuditResults from "@/components/dashboard/audit/auditResults";
import { useToast } from "@/hooks/use-toast";
import { analyzeContractSecurity } from "@utils/qwenCloudAI";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import { ethers } from "ethers";
import useAuditStore from "@/store/auditStore"; // Import the Zustand store
// ABI of the AuditRegistry contract (import or define it here)
const AUDIT_REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "contractHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "stars",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "string",
        name: "summary",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "auditor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "AuditRegistered",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "contractHash",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "stars",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "summary",
        type: "string",
      },
    ],
    name: "registerAudit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "startIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getAllAudits",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "contractHashes",
        type: "bytes32[]",
      },
      {
        internalType: "uint8[]",
        name: "stars",
        type: "uint8[]",
      },
      {
        internalType: "string[]",
        name: "summaries",
        type: "string[]",
      },
      {
        internalType: "address[]",
        name: "auditors",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "timestamps",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "auditor",
        type: "address",
      },
    ],
    name: "getAuditorHistory",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "contractHash",
        type: "bytes32",
      },
    ],
    name: "getContractAudits",
    outputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "stars",
            type: "uint8",
          },
          {
            internalType: "string",
            name: "summary",
            type: "string",
          },
          {
            internalType: "address",
            name: "auditor",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct AuditRegistry.AuditEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getContractHashByIndex",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "contractHash",
        type: "bytes32",
      },
    ],
    name: "getLatestAudit",
    outputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "stars",
            type: "uint8",
          },
          {
            internalType: "string",
            name: "summary",
            type: "string",
          },
          {
            internalType: "address",
            name: "auditor",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct AuditRegistry.AuditEntry",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalContracts",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: string; // e.g., "critical", "high", "medium", "low", "info"
  source: string; // e.g., "QwenCloud", "Slither", "Mythril"
  line?: number | null; // Optional line number
  recommendation?: string; // Optional recommendation
}

// Address of the deployed AuditRegistry contract
const AUDIT_REGISTRY_ADDRESS = "0x5cA23Cd0D991257cA55AcCd8E749b138E77440eC";
const parseIssuesFromAuditReport = (auditReport: string): AuditIssue[] => {
  const issues: AuditIssue[] = [];
  const lines = auditReport.split("\n");

  let currentIssue: Partial<AuditIssue> = {};

  lines.forEach((line) => {
    if (line.startsWith("####")) {
      // Start of a new issue
      if (currentIssue.id) {
        issues.push(currentIssue as AuditIssue);
      }
      const generateUUID = () => {
        // Check if crypto.randomUUID is available
        if (
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
        ) {
          return crypto.randomUUID();
        }

        // Fallback implementation
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      };

      // Then replace crypto.randomUUID() with generateUUID()
      // In the parseIssuesFromAuditReport function, change this line:
      currentIssue = {
        id: generateUUID(), // Replace crypto.randomUUID()
        title: line.replace(/####/, "").trim(),
      };
    } else if (line.startsWith("- **Description**:")) {
      currentIssue.description = line
        .replace(/- \*\*Description\*\*:/, "")
        .trim();
    } else if (line.startsWith("- **Affected Function**:")) {
      currentIssue.source = line
        .replace(/- \*\*Affected Function\*\*:/, "")
        .trim();
    } else if (line.startsWith("- **Mitigation**:")) {
      currentIssue.recommendation = line
        .replace(/- \*\*Mitigation\*\*:/, "")
        .trim();
    } else if (line.startsWith("- **Severity**:")) {
      currentIssue.severity = line
        .replace(/- \*\*Severity\*\*:/, "")
        .trim()
        .toLowerCase();
    }
  });

  // Push the last issue if it exists
  if (currentIssue.id) {
    issues.push(currentIssue as AuditIssue);
  }

  return issues;
};
const AuditPage = () => {
  const [showResults, setShowResults] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { toast } = useToast();
  const {
    auditScore,
    auditReport,
    contractHash,
    isLocked,
    setAuditScore,
    setAuditReport,
    setContractHash,
    setIssues,
    setIssueCount,
    setIsLocked,
  } = useAuditStore();
  // Handle code analysis
  const handleAnalyze = async (code: string, chain: string) => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const auditResults = await analyzeContractSecurity(code, chain);
      setAuditReport(auditResults);

      const generateUniqueHash = () => {
        const timestamp = Date.now().toString();
        const randomNum = Math.random().toString();
        const uniqueString = `${timestamp}-${randomNum}-${code.length}`;
        return keccak256(toUtf8Bytes(uniqueString));
      };

      const uniqueHash = generateUniqueHash();
      setContractHash(uniqueHash);

      const parsedIssues: AuditIssue[] =
        parseIssuesFromAuditReport(auditResults);
      setIssues(parsedIssues);

      // Calculate issue counts and score
      const lowerReport = auditResults.toLowerCase();
      const critical = (lowerReport.match(/critical/g) || []).length;
      const high = (lowerReport.match(/high/g) || []).length;
      const medium = (lowerReport.match(/medium/g) || []).length;
      const low = (lowerReport.match(/low/g) || []).length;
      const info = (lowerReport.match(/info/g) || []).length;

      setIssueCount({ critical, high, medium, low, info });

      const totalIssues = critical * 5 + high * 3 + medium * 2 + low;
      const score = Math.max(100 - totalIssues * 2, 40);
      setAuditScore(score);

      setShowResults(true);
      setIsLocked(true);

      toast({
        title: "Audit Complete",
        description: `Audit completed with a score of ${score}%. Please register the audit on-chain to view details.`,
      });
    } catch (error) {
      console.error("Error analyzing contract:", error);
      toast({
        title: "Audit Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during the audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debugging state updates

  // Handle audit registration on-chain
  const handleRegisterAudit = async () => {
    if (!window.ethereum) {
      toast({
        title: "No Wallet Detected",
        description: "Please install MetaMask or another Ethereum wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!contractHash || !auditReport) {
      toast({
        title: "Invalid Input",
        description: "Failed to register audit. Missing required data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegistering(true);

      // Check if connected to a supported network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Verify it's Mantle Testnet (5003)
      if (chainId !== 5003) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Mantle Testnet (Sepolia)",
          variant: "destructive",
        });
        return;
      }

      // Proceed with registering the audit
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const auditRegistry = new ethers.Contract(
        AUDIT_REGISTRY_ADDRESS,
        AUDIT_REGISTRY_ABI,
        signer
      );

      const tx = await auditRegistry.registerAudit(
        contractHash,
        auditScore, // Convert score to stars (1-5 scale)
        "ok"
      );
      await tx.wait();

      toast({
        title: "Audit Registered",
        description: "The audit has been successfully registered on-chain.",
      });

      setIsLocked(false); // Unlock the results after registration
    } catch (error) {
      console.error("Error registering audit:", error);
      toast({
        title: "Error",
        description: "Failed to register the audit on-chain.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Security Audit</h2>
        <p className="text-gray-300">
          Analyze your smart contracts for vulnerabilities and security issues.
        </p>
      </div>

      <CodeAnalyzer onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      {showResults && (
        <div>
          {/* Lock Screen */}
          {isLocked && (
            <div className="bg-black/80 backdrop-blur border border-white/20 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-4">
                Audit Results Locked
              </h3>
              <p className="text-gray-300 mb-6">
                To unlock the audit results, please register the audit on-chain.
              </p>
              <button
                onClick={handleRegisterAudit}
                disabled={isRegistering}
                className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <>
                    <span className="animate-spin">↻</span>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Register Audit</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Audit Results */}
          {!isLocked && <AuditResults />}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AuditPage;
