import { useEffect } from "react";
import { Activity, ShieldAlert, Cpu, GitMerge } from "lucide-react";
import { useEDRStore } from "../store/edrStore";

const DashboardInfoCard = ({ title, value, icon, colorClass }: any) => (
  <div className="cyber-panel p-6 flex items-center justify-between">
    <div>
      <h3 className="text-gray-400 font-mono text-sm tracking-wider mb-2">{title}</h3>
      <div className={`text-4xl font-mono font-bold ${colorClass}`}>{value}</div>
    </div>
    <div className={`p-4 rounded-full bg-opacity-10 bg-current ${colorClass}`}>{icon}</div>
  </div>
);

const PipelineDiagram = () => {
  const { isStreaming } = useEDRStore();
  
  return (
    <div className="cyber-panel p-6 mt-6 overflow-hidden relative min-h-[400px]">
      <h2 className="text-xl font-mono text-cyber-accent mb-8 flex items-center">
        <Cpu className="mr-3" /> PIPELINE ARCHITECTURE
        <span className={`ml-4 px-2 py-1 rounded text-xs ${
          isStreaming 
            ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green' 
            : 'bg-gray-500/20 text-gray-500 border border-gray-500'
        }`}>
          {isStreaming ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </h2>
      
      <div className="flex flex-col md:flex-row items-center justify-between w-full h-full relative z-10 space-y-8 md:space-y-0 text-center font-mono text-sm max-w-5xl mx-auto">
        
        {/* Node 1: Endpoint */}
        <div className="flex flex-col items-center relative group">
          <div className={`w-20 h-20 rounded-xl bg-cyber-bg border-2 flex items-center justify-center mb-4 transition-all ${
            isStreaming 
              ? 'border-cyber-accent shadow-cyber group-hover:border-cyber-accent group-hover:shadow-cyber' 
              : 'border-gray-600 group-hover:border-gray-500'
          }`}>
            <Activity className={`transition-colors ${
              isStreaming 
                ? 'text-cyber-accent group-hover:text-cyber-accent' 
                : 'text-gray-500 group-hover:text-gray-400'
            }`} size={32} />
          </div>
          <span className="text-white font-bold">Linux Endpoint</span>
          <span className="text-sm text-gray-300 mt-1">eBPF Sensor</span>
        </div>

        {/* Path 1 */}
        <div className="hidden md:flex flex-1 h-0.5 bg-gray-700 relative mx-4">
          <div className={`absolute top-1/2 left-0 w-full h-0.5 origin-left transition-transform duration-1000 ${
            isStreaming ? 'bg-cyber-accent scale-x-100' : 'bg-gray-600 scale-x-0'
          }`}></div>
          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-sm bg-cyber-bg px-2 font-semibold ${
            isStreaming ? 'text-cyber-accent' : 'text-gray-500'
          }`}>SSE Stream</div>
          {isStreaming && (
            <div className="absolute top-1/2 left-0 w-2 h-2 bg-cyber-accent rounded-full -translate-y-1/2 shadow-cyber animate-[slide-in_2s_linear_infinite]"></div>
          )}
        </div>

        {/* Node 2: Backend */}
        <div className="flex flex-col items-center relative group">
          <div className={`w-20 h-20 rounded-xl bg-cyber-bg border-2 flex items-center justify-center mb-4 ${
            isStreaming 
              ? 'border-cyber-accent shadow-cyber' 
              : 'border-gray-600'
          }`}>
            <svg className={`w-8 h-8 ${isStreaming ? 'text-cyber-accent' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span className={`font-bold text-glitch ${isStreaming ? 'text-cyber-accent' : 'text-gray-500'}`} data-text="Node.js Engine">Node.js Engine</span>
          <span className="text-sm text-gray-300 mt-1">Data Ingestion</span>
        </div>

        {/* Path 2 */}
        <div className="hidden md:flex flex-1 h-0.5 bg-cyber-border relative mx-4">
          {isStreaming && (
            <div className="absolute top-1/2 left-0 w-4 h-1 bg-cyber-purple -translate-y-1/2 shadow-[0_0_10px_#8b5cf6] animate-[slide-in_1.5s_linear_infinite]"></div>
          )}
        </div>

        {/* Node 3: AI/Detection */}
        <div className="flex flex-col items-center relative group">
          <div className={`w-20 h-20 rounded-full bg-cyber-bg border-2 flex items-center justify-center mb-4 relative overflow-hidden ${
            isStreaming 
              ? 'border-cyber-purple shadow-[0_0_15px_#8b5cf6]' 
              : 'border-gray-600'
          }`}>
            {isStreaming && <div className="absolute inset-0 bg-cyber-purple/10 animate-pulse-slow"></div>}
            <Cpu className={`relative z-10 ${isStreaming ? 'text-cyber-purple' : 'text-gray-500'}`} size={32} />
          </div>
          <span className={`font-bold ${isStreaming ? 'text-cyber-purple' : 'text-gray-500'}`}>Isolation Forest</span>
          <span className="text-sm text-gray-300 mt-1">Anomaly Scoring</span>
        </div>

        {/* Path 3 */}
        <div className="hidden md:flex flex-1 h-0.5 bg-cyber-border relative mx-4">
          {isStreaming && (
            <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-cyber-red -translate-y-1/2 shadow-cyber-red animate-[slide-in_1s_linear_infinite_0.5s]"></div>
          )}
        </div>

        {/* Node 4: SOC */}
        <div className="flex flex-col items-center relative group">
          <div className={`w-20 h-20 rounded-sm bg-cyber-bg border-2 flex items-center justify-center mb-4 ${
            isStreaming 
              ? 'border-cyber-red shadow-cyber-red' 
              : 'border-gray-600'
          }`}>
            <ShieldAlert className={isStreaming ? 'text-cyber-red' : 'text-gray-500'} size={32} />
          </div>
          <span className={`font-bold ${isStreaming ? 'text-cyber-red' : 'text-gray-500'}`}>Response Module</span>
          <span className="text-sm text-gray-300 mt-1">Automated Actions</span>
        </div>

      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { events, alerts, processTrees, isStreaming } = useEDRStore();
  
  // Subscribe to store changes to ensure re-renders
  const activeAlerts = alerts.filter(a => !a.resolved);
  const processTreeCount = processTrees.length;
  const eventCount = events.length;

  // Debug logging for alert count changes
  useEffect(() => {
    console.log(`[Dashboard] Active alerts count: ${activeAlerts.length}`);
  }, [activeAlerts.length]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono text-white tracking-widest">SYSTEM OVERVIEW</h1>
        <div className="flex space-x-3">
          <span className={`px-3 py-1 border rounded font-mono text-xs ${
            isStreaming 
              ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent' 
              : 'bg-gray-500/10 border-gray-500 text-gray-500'
          }`}>
            {isStreaming ? 'LIVE MODE' : 'OFFLINE MODE'}
          </span>
          <span className="px-3 py-1 bg-cyber-surface border border-gray-600 text-gray-400 rounded font-mono text-xs">
            v1.0.4-beta
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardInfoCard
          title="EVENTS INGESTED"
          value={isStreaming ? eventCount.toLocaleString() : "0"}
          icon={<Activity size={32} />}
          colorClass={isStreaming ? "text-cyber-accent" : "text-gray-500"}
        />
        <DashboardInfoCard
          title="ACTIVE THREATS"
          value={isStreaming ? activeAlerts.length : "0"}
          icon={<ShieldAlert size={32} />}
          colorClass={isStreaming && activeAlerts.length > 0 ? "text-cyber-red" : "text-gray-500"}
        />
        <DashboardInfoCard
          title="PROCESS GRAPHS"
          value={isStreaming ? processTreeCount : "0"}
          icon={<GitMerge size={32} />}
          colorClass={isStreaming ? "text-cyber-purple" : "text-gray-500"}
        />
      </div>

      <PipelineDiagram />
      
      {/* Live Feed Mini */}
      <div className="cyber-panel p-6">
        <h2 className="text-lg font-mono text-gray-300 mb-4 border-b border-cyber-border pb-2">RECENT TELEMETRY</h2>
        <div className="space-y-2 h-[200px] overflow-hidden relative">
          {!isStreaming ? (
            <div className="text-center text-gray-500 font-mono py-10">
              <Activity className="mx-auto mb-2 text-gray-600" size={32} />
              Click "START STREAM" to begin telemetry collection
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-gray-500 font-mono py-10">
              <div className="animate-pulse">Waiting for telemetry data...</div>
            </div>
          ) : (
            events.slice(0, 5).map((ev) => (
              <div key={ev.event_id} className="flex justify-between items-center text-xs font-mono py-2 border-b border-cyber-border/50 animate-slide-in">
                <span className="text-gray-500 w-48">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                <span className={`w-32 ${ev.event_type === 'PROCESS_EXEC' ? 'text-cyber-accent' : ev.event_type === 'NETWORK_CONNECT' ? 'text-cyber-purple' : 'text-cyber-green'}`}>
                  {ev.event_type}
                </span>
                <span className="text-gray-300 flex-1 truncate">{ev.executable_path} {ev.command_line}</span>
                <span className="text-gray-500 w-24 text-right">PID: {ev.pid}</span>
              </div>
            ))
          )}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-cyber-surface/80 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};
