import React, { useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Eye, 
  Bot, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  Award, 
  Sparkles, 
  Zap, 
  ArrowUpRight,
  Truck,
  ClipboardList,
  Layers,
  FileSpreadsheet,
  Users,
  Flame,
  RefreshCw,
  ShieldAlert,
  Pause,
  Search,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';
import { WarehouseException, WarehouseMetrics, LiveTelemetryLog, AIAgent, ActivityLog } from '../../types';

interface OverviewTabProps {
  metrics: WarehouseMetrics;
  exceptions: WarehouseException[];
  telemetry: LiveTelemetryLog[];
  agents: AIAgent[];
  autonomousMode: boolean;
  onSelectTab: (tab: 'overview' | 'live' | 'agents' | 'resolutions' | 'integrations' | 'analytics') => void;
  onApproveResolution: (id: string) => void;
  onDeclineResolution: (id: string) => void;
  activityLogs: ActivityLog[];
  setSelectedExceptionId?: (id: string | null) => void;
  isSequencing: boolean;
  isPaused: boolean;
  sequenceStep: 'idle' | 'monitor' | 'diagnostic' | 'resolution' | 'validation';
  sequenceExceptionId: string | null;
  onLaunchSequence: () => void;
  onTogglePause: () => void;
  onResetDemo: () => void;
  triggerAnomaly: (type: 'agv_obstruction' | 'conveyor_jam' | 'spill_hazard' | 'high_temp') => void;
}

export default function OverviewTab({
  metrics,
  exceptions,
  telemetry,
  agents,
  autonomousMode,
  onSelectTab,
  onApproveResolution,
  onDeclineResolution,
  activityLogs,
  setSelectedExceptionId,
  isSequencing,
  isPaused,
  sequenceStep,
  sequenceExceptionId,
  onLaunchSequence,
  onTogglePause,
  onResetDemo,
  triggerAnomaly
}: OverviewTabProps) {
  const activeExceptions = exceptions.filter((e) => e.resolutionStatus === 'pending_approval');
  const [comparisonMode, setComparisonMode] = useState<'side' | 'reactive' | 'autonomous'>('side');
  const resolvedCount = exceptions.filter((e) => e.severity === 'resolved' || e.resolutionStatus === 'completed').length;

  // Simulation specific live analytics
  const isSimActive = exceptions.some(e => e.id.startsWith('Issue-'));
  const resolvedSimIssues = exceptions.filter(e => e.id.startsWith('Issue-') && e.resolutionStatus === 'completed');
  const simInterventions = resolvedSimIssues.length;
  const simSavings = resolvedSimIssues.reduce((acc, e) => {
    if (e.id === 'Issue-001') return acc + 2850;
    if (e.id === 'Issue-002') return acc + 1450;
    if (e.id === 'Issue-003') return acc + 1250;
    if (e.id === 'Issue-004') return acc + 3200;
    return acc;
  }, 0);

  // Derived values for 6 premium KPIs
  const activeIssuesCount = activeExceptions.length;
  const avgResolutionTime = isSimActive ? "7.5" : (autonomousMode 
    ? (3.8 + (metrics.currentThroughputHr % 7) / 10).toFixed(1) 
    : "45.2");
  const avgResolutionUnit = isSimActive ? "seconds" : (autonomousMode ? "seconds" : "minutes");
  const avgResolutionSub = isSimActive ? "AI average latency" : (autonomousMode ? "-99.8% vs human manual" : "+145% vs EWM target SLA");
  const avgResolutionColor = isSimActive ? "text-success-ewm" : (autonomousMode ? "text-success-ewm" : "text-danger-ewm");

  const interventionsAvoided = isSimActive ? simInterventions : (autonomousMode ? (1420 + resolvedCount * 12) : 0);
  const interventionsSub = isSimActive ? `${simInterventions} of 4 resolved` : (autonomousMode ? "+14.2% auto-recovery rate" : "Manual dispatch required");
  const interventionsColor = isSimActive || autonomousMode ? "text-success-ewm" : "text-danger-ewm";

  const estCostSavings = isSimActive ? simSavings : (autonomousMode ? (12450 + resolvedCount * 145) : 0);
  const estCostSavingsSub = isSimActive ? `+$${simSavings.toLocaleString()} saved live` : (autonomousMode ? "+$1,450 saved today" : "$0 saved (SLA Leakage)");
  const estCostSavingsColor = isSimActive || autonomousMode ? "text-success-ewm" : "text-danger-ewm";

  const throughputPercent = isSimActive
    ? (simInterventions === 1 ? 8 : simInterventions === 2 ? 15 : simInterventions === 3 ? 22 : simInterventions === 4 ? 31 : 0)
    : Math.min(99.8, parseFloat(((metrics.currentThroughputHr / 1000) * 100).toFixed(1)));
  const autonomyScore = isSimActive ? Math.min(100, Math.round(42 + (simInterventions * 14.5))) : (autonomousMode ? 96 : 42);

  // Real-time Warehouse State derived values
  const occupiedDocksVal = autonomousMode ? "3 / 5" : "4 / 5";
  const openTasksVal = 42 + activeExceptions.length * 6;
  const qRfcLengthVal = activeExceptions.length > 0 ? "SMQ1: 3 | SMQ2: 1" : "SMQ1: 0 | SMQ2: 0";
  const idocsPendingVal = activeExceptions.filter(e => e.title.toLowerCase().includes("idoc") || e.description.toLowerCase().includes("idoc")).length;
  const resourceUtilVal = autonomousMode ? 79 : 92;
  const dockCongestionVal = activeExceptions.length > 2 ? "HIGH" : activeExceptions.length > 0 ? "MEDIUM" : "LOW";

  // Let's design some custom SVG chart data points for throughput
  const svgPoints = [
    { x: 50, y: 150, time: '04:00', val: 620 },
    { x: 150, y: 120, time: '05:00', val: 780 },
    { x: 250, y: 140, time: '06:00', val: 690 },
    { x: 350, y: 80, time: '07:00', val: 980 },
    { x: 450, y: 60, time: '08:00', val: 1120 },
    { x: 550, y: 90, time: '09:00', val: metrics.currentThroughputHr }
  ];

  const chartPath = svgPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${chartPath} L ${svgPoints[svgPoints.length - 1].x} 200 L ${svgPoints[0].x} 200 Z`;

  return (
    <div className="space-y-6">
      
      {/* 1. Autonomous Engine Banner (If on) */}
      {autonomousMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-accent-ai-light/20 border border-accent-ai/30 text-primary-dark"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-ai text-white shadow-sm ai-pulse-glow">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Autonomous Decision Loop Active</h4>
              <p className="text-xs text-text-secondary">EWM Decisions are currently handled automatically by the AI Agent Swarm without requiring supervisor validation.</p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-ai/20 text-primary border border-accent-ai/40">
            Auto-Resolving Exceptions
          </span>
        </motion.div>
      )}

      {/* Dynamic Autonomous Operations Impact Control Banner */}
      {isSimActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/35 shadow-xl relative overflow-hidden"
        >
          {/* Animated pulsing background light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.2),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${simInterventions === 4 ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${simInterventions === 4 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                  {simInterventions === 4 ? 'Swarm Audit Complete' : 'Swarm Impact Monitor'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Cpu className={`h-5 w-5 text-cyan-400 ${simInterventions === 4 ? '' : 'animate-spin-slow'}`} />
                {simInterventions === 4 ? 'Autonomous Swarm Execution Complete!' : 'Autonomous Operations Impact Monitor'}
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                {simInterventions === 4
                  ? 'All 4 critical SAP EWM exceptions have been triaged, diagnosed, and resolved autonomously by the agent cluster with 100% resolution accuracy.'
                  : 'Active live-triage of SAP EWM exceptions. The AI agent cluster is resolving bottlenecks sequentially with zero human overhead.'
                }
              </p>
            </div>

            {/* Metrics display with 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 border border-white/10 rounded-xl p-4 shrink-0 w-full xl:w-auto min-w-[320px] xl:min-w-[580px]">
              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Avoided Loop</span>
                <motion.span 
                  key={simInterventions}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl md:text-2xl font-black text-cyan-400 font-mono block mt-1"
                >
                  {simInterventions}
                </motion.span>
                <span className="text-[9px] text-slate-300 font-medium block mt-0.5">Human Interventions Avoided</span>
              </div>

              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Estimated Savings</span>
                <motion.span 
                  key={simSavings}
                  initial={{ y: -5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl md:text-2xl font-black text-emerald-400 font-mono block mt-1"
                >
                  ${simSavings.toLocaleString()}
                </motion.span>
                <span className="text-[9px] text-slate-300 font-medium block mt-0.5">Estimated Savings</span>
              </div>

              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Throughput Boost</span>
                <motion.span 
                  key={simInterventions}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl md:text-2xl font-black text-amber-400 font-mono block mt-1"
                >
                  +{throughputPercent}%
                </motion.span>
                <span className="text-[9px] text-slate-300 font-medium block mt-0.5 font-semibold">Warehouse Throughput</span>
              </div>

              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Manual Touch</span>
                <motion.span 
                  className="text-xl md:text-2xl font-black text-rose-400 font-mono block mt-1"
                >
                  0
                </motion.span>
                <span className="text-[9px] text-slate-300 font-medium block mt-0.5">Touchpoints after detection</span>
              </div>
            </div>
          </div>

          {/* Overall progress bar at the bottom of the banner */}
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden relative z-10">
            <motion.div 
              className={`h-full rounded-full ${simInterventions === 4 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-cyan-400 to-indigo-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${(simInterventions / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {/* Prominent Operations Console Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
        {/* Decorative ambient background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary animate-pulse" />
              AI Agent Swarm & Exception Operations Console
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-3xl">
              Activate autonomous operations to let AI Agents triage, diagnose, and resolve warehouse exceptions step-by-step in real-time. Trigger dynamic exceptions to trace recovery pathways or reset to nominal baseline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Trigger New Exception dropdown/quick buttons */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
              <span className="text-[10px] font-bold text-text-secondary uppercase px-2">Trigger Exception:</span>
              <button
                id="inline-inject-agv-btn"
                onClick={() => triggerAnomaly('agv_obstruction')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-warning-ewm/5 hover:border-warning-ewm/30 text-[10px] font-bold text-warning-ewm rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" /> AGV Obstacle
              </button>
              <button
                id="inline-inject-conveyor-btn"
                onClick={() => triggerAnomaly('conveyor_jam')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-danger-ewm/5 hover:border-danger-ewm/30 text-[10px] font-bold text-danger-ewm rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" /> Conveyor Jam
              </button>
              <button
                id="inline-inject-spill-btn"
                onClick={() => triggerAnomaly('spill_hazard')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-danger-ewm/5 hover:border-danger-ewm/30 text-[10px] font-bold text-danger-ewm rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" /> Spill Alert
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls & Real-Time Sequencer Progress Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-5 border-t border-slate-100 items-center">
          
          {/* Main Operations Action Buttons */}
          <div className="lg:col-span-5 flex flex-wrap items-center gap-3">
            <button
              id="inline-launch-autonomous-btn"
              onClick={onLaunchSequence}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                isSequencing && !isPaused
                  ? 'bg-accent-ai hover:bg-accent-ai text-white animate-pulse shadow-[0_0_15px_rgba(0,180,216,0.3)]'
                  : 'bg-primary hover:bg-primary-dark text-white hover:shadow-md'
              }`}
            >
              <Bot className={`h-4.5 w-4.5 ${isSequencing && !isPaused ? 'animate-bounce' : ''}`} />
              {isSequencing 
                ? isPaused 
                  ? '▶️ Resume Swarm Sequence' 
                  : '🤖 Swarm Actively Resolving...' 
                : '⚡ Activate Autonomous Operations'}
            </button>

            {isSequencing && (
              <button
                id="inline-toggle-pause-btn"
                onClick={onTogglePause}
                className={`py-3 px-4 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isPaused 
                    ? 'border-emerald-200 bg-emerald-50 text-success-ewm hover:bg-emerald-100' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 fill-current" /> Pause Sequence
                  </>
                )}
              </button>
            )}

            <button
              id="inline-reset-demo-btn"
              onClick={onResetDemo}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset to Baseline
            </button>
          </div>

          {/* Real-time sequencing visualizer inside the card */}
          <div className="lg:col-span-7">
            {isSequencing ? (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
                
                {/* Active Focus Exception Info */}
                {(() => {
                  const activeExc = exceptions.find(e => e.id === sequenceExceptionId);
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                            LIVE TRIAGE TARGET: {activeExc?.id || sequenceExceptionId}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-100 mt-1">
                          {activeExc?.title || 'Resolving Active Anomaly'}
                        </h4>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-center">
                        ZONE: <span className="text-cyan-400 font-bold">{activeExc?.zone || 'EWM GRID'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Responsive Orchestration Flow with Connectors */}
                <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 px-1 relative">
                  
                  {/* Step 1: Monitor Agent */}
                  {(() => {
                    const status = (() => {
                      const order = ['monitor', 'diagnostic', 'resolution', 'validation'];
                      const cur = order.indexOf(sequenceStep);
                      if (cur === 0) return 'active';
                      if (cur > 0) return 'completed';
                      return 'pending';
                    })();
                    
                    return (
                      <div className={`flex-1 flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                        status === 'active' ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(0,180,216,0.15)]' :
                        status === 'completed' ? 'bg-slate-900/40 border-emerald-500/40' :
                        'bg-slate-900/10 border-slate-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all duration-300 shrink-0 ${
                            status === 'active' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(0,180,216,0.4)]' :
                            status === 'completed' ? 'bg-emerald-500 text-white border-emerald-400' :
                            'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            <Search className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block leading-tight">Monitor Agent</span>
                            <span className={`text-[9px] font-black tracking-wider uppercase ${
                              status === 'active' ? 'text-cyan-400 animate-pulse' :
                              status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {status === 'active' ? '● Scanning' : status === 'completed' ? 'Captured ✓' : 'Standby'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium leading-normal">
                          Supervises queues, IDocs, and resource signals.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Flow Connector 1 */}
                  {(() => {
                    const isFlowActive = ['diagnostic', 'resolution', 'validation'].includes(sequenceStep);
                    return (
                      <div className="flex items-center justify-center self-center shrink-0">
                        {/* Desktop: arrow right */}
                        <div className="hidden md:block">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12H20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M14 6L20 12L14 18" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                        {/* Mobile: arrow down */}
                        <div className="md:hidden py-1">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4V20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M6 14L12 20L18 14" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Step 2: Diagnostic Agent */}
                  {(() => {
                    const status = (() => {
                      const order = ['monitor', 'diagnostic', 'resolution', 'validation'];
                      const cur = order.indexOf(sequenceStep);
                      if (cur === 1) return 'active';
                      if (cur > 1) return 'completed';
                      return 'pending';
                    })();
                    
                    return (
                      <div className={`flex-1 flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                        status === 'active' ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(0,180,216,0.15)]' :
                        status === 'completed' ? 'bg-slate-900/40 border-emerald-500/40' :
                        'bg-slate-900/10 border-slate-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all duration-300 shrink-0 ${
                            status === 'active' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(0,180,216,0.4)]' :
                            status === 'completed' ? 'bg-emerald-500 text-white border-emerald-400' :
                            'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block leading-tight">Diagnostic Agent</span>
                            <span className={`text-[9px] font-black tracking-wider uppercase ${
                              status === 'active' ? 'text-cyan-400 animate-pulse' :
                              status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {status === 'active' ? '● Analyzing' : status === 'completed' ? 'Diagnosed ✓' : 'Standby'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium leading-normal">
                          Performs root-cause analysis and fault isolation.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Flow Connector 2 */}
                  {(() => {
                    const isFlowActive = ['resolution', 'validation'].includes(sequenceStep);
                    return (
                      <div className="flex items-center justify-center self-center shrink-0">
                        {/* Desktop: arrow right */}
                        <div className="hidden md:block">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12H20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M14 6L20 12L14 18" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                        {/* Mobile: arrow down */}
                        <div className="md:hidden py-1">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4V20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M6 14L12 20L18 14" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Step 3: Resolution Agent */}
                  {(() => {
                    const status = (() => {
                      const order = ['monitor', 'diagnostic', 'resolution', 'validation'];
                      const cur = order.indexOf(sequenceStep);
                      if (cur === 2) return 'active';
                      if (cur > 2) return 'completed';
                      return 'pending';
                    })();
                    
                    return (
                      <div className={`flex-1 flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                        status === 'active' ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(0,180,216,0.15)]' :
                        status === 'completed' ? 'bg-slate-900/40 border-emerald-500/40' :
                        'bg-slate-900/10 border-slate-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all duration-300 shrink-0 ${
                            status === 'active' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(0,180,216,0.4)]' :
                            status === 'completed' ? 'bg-emerald-500 text-white border-emerald-400' :
                            'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            <Zap className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block leading-tight">Resolution Agent</span>
                            <span className={`text-[9px] font-black tracking-wider uppercase ${
                              status === 'active' ? 'text-cyan-400 animate-pulse' :
                              status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {status === 'active' ? '● Executing' : status === 'completed' ? 'Executed ✓' : 'Standby'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium leading-normal">
                          Executes Direct BAPI overrides & RPC repairs.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Flow Connector 3 */}
                  {(() => {
                    const isFlowActive = sequenceStep === 'validation';
                    return (
                      <div className="flex items-center justify-center self-center shrink-0">
                        {/* Desktop: arrow right */}
                        <div className="hidden md:block">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12H20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M14 6L20 12L14 18" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                        {/* Mobile: arrow down */}
                        <div className="md:hidden py-1">
                          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4V20" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinecap="round" className={isFlowActive ? "animate-flow-dash" : ""} />
                            <path d="M6 14L12 20L18 14" stroke={isFlowActive ? "#00B4D8" : "#334155"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Step 4: Validation Agent */}
                  {(() => {
                    const status = sequenceStep === 'validation' ? 'active' : 'pending';
                    return (
                      <div className={`flex-1 flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                        status === 'active' ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(0,180,216,0.15)]' :
                        'bg-slate-900/10 border-slate-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all duration-300 shrink-0 ${
                            status === 'active' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(0,180,216,0.4)]' :
                            'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block leading-tight">Validation Agent</span>
                            <span className={`text-[9px] font-black tracking-wider uppercase ${
                              status === 'active' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
                            }`}>
                              {status === 'active' ? '● Auditing' : 'Standby'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium leading-normal">
                          Verifies restored systems & closes the SLA loop.
                        </p>
                      </div>
                    );
                  })()}

                </div>

                {/* AI Agent Thinking & Action Loader Row */}
                <div className="border-t border-slate-850 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-400 select-none shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    <span className="font-extrabold uppercase tracking-wide">
                      {sequenceStep === 'monitor' ? 'AI Scanning' : sequenceStep === 'diagnostic' ? 'AI Diagnosing' : sequenceStep === 'resolution' ? 'AI Thinking' : 'AI Closing'}...
                    </span>
                  </div>
                  <div className="text-slate-350 font-semibold text-left sm:text-right flex-1 truncate">
                    {sequenceStep === 'monitor' && '🔍 [Sensor Watchdog] Ingesting real-time LiDAR telemetry & outfeed qRFC queues...'}
                    {sequenceStep === 'diagnostic' && '🧠 [Cognitive Swarm] Tracing anomaly signatures... correlating fault codes in EWM logs...'}
                    {sequenceStep === 'resolution' && '⚡ [Consensus Solver] Executing transaction reprocess & BAPI parameter updates...'}
                    {sequenceStep === 'validation' && '✅ [Verification Guard] Pinging restored nodes... verifying SLA close conditions.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-dark">Autonomous Swarm Ready</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    No active sequence currently processing. Click "Activate Autonomous Operations" or trigger dynamic alerts to begin tracing.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. Premium 6 KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Active Issues */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Active Exceptions</span>
            <div className={`rounded-xl p-2.5 ${activeIssuesCount > 0 ? 'bg-rose-50 text-danger-ewm' : 'bg-emerald-50 text-success-ewm'}`}>
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={activeIssuesCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-black tracking-tight ${activeIssuesCount > 0 ? 'text-danger-ewm' : 'text-text-dark'}`}
              >
                {activeIssuesCount}
              </motion.span>
              <span className="text-[10px] font-bold text-text-secondary uppercase">
                {activeIssuesCount === 1 ? 'Issue' : 'Issues'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 mt-2">
              {activeIssuesCount > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-danger-ewm animate-ping shrink-0" />
                  <span className="text-[10px] text-danger-ewm font-semibold">Triage Required</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-success-ewm shrink-0" />
                  <span className="text-[10px] text-success-ewm font-semibold">All Clear</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Avg AI Resolution Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Avg Resolve Time</span>
            <div className={`rounded-xl p-2.5 ${autonomousMode ? 'bg-cyan-50 text-accent-ai' : 'bg-rose-50 text-danger-ewm'}`}>
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={avgResolutionTime}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black text-text-dark tracking-tight"
              >
                {avgResolutionTime}
              </motion.span>
              <span className="text-xs font-bold text-text-secondary">{avgResolutionUnit}</span>
            </div>
            <div className={`text-[10px] ${avgResolutionColor} font-semibold flex items-center gap-0.5 mt-2`}>
              {autonomousMode ? (
                <TrendingUp className="h-3 w-3 transform rotate-180" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {avgResolutionSub}
            </div>
          </div>
        </div>

        {/* KPI 3: Human Interventions Avoided */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Interventions Avoided</span>
            <div className={`rounded-xl p-2.5 ${autonomousMode ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-500'}`}>
              <Cpu className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={interventionsAvoided}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-text-dark tracking-tight"
              >
                {interventionsAvoided.toLocaleString()}
              </motion.span>
            </div>
            <div className={`text-[10px] ${interventionsColor} font-semibold flex items-center gap-0.5 mt-2`}>
              {autonomousMode ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {interventionsSub}
            </div>
          </div>
        </div>

        {/* KPI 4: Estimated Cost Savings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Est. Cost Savings</span>
            <div className={`rounded-xl p-2.5 ${autonomousMode ? 'bg-emerald-50 text-success-ewm' : 'bg-rose-50 text-danger-ewm'}`}>
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-black text-text-dark">$</span>
              <motion.span
                key={estCostSavings}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black text-text-dark tracking-tight"
              >
                {estCostSavings.toLocaleString()}
              </motion.span>
            </div>
            <div className={`text-[10px] ${estCostSavingsColor} font-semibold flex items-center gap-0.5 mt-2`}>
              {autonomousMode ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {estCostSavingsSub}
            </div>
          </div>
        </div>

        {/* KPI 5: Warehouse Throughput % */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Throughput Rate</span>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={throughputPercent}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-text-dark tracking-tight"
              >
                {isSimActive ? `+${throughputPercent}%` : `${throughputPercent}%`}
              </motion.span>
            </div>
            <div className="text-[10px] text-text-secondary mt-2">
              {isSimActive ? "Autonomous throughput boost" : `Current: ${metrics.currentThroughputHr} units/hr`}
            </div>
          </div>
        </div>

        {/* KPI 6: Autonomy Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Autonomy Score</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-warning-ewm">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <motion.span
                key={autonomyScore}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-text-dark tracking-tight"
              >
                {autonomyScore}%
              </motion.span>
              
              {/* Horizontal Progress bar for score */}
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${autonomousMode ? 'bg-accent-ai' : 'bg-warning-ewm'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${autonomyScore}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] text-text-secondary mt-2">
              {autonomousMode ? 'Dynamic Agent Loop enabled' : 'Manual supervisor queue'}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Interactive "Reactive vs Autonomous" Comparison Module */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-text-dark flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-ai" />
              Process Analysis: Reactive vs. Autonomous Paradigm
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Analyze the operational leap between slow, human-in-the-loop manual tickets and sub-second agent swarm resolution loops.
            </p>
          </div>

          {/* Selector Switch buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setComparisonMode('side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                comparisonMode === 'side'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-dark'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setComparisonMode('reactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                comparisonMode === 'reactive'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-dark'
              }`}
            >
              🔴 Traditional (Reactive)
            </button>
            <button
              onClick={() => setComparisonMode('autonomous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                comparisonMode === 'autonomous'
                  ? 'bg-accent-ai text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-dark'
              }`}
            >
              🤖 Autonomous (AI-Agent)
            </button>
          </div>
        </div>

        {/* Comparison Content Switcher */}
        {comparisonMode === 'side' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Legacy Bottlenecks Card */}
            <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5 flex flex-col justify-between shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-sans">Traditional Reactive Pipeline</h4>
                    <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">35-45 Min Avg. Recovery</span>
                  </div>
                </div>
                
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Traditional WMS & ERP systems operate passively. When an AGV experiences sensory occlusion, conveyor jams, or inventory mismatches, a ticket is logged in S/4HANA waiting for a manual supervisor check. Operators stand idle, sorters experience back-pressure, and dock doors experience truck line-ups.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-rose-500">❌</span>
                    <span><strong>Static Queuing:</strong> Issues sit in backend SMQ1 queues until human review.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-rose-500">❌</span>
                    <span><strong>Friction & Delay:</strong> Operators wait idle for dispatch orders to troubleshoot jams.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-rose-500">❌</span>
                    <span><strong>Severe Back-Pressure:</strong> Downtime costs cascade into secondary lines instantly.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">COGNITIVE LOAD: HIGH</span>
                <span className="text-xs font-extrabold text-rose-500 font-mono">Est. Loss: $420/min</span>
              </div>
            </div>

            {/* Autonomous Future Card */}
            <div className="rounded-2xl border border-accent-ai/20 bg-gradient-to-br from-accent-ai-light/5 via-white to-primary/5 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-ai/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-ai text-white shadow-sm shadow-accent-ai/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider font-sans">AI Autonomous Control Loop</h4>
                    <span className="text-[10px] font-mono font-bold text-success-ewm bg-emerald-50 px-2 py-0.5 rounded-full">⚡ &lt; 5 Sec Auto-Healing</span>
                  </div>
                </div>
                
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  The Autonomous EWM Agent Swarm continuously intercepts raw telemetry at the edge. Dedicated specialized agents form a consensus diagnostic circle, execute dynamic alternate routing grids for AGVs, and re-allocate active picking bins instantly in SAP—closing loops before the human crew registers the alarm.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-success-ewm">✅</span>
                    <span><strong>Active Listening:</strong> Instant sub-second sensor stream correlation.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-success-ewm">✅</span>
                    <span><strong>Swarm Consensus:</strong> Multi-agent system analyzes causal paths simultaneously.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-text-secondary">
                    <span className="text-success-ewm">✅</span>
                    <span><strong>API Automation:</strong> Auto-heals S/4HANA records and PLC systems remotely.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-mono text-accent-ai">COGNITIVE LOAD: ZERO</span>
                <span className="text-xs font-extrabold text-success-ewm font-mono">Saved: 98% Overhead</span>
              </div>
            </div>

          </div>
        )}

        {comparisonMode === 'reactive' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <strong className="font-bold font-sans">Traditional Reactive Process:</strong> Demands multiple levels of manual confirmation. When a hardware fault blocks cargo flow, operations freeze until human managers intervene.
              </div>
            </div>

            {/* Steps Timeline visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2 relative">
              {/* Connector line for large screens */}
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-rose-200 -z-0" />

              {[
                { label: '1. Hardware Fault', desc: 'conveyor lock / AGV path blocked', time: '0m', icon: AlertTriangle, col: 'border-rose-300 bg-white text-rose-600' },
                { label: '2. Alarm Escalated', desc: 'Ticket enters manual supervisor queue', time: '5m', icon: Clock, col: 'border-rose-300 bg-white text-rose-600' },
                { label: '3. Investigation', desc: 'Technician arrives, reviews terminal codes', time: '18m', icon: Search, col: 'border-rose-300 bg-white text-rose-600' },
                { label: '4. Manual Reset', desc: 'Operator physically clears hardware anomaly', time: '30m', icon: Sliders, col: 'border-rose-300 bg-white text-rose-600' },
                { label: '5. Line Restarts', desc: 'System resumes, heavy queue congestion', time: '35m', icon: CheckCircle2, col: 'bg-rose-500 border-rose-600 text-white' }
              ].map((step, idx) => (
                <div key={idx} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between relative z-10 text-center items-center shadow-sm">
                  <span className="absolute top-2 right-2 text-[10px] font-mono font-bold text-rose-500">{step.time}</span>
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center mb-3 ${step.col}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-extrabold text-text-dark font-sans">{step.label}</h5>
                  <p className="text-[10px] text-text-secondary mt-1 max-w-[140px] font-sans leading-normal">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {comparisonMode === 'autonomous' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs flex items-center gap-3">
              <Bot className="h-5 w-5 shrink-0 text-accent-ai" />
              <div>
                <strong className="font-bold font-sans">Autonomous Agent Cycle:</strong> Telemetry streams directly into specialized sub-agents. Issues are analyzed, diagnosed, and resolved at the API/PLC layer within seconds.
              </div>
            </div>

            {/* Steps Timeline visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2 relative">
              {/* Connector line for large screens */}
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-cyan-200 -z-0" />

              {[
                { label: '1. Event Ingest', desc: 'Sensor stream telemetry is intercepted', time: '<10ms', icon: Activity, col: 'border-cyan-300 bg-white text-accent-ai' },
                { label: '2. Triage Circle', desc: 'Diagnostic Agent localizes causal node', time: '150ms', icon: Cpu, col: 'border-cyan-300 bg-white text-accent-ai' },
                { label: '3. Swarm Solve', desc: 'Agents agree on corrective PLC payload', time: '450ms', icon: Sparkles, col: 'border-cyan-300 bg-white text-accent-ai' },
                { label: '4. API Patch', desc: 'EWM bypass or alternate route applied', time: '1.2s', icon: Zap, col: 'border-cyan-300 bg-white text-accent-ai' },
                { label: '5. Loop Closed', desc: 'Telemetry checks clear, normal flow restored', time: '4.5s', icon: CheckCircle2, col: 'bg-accent-ai border-cyan-400 text-white' }
              ].map((step, idx) => (
                <div key={idx} className="border border-cyan-100 rounded-xl p-4 bg-cyan-50/20 flex flex-col justify-between relative z-10 text-center items-center shadow-sm">
                  <span className="absolute top-2 right-2 text-[10px] font-mono font-bold text-cyan-500">{step.time}</span>
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center mb-3 ${step.col}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-extrabold text-text-dark font-sans">{step.label}</h5>
                  <p className="text-[10px] text-text-secondary mt-1 max-w-[140px] font-sans leading-normal">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Comparison Summary Table/Cards */}
        <div className="mt-6 p-4.5 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Avg. Resolution Time</span>
            <div className="flex justify-center items-center gap-2 mt-1.5">
              <span className="text-xs text-rose-600 font-bold line-through">45 mins</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-sm text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                7.5 sec
              </span>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Human Touchpoints</span>
            <div className="flex justify-center items-center gap-2 mt-1.5">
              <span className="text-xs text-rose-600 font-bold line-through">4-5 steps</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-sm text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                0 Touch
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Throughput Boost</span>
            <div className="flex justify-center items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-500 font-medium">SLA Limit</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-sm text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                +31% Boost
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Financial Impact</span>
            <div className="flex justify-center items-center gap-2 mt-1.5">
              <span className="text-xs text-rose-600 font-bold line-through">$420/min</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-sm text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                $0 (Risk Free)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Real-time Warehouse State Sub-grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Live Warehouse State Parameters
          </h3>
          <span className="text-[10px] font-mono text-text-secondary">
            Last Updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* Card 1: Inbound Docks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Inbound Docks</span>
              <Truck className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-text-dark">{occupiedDocksVal}</span>
                <span className="text-[10px] font-bold text-text-secondary">Occupied</span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 leading-tight truncate">
                {autonomousMode ? "Bay 1, 3, 5 Active • Flowing" : "Bay 1, 2, 4, 5 Active • Waiting"}
              </p>
            </div>
          </div>

          {/* Card 2: Open Warehouse Tasks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Open Tasks</span>
              <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-text-dark">{openTasksVal}</span>
                <span className="text-[10px] font-bold text-text-secondary">Tasks Active</span>
              </div>
              <p className="text-[10px] text-success-ewm font-semibold mt-1.5 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3 transform rotate-180" />
                SLA Compliance: 98.4%
              </p>
            </div>
          </div>

          {/* Card 3: qRFC Queue Length */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">qRFC Queues</span>
              <Layers className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-text-dark truncate">
                  {activeExceptions.length > 0 ? "SMQ1 (Out): 3" : "SMQ1 (Out): 0"}
                </span>
                <span className="text-xs font-mono font-bold text-text-dark truncate">
                  SMQ2 (In): 0
                </span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 truncate">
                {activeExceptions.length > 0 ? "⚠️ Channel retry active" : "✅ Systems fully in sync"}
              </p>
            </div>
          </div>

          {/* Card 4: Critical IDocs Pending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Critical IDocs</span>
              <FileSpreadsheet className={`h-4.5 w-4.5 ${idocsPendingVal > 0 ? 'text-danger-ewm animate-pulse' : 'text-emerald-500'}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-extrabold ${idocsPendingVal > 0 ? 'text-danger-ewm' : 'text-text-dark'}`}>
                  {idocsPendingVal}
                </span>
                <span className="text-[10px] font-bold text-text-secondary">Pending</span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 leading-tight truncate">
                {idocsPendingVal > 0 ? "⚠️ Retrying blocked IDocs" : "Last processed: 1m ago"}
              </p>
            </div>
          </div>

          {/* Card 5: Resource Utilization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Resource Util.</span>
              <Users className="h-4.5 w-4.5 text-cyan-500" />
            </div>
            <div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-text-dark">{resourceUtilVal}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${resourceUtilVal}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 leading-tight truncate">
                {autonomousMode ? "18 AGVs active, 2 idle" : "22 AGVs active, queue back-pressure"}
              </p>
            </div>
          </div>

          {/* Card 6: Dock Congestion Alert */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Dock Congestion</span>
              <Flame className={`h-4.5 w-4.5 ${dockCongestionVal === 'HIGH' ? 'text-danger-ewm animate-bounce' : dockCongestionVal === 'MEDIUM' ? 'text-warning-ewm animate-pulse' : 'text-emerald-500'}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-sm font-black tracking-tight uppercase ${dockCongestionVal === 'HIGH' ? 'text-danger-ewm' : dockCongestionVal === 'MEDIUM' ? 'text-warning-ewm' : 'text-success-ewm'}`}>
                  {dockCongestionVal}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 leading-tight truncate">
                {dockCongestionVal === 'HIGH' ? "🚨 Bottlenecks in Bay 2" : dockCongestionVal === 'MEDIUM' ? "⚠️ Standard queues" : "✅ Smooth terminal turnaround"}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Mid Grid: Active Action Items + Live Throughput Wave */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Resolutions / Action Items */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="font-bold text-text-dark text-base flex items-center gap-2">
                Active Exception Queue
                {activeExceptions.length > 0 && (
                  <span className="bg-danger-ewm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeExceptions.length} Urgent
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-secondary">Immediate attention required from supervisor</p>
            </div>
            <button
              onClick={() => onSelectTab('resolutions')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              See Resolutions
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {activeExceptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-success-ewm mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-text-dark text-sm">All Systems Nominal</h4>
                <p className="text-xs text-text-secondary max-w-sm mt-1">No active EWM exceptions pending validation. AI Agent Swarm is handling operational load routing.</p>
              </div>
            ) : (
              activeExceptions.map((exc) => {
                const assignedAgent = agents.find(a => a.id === exc.assignedAgentId);
                return (
                  <div 
                    key={exc.id} 
                    onClick={() => {
                      if (setSelectedExceptionId) {
                        setSelectedExceptionId(exc.id);
                        onSelectTab('resolutions');
                      }
                    }}
                    className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/55 hover:border-rose-200 transition-all cursor-pointer group/card relative shadow-sm hover:shadow-md duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4.5 w-4.5 text-danger-ewm shrink-0 animate-pulse" />
                        <span className="text-xs font-bold text-danger-ewm uppercase tracking-wider">{exc.zone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-secondary">{exc.timestamp.split('T')[1].slice(0, 8)}</span>
                        <span className="text-[10px] text-primary group-hover/card:translate-x-0.5 transition-transform font-bold flex items-center gap-0.5">
                          View Trace →
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-text-dark text-sm mb-1 group-hover/card:text-primary transition-colors">{exc.title}</h4>
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">{exc.description}</p>

                    {/* Active agent status indicator banner */}
                    {isSequencing && sequenceExceptionId === exc.id && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-cyan-950/90 border border-cyan-500/50 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                          ACTIVE AGENT: {
                            sequenceStep === 'monitor' ? 'Monitor Agent (Scanning Systems)' :
                            sequenceStep === 'diagnostic' ? 'Diagnostic Agent (Isolating Fault)' :
                            sequenceStep === 'resolution' ? 'Resolution Agent (Reprocessing Transaction)' :
                            'Validation Agent (Auditing SLA Limits)'
                          }
                        </span>
                      </div>
                    )}

                    {isSequencing && sequenceExceptionId !== exc.id && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                        <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                          QUEUED FOR AUTONOMOUS SWARM
                        </span>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200/60 p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 rounded bg-blue-50 flex items-center justify-center text-primary">
                          <Cpu className="h-3 w-3 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold text-text-dark">AI Recommendation by {assignedAgent?.name || 'Agent'}</span>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{exc.suggestedResolution}"</p>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 relative z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDeclineResolution(exc.id)}
                        className="py-1.5 px-3 rounded-lg border border-slate-300 text-text-secondary hover:bg-slate-50 text-xs font-medium cursor-pointer"
                      >
                        Override / Decline
                      </button>
                      <button
                        onClick={() => onApproveResolution(exc.id)}
                        className="py-1.5 px-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Apply Resolution
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Throughput SVG Wave Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[400px]">
          <div className="shrink-0 mb-4">
            <h3 className="font-bold text-text-dark text-base">Warehouse Outfeed Wave</h3>
            <p className="text-xs text-text-secondary">Units dispatched per hour</p>
          </div>

          <div className="flex-1 relative border border-slate-100 rounded-xl p-4 bg-slate-50/40 flex items-center justify-center">
            {/* SVG Wave */}
            <svg viewBox="0 0 600 220" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="550" y2="20" stroke="#E2E8F0" strokeDasharray="4 4" />
              <line x1="50" y1="80" x2="550" y2="80" stroke="#E2E8F0" strokeDasharray="4 4" />
              <line x1="50" y1="140" x2="550" y2="140" stroke="#E2E8F0" strokeDasharray="4 4" />
              <line x1="50" y1="200" x2="550" y2="200" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Area Under Wave */}
              <path d={areaPath} fill="url(#wave-gradient)" opacity="0.15" />

              {/* Wave Path */}
              <path d={chartPath} fill="none" stroke="#0A4D8C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Dots & Labels */}
              {svgPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#00B4D8" stroke="#FFFFFF" strokeWidth="2" className="drop-shadow-sm" />
                  {idx === svgPoints.length - 1 && (
                    <circle cx={pt.x} cy={pt.y} r="10" fill="none" stroke="#00B4D8" strokeWidth="1.5" className="animate-ping" />
                  )}
                  {/* Label tooltip */}
                  <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="text-[10px] font-bold font-mono fill-text-dark">
                    {pt.val}
                  </text>
                  {/* Time label */}
                  <text x={pt.x} y="215" textAnchor="middle" className="text-[10px] font-mono fill-text-secondary">
                    {pt.time}
                  </text>
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A4D8C" />
                  <stop offset="100%" stopColor="#00B4D8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs shrink-0 text-text-secondary">
            <span>Operating at 93% efficiency</span>
            <span className="font-semibold text-primary">Target: 1,000 units/hr</span>
          </div>
        </div>

      </div>

      {/* 5. Bottom Grid: Real-time AI Agent Log Feed & Firestore Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live AI Orchestration Telemetry */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-text-dark text-base flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent-ai animate-bounce" />
                  Orchestration Telemetry
                </h3>
                <p className="text-xs text-text-secondary">Real-time decisions logged</p>
              </div>
              <button
                onClick={() => onSelectTab('agents')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Clusters
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 shadow-inner h-[260px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
              {telemetry.map((log) => {
                const timeColor = 'text-cyan-400';
                let tagColor = 'bg-slate-800 text-slate-400';
                if (log.type === 'exception') tagColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                if (log.type === 'resolution') tagColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                if (log.type === 'agent') tagColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';

                return (
                  <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/60 p-1 rounded transition-colors">
                    <span className={`${timeColor} shrink-0`}>[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${tagColor} shrink-0`}>
                      {log.type}
                    </span>
                    <span className="text-slate-200 leading-relaxed break-all">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Firestore Agent Activity Feed */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-dark text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
                    Real-time Agent Activity Feed
                  </h3>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    ONLINE
                  </div>
                </div>
                <p className="text-xs text-text-secondary">Transactional event log of recent autonomous decisions and actions</p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                {activityLogs.length} logs
              </span>
            </div>

            {/* Structured Table/Scrolling List layout */}
            <div className="overflow-y-auto h-[260px] pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
              {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                  <Bot className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-sm font-medium">No activity logs streaming</p>
                  <p className="text-xs">Trigger anomalies or process exceptions to generate logs.</p>
                </div>
              ) : (
                activityLogs.map((log, idx) => {
                  // Assign distinctive icons & colors for agents
                  let agentIcon = <Bot className="h-4 w-4" />;
                  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

                  if (log.agentName.includes("Router")) {
                    agentIcon = <TrendingUp className="h-4 w-4 text-sky-500" />;
                    badgeStyle = "bg-sky-50 text-sky-700 border-sky-200";
                  } else if (log.agentName.includes("Allocator")) {
                    agentIcon = <Cpu className="h-4 w-4 text-violet-500" />;
                    badgeStyle = "bg-violet-50 text-violet-700 border-violet-200";
                  } else if (log.agentName.includes("Rebalancer")) {
                    agentIcon = <Layers className="h-4 w-4 text-amber-500" />;
                    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                  } else if (log.agentName.includes("Safety")) {
                    agentIcon = <ShieldAlert className="h-4 w-4 text-rose-500" />;
                    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                  } else if (log.agentName.includes("Monitor")) {
                    agentIcon = <Search className="h-4 w-4 text-cyan-500" />;
                    badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200";
                  } else if (log.agentName.includes("Diagnostic")) {
                    agentIcon = <Cpu className="h-4 w-4 text-indigo-500" />;
                    badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  } else if (log.agentName.includes("Validation")) {
                    agentIcon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
                    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else if (log.agentName.includes("Integration") || log.agentName.includes("SAP")) {
                    agentIcon = <Layers className="h-4 w-4 text-blue-500" />;
                    badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                  }

                  const isEven = idx % 2 === 0;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                      className={`group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        isEven 
                          ? 'bg-slate-50/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200' 
                          : 'bg-white border-slate-100 hover:bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      {/* Column 1: Time, Agent Info, Action */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Time Column */}
                        <div className="text-[11px] font-semibold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md h-fit shrink-0">
                          {log.timestamp}
                        </div>
                        
                        {/* Agent Info & Action Name */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle} shrink-0`}>
                              {agentIcon}
                              {log.agentName}
                            </span>
                            <span className="text-slate-800 font-bold text-xs truncate">
                              {log.action}
                            </span>
                          </div>
                          
                          {/* Details line */}
                          <p className="text-[11px] text-text-secondary mt-1 group-hover:text-slate-700 transition-colors leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Related Issue Badge */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {log.issueId && log.issueId !== 'none' ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-wider bg-rose-50 border border-rose-200 text-rose-600 shadow-xs uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {log.issueId}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">-</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
