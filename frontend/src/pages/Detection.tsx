import React, { useEffect, useState } from "react";
import { ShieldAlert, Cpu, AlertTriangle, Fingerprint, ActivitySquare } from "lucide-react";
import { fetchDetections } from "../api/client";
import type { DetectionResult } from "../types/edr";
import { useEDRStore } from "../store/edrStore";

const GaugeCard = ({ score, isAnomalous }: { score: number, isAnomalous: boolean }) => {
  const percentage = Math.round(score * 100);
  const color = isAnomalous ? "#ff3366" : "#00d4ff";
  const bgC = isAnomalous ? "rgba(255, 51, 102, 0.2)" : "rgba(0, 212, 255, 0.2)";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" stroke={bgC} strokeWidth="8" fill="none" />
        {/* Foreground arch */}
        <circle 
          cx="50" cy="50" r="40" 
          stroke={color} 
          strokeWidth="8" 
          fill="none" 
          strokeDasharray="251.2" 
          strokeDashoffset={251.2 - (251.2 * percentage) / 100}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-mono ${isAnomalous ? 'text-cyber-red animate-pulse' : 'text-cyber-accent'}`}>
          {percentage}%
        </span>
        <span className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">SCORE</span>
      </div>
    </div>
  );
};

export const Detection = () => {
  const { detections, setDetections } = useEDRStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadD = () => {
      fetchDetections().then(data => {
        if (!isMounted) return;
        useEDRStore.getState().setDetections(data);
        setLoading(false);
      });
    };
    
    loadD();
    const interval = setInterval(loadD, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="text-cyber-purple font-mono p-10">ANALYZING HEURISTICS...</div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <Cpu className="text-cyber-purple" size={32} />
        <div>
          <h1 className="text-3xl font-mono text-white tracking-widest">ISOLATION FOREST DETECTION</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">Anomaly scoring based on 5-dimensional feature engineering</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {detections.map((res: DetectionResult) => (
          <div 
            key={res.tree_id} 
            className={`cyber-panel p-6 flex flex-col transition-all duration-500 border-2 ${
              res.is_anomalous 
                ? "border-cyber-red/50 shadow-[0_0_15px_rgba(255,51,102,0.15)] bg-gradient-to-b from-cyber-red/5 to-transparent hover:border-cyber-red" 
                : "border-cyber-border hover:border-cyber-accent/50"
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-mono text-white flex items-center">
                  {res.is_anomalous ? <ShieldAlert className="text-cyber-red mr-2" size={20} /> : <ActivitySquare className="text-cyber-accent mr-2" size={20} />}
                  {res.tree_id}
                </h2>
                <div className="text-sm font-mono text-gray-400 mt-1">{res.label}</div>
              </div>
              <GaugeCard score={res.anomaly_score} isAnomalous={res.is_anomalous} />
            </div>

            <h3 className="text-xs font-mono text-gray-500 tracking-widest mb-3 uppercase border-b border-cyber-border pb-2">
              Feature Vector Profile
            </h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-mono mt-2">
              <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                <span className="text-gray-400">Tree Depth:</span>
                <span className={res.features.tree_depth > 3 ? "text-cyber-red" : "text-white"}>{res.features.tree_depth}</span>
              </div>
              <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                <span className="text-gray-400">Exec Breadth:</span>
                <span className={res.features.execution_breadth > 3 ? "text-cyber-red" : "text-white"}>{res.features.execution_breadth}</span>
              </div>
              <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                <span className="text-gray-400">CLI Entropy:</span>
                <span className={res.features.cli_entropy > 3.0 ? "text-cyber-red" : "text-white"}>{res.features.cli_entropy}</span>
              </div>
              <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                <span className="text-gray-400">Temporal Rate:</span>
                <span className={res.features.temporal_rate_ms > 50 ? "text-cyber-red" : "text-white"}>{res.features.temporal_rate_ms} eps</span>
              </div>
              <div className="flex justify-between border-b border-cyber-border/30 pb-1 col-span-2">
                <span className="text-gray-400 flex items-center"><Fingerprint size={14} className="mr-2" /> Priv Transition:</span>
                <span className={res.features.privilege_transition ? "text-cyber-red font-bold animate-pulse" : "text-gray-500"}>
                  {res.features.privilege_transition ? "TRUE (UID 0)" : "FALSE"}
                </span>
              </div>
            </div>

            {res.is_anomalous && (
              <div className="mt-6 bg-cyber-red/10 border border-cyber-red text-cyber-red text-xs font-mono p-3 rounded flex items-start">
                <AlertTriangle size={16} className="mr-3 flex-shrink-0 mt-0.5" />
                <p>AI Engine classified this behavior pattern as highly anomalous. Signature matches T1059 Command and Scripting Interpreter mechanics.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
