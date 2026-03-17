import type { TelemetryEvent, ProcessTree, DetectionResult, ActionLog, ResponseAction } from "../types/edr";

const API_BASE = "/api";

export const fetchTelemetryBatch = async (): Promise<TelemetryEvent[]> => {
  const res = await fetch(`${API_BASE}/telemetry`);
  if (!res.ok) throw new Error("Failed to fetch telemetry batch");
  const data = await res.json();
  return data.events;
};

export const fetchProcessTrees = async (): Promise<ProcessTree[]> => {
  const res = await fetch(`${API_BASE}/process-tree`);
  if (!res.ok) throw new Error("Failed to fetch process trees");
  const data = await res.json();
  return data.trees;
};

export const fetchDetections = async (): Promise<DetectionResult[]> => {
  const res = await fetch(`${API_BASE}/detection`);
  if (!res.ok) throw new Error("Failed to fetch detections");
  const data = await res.json();
  return data.detections;
};

export const postResponseAction = async (action: ResponseAction, pid: number, tree_id?: string): Promise<ActionLog> => {
  const res = await fetch(`${API_BASE}/response/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, pid, tree_id }),
  });
  if (!res.ok) throw new Error("Failed to post response action");
  const data = await res.json();
  return data.result;
};

export const fetchActionLog = async (): Promise<ActionLog[]> => {
  const res = await fetch(`${API_BASE}/response/log`);
  if (!res.ok) throw new Error("Failed to fetch response log");
  const data = await res.json();
  return data.actions;
};
