// Demo fallback data for RedPen (P0 demo) – three samples
export default [
  // 1️⃣ Greedy coin‑change (fails)
  {
    layer0: {
      problem_statement: "Given a list of coin denominations [1,3,4] and a target amount 6, find the minimum number of coins.",
      code: "def minCoins(coins, amount):\n    count = 0\n    for c in sorted(coins, reverse=True):\n        while amount >= c:\n            amount -= c\n            count += 1\n    return count",
      approach: "Use a greedy algorithm: repeatedly take the largest coin not exceeding the remaining amount.",
      language: "python",
      per_line_confidence: {"1": "high", "2": "high", "3": "high", "4": "high"}
    },
    layers: {
      approach: {
        layer: "Approach",
        status: "done",
        findings: [{
          severity: "critical",
          location: "approach",
          claim: "Greedy approach fails for this coin set",
          evidence: "Counterexample: amount=6 yields 4 coins (4+1+1) instead of optimal 3 (3+3)",
          confidence: "high",
          suggestion: "Use DP or BFS to compute minimum coins"
        }]
      },
      code: {
        layer: "Code",
        status: "done",
        findings: [{
          severity: "info",
          location: "line 2",
          claim: "Loop iterates over coins in descending order, appropriate for greedy but not optimal",
          evidence: "See line 2: sorted(coins, reverse=True)",
          confidence: "medium",
          suggestion: "Consider DP implementation"
        }]
      },
      alignment: {
        layer: "Alignment",
        status: "done",
        findings: []
      }
    }
  },
  // 2️⃣ Correct but unusual solution (DP implementation)
  {
    layer0: {
      problem_statement: "Given a list of coin denominations [1,3,4] and a target amount 6, find the minimum number of coins.",
      code: "def minCoinsDP(coins, amount):\n    dp = [0] + [float('inf')] * amount\n    for i in range(1, amount+1):\n        for c in coins:\n            if c <= i:\n                dp[i] = min(dp[i], dp[i-c] + 1)\n    return dp[amount]",
      approach: "Dynamic programming: build a table of best solutions for each sub‑amount.",
      language: "python",
      per_line_confidence: {"1": "high", "2": "high", "3": "high", "4": "high"}
    },
    layers: {
      approach: {
        layer: "Approach",
        status: "done",
        findings: [{
          severity: "info",
          location: "approach",
          claim: "Approach is correct and optimal for the coin change problem.",
          evidence: "DP guarantees optimality",
          confidence: "high",
          suggestion: "None"
        }]
      },
      code: {
        layer: "Code",
        status: "done",
        findings: []
      },
      alignment: {
        layer: "Alignment",
        status: "done",
        findings: []
      }
    }
  },
  // 3️⃣ Approach/code mismatch sample
  {
    layer0: {
      problem_statement: "Find the maximum subarray sum.",
      code: "def maxSubarray(arr):\n    return max(arr)",
      approach: "Kadane's algorithm (linear scan keeping current max).",
      language: "python",
      per_line_confidence: {"1": "high", "2": "high", "3": "high"}
    },
    layers: {
      approach: {
        layer: "Approach",
        status: "done",
        findings: []
      },
      code: {
        layer: "Code",
        status: "done",
        findings: [{
          severity: "warning",
          location: "code",
          claim: "Code does not implement Kadane's algorithm; it only returns the max element.",
          evidence: "Implementation is a single max() call",
          confidence: "high",
          suggestion: "Implement proper Kadane iteration"
        }]
      },
      alignment: {
        layer: "Alignment",
        status: "done",
        findings: [{
          severity: "warning",
          location: "overall",
          claim: "Approach description and code are mismatched.",
          evidence: "Approach mentions Kadane, code uses max()",
          confidence: "high",
          suggestion: "Align code with described approach"
        }]
      }
    }
  }
];
