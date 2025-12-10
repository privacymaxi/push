// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - Test Client
// Test the Push API with and without payments
// ═══════════════════════════════════════════════════════════════════════════════

import "dotenv/config";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: unknown;
  error?: string;
}

const results: TestResult[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; details?: unknown }>
): Promise<void> {
  const start = Date.now();
  try {
    const result = await testFn();
    results.push({
      name,
      passed: result.passed,
      duration: Date.now() - start,
      details: result.details,
    });
    console.log(`${result.passed ? "✅" : "❌"} ${name} (${Date.now() - start}ms)`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split("\n").slice(0, 5).join("\n   "));
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    console.log(`❌ ${name} - Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

async function testHealthEndpoint(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/health`);
  const data = await response.json() as any;
  
  return {
    passed: response.ok && data.status === "healthy",
    details: data,
  };
}

async function testPaymentInfoEndpoint(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/payment-info`);
  const data = await response.json() as any;
  
  return {
    passed: response.ok && data.x402Version === 1 && data.accepts?.length > 0,
    details: {
      network: data.accepts?.[0]?.network,
      price: data.accepts?.[0]?.maxAmountRequired,
    },
  };
}

async function testProcessWithoutPayment(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        parts: [{ kind: "text", text: "What is the current gas price on Base?" }],
      },
    }),
  });
  
  const data = await response.json() as any;
  
  return {
    passed: response.status === 402 && data.x402 !== undefined,
    details: {
      status: response.status,
      hasX402: !!data.x402,
    },
  };
}

async function testTestEndpoint(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "What networks do you support?",
      tools: false,
    }),
  });
  
  const data = await response.json() as any;
  
  return {
    passed: response.ok && data.status === "completed",
    details: {
      responseLength: data.response?.text?.length,
      toolsUsed: data.response?.toolsUsed,
    },
  };
}

async function testBlockchainToolsEndpoint(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/api/gas/base`);
  const data = await response.json() as any;
  
  return {
    passed: response.ok && data.standard !== undefined,
    details: data,
  };
}

async function testNetworksEndpoint(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/api/networks`);
  const data = await response.json() as any;
  
  return {
    passed: response.ok && Object.keys(data).length > 0,
    details: {
      networks: Object.keys(data),
    },
  };
}

async function testTestEndpointWithTools(): Promise<{ passed: boolean; details?: unknown }> {
  const response = await fetch(`${AGENT_URL}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "What is the current gas price on Ethereum mainnet?",
      tools: true,
    }),
  });
  
  const data = await response.json() as any;
  
  return {
    passed: response.ok && data.status === "completed",
    details: {
      responseLength: data.response?.text?.length,
      toolsUsed: data.response?.toolsUsed,
      tokensUsed: data.response?.tokensUsed,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Test Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PUSH Test Suite                                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Target: ${AGENT_URL.padEnd(65)}║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  // Basic API Tests
  console.log("\n📋 Basic API Tests\n" + "─".repeat(50));
  await runTest("Health endpoint", testHealthEndpoint);
  await runTest("Payment info endpoint", testPaymentInfoEndpoint);
  await runTest("Networks endpoint", testNetworksEndpoint);

  // Payment Flow Tests
  console.log("\n💳 Payment Flow Tests\n" + "─".repeat(50));
  await runTest("Process without payment (should return 402)", testProcessWithoutPayment);

  // Blockchain Tools Tests
  console.log("\n⛓️ Blockchain Tools Tests\n" + "─".repeat(50));
  await runTest("Gas price endpoint", testBlockchainToolsEndpoint);

  // AI Integration Tests
  console.log("\n🤖 AI Integration Tests\n" + "─".repeat(50));
  await runTest("Test endpoint (no tools)", testTestEndpoint);
  await runTest("Test endpoint (with tools)", testTestEndpointWithTools);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalTime = results.reduce((acc, r) => acc + r.duration, 0);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              Test Summary                                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ✅ Passed: ${passed.toString().padEnd(5)} │ ❌ Failed: ${failed.toString().padEnd(5)} │ ⏱️  Total: ${totalTime}ms${" ".repeat(Math.max(0, 20 - totalTime.toString().length))}║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error || "Failed"}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
