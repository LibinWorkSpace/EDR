import { Router } from "express";
import { edrEvents } from "../store";

const router = Router();

// Store recent retirement events (last 200 for better coverage)
const recentRetirements: Array<{
  tree_id: string;
  reason: string;
  timestamp: string;
  age_ms?: number;
  node_count?: number;
}> = [];

// Listen for retirement events and store them
edrEvents.on('tree_retired', (event) => {
  console.log(`[Backend] Tree retired: ${event.tree_id} (${event.reason})`);
  recentRetirements.unshift(event);
  if (recentRetirements.length > 200) {
    recentRetirements.pop();
  }
});

// GET /api/retirement - Get recent tree retirement events
router.get("/", (_req, res) => {
  res.json(recentRetirements);
});

// GET /api/retirement/stream - SSE stream for real-time retirement events
router.get("/stream", (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial data
  res.write(`data: ${JSON.stringify({ 
    retirements: recentRetirements.slice(0, 20), // Last 20 events
    timestamp: new Date().toISOString() 
  })}\n\n`);

  // Listen for new retirement events and stream them
  const retirementHandler = (event: any) => {
    res.write(`data: ${JSON.stringify({ 
      type: 'retirement',
      event,
      timestamp: new Date().toISOString() 
    })}\n\n`);
  };

  edrEvents.on('tree_retired', retirementHandler);

  // Cleanup on client disconnect
  req.on('close', () => {
    edrEvents.off('tree_retired', retirementHandler);
  });
});

// GET /api/retirement/recent/:minutes - Get retirements from last N minutes
router.get("/recent/:minutes", (req, res) => {
  const minutes = parseInt(req.params.minutes) || 5;
  const cutoff = Date.now() - (minutes * 60 * 1000);
  
  const recent = recentRetirements.filter(r => 
    new Date(r.timestamp).getTime() > cutoff
  );
  
  res.json(recent);
});

// DELETE /api/retirement/cleanup - Clear old retirement events
router.delete("/cleanup", (_req, res) => {
  const before = recentRetirements.length;
  const cutoff = Date.now() - (30 * 60 * 1000); // Keep last 30 minutes
  
  while (recentRetirements.length > 0 && 
         new Date(recentRetirements[recentRetirements.length - 1].timestamp).getTime() < cutoff) {
    recentRetirements.pop();
  }
  
  const cleaned = before - recentRetirements.length;
  res.json({ cleaned, remaining: recentRetirements.length });
});

export default router;