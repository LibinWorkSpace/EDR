import { create } from "zustand";
import type { TelemetryEvent, ProcessTree, DetectionResult, ActionLog, Alert } from "../types/edr";

interface EDRState {
  // Telemetry stream data
  events: TelemetryEvent[];
  addEvent: (event: TelemetryEvent) => void;
  setEvents: (events: TelemetryEvent[]) => void;
  // Process Trees
  processTrees: ProcessTree[];
  setProcessTrees: (trees: ProcessTree[]) => void;
  activeTree: string | null;
  setActiveTree: (id: string | null) => void;
  // Detections
  detections: DetectionResult[];
  setDetections: (results: DetectionResult[]) => void;
  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  archiveAlert: (id: string) => void;
  cleanupOldAlerts: (maxAge?: number) => void;
  // Response Log
  actionLog: ActionLog[];
  addAction: (action: ActionLog) => void;
  // System Status
  isStreaming: boolean;
  setStreaming: (val: boolean) => void;
}

export const useEDRStore = create<EDRState>((set) => ({
  events: [],
  addEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 500) })), // Keep last 500 events
  setEvents: (events) => set({ events }),

  processTrees: [],
  setProcessTrees: (trees) => set({ processTrees: Array.isArray(trees) ? trees : [] }),
  activeTree: null,
  setActiveTree: (id) => set({ activeTree: id }),

  detections: [],
  setDetections: (results) => set({ detections: results }),

  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) })),
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    })),
  archiveAlert: (id) => set((state) => {
    const alertToArchive = state.alerts.find(a => a.id === id);
    if (alertToArchive) {
      console.log(`[EDR] Archiving alert: ${alertToArchive.tree_id} (${alertToArchive.label})`);
    }
    return { alerts: state.alerts.filter(a => a.id !== id) };
  }),
  cleanupOldAlerts: (maxAge = 600000) => // 10 minutes default
    set((state) => {
      const before = state.alerts.length;
      const filtered = state.alerts.filter(a => {
        if (!a.resolved) return true; // Keep unresolved alerts
        const alertAge = Date.now() - new Date(a.timestamp).getTime();
        return alertAge < maxAge; // Remove old resolved alerts
      });
      const cleaned = before - filtered.length;
      if (cleaned > 0) {
        console.log(`[EDR] Cleaned up ${cleaned} old resolved alerts`);
      }
      return { alerts: filtered };
    }),

  actionLog: [],
  addAction: (action) => set((state) => ({ actionLog: [action, ...state.actionLog] })),

  isStreaming: false,
  setStreaming: (val) => set({ isStreaming: val }),
}));
