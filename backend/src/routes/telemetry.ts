import { Router, Request, Response } from "express";
import { MOCK_TELEMETRY_EVENTS } from "../data/mockTelemetry";
import { edrEvents } from "../store";

const router = Router();

/**
 * GET /api/telemetry
 * Returns a random batch of telemetry events (simulates a snapshot pull).
 */
router.get("/", (_req: Request, res: Response) => {
  const shuffled = [...MOCK_TELEMETRY_EVENTS].sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, 8 + Math.floor(Math.random() * 5));
  res.json({ events: batch, total: MOCK_TELEMETRY_EVENTS.length });
});

/**
 * GET /api/telemetry/stream
 * Server-Sent Events endpoint that drip-feeds live events from the EDR simulation engine.
 */
router.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Listen to live simulation events
  edrEvents.on('process_exec', sendEvent);
  edrEvents.on('activity', sendEvent);

  req.on("close", () => {
    edrEvents.off('process_exec', sendEvent);
    edrEvents.off('activity', sendEvent);
  });
});

export default router;
