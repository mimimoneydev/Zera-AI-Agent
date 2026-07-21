import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "glm-5.2";
const DEFAULT_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const REQUEST_TIMEOUT_MS = 55_000;
const MAX_INPUT_LENGTH = 120_000;
const MAX_CONTEXT_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 10;

type Operation =
  | "generate-contract"
  | "analyze-security"
  | "generate-documentation"
  | "generate-tests";

interface RequestBody {
  operation?: unknown;
  input?: unknown;
  context?: unknown;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientId(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  entry.count += 1;

  if (rateLimitStore.size > 1_000) {
    for (const [key, value] of rateLimitStore) {
      if (value.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  return entry.count > RATE_LIMIT_REQUESTS;
}

function isOperation(value: unknown): value is Operation {
  return (
    value === "generate-contract" ||
    value === "analyze-security" ||
    value === "generate-documentation" ||
    value === "generate-tests"
  );
}

function getSystemPrompt(operation: Operation, context: string): string {
  switch (operation) {
    case "generate-contract":
      return `You are an expert blockchain developer. Create a secure, optimized ${context} smart contract based on the user's requirements. Use a current stable Solidity version and established security patterns. Return only compilable Solidity code with useful comments; do not use markdown fences.`;
    case "analyze-security":
      return `You are a smart contract security expert. Analyze the contract for vulnerabilities, gas optimizations, and best practices, focusing on the ${context} blockchain. Use this exact markdown structure for every issue: "#### Issue title", "- **Severity**: critical|high|medium|low|info", "- **Description**: ...", "- **Affected Function**: ...", and "- **Mitigation**: ...". Include a concise summary first. Do not invent an issue when the code does not support it.`;
    case "generate-documentation":
      return `You are a technical documentation expert. Create comprehensive ${context}-style documentation for the smart contract. Include functions, parameters, return values, events, security considerations, and usage examples. Return well-structured markdown.`;
    case "generate-tests":
      return `You are an expert in smart contract testing. Create a comprehensive, runnable test suite using ${context}. Cover all functions, access control, edge cases, expected reverts, and important security properties. Return only test code with useful comments; do not use markdown fences.`;
  }
}

function getCompletionUrl(baseUrl: string): URL {
  const url = new URL(baseUrl);

  if (url.protocol !== "https:") {
    throw new Error("QWEN_CLOUD_BASE_URL must use HTTPS.");
  }

  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/$/, "");

  if (!url.pathname.endsWith("/chat/completions")) {
    url.pathname += "/chat/completions";
  }

  return url;
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientId(request))) {
    return jsonError("Too many AI requests. Please wait a minute and retry.", 429);
  }

  const apiKey = process.env.QWEN_CLOUD_API_KEY?.trim();
  const baseUrl =
    process.env.QWEN_CLOUD_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const model = process.env.QWEN_CLOUD_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    return jsonError(
      "QwenCloud is not configured. Set QWEN_CLOUD_API_KEY on the server.",
      503
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError("The request body must be valid JSON.", 400);
  }

  if (!isOperation(body.operation)) {
    return jsonError("Unsupported QwenCloud operation.", 400);
  }

  if (
    typeof body.input !== "string" ||
    !body.input.trim() ||
    body.input.length > MAX_INPUT_LENGTH
  ) {
    return jsonError(
      `Input must contain between 1 and ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
      400
    );
  }

  if (
    typeof body.context !== "string" ||
    !body.context.trim() ||
    body.context.length > MAX_CONTEXT_LENGTH
  ) {
    return jsonError("The request context is invalid.", 400);
  }

  let completionUrl: URL;

  try {
    completionUrl = getCompletionUrl(baseUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid QwenCloud base URL.";
    console.error("QwenCloud configuration error:", message);
    return jsonError("QwenCloud server configuration is invalid.", 503);
  }

  try {
    const response = await fetch(completionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: getSystemPrompt(body.operation, body.context.trim()),
          },
          { role: "user", content: body.input },
        ],
        temperature: body.operation === "analyze-security" ? 0.3 : 0.4,
        max_completion_tokens:
          body.operation === "generate-contract" ? 4_096 : 6_144,
        enable_thinking: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("QwenCloud API request failed with status", response.status);

      if (response.status === 401 || response.status === 403) {
        return jsonError(
          "QwenCloud rejected the API key. Verify that the key, billing plan, and base URL use the same region.",
          502
        );
      }

      if (response.status === 429) {
        return jsonError(
          "QwenCloud is rate-limiting requests. Please retry shortly.",
          429
        );
      }

      return jsonError("QwenCloud could not complete the request.", 502);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      console.error("QwenCloud API returned an invalid completion payload.");
      return jsonError("QwenCloud returned an invalid response.", 502);
    }

    return NextResponse.json(
      { content },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonError("QwenCloud timed out. Please retry.", 504);
    }

    console.error(
      "QwenCloud request error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return jsonError("Unable to reach QwenCloud. Please retry.", 502);
  }
}
