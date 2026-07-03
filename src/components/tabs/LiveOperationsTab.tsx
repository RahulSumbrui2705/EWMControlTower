import React, { useState } from 'react';
import { Truck, Activity, Box, AlertTriangle, Layers, Navigation, RefreshCw, CheckCircle2, Clock, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { WarehouseOrder, WarehouseException, LiveTelemetryLog } from '../../types';

interface LiveOperationsTabProps {
  orders: WarehouseOrder[];
  exceptions: WarehouseException[];
  telemetry: LiveTelemetryLog[];
}

export default function LiveOperationsTab({
  orders,
  exceptions,
  telemetry
}: LiveOperationsTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<WarehouseOrder | null>(null);

  // Check if specific zones have active critical exceptions
  const hasZoneException = (zoneKey: string) => {
    return exceptions.some(e => e.zone.toLowerCase().includes(zoneKey) && e.resolutionStatus === 'pending_approval');
  };

  const zones = [
    { key: 'zone a', label: 'Zone Alpha', desc: 'Inbound Receiving & Conveyors', color: 'bg-blue-500' },
    { key: 'zone b', label: 'Zone Beta', desc: 'High-Density Rack Storage', color: 'bg-indigo-500' },
    { key: 'zone c', label: 'Zone Gamma', desc: 'Autonomous AGV Lanes', color: 'bg-cyan-500' },
    { key: 'zone d', label: 'Zone Delta', desc: 'Outbound Sorting & Loading Docks', color: 'bg-teal-500' }
  ];

  // Dynamic Inbound Stages
  const activeExceptions = exceptions.filter(e => e.resolutionStatus === 'pending_approval');
  const hasQueueLock = activeExceptions.some(e => e.type === 'qRFC' || e.id === 'exc-101' || e.id === 'Issue-001');
  const hasPutawayError = activeExceptions.some(e => e.type === 'Warehouse Task' || e.id === 'exc-102' || e.id === 'Issue-002');
  
  const inboundStages = [
    {
      id: 1,
      name: 'Dock Appointment',
      desc: 'S/4HANA TU Scheduled',
      status: 'completed',
      detail: 'Appt #849021, Carrier: DHL',
      time: '08:15'
    },
    {
      id: 2,
      name: 'TU Yard Check-In',
      desc: 'Trailer TRK-49122 Arrived',
      status: 'completed',
      detail: 'Gate 1, Yard Bin Y-104',
      time: '08:30'
    },
    {
      id: 3,
      name: 'Door Docking',
      desc: 'Trailer Positioned',
      status: 'completed',
      detail: 'Inbound Dock Door 04',
      time: '08:45'
    },
    {
      id: 4,
      name: 'Goods Receipt Posting',
      desc: 'Goods Receipt Posted',
      status: 'completed',
      detail: 'HU Qty: 48, EWM Deliv: 1800001245',
      time: '09:20'
    },
    {
      id: 5,
      name: 'Putaway WT Execution',
      desc: hasQueueLock ? 'qRFC SMQ1 Queue Blocked' : hasPutawayError ? 'WT Putaway Capacity Overlimit' : activeExceptions.length > 0 ? 'Preceding Blockage' : 'Executing Warehouse Tasks',
      status: hasQueueLock || hasPutawayError ? 'exception' : activeExceptions.length > 0 ? 'warning' : 'completed',
      detail: hasQueueLock ? 'SMQ1 lock on Material 1000004567' : hasPutawayError ? 'HU 9876543210 → Bin 02-04-12' : 'AGV/Forklift active transport',
      time: hasQueueLock ? '09:43' : hasPutawayError ? '09:48' : '09:50'
    },
    {
      id: 6,
      name: 'Storage Bin Confirmation',
      desc: activeExceptions.length > 0 ? 'Awaiting Exception Resolution' : 'All Tasks Confirmed',
      status: activeExceptions.length > 0 ? 'pending' : 'completed',
      detail: activeExceptions.length > 0 ? 'Locked by Putaway exception' : 'Confirmed in final storage bins',
      time: activeExceptions.length > 0 ? '--:--' : '10:00'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Dynamic SAP EWM Inbound Pipeline Process Stage Monitor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden" id="ewm-inbound-pipeline-card">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-text-dark text-base flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              S/4HANA EWM Inbound Delivery Process Flow
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Live tracking of Inbound Delivery <strong>1800001245</strong> / Transportation Unit <strong>TRK-49122</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg">
              Doc Type: EL (Inbound Delivery)
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
              activeExceptions.length > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${activeExceptions.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {activeExceptions.length > 0 ? 'EXCEPTIONS ACTIVE' : 'NOMINAL PIPELINE'}
            </span>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
          {inboundStages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isException = stage.status === 'exception';
            const isWarning = stage.status === 'warning';
            const isPending = stage.status === 'pending';

            return (
              <div key={stage.id} className="relative flex flex-col justify-between p-3.5 rounded-xl border bg-slate-50/40 hover:bg-slate-50 transition-all duration-200">
                {/* Arrow connectors for desktop */}
                {idx < 5 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 text-slate-300">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black text-slate-400">STAGE 0{stage.id}</span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stage.time}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{stage.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">{stage.desc}</p>
                  <p className="text-[10px] font-mono text-slate-400 bg-white border border-slate-150/60 p-1.5 rounded-md mt-1 break-words leading-tight">
                    {stage.detail}
                  </p>
                </div>

                <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    isCompleted ? 'text-emerald-600' :
                    isException ? 'text-rose-600' :
                    isWarning ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {stage.status}
                  </span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  {isException && <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 animate-bounce" />}
                  {isWarning && <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />}
                  {isPending && <Clock className="h-4 w-4 text-slate-400 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Visual Warehouse Map */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[580px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <div>
            <h3 className="font-bold text-text-dark text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Live Visual Floor Map
            </h3>
            <p className="text-xs text-text-secondary">Real-time tracking of AGVs & Outfeed lines</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary font-mono">
            <span className="h-2 w-2 rounded-full bg-success-ewm animate-pulse" />
            CCTV Calibration OK
          </div>
        </div>

        {/* Visual Map Grid representing Zones */}
        <div className="flex-1 grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-150 relative overflow-hidden">
          {zones.map((zone) => {
            const isAlert = hasZoneException(zone.key);
            return (
              <div 
                key={zone.key} 
                className={`relative rounded-xl p-5 border flex flex-col justify-between transition-all duration-300 ${
                  isAlert 
                    ? 'bg-rose-50 border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : 'bg-white border-slate-200 hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                {/* Zone Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${isAlert ? 'bg-danger-ewm' : zone.color}`}>
                    {zone.label.toUpperCase()}
                  </span>
                  {isAlert ? (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }} 
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-1 text-danger-ewm font-bold text-xs"
                    >
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                      CRITICAL STOPPAGE
                    </motion.div>
                  ) : (
                    <span className="text-[10px] font-mono text-success-ewm font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-ewm" />
                      NOMINAL
                    </span>
                  )}
                </div>

                {/* Simulated Warehouse Assets */}
                <div className="my-3 flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-text-dark text-sm">{zone.label}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{zone.desc}</p>
                  
                  {/* Decorative asset grids representing aisles or conveyors */}
                  <div className="mt-4 grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                      const isFaultyAisle = isAlert && i === 4;
                      return (
                        <div 
                          key={i} 
                          className={`h-6 rounded-md flex items-center justify-center text-[9px] font-mono font-semibold ${
                            isFaultyAisle 
                              ? 'bg-danger-ewm text-white animate-pulse' 
                              : 'bg-slate-100 text-text-secondary hover:bg-slate-200 transition-colors'
                          }`}
                          title={`Aisle ${i}`}
                        >
                          A{i}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action or status banner */}
                <div className="text-[10px] text-text-secondary flex justify-between border-t border-slate-100 pt-2 font-mono">
                  <span>AGV Fleet: {isAlert ? '2 Halted / 4 Rerouting' : '6 Active'}</span>
                  <span>Throughput: {isAlert ? '45%' : '98%'}</span>
                </div>
              </div>
            );
          })}

          {/* Simulated AGV dot overlays that animate across the grid */}
          <motion.div
            animate={{
              x: [20, 180, 180, 20, 20],
              y: [40, 40, 220, 220, 40]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute h-5 w-5 rounded-full bg-gradient-to-r from-accent-ai to-primary flex items-center justify-center shadow-lg border-2 border-white z-10"
            title="AGV #04 (Autonomous Routing)"
          >
            <Navigation className="h-2.5 w-2.5 text-white transform rotate-45" />
          </motion.div>

          <motion.div
            animate={{
              x: [340, 340, 500, 500, 340],
              y: [220, 40, 40, 220, 220]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute h-5 w-5 rounded-full bg-gradient-to-r from-accent-ai to-primary flex items-center justify-center shadow-lg border-2 border-white z-10"
            title="AGV #12 (Fulfillment Mode)"
          >
            <Navigation className="h-2.5 w-2.5 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Right: Live Release Queue (Orders) */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[580px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-text-dark text-base">Order Fulfillment</h3>
            <p className="text-xs text-text-secondary">Release pipeline from SAP ERP</p>
          </div>
          <Box className="h-5 w-5 text-text-secondary" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {orders.map((order) => {
            let badgeStyle = 'bg-slate-100 text-slate-700';
            let priorityBadge = 'bg-slate-100 text-slate-700';
            
            if (order.status === 'completed') badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
            else if (order.status === 'shipping') badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200/50';
            else if (order.status === 'packing') badgeStyle = 'bg-indigo-50 text-indigo-700 border border-indigo-200/50';
            else if (order.status === 'picking') badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200/50';

            if (order.priority === 'urgent') priorityBadge = 'bg-rose-500 text-white';
            else if (order.priority === 'high') priorityBadge = 'bg-orange-500 text-white';

            return (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedOrder?.id === order.id 
                    ? 'border-primary bg-slate-50 shadow-sm' 
                    : 'border-slate-150 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold font-mono text-text-dark">{order.id}</span>
                    <div className="text-[10px] text-text-secondary font-semibold">{order.sku}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {order.priority !== 'standard' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${priorityBadge}`}>
                        {order.priority}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${badgeStyle}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-text-secondary font-mono">
                    <span>Qty: {order.qty} • {order.destination}</span>
                    <span>{order.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${order.status === 'completed' ? 'bg-success-ewm' : 'bg-primary'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                {/* Details view when selected */}
                {selectedOrder?.id === order.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-text-secondary space-y-1.5"
                  >
                    <div className="flex justify-between">
                      <span>Inbound Trailer:</span>
                      <span className="font-semibold text-text-dark">TRK-49122</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Destination Bin:</span>
                      <span className="font-semibold text-text-dark">ROW-04-B-12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Operator:</span>
                      <span className="font-semibold text-text-dark">Robotic Line 4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Delivery:</span>
                      <span className="font-semibold text-text-dark">09:12 (SLA Target)</span>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
    </div>
  );
}
