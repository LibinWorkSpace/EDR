// ── Telemetry Event ──────────────────────────────────────────────────────────
export type EventType = "PROCESS_EXEC" | "NETWORK_CONNECT" | "FILE_OPEN";

export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  pid: number;
  ppid: number;
  uid: number;
  executable_path: string;
  command_line: string;
  event_type: EventType;
}

// ── Process Tree ─────────────────────────────────────────────────────────────
export interface ProcessNode {
  pid: number;
  ppid: number;
  uid: number;
  executable_path: string;
  command_line: string;
  timestamp: string;
  children?: ProcessNode[];
}

export interface ProcessTree {
  tree_id: string;
  label: string;
  is_suspicious: boolean;
  root: ProcessNode;
}

// ── Feature Engineering + Detection ──────────────────────────────────────────
export interface FeatureSet {
  tree_depth: number;
  execution_breadth: number;
  cli_entropy: number;
  temporal_rate_ms: number;
  privilege_transition: boolean;
}

export interface DetectionResult {
  tree_id: string;
  label: string;
  root_pid: number;
  features: FeatureSet;
  anomaly_score: number;
  is_anomalous: boolean;
}

// ── Response ─────────────────────────────────────────────────────────────────
export type ResponseAction = "kill_process" | "isolate_host" | "alert_soc";

export interface ActionLog {
  id: string;
  action: ResponseAction;
  pid: number;
  tree_id?: string;
  timestamp: string;
  status: string;
  message: string;
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  tree_id: string;
  label: string;
  pid: number;
  anomaly_score: number;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  resolved: boolean;
}
