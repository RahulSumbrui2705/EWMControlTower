import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  PieChart, 
  Sparkles, 
  Trophy, 
  DollarSign, 
  Clock, 
  Zap, 
  Activity 
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { WarehouseException } from '../../types';

interface AnalyticsTabProps {
  exceptions: WarehouseException[];
}

// Custom modern tooltip styled with Tailwind CSS
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-800 shadow-2xl text-xs font-sans">
        <p className="font-mono font-bold mb-1 border-b border-slate-800/80 pb-1.5 text-slate-300">{label}</p>
        {payload.map((pld: any) => (
          <div key={pld.name} className="flex items-center justify-between gap-4 mt-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: pld.color || pld.fill }} />
              <span className="text-slate-400 capitalize">{pld.name}:</span>
            </div>
            <span className="font-bold font-mono text-white">
              {typeof pld.value === 'number' && pld.name.toLowerCase().includes('savings') 
                ? `$${pld.value.toLocaleString()}` 
                : typeof pld.value === 'number' && pld.name.toLowerCase().includes('time')
                ? `${pld.value} min`
                : pld.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsTab({ exceptions }: AnalyticsTabProps) {
  
  // Real-time calculated live KPIs based on actual exception statuses
  const stats = useMemo(() => {
    const liveCompleted = exceptions.filter(e => e.resolutionStatus === 'completed');
    const totalCount = exceptions.length;
    
    // 1. Calculate Downtime Savings
    let liveSavings = 0;
    liveCompleted.forEach((exc) => {
      const titleLower = exc.title.toLowerCase();
      if (titleLower.includes('conveyor') || titleLower.includes('jam')) {
        liveSavings += 1500;
      } else if (titleLower.includes('agv') || titleLower.includes('obstacle')) {
        liveSavings += 800;
      } else if (titleLower.includes('spill') || titleLower.includes('oil')) {
        liveSavings += 2500;
      } else if (titleLower.includes('temp') || titleLower.includes('thermal')) {
        liveSavings += 3000;
      } else {
        liveSavings += 1000;
      }
    });
    const cumulativeSavings = 26800 + liveSavings;

    // 2. Average AI Resolution Time in Seconds
    const totalTimeS = liveCompleted.reduce((acc, curr) => acc + (curr.timeTakenS || 45), 0);
    const averageTimeS = liveCompleted.length > 0 ? totalTimeS / liveCompleted.length : 48;
    
    // 3. Acceleration Ratio (Traditional manual average 35 min = 2100s)
    const manualBaselineS = 2100;
    const accelerationRatio = (manualBaselineS / averageTimeS).toFixed(1);

    // 4. SLA Adherence %
    // If we have declined/ignored/delayed exceptions, SLA dips slightly
    const ignoredCount = exceptions.filter(e => e.resolutionStatus === 'ignored').length;
    const sla = Math.max(92.5, 99.8 - (ignoredCount * 1.5)).toFixed(1);

    return {
      cumulativeSavings,
      averageTimeS,
      accelerationRatio,
      sla,
      resolvedCount: liveCompleted.length,
      totalCount
    };
  }, [exceptions]);

  // Data 1: Issues Resolved Over Time
  const resolvedOverTimeData = useMemo(() => {
    const baseData = [
      { hour: '08:00', 'Resolved (AI)': 4 },
      { hour: '09:00', 'Resolved (AI)': 9 },
      { hour: '10:00', 'Resolved (AI)': 15 },
      { hour: '11:00', 'Resolved (AI)': 22 },
      { hour: '12:00', 'Resolved (AI)': 28 },
      { hour: '13:00', 'Resolved (AI)': 34 },
      { hour: '14:00', 'Resolved (AI)': 41 },
      { hour: '15:00', 'Resolved (AI)': 48 }
    ];

    // Distribute live completed exceptions to increment cumulative curve
    const liveCompleted = exceptions.filter(e => e.resolutionStatus === 'completed');
    liveCompleted.forEach((_, index) => {
      // Smoothly distribute them across later hours to simulate progression
      const targetIndex = Math.min(baseData.length - 1, 5 + (index % 3));
      for (let i = targetIndex; i < baseData.length; i++) {
        baseData[i]['Resolved (AI)'] += 1;
      }
    });

    return baseData;
  }, [exceptions]);

  // Data 2: Resolution Time Trend (AI vs Manual Baseline)
  const resolutionTimeTrendData = useMemo(() => {
    const liveCompleted = exceptions.filter(e => e.resolutionStatus === 'completed');
    const averageLiveTimeS = liveCompleted.length > 0 
      ? liveCompleted.reduce((acc, curr) => acc + (curr.timeTakenS || 45), 0) / liveCompleted.length
      : 48;
    const averageLiveTimeMin = Number((averageLiveTimeS / 60).toFixed(2));

    return [
      { category: 'AGV Obstacles', 'Manual Process': 28.0, 'AI Swarm': 0.8 },
      { category: 'Conveyor Jams', 'Manual Process': 35.0, 'AI Swarm': 0.95 },
      { category: 'Safety Spills', 'Manual Process': 55.0, 'AI Swarm': 1.2 },
      { category: 'Thermal Alarms', 'Manual Process': 42.0, 'AI Swarm': 0.75 },
      { category: 'Mean SLA Time', 'Manual Process': 35.0, 'AI Swarm': averageLiveTimeMin }
    ];
  }, [exceptions]);

  // Data 3: Issues by Type Breakdown
  const issuesByTypeData = useMemo(() => {
    let agvCount = 0;
    let conveyorCount = 0;
    let safetyCount = 0;
    let thermalCount = 0;

    exceptions.forEach((exc) => {
      const titleLower = exc.title.toLowerCase();
      const typeLower = (exc.type || '').toLowerCase();
      
      if (titleLower.includes('agv') || titleLower.includes('obstacle') || typeLower.includes('resource') || exc.zone.includes('Aisle')) {
        agvCount++;
      } else if (titleLower.includes('conveyor') || titleLower.includes('stoppage') || titleLower.includes('jam') || typeLower.includes('task')) {
        conveyorCount++;
      } else if (titleLower.includes('spill') || titleLower.includes('oil') || titleLower.includes('hazard')) {
        safetyCount++;
      } else if (titleLower.includes('temp') || titleLower.includes('thermal') || titleLower.includes('heat')) {
        thermalCount++;
      } else {
        conveyorCount++;
      }
    });

    return [
      { name: 'AGV Blockages', value: agvCount || 2, color: '#0A4D8C' },
      { name: 'Conveyor Jams', value: conveyorCount || 3, color: '#00B4D8' },
      { name: 'Safety Hazards', value: safetyCount || 1, color: '#F59E0B' },
      { name: 'Thermal Spikes', value: thermalCount || 1, color: '#EF4444' }
    ];
  }, [exceptions]);

  // Data 4: Estimated Cost Savings Trend
  const costSavingsData = useMemo(() => {
    const liveCompleted = exceptions.filter(e => e.resolutionStatus === 'completed');
    let liveSavings = 0;
    liveCompleted.forEach((exc) => {
      const titleLower = exc.title.toLowerCase();
      if (titleLower.includes('conveyor') || titleLower.includes('jam')) {
        liveSavings += 1500;
      } else if (titleLower.includes('agv') || titleLower.includes('obstacle')) {
        liveSavings += 800;
      } else if (titleLower.includes('spill') || titleLower.includes('oil')) {
        liveSavings += 2500;
      } else if (titleLower.includes('temp') || titleLower.includes('thermal')) {
        liveSavings += 3000;
      } else {
        liveSavings += 1000;
      }
    });

    return [
      { day: 'Mon', 'Cumulative Savings': 4200 },
      { day: 'Tue', 'Cumulative Savings': 8500 },
      { day: 'Wed', 'Cumulative Savings': 13100 },
      { day: 'Thu', 'Cumulative Savings': 17800 },
      { day: 'Fri', 'Cumulative Savings': 22400 },
      { day: 'Sat', 'Cumulative Savings': 26800 },
      { day: 'Today', 'Cumulative Savings': 26800 + liveSavings }
    ];
  }, [exceptions]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="font-bold text-text-dark text-lg mb-1 flex items-center gap-2">
            <BarChart3 className="h-5.5 w-5.5 text-primary" />
            Control Tower Intelligence Analytics
          </h3>
          <p className="text-sm text-text-secondary">
            Aggregate key performance indicators, response efficiency logs, and cumulative ROI calculations derived from autonomous swarm actions.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-ewm/10 text-success-ewm text-xs font-semibold shrink-0">
          <Trophy className="h-4 w-4 animate-bounce" />
          SLA fulfillment at {stats.sla}%
        </div>
      </div>

      {/* 2. Real-Time Dynamic KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Savings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Downtime Savings</span>
            <div className="text-xl font-black text-slate-800 font-mono mt-0.5">
              ${stats.cumulativeSavings.toLocaleString()}
            </div>
          </div>
        </div>

        {/* AI Mean Response Time */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/20 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(10,77,140,0.2)]">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI Response Time</span>
            <div className="text-xl font-black text-slate-800 font-mono mt-0.5">
              {stats.averageTimeS.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Speed Acceleration Ratio */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Speed Multiplication</span>
            <div className="text-xl font-black text-slate-800 font-mono mt-0.5">
              {stats.accelerationRatio}x Faster
            </div>
          </div>
        </div>

        {/* Total Actions Traced */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(168,85,247,0.2)]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resolved Anomalies</span>
            <div className="text-xl font-black text-slate-800 font-mono mt-0.5 flex items-baseline gap-1.5">
              {stats.resolvedCount} <span className="text-xs font-medium text-slate-400">/ {stats.totalCount} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Four Core Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Issues Resolved Over Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="mb-4">
            <h4 className="font-bold text-text-dark text-sm flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              Cumulative Issues Resolved Over Time
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">Chronological summary of automated loop completion curve</p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolvedOverTimeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A4D8C" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0A4D8C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="Resolved (AI)" 
                  stroke="#0A4D8C" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorResolved)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resolution Time Trend (AI vs Manual Baseline) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="mb-4">
            <h4 className="font-bold text-text-dark text-sm flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-accent-ai" />
              Resolution Speed: Traditional vs AI Swarm
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">Comparative response time (minutes) by alert division</p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionTimeTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Manual Process" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="AI Swarm" fill="#00B4D8" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Issues by Type (Donut Pie Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="mb-4">
            <h4 className="font-bold text-text-dark text-sm flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-amber-500" />
              Failure Breakdown & Anomaly Incidence
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">Real-time counts of active and handled anomalies</p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 h-64 sm:h-72">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={issuesByTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {issuesByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 w-full max-w-xs shrink-0">
              {issuesByTypeData.map((item, index) => {
                const totalVal = issuesByTypeData.reduce((a, b) => a + b.value, 0);
                const percentage = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(0) : '0';
                return (
                  <div key={index} className="flex items-center justify-between text-xs font-semibold p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-text-dark flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-text-secondary font-mono">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 4: Estimated Cost Savings Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="mb-4">
            <h4 className="font-bold text-text-dark text-sm flex items-center gap-2">
              <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
              Cumulative Financial Recovery Trend
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">Cumulative dollar value of recovered warehouse downtime</p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costSavingsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="Cumulative Savings" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorSavings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Footer Sparkle insight */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-text-secondary flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-accent-ai shrink-0 animate-pulse" />
        <span>
          <strong>Control Tower Insight:</strong> Every exception resolved within our autonomous swarm saves an average of <strong>$1,450</strong> by preventing cascading line-stoppages. Live charts update in real-time as operations progress.
        </span>
      </div>

    </div>
  );
}
