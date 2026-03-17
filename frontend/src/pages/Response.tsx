import { useEffect, useState } from "react";
import { Terminal, ShieldAlert, Crosshair, WifiOff, BellRing, CheckCircle2 } from "lucide-react";
import { useEDRStore } from "../store/edrStore";
import { postResponseAction, fetchActionLog, fetchDetections } from "../api/client";
import type { Alert, ResponseAction, DetectionResult } from "../types/edr";

export const Response = () => {
  const { alerts, addAlert, dismissAlert, actionLog, addAction } = useEDRStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Sync alerts from live detections
  useEffect(() => {
    let isMounted = true;
    const syncAlerts = async () => {
      try {
        const detections = await fetchDetections();
        if (!isMounted) return;
        
        const currentAlerts = useEDRStore.getState().alerts;
        
        // 1. Handle Additions/Updates
        detections.forEach((det: DetectionResult) => {
          if (det.is_anomalous) {
            const existingAlert = currentAlerts.find(a => a.tree_id === det.tree_id);
            if (!existingAlert) {
              addAlert({
                id: `alert-${det.tree_id}-${Date.now()}`,
                tree_id: det.tree_id,
                label: det.label,
                pid: det.root_pid,
                anomaly_score: det.anomaly_score,
                timestamp: new Date().toISOString(),
                severity: det.anomaly_score > 0.8 ? "CRITICAL" : "HIGH",
                resolved: false,
              });
            } else {
              // Update score if it changed significantly
              if (Math.abs(existingAlert.anomaly_score - det.anomaly_score) > 0.05) {
                // (Score update logic could go here, but for now we'll just let it be)
              }
            }
          }
        });

        // 2. Handle Removals (if tree is gone or no longer anomalous)
        currentAlerts.forEach(alert => {
          if (!alert.resolved) {
            const stillAnomalous = detections.find(d => d.tree_id === alert.tree_id && d.is_anomalous);
            if (!stillAnomalous) {
              // Optionally resolve it automatically
              dismissAlert(alert.id);
            }
          }
        });

      } catch (err) {
        console.error("Failed to sync alerts:", err);
      }
    };

    syncAlerts();
    const interval = setInterval(syncAlerts, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [addAlert, dismissAlert]);

  // Fetch historical actions
  useEffect(() => {
    // Clear any potentially stale alerts from previous sessions on mount
    useEDRStore.setState({ alerts: [] });
    
    fetchActionLog().then(logs => {
      if (useEDRStore.getState().actionLog.length === 0) {
        logs.forEach(l => addAction(l));
      }
    }).catch(console.error);
  }, [addAction]);

  const handleAction = async (alert: Alert, actionType: ResponseAction) => {
    setLoadingAction(`${alert.id}-${actionType}`);
    try {
      const result = await postResponseAction(actionType, alert.pid, alert.tree_id);
      addAction(result);
      // Auto-dismiss alert if we took a strong action
      if (actionType === "kill_process" || actionType === "isolate_host") {
        setTimeout(() => dismissAlert(alert.id), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between border-b border-cyber-border pb-6">
        <div className="flex items-center space-x-4">
          <Terminal className="text-cyber-red" size={36} />
          <div>
            <h1 className="text-3xl font-mono text-white tracking-widest">INCIDENT RESPONSE</h1>
            <p className="text-gray-500 font-mono text-sm mt-1 flex items-center">
              {activeAlerts.length > 0 ? (
                <span className="text-cyber-red animate-pulse flex items-center">
                  <ShieldAlert size={14} className="mr-2" /> AUTOMATED CONTAINMENT REQUIRED
                </span>
              ) : (
                <span className="text-cyber-green flex items-center">
                  <CheckCircle2 size={14} className="mr-2" /> ALL THREATS CONTAINED
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-cyber-bg/50 border border-cyber-accent/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></div>
            <span className="text-[10px] font-mono text-cyber-accent tracking-tighter">LIVE SIGNAL // SENSOR_01</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Col: Active Alerts */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-mono text-cyber-red tracking-wider flex items-center">
            <ShieldAlert className="mr-2" /> ACTIVE INCIDENTS ({activeAlerts.length})
          </h2>

          <div className="space-y-4">
            {activeAlerts.length === 0 && (
              <div className="cyber-panel p-10 text-center flex flex-col items-center justify-center border-cyber-green text-cyber-green bg-cyber-green/5">
                <CheckCircle2 size={48} className="mb-4 opacity-50" />
                <p className="font-mono text-lg">No active security incidents</p>
              </div>
            )}

            {activeAlerts.map(alert => (
              <div key={alert.id} className="cyber-panel p-6 border-l-4 border-l-cyber-red animate-slide-in">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="bg-cyber-red text-white text-xs font-bold px-2 py-0.5 rounded uppercase font-mono">
                        {alert.severity}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-mono text-white mt-2">
                      {alert.label} 
                      <span className="text-cyber-accent/50 text-[10px] ml-2 tracking-widest">
                        #{alert.tree_id.split('-').slice(-1)[0].slice(-6)}
                      </span>
                    </h3>
                    <p className="text-gray-400 font-mono text-sm mt-1">
                      Target PID: <span className="text-cyber-accent font-bold">{alert.pid}</span> | 
                      Tree ID: <span className="text-gray-300">{alert.tree_id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-cyber-red">{(alert.anomaly_score * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">CONFIDENCE</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <button 
                    onClick={() => handleAction(alert, "kill_process")}
                    disabled={loadingAction !== null}
                    className="cyber-btn cyber-btn-accent flex flex-col items-center justify-center py-4 text-center disabled:opacity-50"
                  >
                    <Crosshair size={24} className="mb-2" />
                    <span>TERMINATE PROCESS</span>
                  </button>
                  <button 
                    onClick={() => handleAction(alert, "isolate_host")}
                    disabled={loadingAction !== null}
                    className="cyber-btn cyber-btn-red flex flex-col items-center justify-center py-4 text-center disabled:opacity-50"
                  >
                    <WifiOff size={24} className="mb-2" />
                    <span>ISOLATE HOST</span>
                  </button>
                  <button 
                    onClick={() => handleAction(alert, "alert_soc")}
                    disabled={loadingAction !== null}
                    className="cyber-btn border-cyber-purple text-cyber-purple hover:bg-cyber-purple/10 flex flex-col items-center justify-center py-4 text-center disabled:opacity-50"
                  >
                    <BellRing size={24} className="mb-2" />
                    <span>ESCALATE TO SOC</span>
                  </button>
                </div>
                
                {loadingAction?.startsWith(alert.id) && (
                  <div className="mt-4 text-center text-xs font-mono text-cyber-accent animate-pulse flex items-center justify-center">
                    <Terminal size={14} className="mr-2" />
                    INITIATING RESPONSE SEQUENCE...
                  </div>
                )}
              </div>
            ))}
          </div>

          {resolvedAlerts.length > 0 && (
            <div className="mt-12 opacity-50">
              <h2 className="text-sm font-mono text-gray-400 tracking-wider border-b border-gray-700 pb-2 mb-4">CONTAINED INCIDENTS</h2>
              <div className="space-y-2">
                {resolvedAlerts.map(a => (
                  <div key={a.id} className="flex justify-between items-center text-xs font-mono py-2">
                    <span className="text-gray-500 line-through">{a.label} (PID: {a.pid})</span>
                    <span className="text-cyber-green px-2 py-0.5 border border-cyber-green/50 rounded">RESOLVED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Action Audit Log */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-mono text-gray-300 mb-4 flex items-center">
            <Terminal size={18} className="mr-2 text-cyber-accent" /> COMMAND LOG
          </h2>
          <div className="cyber-panel p-0 overflow-hidden h-full max-h-[600px] flex flex-col">
            <div className="p-3 bg-cyber-bg/80 border-b border-cyber-border text-xs font-mono text-gray-500">
              AUDIT TRAIL // RESTRICTED ACCESS
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {actionLog.length === 0 && (
                <div className="text-center text-gray-600 font-mono text-sm py-10">No actions executed</div>
              )}
              {actionLog.map(log => (
                <div key={log.id} className="text-xs font-mono border-l-2 border-cyber-accent pl-3 py-1">
                  <div className="text-gray-500 mb-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="flex space-x-2 mb-1">
                    <span className="text-cyber-accent">[SYS.CMD]</span>
                    <span className="text-white font-bold">{log.action.toUpperCase()} // PID:{log.pid}</span>
                  </div>
                  <div className="text-gray-400 leading-relaxed">{log.message}</div>
                  <div className={`mt-1 font-bold ${log.status === 'COMPLETED' || log.status.endsWith('ED') ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
                    STATUS: {log.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
