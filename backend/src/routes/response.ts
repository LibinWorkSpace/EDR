import { Router, Request, Response } from "express";
import { killProcess } from "../store";

const router = Router();

// Simulated action log store (in-memory for demo)
const actionLog: Array<{
  id: string;
  action: string;
  pid: number;
  tree_id?: string;
  timestamp: string;
  status: string;
  message: string;
}> = [];

/**
 * POST /api/response/action
 * Simulates a security response action.
 * Body: { action: "kill_process" | "isolate_host" | "alert_soc", pid: number, tree_id?: string }
 */
router.post("/action", (req: Request, res: Response) => {
  const { action, pid, tree_id } = req.body as {
    action: string;
    pid: number;
    tree_id?: string;
  };

  if (!action || !pid) {
    res.status(400).json({ error: "action and pid are required" });
    return;
  }

  // Effectuate the process tree mutation
  if (action === "kill_process" || action === "isolate_host") {
    killProcess(pid);
  }

  const messages: Record<string, string> = {
    kill_process: `Process PID ${pid} terminated. Child processes cleaned up. Memory reclaimed.`,
    isolate_host: `Host isolation enforced. All inbound/outbound traffic blocked except SOC tunnel. Affected PID: ${pid}.`,
    alert_soc: `SOC alert dispatched. Severity: CRITICAL. Analyst notified via PagerDuty. Ticket #INC-${Math.floor(Math.random() * 90000) + 10000} opened.`,
  };

  const statuses: Record<string, string> = {
    kill_process: "PROCESS_KILLED",
    isolate_host: "HOST_ISOLATED",
    alert_soc: "SOC_ALERTED",
  };

  const entry = {
    id: `action-${Date.now()}`,
    action,
    pid,
    tree_id,
    timestamp: new Date().toISOString(),
    status: statuses[action] ?? "COMPLETED",
    message: messages[action] ?? `Action '${action}' executed on PID ${pid}.`,
  };

  actionLog.push(entry);
  res.json({ success: true, result: entry });
});

/**
 * GET /api/response/log
 * Returns all prior response actions taken in this session.
 */
router.get("/log", (_req: Request, res: Response) => {
  res.json({ actions: actionLog });
});

export default router;
