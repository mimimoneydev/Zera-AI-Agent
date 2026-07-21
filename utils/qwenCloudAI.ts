type QwenCloudOperation =
  | "generate-contract"
  | "analyze-security"
  | "generate-documentation"
  | "generate-tests";

interface QwenCloudResponse {
  content?: string;
  error?: string;
}

async function callQwenCloud(
  operation: QwenCloudOperation,
  input: string,
  context: string
): Promise<string> {
  const response = await fetch("/api/qwen-cloud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, input, context }),
  });

  const data = (await response.json().catch(() => ({}))) as QwenCloudResponse;

  if (!response.ok) {
    throw new Error(data.error || "QwenCloud request failed. Please try again.");
  }

  if (!data.content?.trim()) {
    throw new Error("QwenCloud returned an empty response.");
  }

  return data.content;
}

// Specialized methods for different AI capabilities
export async function generateSmartContract(
  prompt: string,
  contractType: string
) {
  return callQwenCloud("generate-contract", prompt, contractType);
}

export async function analyzeContractSecurity(code: string, chain: string) {
  return callQwenCloud("analyze-security", code, chain);
}

export async function generateContractDocumentation(
  code: string,
  framework: string
) {
  return callQwenCloud("generate-documentation", code, framework);
}

export async function generateContractTests(code: string, framework: string) {
  return callQwenCloud("generate-tests", code, framework);
}

// Function to simulate the test results (in a real scenario, this would be handled by a backend)
export function simulateTestResults() {
  return {
    passed: Math.floor(Math.random() * 3) + 3,
    failed: Math.floor(Math.random() * 2),
    results: [
      {
        id: 1,
        name: "Should set the right owner",
        status: "passed",
        duration: "0.23s",
      },
      {
        id: 2,
        name: "Should assign total supply to owner",
        status: "passed",
        duration: "0.18s",
      },
      {
        id: 3,
        name: "Should transfer tokens between accounts",
        status: "passed",
        duration: "0.45s",
      },
      {
        id: 4,
        name: "Should fail if sender doesn't have enough tokens",
        status: Math.random() > 0.7 ? "failed" : "passed",
        duration: "0.32s",
        error:
          "Contract was expected to revert with 'Not enough tokens', but didn't revert.",
      },
      {
        id: 5,
        name: "Should update balances after transfers",
        status: "passed",
        duration: "0.38s",
      },
    ],
    gasUsage: [
      { function: "transfer", cost: 48325, improvement: "+12%" },
      { function: "approve", cost: 32750, improvement: "+5%" },
      { function: "transferFrom", cost: 53420, improvement: "-3%" },
    ],
  };
}
