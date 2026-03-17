import { useState } from "react";
import { TerminalIcon, Activity, Database } from "lucide-react";
import { useEDRStore } from "../store/edrStore";
import type { EventType } from "../types/edr";

export const Telemetry = () => {
  const { events, isStreaming } = useEDRStore();
  const [filter, setFilter] = useState<EventType | "ALL">("ALL");

  const filteredEvents = filter === "ALL" ? events : events.filter(e => e.event_type === filter);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PROCESS_EXEC": return "text-cyber-accent bg-cyber-accent/10 border-cyber-accent";
      case "NETWORK_CONNECT": return "text-cyber-purple bg-cyber-purple/10 border-cyber-purple";
      case "FILE_OPEN": return "text-cyber-green bg-cyber-green/10 border-cyber-green";
      default: return "text-gray-400 border-gray-600";
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-cyber-card p-4 rounded-lg border border-cyber-border">
        <div className="flex items-center space-x-4">
          <Activity className="text-cyber-accent" />
          <h1 className="text-xl font-mono text-white">LIVE TELEMETRY STREAM</h1>
        </div>
        
        <div className="flex space-x-2">
          {["ALL", "PROCESS_EXEC", "NETWORK_CONNECT", "FILE_OPEN"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 text-xs font-mono border rounded transition-all ${
                filter === f
                  ? "bg-cyber-bg text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  : "bg-transparent text-gray-500 border-gray-700 hover:text-gray-300"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 cyber-panel overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-cyber-border bg-cyber-bg/50 text-xs font-mono text-gray-500 uppercase tracking-wider">
          <div className="col-span-2">TIMESTAMP</div>
          <div className="col-span-1">PID/PPID</div>
          <div className="col-span-1">UID</div>
          <div className="col-span-2">EVENT TYPE</div>
          <div className="col-span-2">EXECUTABLE</div>
          <div className="col-span-4">COMMAND LINE / ARGS</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 relative">
          {!isStreaming && events.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 font-mono">
              <Database size={48} className="mb-4 opacity-20" />
              <p>NO DATA IN STREAM</p>
              <p className="text-xs mt-2">Activate stream from the top control bar</p>
            </div>
          )}

          {filteredEvents.map((ev, i) => (
            <div 
              key={`${ev.event_id}-${i}`} 
              className="grid grid-cols-12 gap-4 p-3 rounded hover:bg-cyber-bg/50 border border-transparent hover:border-cyber-border transition-colors font-mono text-sm group animate-slide-in"
            >
              <div className="col-span-2 text-gray-400 flex items-center">
                {new Date(ev.timestamp).toISOString().split('T')[1].replace('Z', '')}
              </div>
              <div className="col-span-1 text-gray-500 flex items-center">
                {ev.pid} / <span className="text-gray-600 text-xs ml-1">{ev.ppid}</span>
              </div>
              <div className="col-span-1 text-gray-400 flex items-center">{ev.uid === 0 ? <span className="text-cyber-red font-bold">root (0)</span> : ev.uid}</div>
              <div className="col-span-2 flex items-center">
                <span className={`px-2 py-0.5 rounded text-[10px] border tracking-wider ${getTypeColor(ev.event_type)}`}>
                  {ev.event_type}
                </span>
              </div>
              <div className="col-span-2 text-cyber-text truncate flex items-center" title={ev.executable_path}>
                <TerminalIcon size={12} className="mr-2 opacity-50" />
                {ev.executable_path.split('/').pop()}
              </div>
              <div className="col-span-4 text-gray-300 truncate flex items-center" title={ev.command_line}>
                {ev.command_line}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
