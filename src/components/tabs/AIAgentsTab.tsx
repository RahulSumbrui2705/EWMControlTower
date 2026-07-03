import React from 'react';
import { Cpu, Terminal, ShieldAlert, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { AIAgent } from '../../types';

interface AIAgentsTabProps {
  agents: AIAgent[];
  onToggleAgentPermission: (id: string) => void;
}

export default function AIAgentsTab({
  agents,
  onToggleAgentPermission
}: AIAgentsTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Tab Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h3 className="font-bold text-text-dark text-lg mb-1">Autonomous AI Agent Clusters</h3>
        <p className="text-sm text-text-secondary">
          Monitor neural loads, system task histories, and enable/disable individual self-execution rights.
        </p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const isAutonomous = agent.autonomousAllowed;
          return (
            <div key={agent.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-[440px]">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-ai text-white shadow-sm">
                      <Cpu className={`h-5.5 w-5.5 ${agent.status === 'busy' ? 'animate-spin' : 'animate-pulse'}`} />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        agent.status === 'offline' ? 'bg-danger-ewm' : 'bg-success-ewm'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-dark text-base">{agent.name}</h4>
                      <p className="text-xs text-text-secondary">{agent.role}</p>
                    </div>
                  </div>

                  {/* Self Execute Switch */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isAutonomous ? 'text-accent-ai' : 'text-text-secondary'}`}>
                      {isAutonomous ? 'Autonomous Approved' : 'Supervised'}
                    </span>
                    <button
                      onClick={() => onToggleAgentPermission(agent.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAutonomous ? 'bg-accent-ai' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isAutonomous ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Task and Stats Grid */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 mb-4 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-text-secondary uppercase">Operational Status</div>
                    <div className="text-xs font-black text-text-dark uppercase mt-0.5">{agent.status}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-text-secondary uppercase">Decision Efficiency</div>
                    <div className="text-xs font-black text-text-dark mt-0.5">{agent.efficiency}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-text-secondary uppercase">Active Core Load</div>
                    <div className="text-xs font-black text-text-dark mt-0.5">{agent.load}%</div>
                  </div>
                </div>

                {/* Current Active Task */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Current Active Thread</div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                    {agent.currentTask}
                  </div>
                </div>
              </div>

              {/* Agent Terminal / Logs */}
              <div className="flex-1 flex flex-col justify-end">
                <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5" />
                  Telemetry Log Feed
                </div>
                <div className="bg-slate-950 rounded-xl p-3 font-mono text-[10px] text-slate-300 h-32 overflow-y-auto space-y-1">
                  {agent.logs.map((log, i) => (
                    <div key={i} className="text-slate-300 hover:bg-slate-800/40 px-1 py-0.5 rounded transition-colors flex gap-2">
                      <span className="text-accent-ai shrink-0">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
