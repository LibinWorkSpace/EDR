import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, BackgroundVariant, Handle, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { GitMerge, ShieldAlert } from "lucide-react";
import { useEDRStore } from "../store/edrStore";
import type { ProcessNode } from "../types/edr";

// Custom node component for cyber theme
const CyberNode = ({ data }: any) => {
  return (
    <div className={`cyber-panel p-3 border-2 min-w-[200px] flex items-center shadow-lg transition-all ${
      data.isRoot ? "border-cyber-purple bg-cyber-purple/10" : 
      data.isAnomalous ? "border-cyber-red bg-cyber-red/10 animate-pulse ring-4 ring-cyber-red/20" : 
      "border-cyber-border hover:border-cyber-accent"
    }`}>
      <Handle type="target" position={Position.Top} />
      <div className="w-10 h-10 rounded bg-cyber-bg flex items-center justify-center mr-3 border border-gray-700">
        {data.isAnomalous ? <ShieldAlert className="text-cyber-red" size={20} /> : <TerminalIcon className="text-cyber-accent" size={20} />}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-xs font-mono text-gray-500 mb-1 flex justify-between">
          <span>PID: <span className="text-gray-300">{data.pid}</span></span>
          <span>UID: {data.uid === 0 ? <span className="text-cyber-red">0</span> : data.uid}</span>
        </div>
        <div className="text-sm font-mono text-white truncate font-bold" title={data.executable_path}>
          {data.executable_path.split('/').pop()}
        </div>
        <div className="text-xs font-mono text-gray-400 mt-1 truncate" title={data.command_line}>
          {data.command_line}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const TerminalIcon = ({ className, size }: any) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

// Move nodeTypes outside component to prevent recreation
const nodeTypes = { cyberNode: CyberNode };

export const ProcessTree = () => {
  const { processTrees, activeTree, setActiveTree, isStreaming } = useEDRStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure processTrees is always an array
  const safeProcessTrees = Array.isArray(processTrees) ? processTrees : [];

  // Load trees dynamically - rely on global sync from TopBar
  useEffect(() => {
    if (!isStreaming) {
      // Clear data when streaming is stopped
      setActiveTree(null);
      setLoading(false);
      return;
    }

    // Set active tree if none selected and we have trees
    if (safeProcessTrees.length > 0 && !activeTree) {
      setActiveTree(safeProcessTrees[0].tree_id);
    }
    
    setLoading(false);
  }, [isStreaming, safeProcessTrees, activeTree, setActiveTree]);

  // Transform raw tree into React Flow nodes/edges
  useEffect(() => {
    if (!activeTree || safeProcessTrees.length === 0) return;

    const treeData = safeProcessTrees.find(t => t.tree_id === activeTree);
    if (!treeData) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Simple auto-layout (DFS)
    let yOffset = 50;
    const processNode = (node: ProcessNode, x: number, y: number, isRoot = false) => {
      newNodes.push({
        id: node.pid.toString(),
        type: "cyberNode",
        position: { x, y },
        data: {
          pid: node.pid,
          uid: node.uid,
          executable_path: node.executable_path,
          command_line: node.command_line,
          isRoot,
          isAnomalous: treeData.is_suspicious && (node.uid === 0 || node.executable_path.includes("/tmp")),
        },
      });

      if (node.children) {
        let childX = x - (node.children.length - 1) * 150; // spread children horizontally
        node.children.forEach(child => {
          newEdges.push({
            id: `e-${node.pid}-${child.pid}`,
            source: node.pid.toString(),
            target: child.pid.toString(),
            animated: treeData.is_suspicious, // animate edges for suspicious trees
            style: { stroke: treeData.is_suspicious ? "#ff3366" : "#00d4ff", strokeWidth: 2 },
          });
          processNode(child, childX, y + 150);
          childX += 300;
        });
      }
    };

    processNode(treeData.root, 400, yOffset, true);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [activeTree, safeProcessTrees]);

  if (!isStreaming) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <GitMerge className="text-gray-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-mono text-gray-400 mb-2">PROCESS GRAPH OFFLINE</h2>
          <p className="text-gray-500 font-mono text-sm">Click "START STREAM" to visualize process trees</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-cyber-accent font-mono p-10">LOADING MEMORY FORENSICS...</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in relative z-10 w-full">
      <div className="flex justify-between items-center bg-cyber-card p-4 rounded-lg border border-cyber-border">
        <div className="flex items-center space-x-4">
          <GitMerge className="text-cyber-purple" />
          <h1 className="text-xl font-mono text-white">PROCESS EXECUTION GRAPH</h1>
        </div>
        
        <div className="flex space-x-2">
          {safeProcessTrees.map(t => (
            <button
              key={t.tree_id}
              onClick={() => setActiveTree(t.tree_id)}
              className={`px-4 py-1.5 text-xs font-mono border rounded transition-all flex items-center ${
                activeTree === t.tree_id
                  ? t.is_suspicious
                    ? "bg-cyber-red/20 text-cyber-red border-cyber-red shadow-[0_0_10px_rgba(255,51,102,0.3)]"
                    : "bg-cyber-purple/20 text-cyber-purple border-cyber-purple shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  : "bg-cyber-bg text-gray-500 border-gray-700 hover:text-gray-300"
              }`}
            >
              {t.is_suspicious && <ShieldAlert size={12} className="mr-2" />}
              {t.tree_id}: {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 cyber-panel overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={2}
          className="bg-cyber-bg"
        >
          <Background color="#1e2d4a" variant={BackgroundVariant.Dots} gap={20} size={2} />
          <Controls className="fill-cyber-text bg-cyber-surface border-cyber-border shadow-cyber" />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-cyber-surface/90 border border-cyber-border p-4 rounded-lg backdrop-blur-sm shadow-xl z-10 pointer-events-none">
          <h4 className="font-mono text-xs text-gray-400 mb-3 uppercase tracking-widest">Graph Legend</h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center text-cyber-text"><div className="w-3 h-3 rounded bg-cyber-purple border border-cyber-purple mr-2"></div> Root Process</div>
            <div className="flex items-center text-cyber-accent"><div className="w-3 h-3 rounded bg-cyber-bg border border-cyber-accent mr-2"></div> Standard Process</div>
            <div className="flex items-center text-cyber-red"><div className="w-3 h-3 rounded bg-cyber-red border border-cyber-red ring-2 ring-cyber-red/30 mr-2 animate-pulse"></div> Anomalous Node</div>
          </div>
        </div>
      </div>
    </div>
  );
};
