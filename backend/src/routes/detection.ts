import { Router, Request, Response } from "express";
import { ProcessNode } from "../data/mockProcessTree";
import { globalStore } from "../store";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Collect all nodes in a tree (BFS) */
function flattenTree(root: ProcessNode): ProcessNode[] {
  const result: ProcessNode[] = [];
  const queue: ProcessNode[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    if (node.children) queue.push(...node.children);
  }
  return result;
}

/** Compute maximum depth of a tree (root = depth 1) */
function getDepth(node: ProcessNode, current: number = 1): number {
  if (!node.children || node.children.length === 0) return current;
  return Math.max(...node.children.map((c) => getDepth(c, current + 1)));
}

/** Shannon entropy of a string (CLI entropy feature) */
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((acc, count) => {
    const p = count / len;
    return acc + p * Math.log2(p);
  }, 0);
}

/** Average entropy of all command lines in the tree */
function avgCLIEntropy(nodes: ProcessNode[]): number {
  if (!nodes.length) return 0;
  const entropies = nodes.map((n) => shannonEntropy(n.command_line));
  return entropies.reduce((a, b) => a + b, 0) / entropies.length;
}

/** Rate of events (events per second based on first/last timestamp gap) */
function temporalRateMs(nodes: ProcessNode[]): number {
  if (!nodes.length) return 0;
  const ts = nodes.map((n) => new Date(n.timestamp).getTime()).sort((a, b) => a - b);
  if (ts.length < 2) return 0;
  const gapMs = ts[ts.length - 1] - ts[0];
  return gapMs === 0 ? 0 : Math.round((nodes.length / gapMs) * 1000 * 100) / 100;
}

/** Check for uid 0 privilege transitions (any node != root's uid) */
function privilegeTransition(nodes: ProcessNode[]): boolean {
  if (!nodes.length) return false;
  const rootUid = nodes[0]?.uid ?? 1000;
  return nodes.some((n) => n.uid !== rootUid && n.uid === 0);
}

/**
 * Isolation Forest simulation — deterministic threshold-based scoring.
 * Factors: tree depth, breadth, cli_entropy, temporal_rate, privilege_transition.
 * Score ranges 0 → 1 (higher = more anomalous).
 */
function computeAnomalyScore(
  tree_depth: number,
  execution_breadth: number,
  cli_entropy: number,
  temporal_rate_ms: number,
  has_privilege_transition: boolean
): number {
  let score = 0;
  // Depth: suspicious if > 4
  score += Math.min(tree_depth / 10, 0.25);
  // Breadth: many siblings at once is unusual
  score += Math.min(execution_breadth / 8, 0.15);
  // CLI entropy: random-looking commands score high
  score += Math.min(cli_entropy / 5, 0.25);
  // Temporal rate: very fast spawning is suspicious
  score += Math.min(temporal_rate_ms / 100, 0.2);
  // Privilege transition is a strong indicator
  if (has_privilege_transition) score += 0.15;

  return Math.min(parseFloat(score.toFixed(3)), 1.0);
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/detection
 * Returns feature engineering results and anomaly detection for each process tree.
 */
router.get("/", (_req: Request, res: Response) => {
  const results = globalStore.trees.map((tree) => {
    const nodes = flattenTree(tree.root);
    const tree_depth = getDepth(tree.root);
    const execution_breadth = Math.max(...nodes.map((n) => (n.children?.length ?? 0)), 0);
    
    // Add small random jitter (±0.02) to simulate live data computation on CLI entropy
    const base_cli = avgCLIEntropy(nodes);
    const jitter = (Math.random() - 0.5) * 0.04;
    const cli_entropy = parseFloat(Math.max(0, base_cli + jitter).toFixed(3));
    
    // Jitter temporal rate ±2 eps
    const base_rate = temporalRateMs(nodes);
    const temporal_rate = Math.max(0, parseFloat((base_rate + (Math.random() * 4 - 2)).toFixed(2)));
    
    const has_privilege_transition = privilegeTransition(nodes);
    const anomaly_score = Number(computeAnomalyScore(
      tree_depth,
      execution_breadth,
      cli_entropy,
      temporal_rate,
      has_privilege_transition
    ).toFixed(3));
    
    const is_anomalous = anomaly_score >= 0.55; // Lowered threshold for more dynamic demo flow

    return {
      tree_id: tree.tree_id,
      label: tree.label,
      root_pid: tree.root.pid,
      features: {
        tree_depth,
        execution_breadth,
        cli_entropy,
        temporal_rate_ms: temporal_rate,
        privilege_transition: has_privilege_transition,
      },
      anomaly_score,
      is_anomalous,
    };
  });

  res.json({ detections: results });
});

export default router;
