import React from 'react';
import { LayoutDashboard, Radio, Cpu, CheckSquare, Layers, BarChart3, Shield, User, Bot, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: 'overview' | 'live' | 'agents' | 'resolutions' | 'integrations' | 'analytics') => void;
  autonomousMode: boolean;
  toggleAutonomousMode: () => void;
  activeExceptionCount: number;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  autonomousMode,
  toggleAutonomousMode,
  activeExceptionCount
}: NavbarProps) {
  const tabs: {
    id: 'overview' | 'live' | 'agents' | 'resolutions' | 'integrations' | 'analytics';
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Operations', icon: Radio },
    { id: 'agents', label: 'AI Agents', icon: Cpu, badge: 4 },
    { id: 'resolutions', label: 'Resolutions', icon: CheckSquare, badge: activeExceptionCount > 0 ? activeExceptionCount : undefined, badgeColor: 'bg-danger-ewm' },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header id="control-tower-header" className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        
        {/* Left Side: Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-ai text-white shadow-md">
            <Shield className="h-5 w-5" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-ai animate-ping" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-ai" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text-dark flex items-center gap-2">
              Autonomous EWM <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">Control Tower</span>
            </h1>
            <p className="text-[10px] text-text-secondary font-mono">POWERED BY SAP & DYNAMIC GEN AI</p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg cursor-pointer ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-text-secondary hover:text-text-dark hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                <span>{tab.label}</span>
                
                {tab.badge !== undefined && (
                  <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${tab.badgeColor || 'bg-accent-ai'}`}>
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side: Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* Supervisor User Info */}
          <div className="hidden md:flex items-center gap-2.5 border-r border-slate-200 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-text-dark border border-slate-200">
              <User className="h-4.5 w-4.5 text-text-secondary" />
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-text-dark">EWM Supervisor</div>
              <div className="text-[10px] text-text-secondary">Capgemini Team</div>
            </div>
          </div>

          {/* Launch Autonomous Button */}
          <button
            onClick={toggleAutonomousMode}
            className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all duration-300 cursor-pointer ${
              autonomousMode 
                ? 'bg-gradient-to-r from-accent-ai to-primary text-white hover:brightness-110 border-none scale-105'
                : 'bg-white text-text-dark border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {autonomousMode ? (
              <>
                <Bot className="h-4 w-4 animate-bounce text-white" />
                <span>Autonomous Active</span>
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-ai opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-ai"></span>
                </span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 text-text-secondary" />
                <span>Engage Autonomous</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
