import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  Sparkles, 
  Filter, 
  ShieldAlert,
  Search,
  ArrowUpDown,
  ChevronRight,
  X,
  Clock,
  Cpu,
  Layers,
  Bot,
  Activity,
  Award,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Info,
  Calendar,
  ExternalLink,
  Zap,
  Check,
  Server,
  AlertTriangle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WarehouseException, AIAgent } from '../../types';

interface ResolutionsTabProps {
  exceptions: WarehouseException[];
  agents: AIAgent[];
  onApproveResolution: (id: string) => void;
  onDeclineResolution: (id: string) => void;
  selectedExceptionId?: string | null;
  setSelectedExceptionId?: (id: string | null) => void;
}

type SortField = 'id' | 'timestamp' | 'confidence' | 'timeTakenS' | 'resolutionStatus';
type SortOrder = 'asc' | 'desc';

export default function ResolutionsTab({
  exceptions,
  agents,
  onApproveResolution,
  onDeclineResolution,
  selectedExceptionId: propSelectedExceptionId,
  setSelectedExceptionId: propSetSelectedExceptionId
}: ResolutionsTabProps) {
  // State variables for search, sorting, and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'resolving' | 'completed' | 'ignored'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'qRFC' | 'IDoc' | 'Warehouse Task' | 'Resource'>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selected Exception for explainability drawer with prop fallback
  const [localSelectedExceptionId, localSetSelectedExceptionId] = useState<string | null>(null);
  const selectedExceptionId = propSelectedExceptionId !== undefined ? propSelectedExceptionId : localSelectedExceptionId;
  const setSelectedExceptionId = propSetSelectedExceptionId !== undefined ? propSetSelectedExceptionId : localSetSelectedExceptionId;

  // Helper functions for fallback/computed values
  const getExceptionType = (exc: WarehouseException): 'qRFC' | 'IDoc' | 'Warehouse Task' | 'Resource' => {
    return exc.type || (exc.assignedAgentId === 'router' ? 'Resource' : exc.assignedAgentId === 'allocator' ? 'Warehouse Task' : 'IDoc');
  };

  const getExceptionDiagnosis = (exc: WarehouseException): string => {
    return exc.aiDiagnosis || `Anomaly in ${exc.zone}: ${exc.description}`;
  };

  const getExceptionAction = (exc: WarehouseException): string => {
    return exc.resolutionAction || exc.suggestedResolution.split('.')[0] + '.';
  };

  const getExceptionConfidence = (exc: WarehouseException): number => {
    return exc.confidence || (exc.severity === 'resolved' ? 97 : exc.id.includes('102') ? 94 : 88);
  };

  // Detailed, highly premium EWM/SAP structures for the Explainability Drawer
  const getDetailedExplainability = (exc: WarehouseException) => {
    const title = exc.title.toLowerCase();
    const type = getExceptionType(exc);
    const id = exc.id;

    if (id === 'exc-101' || type === 'qRFC' || title.includes('qrfc') || title.includes('stuck')) {
      return {
        rootCause: "Monitor Agent detected that the qRFC queue SMQ1 is locked due to a previous failed LUW on material master 1000004567. The lock has been active for 47 minutes, blocking all subsequent inbound deliveries.",
        agentsInvolved: "Monitor Agent → Diagnostic Agent → Resolution Agent → Validation Agent",
        actionsTaken: [
          "1. Monitor Agent flagged the blocked queue via real-time OData polling (`/sap/opu/odata/sap/EWM_QUEUE_MONITOR` for WarehouseTask and qRFC monitoring).",
          "2. Diagnostic Agent cross-referenced with historical patterns (34 similar cases this month) utilizing Event-Driven Ingestion telemetry streams.",
          "3. Resolution Agent executed custom RFC `/SCWM/RFC_QUEUE_REPROCESS` via SAP BTP Destination Service and Cloud Connector secure tunnel to break locks. S/4HANA EWM backend returned `subrc = 0` (SUCCESS) and released lock status code `EWM_QUEUE_ACTIVE`.",
          "4. Validation Agent confirmed queue status moved to 'Running' (via OData validation) and IDoc reached status 53 (Application document posted)."
        ],
        businessImpact: "3 trucks waiting at inbound gate. Estimated demurrage cost avoided: $2,850. Production line would have faced material shortage in 2.5 hours.",
        estimatedSavings: "$2,850",
        downtimePrevented: "2.5 hours",
        whyThisDecision: "Automated execution of queue unlocking coupled with an immediate LUW reprocess sequence via the custom RFC /SCWM/RFC_QUEUE_REPROCESS avoids human database lock troubleshooting and clears backlogs instantly.",
        sapObjects: [
          { name: "SMQ1 (Queue Monitor)", type: "Transaction" as const, purpose: "Monitors and triages inbound/outbound RFC queue queues to detect locked/blocked channels." },
          { name: "WE02 (IDoc List)", type: "Transaction" as const, purpose: "Traces the state and segments of incoming delivery notification IDocs to ensure core structural integrity." },
          { name: "/SCWM/RFC_QUEUE_REPROCESS", type: "RFC" as const, purpose: "Custom RFC helper that dynamically breaks transactional locks on specific material nodes and re-triggers queue execution." }
        ],
        agentTimeline: [
          { timeOffset: "-47m", agent: "Monitor Agent", action: "Flagged the blocked queue via OData polling.", status: "warning" as const },
          { timeOffset: "-30s", agent: "Diagnostic Agent", action: "Cross-referenced with historical patterns (34 similar cases this month).", status: "info" as const },
          { timeOffset: "-8s", agent: "Resolution Agent", action: "Executed /SCWM/RFC_QUEUE_REPROCESS to unlock and reprocess the queue.", status: "completed" as const },
          { timeOffset: "0s", agent: "Validation Agent", action: "Confirmed queue status moved to \"Running\" and IDoc reached status 53.", status: "completed" as const }
        ]
      };
    } else if (id === 'exc-102' || title.includes('putaway') || title.includes('capacity') || title.includes('wt-98432')) {
      return {
        rootCause: "Diagnostic Agent identified that destination Bin 02-04-12 has only 12% remaining physical capacity. Handling Unit (HU) 9876543210 is a palletized load with 1.2m height and 850kg weight, which exceeds the available bin volumetric threshold.",
        agentsInvolved: "Monitor Agent → Diagnostic Agent → Rebalancer Agent → Validation Agent",
        actionsTaken: [
          "1. Monitor Agent intercepted the Putaway WT-98432 failure signal from the forklift operator's handheld terminal using SAP Event Mesh Event-Driven Ingestion.",
          "2. Diagnostic Agent analyzed physical space utilization via OData `/sap/opu/odata/sap/EWM_STORAGE_BINS` and confirmed destination Bin 02-04-12 was filled to 88% capacity.",
          "3. Rebalancer Agent calculated volumetric footprint of HU 9876543210 and called BAPI `/SCWM/TO_CREATE` with alternate Bin 03-01-05. S/4HANA EWM returned a successful export structure with newly created Warehouse Task ID `WT-98435` and `BAPIRET2` table showing 0 error records.",
          "4. Validation Agent confirmed EWM warehouse task update and dispatched the alternative route coordinates to the operator's active RF client."
        ],
        businessImpact: "Avoided an estimated 22-minute physical putaway delay, forklift operator idle time, and severe downstream picking wave disruptions due to misplaced pallets. Estimated cost savings: $1,450.",
        estimatedSavings: "$1,450",
        downtimePrevented: "22 mins",
        whyThisDecision: "Calling /SCWM/TO_CONFIRM with alternative bin determination coordinates creates a new, optimized Warehouse Task for Bin 03-01-05 via BAPI /SCWM/TO_CREATE, immediately routing the forklift without manual supervisor re-assignment.",
        sapObjects: [
          { name: "/SCWM/TO_CONFIRM", type: "BAPI" as const, purpose: "Confirms and updates warehouse tasks while enabling real-time exceptions and alternative bin overrides." },
          { name: "/SCWM/TO_CREATE", type: "BAPI" as const, purpose: "Generates new EWM warehouse tasks based on current physical product characteristics and bin search strategies." },
          { name: "Bin Determination Engine", type: "OData" as const, purpose: "Queries the physical S/4HANA slotting matrix to locate open bins with matching height and weight tolerance profiles." }
        ],
        agentTimeline: [
          { timeOffset: "-2m", agent: "Monitor Agent", action: "Intercepted Putaway WT-98432 failure signal from handheld scanner.", status: "warning" as const },
          { timeOffset: "-45s", agent: "Diagnostic Agent", action: "Analyzed space utilization and confirmed Bin 02-04-12 capacity threshold was exceeded.", status: "info" as const },
          { timeOffset: "-11s", agent: "Rebalancer Agent", action: "Calculated volumetric footprint and selected alternate Bin 03-01-05.", status: "completed" as const },
          { timeOffset: "0s", agent: "Validation Agent", action: "Confirmed EWM task update and dispatched alternative coordinates.", status: "completed" as const }
        ]
      };
    } else if (id === 'exc-103' || title.includes('idoc') || title.includes('delay')) {
      return {
        rootCause: "Monitor Agent detected that the outbound IDoc E1WDL02 failed to dispatch for Outbound Delivery 800012543 due to missing partner profile parameters inside transaction WE20, leaving partner logical system 'LS' with an inactive port assignment.",
        agentsInvolved: "Monitor Agent → Diagnostic Agent → Integration Agent → Validation Agent",
        actionsTaken: [
          "1. Monitor Agent flagged IDoc transmission failure flag (Status 29) for Outbound Delivery 800012543 via OData Queue Monitoring.",
          "2. Diagnostic Agent traced WE20 configuration profile inside SAP ERP and discovered the missing carrier routing profile.",
          "3. Integration Agent updated the partner profile records via SAP BTP Extension APIs, assigned the active port gate, and triggered RFC `/SCWM/IDOC_RETRY`. S/4HANA EWM returned `IDOC_STATUS_SUCCESS` (`STATUS: 03` - Sent to port successfully) with packet confirmation.",
          "4. Validation Agent triggered BD87 re-processing block and confirmed IDoc Status moved to 03 (Sent to port) successfully."
        ],
        businessImpact: "DHL outbound trailer load scheduled for 10:15 AM dispatched on time, preserving outbound SLAs. Avoided human ticket creation, manual transaction checks, and delayed loading, saving an estimated $1,250.",
        estimatedSavings: "$1,250",
        downtimePrevented: "15 mins",
        whyThisDecision: "Correcting the partner profile and routing the delivery records through the active fallback port is the cleanest way to clear the transport block, allowing the IDoc to be re-transmitted dynamically.",
        sapObjects: [
          { name: "WE20 (Partner Profiles)", type: "Transaction" as const, purpose: "Configures outbound/inbound EDI message partners, message types, and port assignments." },
          { name: "BD87 (IDoc Monitor)", type: "Transaction" as const, purpose: "Enables manual and automated re-processing of failed or delayed transactional IDocs." },
          { name: "/SCWM/IDOC_RETRY", type: "RFC" as const, purpose: "S/4HANA interface that re-submits specific outbound delivery IDocs to the active carrier gateway." }
        ],
        agentTimeline: [
          { timeOffset: "-15m", agent: "Monitor Agent", action: "Flagged IDoc transmission failure flag (Status 29) for Outbound Delivery 800012543.", status: "warning" as const },
          { timeOffset: "-50s", agent: "Diagnostic Agent", action: "Traced WE20 configuration profile and found missing routing parameters.", status: "info" as const },
          { timeOffset: "-6s", agent: "Integration Agent", action: "Updated partner profile records and assigned active port gate.", status: "completed" as const },
          { timeOffset: "0s", agent: "Validation Agent", action: "Triggered BD87 re-processing block and confirmed status 03.", status: "completed" as const }
        ]
      };
    } else if (id === 'exc-104' || title.includes('stall') || title.includes('obstruction') || title.includes('aisle') || type === 'Resource') {
      return {
        rootCause: "Monitor Agent registered an emergency braking event on AGV #04 due to a LiDAR safety sensor field occlusion at grid coordinates inside the aisle 8 corridor.",
        agentsInvolved: "Monitor Agent → Diagnostic Agent → Safety Agent → Fleet Agent",
        actionsTaken: [
          "1. Monitor Agent detected collision avoidance lock signal and emergency brake trigger on AGV #04 using Event-Driven Ingestion MQTT stream.",
          "2. Diagnostic Agent triggered aerial safety sweep camera to capture live video, identifying a fallen empty plastic container blocking aisle 8.",
          "3. Safety Agent called BAPI `/SCWM/TO_CANCEL` via SAP Cloud Connector to suspend pending tasks on blocked paths. S/4HANA returned `subrc = 0` (SUCCESS) and confirmed warehouse tasks `WT-98124` marked 'CANCELLED'.",
          "4. Fleet Agent mobilized automated cleanup drone #02 to physically sweep and clear the fallen container, then replanned active AGV trajectories and published alternate transit coordinates."
        ],
        businessImpact: "Prevented active aisle gridlock that would block 4 trailing AGVs and stall high-priority picking waves. Cleared corridor safely without manual warehouse crew dispatch, saving $950.",
        estimatedSavings: "$950",
        downtimePrevented: "5 mins",
        whyThisDecision: "Engaging an EWM area mutex lock keeps subsequent AGVs out of aisle 8 while dispatching sweep drone #02 to physically inspect and remove the fallen container. Once verified, publishing alternate transit coordinates to AGV #04 bypasses the blockage.",
        sapObjects: [
          { name: "/SCWM/MON (Warehouse Monitor)", type: "Transaction" as const, purpose: "SAP EWM core monitoring cockpit to supervise resource positions, tasks, and system logs." },
          { name: "/SCWM/TO_CANCEL", type: "BAPI" as const, purpose: "Cancels or suspends pending tasks on blocked paths to permit rerouting." },
          { name: "LiDAR Spatial Grid API", type: "OData" as const, purpose: "Coordinates current real-time 3D laser scanners with active fleet routing nodes." }
        ],
        agentTimeline: [
          { timeOffset: "-5m", agent: "Monitor Agent", action: "Detected collision avoidance lock signal from AGV #04.", status: "warning" as const },
          { timeOffset: "-3m", agent: "Diagnostic Agent", action: "Triggered visual camera sweep and spotted fallen plastic container.", status: "info" as const },
          { timeOffset: "-25s", agent: "Safety Agent", action: "Mobilized cleanup drone #02 to clear coordinates.", status: "completed" as const },
          { timeOffset: "0s", agent: "Fleet Agent", action: "Published backup bypass path coordinates to AGV #04 and unlocked aisle.", status: "completed" as const }
        ]
      };
    } else if (title.includes('spill') || title.includes('hazard')) {
      return {
        rootCause: "Computer-vision neural network analyzed high-definition camera 4 feeds and identified a high-reflectivity liquid pooling signature (approx. 1.2m diameter) on high-density row 3. The viscosity index matches hydraulic oil, creating a severe slip and skid hazard for steel-wheeled AGVs traversing the area.",
        agentsInvolved: "Visual Analytics Agent → Safety Agent → Task Allocator Agent → Clean Agent",
        actionsTaken: [
          "1. Visual Analytics Agent identified high-reflectivity liquid pooling on High-Density Row 3.",
          "2. Safety Agent called BAPI `BAPI_EWM_AISLE_LOCK_MUTEX` via SAP Cloud Connector secure tunnel. EWM returned lock confirmation reference `MUTEX_HD_ROW_3_ENGAGED`.",
          "3. Task Allocator Agent reassigned pending picker tasks in Row 3 to safety hold queues.",
          "4. Clean Agent mobilized automated scrub-drone #12 with dry absorbent compound."
        ],
        businessImpact: "Avoided vehicle slippage, potential racking impacts, and forklift tipping hazards. Saved an estimated $15,000 in clean-up downtime, employee injury risks, and potential physical racking repairs.",
        estimatedSavings: "$15,000",
        downtimePrevented: "45 mins",
        whyThisDecision: "Traversing a fluid spill is a high-risk safety violation. Creating an active EWM area mutex and dispatching automated cleaning drone #12 with chemical sorbents neutralizes the hazard immediately without interrupting pickers on alternate aisles.",
        sapObjects: [
          { name: "BAPI_EWM_AISLE_LOCK_MUTEX", type: "BAPI" as const, purpose: "Engages a high-priority EWM physical area mutex lock, immediately preventing any task releases to Row 3." },
          { name: "/sap/opu/odata/sap/API_EWM_ROBOTICS_DISPATCH_SRV", type: "OData" as const, purpose: "Dispatches clean-and-sweep drone #12 to coordinates X:45.3, Y:22.9 with appropriate chemical sorbent payload." },
          { name: "RFC_POST_EQUIPMENT_MAINTENANCE_LOG", type: "RFC" as const, purpose: "Schedules a corrective maintenance work order in SAP Asset Management for hydraulic seal inspections." }
        ],
        agentTimeline: [
          { timeOffset: "-20s", agent: "Visual Analytics Agent", action: "Identified high-reflectivity liquid pooling on High-Density Row 3.", status: "warning" as const },
          { timeOffset: "-14s", agent: "Safety Agent", action: "Activated priority area locking mutex inside the EWM server.", status: "completed" as const },
          { timeOffset: "-7s", agent: "Task Allocator Agent", action: "Reassigned pending picker tasks in Row 3 to safety hold queues.", status: "info" as const },
          { timeOffset: "0s", agent: "Safety Agent", action: "Mobilized automated scrub-drone #12 with dry absorbent compound.", status: "completed" as const }
        ]
      };
    } else {
      // Battery / High temp / Thermal & general fallback
      return {
        rootCause: "Docking terminal rack R-20 temperature probes recorded a sharp thermal gradient (+1.8C/min) peaking at 48.5C. Hardware register scans indicated localized over-resistance on balance-charging shunt transistor #4, resulting in continuous overcharging current to the active AGV battery cell block.",
        agentsInvolved: "SCADA Ingestion Agent → Safety Agent → Inventory Rebalancer Agent → Fleet Agent",
        actionsTaken: [
          "1. SCADA Ingestion Agent logged high-temperature alarm at charging cell R-20 via Event Mesh MQTT feed.",
          "2. Safety Agent triggered emergency circuit breaker relay by invoking RFC `RFC_POWER_GRID_ISOLATE` with return flag `BREAKER_STATUS_OPEN`.",
          "3. Inventory Rebalancer Agent called BAPI `BAPI_EQUIPMENT_SET_STATUS` on cell R-20 to block future vehicle assignments (returned confirmation code `MNT_LOCKED`).",
          "4. Safety Agent activated cabinet exhaust blower fans to 100% capacity."
        ],
        businessImpact: "Prevented thermal runaway cascade in the Lithium-ion battery pack. Saved a $12,000 AGV vehicle battery, preserved charging station infrastructure ($35k value), and avoided a localized facility fire hazard.",
        estimatedSavings: "$12,000",
        downtimePrevented: "30 mins",
        whyThisDecision: "Isolating the power relay instantly halts current flow, allowing heat dissipation. Rerouting incoming vehicles to aux terminal Hub B keeps fleet battery status balanced, while running cabinet fans at 100% accelerates cooling.",
        sapObjects: [
          { name: "/sap/opu/odata/sap/API_EWM_RESOURCE_SRV", type: "OData" as const, purpose: "Retrieves temperature log streams, battery charge level, and vehicle status profiles for docked vehicles." },
          { name: "RFC_POWER_GRID_ISOLATE", type: "RFC" as const, purpose: "Triggers emergency circuit breaker relay for charging slot R-20 to cut power load." },
          { name: "BAPI_EQUIPMENT_SET_STATUS", type: "BAPI" as const, purpose: "Sets SAP PM status of charging unit R-20 to 'Maintenance Locked' to block future vehicle assignments." }
        ],
        agentTimeline: [
          { timeOffset: "-18s", agent: "SCADA Ingestion Agent", action: "Logged high-temperature alarm at charging cell R-20.", status: "warning" as const },
          { timeOffset: "-11s", agent: "Safety Agent", action: "Activated cabinet exhaust blower fans to 100% capacity.", status: "completed" as const },
          { timeOffset: "-5s", agent: "Inventory Rebalancer Agent", action: "Re-allocated 3 low-battery vehicles to aux dock B slots.", status: "info" as const },
          { timeOffset: "0s", agent: "Safety Agent", action: "Tripped cell electrical relay and logged SAP PM ticket.", status: "completed" as const }
        ]
      };
    }
  };

  // Toggle sorting order or set new sorting field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Process and filter exceptions
  const processedExceptions = useMemo(() => {
    let result = [...exceptions];

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(exc => 
        exc.id.toLowerCase().includes(lower) ||
        exc.title.toLowerCase().includes(lower) ||
        exc.description.toLowerCase().includes(lower) ||
        exc.zone.toLowerCase().includes(lower) ||
        getExceptionType(exc).toLowerCase().includes(lower) ||
        getExceptionDiagnosis(exc).toLowerCase().includes(lower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(exc => exc.resolutionStatus === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(exc => getExceptionType(exc) === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA: any = a[sortField];
      let valueB: any = b[sortField];

      if (sortField === 'confidence') {
        valueA = getExceptionConfidence(a);
        valueB = getExceptionConfidence(b);
      } else if (sortField === 'timeTakenS') {
        valueA = a.timeTakenS || 0;
        valueB = b.timeTakenS || 0;
      }

      if (valueA === undefined) valueA = '';
      if (valueB === undefined) valueB = '';

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [exceptions, searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  // Statistics calculation for the quick overview metrics cards
  const stats = useMemo(() => {
    const total = exceptions.length;
    const pending = exceptions.filter(e => e.resolutionStatus === 'pending_approval').length;
    const resolving = exceptions.filter(e => e.resolutionStatus === 'resolving').length;
    const resolved = exceptions.filter(e => e.resolutionStatus === 'completed' || e.severity === 'resolved').length;
    
    const completedWithTime = exceptions.filter(e => (e.resolutionStatus === 'completed' || e.severity === 'resolved') && e.timeTakenS);
    const avgTime = completedWithTime.length > 0
      ? Math.round(completedWithTime.reduce((sum, e) => sum + (e.timeTakenS || 0), 0) / completedWithTime.length)
      : 35; // Default average mttr fallback

    const totalConfidence = exceptions.reduce((sum, e) => sum + getExceptionConfidence(e), 0);
    const avgConfidence = total ? Math.round(totalConfidence / total) : 92;

    return { total, pending, resolving, resolved, avgTime, avgConfidence };
  }, [exceptions]);

  // Active exception object selected for the drawer
  const selectedException = useMemo(() => {
    return exceptions.find(e => e.id === selectedExceptionId) || null;
  }, [exceptions, selectedExceptionId]);

  return (
    <div className="space-y-6 relative min-h-[600px]" id="resolutions-dashboard-root">
      
      {/* 1. Header & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI Card 1: Unresolved Exceptions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unresolved Issues</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-850 font-mono">
                {stats.pending + stats.resolving}
              </span>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Active Anomaly
              </span>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Mean Time To Resolve */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mean Time To Resolve</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-850 font-mono">{stats.avgTime}</span>
              <span className="text-xs text-slate-500 font-semibold">seconds</span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Avg AI Confidence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg AI Confidence</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-850 font-mono">{stats.avgConfidence}%</span>
              <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-bold">
                Optimized
              </span>
            </div>
          </div>
        </div>

        {/* KPI Card 4: Automated Success Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolution Status</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-850 font-mono">
                {stats.resolved}
              </span>
              <span className="text-xs text-slate-500 font-semibold">completed</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Advanced Control / Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <CheckSquare className="h-5.5 w-5.5 text-primary" />
              AI Decision Log & Exceptions
            </h3>
            <p className="text-xs text-text-secondary">
              Review and act on recommended agent overrides, and track previously auto-resolved transactions.
            </p>
          </div>

          {/* Reset Filters button */}
          {(searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 self-start md:self-center transition-colors border border-rose-100 bg-rose-50/50 px-2.5 py-1 rounded-lg"
            >
              Clear Active Filters
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search exceptions by ID, description, zone or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
            />
          </div>

          {/* Type dropdown */}
          <div className="md:col-span-3 flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Type:</label>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-3.5 w-3.5" />
              </span>
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-4 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white cursor-pointer transition-all appearance-none"
              >
                <option value="all">All Exception Types</option>
                <option value="qRFC">qRFC Anomaly</option>
                <option value="IDoc">IDoc Pipeline</option>
                <option value="Warehouse Task">Warehouse Task</option>
                <option value="Resource">Resource Stall</option>
              </select>
            </div>
          </div>

          {/* Status dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Status:</label>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-4 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white cursor-pointer transition-all appearance-none"
              >
                <option value="all">All Activity States</option>
                <option value="pending_approval">Pending Action (Active)</option>
                <option value="resolving">Resolving (In Flight)</option>
                <option value="completed">Resolved (History)</option>
                <option value="ignored">Overridden / Declined</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* 3. The Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {processedExceptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Filter className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">No exceptions matching criteria</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Adjust your search query or reset your filters to view full active decision logs.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider select-none">
                  <th 
                    onClick={() => handleSort('id')}
                    className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Issue ID
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Short Description</th>
                  <th 
                    onClick={() => handleSort('timestamp')}
                    className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Detected Time
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('resolutionStatus')}
                    className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4">AI Diagnosis</th>
                  <th className="p-4">Resolution Action</th>
                  <th 
                    onClick={() => handleSort('timeTakenS')}
                    className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Time to Resolve
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('confidence')}
                    className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1 flex-row-reverse md:flex-row">
                      Confidence
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs">
                {processedExceptions.map((exc, index) => {
                  const type = getExceptionType(exc);
                  const diagnosis = getExceptionDiagnosis(exc);
                  const action = getExceptionAction(exc);
                  const confidence = getExceptionConfidence(exc);
                  const isEven = index % 2 === 0;

                  // Define Badge colors based on exception types
                  let typeBadge = '';
                  if (type === 'qRFC') typeBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (type === 'IDoc') typeBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  else if (type === 'Warehouse Task') typeBadge = 'bg-violet-50 text-violet-700 border-violet-200';
                  else typeBadge = 'bg-teal-50 text-teal-700 border-teal-200';

                  // Define Status badge colors
                  let statusBadge = '';
                  let statusText = '';
                  let pulseColor = '';
                  
                  if (exc.resolutionStatus === 'pending_approval') {
                    statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                    statusText = 'Active (Pending)';
                    pulseColor = 'bg-rose-500';
                  } else if (exc.resolutionStatus === 'resolving') {
                    statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                    statusText = 'Resolving';
                    pulseColor = 'bg-amber-500';
                  } else if (exc.resolutionStatus === 'completed' || exc.severity === 'resolved') {
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    statusText = 'Resolved';
                  } else {
                    statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';
                    statusText = 'Ignored';
                  }

                  const isSelected = selectedExceptionId === exc.id;

                  return (
                    <tr 
                      key={exc.id}
                      onClick={() => setSelectedExceptionId(exc.id)}
                      className={`group cursor-pointer select-none transition-all duration-150 ${
                        isSelected 
                          ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' 
                          : isEven 
                            ? 'bg-slate-50/40 hover:bg-slate-100/50' 
                            : 'bg-white hover:bg-slate-100/50'
                      }`}
                    >
                      {/* Issue ID */}
                      <td className="p-4 font-bold font-mono text-slate-800">
                        {exc.id}
                      </td>

                      {/* Type Badge */}
                      <td className="p-4 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${typeBadge}`}>
                          {type}
                        </span>
                      </td>

                      {/* Title / Short Description */}
                      <td className="p-4 max-w-[180px]">
                        <div className="font-bold text-slate-850 truncate">{exc.title}</div>
                        <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{exc.zone}</div>
                      </td>

                      {/* Detected time */}
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {new Date(exc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      {/* Status */}
                      <td className="p-4 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {pulseColor && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColor}`} />
                            </span>
                          )}
                          {statusText}
                        </span>
                      </td>

                      {/* AI Diagnosis */}
                      <td className="p-4 text-[11px] text-slate-600 max-w-[160px] truncate italic font-medium">
                        "{diagnosis}"
                      </td>

                      {/* Suggested Action */}
                      <td className="p-4 text-[11px] text-slate-600 max-w-[160px] truncate">
                        {action}
                      </td>

                      {/* Time to Resolve */}
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {exc.timeTakenS ? `${exc.timeTakenS}s` : <span className="text-slate-300 font-normal">-</span>}
                      </td>

                      {/* Confidence */}
                      <td className="p-4 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                confidence >= 95 ? 'bg-emerald-500' : confidence >= 90 ? 'bg-sky-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className={`font-black font-mono text-[11px] ${
                            confidence >= 95 ? 'text-emerald-600' : confidence >= 90 ? 'text-sky-600' : 'text-amber-600'
                          }`}>
                            {confidence}%
                          </span>
                        </div>
                      </td>

                      {/* Row trigger action */}
                      <td className="p-4 text-center shrink-0">
                        <button 
                          className="p-1 rounded-md text-slate-400 group-hover:text-primary hover:bg-slate-100 transition-all cursor-pointer"
                          title="Open Explainability Drawer"
                        >
                          <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 4. Explainability Drawer Panel - Absolute Over Slide Out */}
      <AnimatePresence>
        {selectedException && (() => {
          const detailedExp = getDetailedExplainability(selectedException);
          const type = getExceptionType(selectedException);
          const confidence = getExceptionConfidence(selectedException);
          const assignedAgent = agents.find(a => a.id === selectedException.assignedAgentId);

          return (
            <>
              {/* Dark Backdrop Overlaid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedExceptionId(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-40 cursor-pointer"
              />

              {/* Sliding Drawer Content - Upgraded to beautiful wide layout */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="fixed top-0 right-0 h-full w-full sm:max-w-xl bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
                style={{ height: '100vh' }}
              >
                
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Explainability Trace</span>
                        <span className="h-1 w-1 rounded-full bg-slate-350" />
                        <span className="text-[10px] font-bold font-mono text-primary bg-primary/5 px-1.5 py-0.2 rounded border border-primary/10">SAP EWM Suite</span>
                      </div>
                      <h4 className="font-extrabold text-slate-850 text-base flex items-center gap-1.5 mt-0.5">
                        Case File: <span className="font-mono text-slate-700">{selectedException.id}</span>
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedExceptionId(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-250">
                  
                  {/* Section 1: Issue Summary Card */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black font-mono bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">
                        Zone: {selectedException.zone}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black font-mono border uppercase tracking-wider ${
                        type === 'qRFC' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        type === 'IDoc' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        type === 'Warehouse Task' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {type} Queue
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Anomaly Title</span>
                      <h3 className="font-black text-slate-850 text-lg leading-snug mt-0.5">
                        {selectedException.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1.5">
                        {selectedException.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(selectedException.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 font-bold ${
                        selectedException.resolutionStatus === 'completed' || selectedException.severity === 'resolved' 
                          ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          selectedException.resolutionStatus === 'completed' || selectedException.severity === 'resolved' 
                            ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                        }`} />
                        {selectedException.resolutionStatus === 'completed' || selectedException.severity === 'resolved' ? 'Resolved' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Root Cause Analysis */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-3">
                    <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                      Root Cause Analysis
                    </h5>
                    <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {detailedExp.rootCause}
                      </p>
                    </div>
                  </div>

                  {/* Section 2.1: Agents Involved */}
                  {detailedExp.agentsInvolved && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-3">
                      <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Bot className="h-4.5 w-4.5 text-indigo-500" />
                        Agents Involved
                      </h5>
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-start flex-wrap gap-2 text-xs font-bold text-indigo-950">
                        {detailedExp.agentsInvolved.split(' → ').map((agentName, agentIndex, arr) => (
                          <React.Fragment key={agentName}>
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-3xs font-black">
                              {agentName}
                            </span>
                            {agentIndex < arr.length - 1 && (
                              <span className="text-indigo-400 font-black mx-1">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2.2: Actions Taken */}
                  {detailedExp.actionsTaken && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-3">
                      <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
                        Actions Taken
                      </h5>
                      <div className="space-y-2">
                        {detailedExp.actionsTaken.map((actionText, actionIndex) => {
                          const match = actionText.match(/^(\d+)\.\s*(.*)/);
                          const stepNum = match ? match[1] : (actionIndex + 1).toString();
                          const textOnly = match ? match[2] : actionText;

                          return (
                            <div key={actionIndex} className="flex gap-3 items-start bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl p-3 transition-colors">
                              <div className="h-5.5 w-5.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-100">
                                {stepNum}
                              </div>
                              <p className="text-xs text-slate-700 leading-normal font-medium">
                                {textOnly}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 3: AI Agents Involved & Timeline */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Bot className="h-4.5 w-4.5 text-indigo-500" />
                        Autonomous Agent Timeline
                      </h5>
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {detailedExp.agentTimeline.length} Core Nodes
                      </span>
                    </div>

                    <div className="relative pl-6 space-y-5 border-l border-slate-150 ml-2.5">
                      {detailedExp.agentTimeline.map((item, index) => {
                        const isWarning = item.status === 'warning';
                        const isInfo = item.status === 'info';
                        
                        return (
                          <div key={index} className="relative group">
                            {/* Circle bullet on the left line */}
                            <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 ${
                              isWarning ? 'border-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                              isInfo ? 'border-sky-500' : 'border-emerald-500'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isWarning ? 'bg-rose-500' :
                                isInfo ? 'bg-sky-500' : 'bg-emerald-500'
                              }`} />
                            </span>

                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-slate-800 text-xs block">
                                {item.agent}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                {item.timeOffset}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-medium">
                              {item.action}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 4: SAP Objects & Actions Used */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
                    <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="h-4.5 w-4.5 text-blue-500" />
                      SAP Objects & Actions Used
                    </h5>
                    
                    <div className="space-y-3">
                      {detailedExp.sapObjects.map((obj, i) => (
                        <div key={i} className="border border-slate-150 rounded-xl p-3 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-[10px] font-bold font-mono text-slate-700 break-all select-all bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-3xs">
                              {obj.name}
                            </code>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                              obj.type === 'BAPI' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                              obj.type === 'RFC' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                              'bg-cyan-50 text-cyan-700 border-cyan-200'
                            }`}>
                              {obj.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium mt-1.5 pl-0.5">
                            {obj.purpose}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 6: Business Impact Avoided */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                    <h5 className="font-black text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                      Business Impact Avoided
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      {detailedExp.businessImpact}
                    </p>
                    <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Estimated Savings</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">{detailedExp.estimatedSavings || "$12,500.00"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Downtime Prevented</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">{detailedExp.downtimePrevented || "~45 mins"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 7: Confidence Score + "Why this decision" explanation */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-4 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h5 className="font-black text-cyan-400 text-xs uppercase tracking-wider">
                          Confidence Matrix
                        </h5>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Decision weighting model</span>
                      </div>
                      <span className="text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-mono">
                        {confidence}% MATCH
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>AI CERTAINTY GRADIENT</span>
                        <span className="font-mono text-emerald-400">{confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Vector rationale</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {detailedExp.whyThisDecision}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Agent Details */}
                  {assignedAgent && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                          <Bot className="h-5.5 w-5.5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-850 text-xs block">{assignedAgent.name}</span>
                          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded block w-fit mt-1 uppercase tracking-wider">
                            {assignedAgent.role.split(' ')[0]} Cluster
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Agent Efficiency</span>
                        <span className="font-black text-xs text-slate-700 font-mono block mt-0.5">{assignedAgent.efficiency}%</span>
                      </div>
                    </div>
                  )}

                  {/* Completed details if available */}
                  {selectedException.autoResolvedAt && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-emerald-900 text-xs block">Resolution Completed</span>
                        <p className="text-[11px] text-emerald-700 leading-relaxed mt-1 font-mono">
                          Auto-resolved at {new Date(selectedException.autoResolvedAt).toLocaleTimeString()}
                          {selectedException.timeTakenS && ` in ${selectedException.timeTakenS}s with 0 latency delay.`}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Drawer Footer Actions - Sticky Bottom */}
                {selectedException.resolutionStatus === 'pending_approval' && (
                  <div className="p-5 border-t border-slate-200 bg-white flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        onDeclineResolution(selectedException.id);
                        setSelectedExceptionId(null);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors text-center"
                    >
                      Override / Decline
                    </button>
                    <button
                      onClick={() => {
                        onApproveResolution(selectedException.id);
                        setSelectedExceptionId(null);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all hover:shadow-lg hover:-translate-y-0.2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Apply Recommended Plan
                    </button>
                  </div>
                )}

              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
