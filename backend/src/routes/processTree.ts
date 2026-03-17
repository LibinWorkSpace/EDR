import { Router, Request, Response } from "express";
import { globalStore } from "../store";

const router = Router();

/**
 * GET /api/process-tree
 * Returns all reconstructed process trees with PID/PPID relationships.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({ trees: globalStore.trees });
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
