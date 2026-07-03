import React, { useState } from 'react';
import { 
  Sliders, 
  AlertTriangle, 
  Play, 
  Pause, 
  Zap, 
  RefreshCw, 
  ChevronRight, 
  Bot, 
  CheckCircle2, 
  Activity,
  Cpu,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WarehouseException } from '../types';

interface OperationsConsoleProps {
  autonomousMode: boolean;
  toggleAutonomousMode: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  sapStatus: 'connected' | 'degraded' | 'disconnected';
  setSapStatus: (status: 'connected' | 'degraded' | 'disconnected') => void;
  triggerAnomaly: (type: 'agv_obstruction' | 'conveyor_jam' | 'spill_hazard' | 'high_temp') => void;
  onResetDemo: () => void;
  isSequencing: boolean;
  isPaused: boolean;
  sequenceStep: 'idle' | 'monitor' | 'diagnostic' | 'resolution' | 'validation';
  sequenceExceptionId: string | null;
  onLaunchSequence: () => void;
  onTogglePause: () => void;
  exceptions: WarehouseException[];
}

export default function OperationsConsole({
  autonomousMode,
  toggleAutonomousMode,
  simulationSpeed,
  setSimulationSpeed,
  sapStatus,
  setSapStatus,
  triggerAnomaly,
  onResetDemo,
  isSequencing,
  isPaused,
  sequenceStep,
  sequenceExceptionId,
  onLaunchSequence,
  onTogglePause,
  exceptions,
}: OperationsConsoleProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Helper for step active state styling
  const getStepStatus = (step: typeof sequenceStep) => {
    if (!isSequencing) return 'pending';
    const order = ['monitor', 'diagnostic', 'resolution', 'validation'];
    const currentIndex = order.indexOf(sequenceStep);
    const stepIndex = order.indexOf(step);
    
    if (currentIndex === stepIndex) return 'active';
    if (currentIndex > stepIndex) return 'completed';
    return 'pending';
  };

  const activeException = exceptions.find(e => e.id === sequenceExceptionId);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end">
      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <motion.button
          id="operations-console-collapsed-toggle"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg cursor-pointer hover:bg-primary-dark transition-all duration-200"
          title="Open Operations Console"
        >
          <Sliders className="h-5 w-5 animate-pulse" />
        </motion.button>
      )}

      {/* Floating Cockpit Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="operations-console-panel-card"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-semibold text-text-dark text-sm">Operations Console</h3>
              </div>
              <button
                id="operations-console-close-btn"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-slate-50 hover:text-text-dark cursor-pointer transition-all duration-150"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Content Controls */}
            <div className="space-y-4">
              
              {/* Core Autonomous Mode Controller */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Autonomous Operations Control
                  </span>
                  {isSequencing && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-600 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-150 animate-pulse">
                      <Activity className="h-3 w-3" /> Live Run
                    </span>
                  )}
                </div>

                {/* Primary Action Row */}
                <div className="flex gap-2">
                  <button
                    id="autonomous-mode-launch-btn"
                    onClick={onLaunchSequence}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                      isSequencing && !isPaused
                        ? 'bg-accent-ai text-white animate-pulse'
                        : 'bg-primary text-white hover:bg-primary-dark hover:shadow'
                    }`}
                  >
                    <Bot className="h-4 w-4" />
                    {isSequencing 
                      ? isPaused 
                        ? 'Resume Swarm' 
                          : 'Autonomous Active' 
                        : 'Activate Autonomous Operations'}
                  </button>

                  {isSequencing && (
                    <button
                      id="autonomous-mode-pause-btn"
                      onClick={onTogglePause}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border cursor-pointer transition-all ${
                        isPaused 
                          ? 'border-emerald-200 bg-emerald-50 text-success-ewm hover:bg-emerald-100' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isPaused ? "Resume Agent Loop" : "Pause Agent Loop"}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Active Step Progress Display */}
              {isSequencing && (
                <div className="p-3.5 bg-slate-950 text-white rounded-xl shadow-inner border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">Agent Flow Sequence</span>
                    {activeException && (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        {activeException.id} ({activeException.zone.split(' ')[0]})
                      </span>
                    )}
                  </div>

                  {activeException && (
                    <p className="text-[11px] font-bold text-slate-200 truncate mb-3 italic">
                      "{activeException.title}"
                    </p>
                  )}

                  {/* Step Indicators */}
                  <div className="grid grid-cols-4 gap-1 text-center relative">
                    {/* Connecting line */}
                    <div className="absolute top-3.5 left-1/8 right-1/8 h-0.5 bg-slate-800 -z-0" />
                    
                    {/* Steps */}
                    {(['monitor', 'diagnostic', 'resolution', 'validation'] as const).map((step, idx) => {
                      const status = getStepStatus(step);
                      let colorClass = 'bg-slate-800 text-slate-500 border-slate-700';
                      let labelClass = 'text-slate-500';
                      let Icon = Search;

                      if (step === 'monitor') Icon = Search;
                      else if (step === 'diagnostic') Icon = Cpu;
                      else if (step === 'resolution') Icon = Zap;
                      else Icon = CheckCircle2;

                      if (status === 'completed') {
                        colorClass = 'bg-success-ewm border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                        labelClass = 'text-emerald-400 font-bold';
                      } else if (status === 'active') {
                        colorClass = 'bg-primary border-primary text-white animate-bounce shadow-[0_0_12px_rgba(10,77,140,0.5)]';
                        labelClass = 'text-primary-light font-bold';
                      }

                      return (
                        <div key={step} className="flex flex-col items-center z-10">
                          <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center ${colorClass} text-xs font-bold transition-all duration-300`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className={`text-[9px] mt-1 uppercase font-mono tracking-wider ${labelClass}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exception Controls */}
              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                  Trigger New Exception
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="inject-agv-btn"
                    onClick={() => triggerAnomaly('agv_obstruction')}
                    className="flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border border-warning-ewm/30 bg-warning-ewm/5 hover:bg-warning-ewm/10 text-warning-ewm font-medium text-[11px] cursor-pointer transition-all"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    AGV Obstacle
                  </button>
                  <button
                    id="inject-conveyor-btn"
                    onClick={() => triggerAnomaly('conveyor_jam')}
                    className="flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border border-danger-ewm/30 bg-danger-ewm/5 hover:bg-danger-ewm/10 text-danger-ewm font-medium text-[11px] cursor-pointer transition-all"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Conveyor Jam
                  </button>
                  <button
                    id="inject-spill-btn"
                    onClick={() => triggerAnomaly('spill_hazard')}
                    className="flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border border-danger-ewm/30 bg-danger-ewm/5 hover:bg-danger-ewm/10 text-danger-ewm font-medium text-[11px] cursor-pointer transition-all"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Oil Spill Alert
                  </button>
                  <button
                    id="inject-thermal-btn"
                    onClick={() => triggerAnomaly('high_temp')}
                    className="flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border border-warning-ewm/30 bg-warning-ewm/5 hover:bg-warning-ewm/10 text-warning-ewm font-medium text-[11px] cursor-pointer transition-all"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Thermal Alert
                  </button>
                </div>
              </div>

              {/* Orchestration Speed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                    Execution Cycle Speed
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
                    {([1, 5, 10] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setSimulationSpeed(speed)}
                        className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          simulationSpeed === speed
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-dark'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* ERP Sync Connection */}
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                    SAP S/4 Connection
                  </label>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
                    {(['connected', 'degraded'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setSapStatus(status as any)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer transition-all ${
                          sapStatus === status
                            ? status === 'connected'
                              ? 'bg-success-ewm text-white'
                              : 'bg-warning-ewm text-white'
                            : 'text-text-secondary hover:text-text-dark'
                        }`}
                      >
                        {status === 'connected' ? 'Online' : 'Latency'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset Controls */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  id="reset-demo-baseline-btn"
                  onClick={onResetDemo}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 text-text-secondary hover:text-text-dark hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset to Baseline
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
