import { Router, Request, Response } from "express";
import { globalStore } from "../store";

const router = Router();

/**
 * GET /api/process-tree
 * Returns all reconstructed process trees with PID/PPID relationships.
 */
router.get("/", (req: Request, res: Response) => {
  const clientVersion = parseInt(req.query.version as string) || 0;
  
  if (clientVersion === globalStore.version) {
    // No changes since client's version
    res.json({ 
      trees: globalStore.trees, 
      version: globalStore.version,
      lastUpdate: globalStore.lastUpdate,
      unchanged: true 
    });
  } else {
    // Data has changed
    res.json({ 
      trees: globalStore.trees, 
      version: globalStore.version,
      lastUpdate: globalStore.lastUpdate,
      unchanged: false 
    });
  }
});

/**
 * GET /api/process-tree/stream - SSE stream for real-time process tree updates
 */
router.get("/stream", (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendTrees = () => {
    res.write(`data: ${JSON.stringify({ 
      trees: globalStore.trees, 
      version: globalStore.version,
      lastUpdate: globalStore.lastUpdate,
      timestamp: new Date().toISOString(),
      count: globalStore.trees.length 
    })}\n\n`);
  };

  // Send initial data
  sendTrees();

  // Send updates every 2 seconds
  const interval = setInterval(sendTrees, 2000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * GET /api/process-tree/:treeId
 * Returns a single process tree by ID.
 */
router.get("/:treeId", (req: Request, res: Response) => {
  const tree = globalStore.trees.find((t) => t.tree_id === req.params.treeId);
  if (!tree) {
    res.status(404).json({ error: "Tree not found" });
    return;
  }
  res.json(tree);
});

export default router;
