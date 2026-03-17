import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, GitMerge, ShieldAlert, Terminal, Play, Square } from "lucide-react";
import { useEDRStore } from "../store/edrStore";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/telemetry", icon: <Activity size={20} />, label: "Live Telemetry" },
    { to: "/process-tree", icon: <GitMerge size={20} />, label: "Process Graph" },
    { to: "/detection", icon: <ShieldAlert size={20} />, label: "Detections" },
    { to: "/response", icon: <Terminal size={20} />, label: "Response" },
  ];

  return (
    <div className="w-64 h-full bg-cyber-card border-r border-cyber-border flex flex-col justify-between">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-cyber-border bg-cyber-bg/50">
          <ShieldAlert className="text-cyber-accent mr-3" size={24} />
          <h1 className="text-xl font-mono font-bold tracking-widest text-cyber-text">
            NEXUS<span className="text-cyber-accent">.EDR</span>
          </h1>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-4 py-3 rounded-md transition-all ${
                  isActive
                    ? "bg-cyber-accent/10 text-cyber-accent border border-cyber-accent shadow-cyber"
                    : "text-gray-400 hover:text-cyber-text hover:bg-cyber-surface/50"
                }`}
              >
                {link.icon}
                <span className="ml-3 font-medium tracking-wide">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-cyber-border text-xs text-gray-500 font-mono text-center">
        V 1.0.4-beta / SIMULATION
      </div>
    </div>
  );
};

const TopBar = () => {
  const { isStreaming, setStreaming, alerts } = useEDRStore();
  const [time, setTime] = useState(new Date().toISOString());

  // SSE Management
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (isStreaming) {
      eventSource = new EventSource("/api/telemetry/stream");
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        useEDRStore.getState().addEvent(data);
      };
      eventSource.onerror = () => {
        console.error("SSE stream error");
        eventSource?.close();
        setStreaming(false);
      };
    } else {
      useEDRStore.getState().setEvents([]);
    }
    return () => {
      eventSource?.close();
    };
  }, [isStreaming, setStreaming]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlerts = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="h-16 w-full bg-cyber-card border-b border-cyber-border flex items-center justify-between px-6 shadow-md z-10">
      <div className="flex items-center space-x-4">
        <div className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center ${activeAlerts > 0 ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red animate-pulse' : 'bg-cyber-green/20 text-cyber-green border border-cyber-green'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${activeAlerts > 0 ? 'bg-cyber-red' : 'bg-cyber-green'}`}></div>
          SYSTEM STATUS: {activeAlerts > 0 ? 'COMPROMISED' : 'SECURE'}
        </div>
        {activeAlerts > 0 && (
          <div className="text-xs font-mono text-cyber-red">
            {activeAlerts} ACTIVE ALERT{activeAlerts > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={() => setStreaming(!isStreaming)}
          className={`flex items-center px-4 py-1.5 rounded font-mono text-sm border transition-all ${
            isStreaming
              ? "bg-transparent text-cyber-accent border-cyber-accent cursor-pointer hover:bg-cyber-accent/10"
              : "bg-cyber-bg text-gray-400 border-gray-600 hover:text-white"
          }`}
        >
          {isStreaming ? <Square size={14} className="mr-2" /> : <Play size={14} className="mr-2" />}
          {isStreaming ? "STOP STREAM" : "START STREAM"}
        </button>
        <div className="font-mono text-sm text-gray-400 tracking-wider font-light">
          {time}
        </div>
      </div>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 relative">
          {/* Subtle grid background overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 w-full h-full flex flex-col max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
