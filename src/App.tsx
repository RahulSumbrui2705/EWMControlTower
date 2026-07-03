/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import OperationsConsole from './components/OperationsConsole';
import OverviewTab from './components/tabs/OverviewTab';
import LiveOperationsTab from './components/tabs/LiveOperationsTab';
import AIAgentsTab from './components/tabs/AIAgentsTab';
import ResolutionsTab from './components/tabs/ResolutionsTab';
import IntegrationsTab from './components/tabs/IntegrationsTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import { Toaster, toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
  initialAgents,
  initialIntegrations,
  initialExceptions,
  initialOrders,
  initialTelemetry,
  initialActivityLogs
} from './initialData';

import {
  WarehouseException,
  AIAgent,
  WarehouseOrder,
  IntegrationNode,
  LiveTelemetryLog,
  WarehouseMetrics,
  ActivityLog
} from './types';

import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, isRealFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';


const simExceptions: WarehouseException[] = [
  {
    id: 'Issue-001',
    timestamp: '2026-07-02T09:43:00-07:00',
    severity: 'critical',
    zone: 'SMQ1 Inbound Queue',
    title: 'Inbound Delivery processing stuck – qRFC queue blocked',
    description: 'Queue SMQ1 blocked for Inbound Delivery 1800001245 (IDoc 0000001245789012)',
    assignedAgentId: 'integrator',
    resolutionStatus: 'pending_approval',
    suggestedResolution: 'Execute queue unlock + reprocess via custom RFC /SCWM/RFC_QUEUE_REPROCESS.',
    type: 'qRFC',
    aiDiagnosis: 'Monitor Agent detected queue lock on material master 1000004567. Previous LUW failed due to RFC communication timeout. Queue has been in blocked state for 47 minutes.',
    resolutionAction: 'Resolution Agent executed queue unlock + reprocess via custom RFC /SCWM/RFC_QUEUE_REPROCESS. Queue released and IDoc reprocessed successfully.',
    confidence: 96,
    timeTakenS: 8
  },
  {
    id: 'Issue-002',
    timestamp: '2026-07-02T09:48:00-07:00',
    severity: 'critical',
    zone: 'Zone B - Bin 02-04-12',
    title: 'Putaway task WT-98432 failed – Bin capacity exceeded',
    description: 'WT-98432 failed during putaway of HU 9876543210 into Bin 02-04-12',
    assignedAgentId: 'rebalancer',
    resolutionStatus: 'pending_approval',
    suggestedResolution: 'Execute /SCWM/TO_CONFIRM with alternative bin determination + create new Warehouse Task for Bin 03-01-05 using BAPI /SCWM/TO_CREATE.',
    type: 'Warehouse Task',
    aiDiagnosis: 'Diagnostic Agent identified that destination Bin 02-04-12 has only 12% remaining physical capacity. Handling Unit (HU) 9876543210 is a palletized load with 1.2m height and 850kg weight, which exceeds the available bin volumetric threshold.',
    resolutionAction: 'Resolution Agent executed /SCWM/TO_CONFIRM with alternative bin determination + created new Warehouse Task for Bin 03-01-05 using BAPI /SCWM/TO_CREATE.',
    confidence: 94,
    timeTakenS: 11
  },
  {
    id: 'Issue-003',
    timestamp: '2026-07-02T10:02:00-07:00',
    severity: 'critical',
    zone: 'WE20 Outbound Gateway',
    title: 'IDoc transmission delay - Outbound dispatch blocked',
    description: 'IDoc E1WDL02 failed to dispatch for Outbound Delivery 800012543 (customer partner profile error)',
    assignedAgentId: 'integrator',
    resolutionStatus: 'pending_approval',
    suggestedResolution: 'Process IDoc via BAPI_IDOC_INPUT and trigger outbound transmission queue via BD87.',
    type: 'IDoc',
    aiDiagnosis: "Monitor Agent detected that the outbound IDoc E1WDL02 failed to dispatch for Outbound Delivery 800012543 due to missing partner profile parameters inside transaction WE20, leaving partner logical system 'LS' with an inactive port assignment.",
    resolutionAction: 'Resolution Agent executed BAPI_IDOC_INPUT and triggered BD87 outbound processing successfully.',
    confidence: 95,
    timeTakenS: 6
  },
  {
    id: 'Issue-004',
    timestamp: '2026-07-02T10:15:00-07:00',
    severity: 'critical',
    zone: 'Zone C - AGV Corridor',
    title: 'AGV Resource Assignment failure - Travel path deadlock',
    description: 'AGV #04 travel path locked due to resource assignment collision in Aisle 8',
    assignedAgentId: 'router',
    resolutionStatus: 'pending_approval',
    suggestedResolution: 'Reassign active delivery and transport tasks to alternative AGV using /SCWM/RSRC_REASSIGN.',
    type: 'Resource',
    aiDiagnosis: 'Monitor Agent registered an emergency braking event on AGV #04 due to a LiDAR safety sensor field occlusion at grid coordinates inside the aisle 8 corridor.',
    resolutionAction: 'AGV Fleet Agent executed /SCWM/RSRC_REASSIGN successfully to bypass path deadlock.',
    confidence: 93,
    timeTakenS: 5
  }
];


export default function App() {
  // Current active viewport tab
  const [currentTab, setCurrentTab] = useState<'overview' | 'live' | 'agents' | 'resolutions' | 'integrations' | 'analytics'>('overview');

  // Shared Explainability drawer state
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);

  // Simulation State Variables
  const [autonomousMode, setAutonomousMode] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [sapStatus, setSapStatus] = useState<'connected' | 'degraded' | 'disconnected'>('connected');

  // Core Data Lists
  const [agents, setAgents] = useState<AIAgent[]>(() => JSON.parse(JSON.stringify(initialAgents)));
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(() => JSON.parse(JSON.stringify(initialIntegrations)));
  const [exceptions, setExceptions] = useState<WarehouseException[]>(() => JSON.parse(JSON.stringify(initialExceptions)));
  const [orders, setOrders] = useState<WarehouseOrder[]>(() => JSON.parse(JSON.stringify(initialOrders)));
  const [telemetry, setTelemetry] = useState<LiveTelemetryLog[]>(() => JSON.parse(JSON.stringify(initialTelemetry)));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);

  // Overall Performance Metrics state
  const [metrics, setMetrics] = useState<WarehouseMetrics>({
    totalOrdersToday: 412,
    completedOrdersToday: 215,
    averageFulfillmentTimeMin: 38.5,
    agentSuccessRatePercent: 64.2,
    currentThroughputHr: 590
  });

  // Dynamically synchronize metrics with the active autonomous mode
  useEffect(() => {
    if (autonomousMode) {
      setMetrics({
        totalOrdersToday: 422,
        completedOrdersToday: 310,
        averageFulfillmentTimeMin: 14.2,
        agentSuccessRatePercent: 98.4,
        currentThroughputHr: 840
      });
    } else {
      setMetrics({
        totalOrdersToday: 412,
        completedOrdersToday: 215,
        averageFulfillmentTimeMin: 38.5,
        agentSuccessRatePercent: 64.2,
        currentThroughputHr: 590
      });
    }
  }, [autonomousMode]);

  // Sequenced Autonomous Simulation Run State
  const [isSequencing, setIsSequencing] = useState<boolean>(false);
  const [sequenceExceptionId, setSequenceExceptionId] = useState<string | null>(null);
  const [sequenceStep, setSequenceStep] = useState<'idle' | 'monitor' | 'diagnostic' | 'resolution' | 'validation'>('idle');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Track exceptions currently being auto-resolved
  const autoResolvingRefs = useRef<Set<string>>(new Set());

  // Track logged steps to prevent duplicate logging
  const loggedStepRef = useRef<{ [excId: string]: string }>({});

  // Function to log an agent action to the Activity Feed (and optionally write to Firestore)
  const logAgentActivity = useCallback(async (agentName: string, action: string, issueId: string, details: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newLogId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const logData: ActivityLog = {
      id: newLogId,
      timestamp,
      agentName,
      action,
      issueId,
      details
    };

    // Update local state first for immediate UI updates
    setActivityLogs((prev) => [logData, ...prev].slice(0, 49));

    // Write to Firestore if real credentials are configured
    if (isRealFirebaseConfigured) {
      try {
        const logRef = doc(db, 'activityLogs', newLogId);
        await setDoc(logRef, logData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `activityLogs/${newLogId}`);
      }
    }
  }, []);

  // Real-time listener for Firestore activityLogs
  useEffect(() => {
    if (!isRealFirebaseConfigured) {
      return;
    }

    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as ActivityLog);
      });
      if (logs.length > 0) {
        setActivityLogs(logs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'activityLogs');
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for Firestore exceptions
  useEffect(() => {
    if (!isRealFirebaseConfigured) {
      return;
    }

    const q = query(collection(db, 'exceptions'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbExceptions: WarehouseException[] = [];
      snapshot.forEach((doc) => {
        dbExceptions.push(doc.data() as WarehouseException);
      });
      if (dbExceptions.length > 0) {
        setExceptions(dbExceptions);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exceptions');
    });

    return () => unsubscribe();
  }, []);

  // Function to add clean telemetry log
  const addTelemetry = useCallback((message: string, type: LiveTelemetryLog['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newLog: LiveTelemetryLog = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      type,
      message
    };
    setTelemetry((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Sync SAP status with integrations state
  useEffect(() => {
    setIntegrations((prev) =>
      prev.map((node) => {
        if (node.id === 'sap_s4') {
          return {
            ...node,
            status: sapStatus,
            latency: sapStatus === 'connected' ? 18 : sapStatus === 'degraded' ? 240 : 9999
          };
        }
        return node;
      })
    );

    if (sapStatus === 'connected') {
      addTelemetry('SAP S/4HANA sync restabilized.', 'system');
    } else if (sapStatus === 'degraded') {
      addTelemetry('SAP ERP pipeline latency exceeded 200ms warning threshold.', 'exception');
    } else {
      addTelemetry('CRITICAL: SAP S/4HANA network connection lost.', 'exception');
    }
  }, [sapStatus, addTelemetry]);

  // Handle manual/autonomous approval of an exception resolution
  const handleApproveResolution = useCallback((id: string) => {
    setExceptions((prev) =>
      prev.map((exc) => {
        if (exc.id === id) {
          const nextExc: WarehouseException = {
            ...exc,
            resolutionStatus: 'completed',
            severity: 'resolved',
            autoResolvedAt: new Date().toISOString(),
            timeTakenS: exc.timeTakenS || 5
          };
          if (isRealFirebaseConfigured) {
            setDoc(doc(db, 'exceptions', id), nextExc).catch((err) => {
              console.error("Failed to write approved exception to Firestore:", err);
            });
          }
          return nextExc;
        }
        return exc;
      })
    );

    // Get exception details for logs
    const exc = exceptions.find((e) => e.id === id);
    if (exc) {
      addTelemetry(`Resolution plan approved for ${exc.title}. Actuating physical warehouse overrides...`, 'resolution');
      addTelemetry(`SUCCESS: Exception resolved. Normal traffic restored to ${exc.zone}.`, 'resolution');

      const assignedAgent = agents.find((a) => a.id === exc.assignedAgentId);
      const agentName = assignedAgent ? assignedAgent.name : 'EWM Orchestrator';

      // Provide precise BAPI/RFC logging based on exception id
      let customLogMessage = `Actuated EWM recovery protocol: "${exc.suggestedResolution}". Conveyor gates and route flows restored.`;
      let customActionName = 'Applied Resolution Plan';
      if (exc.id === 'Issue-001' || exc.id === 'exc-101') {
        customActionName = 'qRFC Reprocessed';
        customLogMessage = `Resolution Agent executed /SCWM/RFC_QUEUE_REPROCESS. Queue SMQ1 status changed to Running. Inbound Delivery 1800001245 unlocked.`;
      } else if (exc.id === 'Issue-002' || exc.id === 'exc-102') {
        customActionName = 'WT Reallocated';
        customLogMessage = `Resolution Agent executed /SCWM/TO_CONFIRM with alternative bin determination. Created new Warehouse Task for Bin 03-01-05 via BAPI /SCWM/TO_CREATE.`;
      } else if (exc.id === 'Issue-003' || exc.id === 'exc-103') {
        customActionName = 'Partner Profile Restored';
        customLogMessage = `Resolution Agent updated WE20 profile parameters and executed BD87 queue reprocess successfully. IDoc Status moved to 03 (Sent to port).`;
      } else if (exc.id === 'Issue-004' || exc.id === 'exc-104') {
        customActionName = 'Resource Rerouted';
        customLogMessage = `Resolution Agent executed /SCWM/RSRC_REASSIGN successfully. Transport task reassigned to alternative AGV, resolving path deadlock.`;
      }

      logAgentActivity(
        agentName,
        customActionName,
        exc.id,
        customLogMessage
      );

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        completedOrdersToday: prev.completedOrdersToday + 1,
        agentSuccessRatePercent: Math.min(100, prev.agentSuccessRatePercent + 0.2)
      }));
    }
  }, [exceptions, agents, addTelemetry, logAgentActivity]);

  // Override/decline resolution
  const handleDeclineResolution = useCallback((id: string) => {
    setExceptions((prev) =>
      prev.map((exc) => {
        if (exc.id === id) {
          const nextExc: WarehouseException = {
            ...exc,
            resolutionStatus: 'ignored'
          };
          if (isRealFirebaseConfigured) {
            setDoc(doc(db, 'exceptions', id), nextExc).catch((err) => {
              console.error("Failed to write declined exception to Firestore:", err);
            });
          }
          return nextExc;
        }
        return exc;
      })
    );
    const exc = exceptions.find((e) => e.id === id);
    if (exc) {
      addTelemetry(`Supervisor OVERRIDE: Declined recommendation for ${exc.title}. Manual forklift routing issued.`, 'system');

      logAgentActivity(
        'System Supervisor',
        'Declined AI Recommendation',
        exc.id,
        `Manually overridden agent recommendation for ${exc.title} in ${exc.zone}. Dispatched human supervisor.`
      );
    }
  }, [exceptions, addTelemetry, logAgentActivity]);

  // Autonomous execution simulation engine
  useEffect(() => {
    // Find exceptions that are pending approval
    const pendingExceptions = exceptions.filter(
      (e) => e.resolutionStatus === 'pending_approval'
    );

    if (pendingExceptions.length === 0) return;

    pendingExceptions.forEach((exc) => {
      const assignedAgent = agents.find((a) => a.id === exc.assignedAgentId);

      // We only auto-resolve if autonomousMode is globally active AND the specific agent is approved for autonomous decisions
      if (autonomousMode && assignedAgent?.autonomousAllowed) {
        // Prevent launching multiple resolution threads for the same exception
        if (autoResolvingRefs.current.has(exc.id)) return;
        autoResolvingRefs.current.add(exc.id);

        addTelemetry(`Autonomous Loop: ${assignedAgent.name} intercepted exception ${exc.id} in ${exc.zone}.`, 'agent');
        
        let customInterceptMsg = `Initiating automated diagnostics on exception ${exc.id} in ${exc.zone}.`;
        let interceptAction = 'Triage Initiated';
        if (exc.type === 'qRFC' || exc.id === 'Issue-001' || exc.id === 'exc-101') {
          interceptAction = 'OData Scan Triggered';
          customInterceptMsg = `Monitor Agent detected qRFC lock on Inbound Delivery 1800001245 via OData polling. Commencing queue diagnostics.`;
        } else if (exc.type === 'Warehouse Task' || exc.id === 'Issue-002' || exc.id === 'exc-102') {
          interceptAction = 'WT Exception Trapped';
          customInterceptMsg = `Monitor Agent trapped putaway WT-98432 exception on Bin 02-04-12. Initiating volumetric bin sweep.`;
        } else if (exc.type === 'IDoc' || exc.id === 'Issue-003' || exc.id === 'exc-103') {
          interceptAction = 'IDoc Alert Trapped';
          customInterceptMsg = `Monitor Agent flagged transmission failure flag (Status 29) for Outbound Delivery 800012543.`;
        } else if (exc.type === 'Resource' || exc.id === 'Issue-004' || exc.id === 'exc-104') {
          interceptAction = 'Resource Exception Trapped';
          customInterceptMsg = `Monitor Agent registered emergency collision avoidance lock on AGV #04 travel path in Aisle 8.`;
        }
        logAgentActivity(
          assignedAgent.name,
          interceptAction,
          exc.id,
          customInterceptMsg
        );

        // Spike agent load during analysis
        setAgents((prev) =>
          prev.map((a) => {
            if (a.id === assignedAgent.id) {
              return {
                ...a,
                status: 'busy',
                load: Math.min(100, a.load + 45),
                currentTask: `Executing autonomous resolution path for ${exc.title}`
              };
            }
            return a;
          })
        );

        // Simulate typing/resolution delay
        const timer = setTimeout(() => {
          // Complete the resolution
          handleApproveResolution(exc.id);

          // Reset agent back to nominal state
          setAgents((prev) =>
            prev.map((a) => {
              if (a.id === assignedAgent.id) {
                return {
                  ...a,
                  status: 'idle',
                  load: Math.max(5, a.load - 45),
                  currentTask: 'Monitoring telemetry queues',
                  logs: [`Resolved exception ${exc.id} autonomously.`, ...a.logs]
                };
              }
              return a;
            })
          );

          autoResolvingRefs.current.delete(exc.id);
        }, 4000 / simulationSpeed);

        return () => clearTimeout(timer);
      }
    });
  }, [exceptions, agents, autonomousMode, simulationSpeed, handleApproveResolution, addTelemetry, logAgentActivity]);

  // Periodic heartbeat loop (every 3 seconds, scaled by simulation speed)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Progress active orders
      setOrders((prevOrders) => {
        return prevOrders.map((order) => {
          if (order.status === 'completed') return order;

          const step = Math.floor(Math.random() * 5) + 3;
          let nextProgress = order.progress + step;
          let nextStatus = order.status;

          if (nextProgress >= 100) {
            nextProgress = 0;
            if (order.status === 'pending') {
              nextStatus = 'picking';
              addTelemetry(`Order ${order.id}: Released to picking rows.`, 'info');
              logAgentActivity(
                'Task Allocator Agent',
                'Allocated Pick Order',
                order.id,
                `Optimized line load and allocated picking row 4 to order SKU: ${order.sku} (Qty: ${order.qty}).`
              );
            } else if (order.status === 'picking') {
              nextStatus = 'packing';
            } else if (order.status === 'packing') {
              nextStatus = 'shipping';
            } else if (order.status === 'shipping') {
              nextProgress = 100;
              nextStatus = 'completed';
              addTelemetry(`Order ${order.id}: Dispatched successfully. Shipping gate verified.`, 'info');
              
              logAgentActivity(
                'AGV Router Agent',
                'Completed Delivery Dispatch',
                order.id,
                `Guided AGV #11 to dispatch SKU: ${order.sku} at loading bay gate. Outbound manifest synchronized.`
              );

              // Increment metrics
              setMetrics((prev) => ({
                ...prev,
                completedOrdersToday: prev.completedOrdersToday + 1,
                totalOrdersToday: prev.totalOrdersToday + 1
              }));
            }
          }

          return {
            ...order,
            progress: nextProgress,
            status: nextStatus
          };
        });
      });

      // 2. Fluctuat throughput metrics slightly
      setMetrics((prev) => {
        const offset = Math.floor(Math.random() * 30) - 15;
        const throughput = Math.max(600, Math.min(1150, prev.currentThroughputHr + offset));
        return {
          ...prev,
          currentThroughputHr: throughput
        };
      });

      // 3. Randomly inject dynamic normal order release if buffer space is healthy
      if (Math.random() > 0.7) {
        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder: WarehouseOrder = {
          id: orderId,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}-EL`,
          qty: Math.floor(5 + Math.random() * 150),
          destination: Math.random() > 0.5 ? 'Loading Dock A' : 'Staging Area B',
          status: 'pending',
          priority: Math.random() > 0.85 ? 'urgent' : Math.random() > 0.6 ? 'high' : 'standard',
          progress: 0
        };
        setOrders((prev) => [newOrder, ...prev.slice(0, 9)]);
        addTelemetry(`S/4HANA Pipeline: Released ${orderId} into outfeed buffer.`, 'system');

        logAgentActivity(
          'Inventory Rebalancer Agent',
          'Ingested Outfeed SKU',
          orderId,
          `Analyzed outfeed demand matrix for SKU ${newOrder.sku} (Qty: ${newOrder.qty}). Allocated optimal outfeed row.`
        );
      }

    }, 3500 / simulationSpeed);

    return () => clearInterval(interval);
  }, [simulationSpeed, addTelemetry, logAgentActivity]);

  // Trigger simulated anomaly from simulation controls
  const triggerAnomaly = useCallback((type: 'agv_obstruction' | 'conveyor_jam' | 'spill_hazard' | 'high_temp') => {
    let title = '';
    let description = '';
    let zone = '';
    let assignedAgentId = '';
    let suggestedResolution = '';
    let excType: WarehouseException['type'] = 'Resource';
    let aiDiagnosis = '';
    let resolutionAction = '';
    let confidence = 95;

    if (type === 'agv_obstruction') {
      title = 'AGV #08 Navigation Obstruction';
      description = 'Proximity warning: LiDAR scanner on AGV #08 reports path blocked in Zone C Corridor B.';
      zone = 'Zone C - AGV Corridor';
      assignedAgentId = 'router';
      suggestedResolution = 'Instruct AGV #08 to backup 1.2 meters and reroute fleet through Corridor Alpha bypassing Zone C entirely.';
      excType = 'Resource';
      aiDiagnosis = 'LiDAR path occlusion by palletized merchandise overhang.';
      resolutionAction = 'Reverse-step AGV and execute high-priority alternate route grid-calculation.';
      confidence = 95;
    } else if (type === 'conveyor_jam') {
      title = 'Conveyor Diverter 4 Jammed';
      description = 'Induct sensor reports carton slippage at main picking sorter diverter gate 4.';
      zone = 'Zone A - Pick Sorter';
      assignedAgentId = 'allocator';
      suggestedResolution = 'Temporarily direct heavy items to conveyor buffer 2, slow outfeed flow by 20%, and cycle pneumatics on gate 4.';
      excType = 'qRFC';
      aiDiagnosis = 'Diverter gate slippage under high parcel density.';
      resolutionAction = 'Route flow to secondary buffer & cycle pneumatic release valves.';
      confidence = 92;
    } else if (type === 'spill_hazard') {
      title = 'Fluid Spill Alert Row 3';
      description = 'Safety cameras detected dynamic wet spill hazard on floor path in High-Density row 3.';
      zone = 'Zone B - Aisle 3';
      assignedAgentId = 'safety';
      suggestedResolution = 'Halt all AGVs traversing aisle 3. Dispatch automated floor marshal drone with absorbent compound.';
      excType = 'Warehouse Task';
      aiDiagnosis = 'Visual cameras identified high-reflectivity liquid pooling.';
      resolutionAction = 'Close path segment and command autonomous spill-sweep drone.';
      confidence = 99;
    } else if (type === 'high_temp') {
      title = 'Battery Pack Thermal Threshold Spike';
      description = 'Temperature monitor R-20 flagged active temp of 48.5C on AGV charging dock rack.';
      zone = 'Zone B - Charging Hub';
      assignedAgentId = 'rebalancer';
      suggestedResolution = 'Engage redundant ventilation exhaust fans at 100% capacity and reroute docking vehicles to aux hub B.';
      excType = 'IDoc';
      aiDiagnosis = 'Thermal heat dissipation block on rack system R-20 charging cells.';
      resolutionAction = 'Enable forced cabinet ventilation exhaust & cut charging power load.';
      confidence = 89;
    }

    const newException: WarehouseException = {
      id: `EXC-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      zone,
      title,
      description,
      assignedAgentId,
      resolutionStatus: 'pending_approval',
      suggestedResolution,
      type: excType,
      aiDiagnosis,
      resolutionAction,
      confidence
    };

    setExceptions((prev) => [newException, ...prev]);
    if (isRealFirebaseConfigured) {
      setDoc(doc(db, 'exceptions', newException.id), newException).catch((err) => {
        console.error("Failed to write new exception to Firestore:", err);
      });
    }

    addTelemetry(`CRITICAL ALARM: ${title} detected in ${zone}. AI Agent triage in progress.`, 'exception');

    const assignedAgent = agents.find((a) => a.id === assignedAgentId);
    const agentName = assignedAgent ? assignedAgent.name : 'Safety Agent';

    let triggerActionName = 'Triage Commenced';
    let triggerDetails = `Sensor array triggered alarm in ${zone}. Commencing live diagnostics.`;
    if (type === 'agv_obstruction') {
      triggerActionName = 'Corridor Scan Failed';
      triggerDetails = `LiDAR scanner on AGV #08 reports path obstruction in Zone C. Initiating travel path recalculation.`;
    } else if (type === 'conveyor_jam') {
      triggerActionName = 'Conveyor Slip Alert';
      triggerDetails = `Induct sensor reports carton slippage at main picking sorter diverter gate 4. Dispatching queue adjustment rules.`;
    } else if (type === 'spill_hazard') {
      triggerActionName = 'Floor Obstruction Alert';
      triggerDetails = `Safety cameras flagged active fluid pool on physical route grid in Zone B. Enforcing immediate area lock.`;
    } else if (type === 'high_temp') {
      triggerActionName = 'Thermal Threshold Spike';
      triggerDetails = `Temperature probe flagged heat spike on charging dock R-20 cells. Routing active vehicles to aux docks.`;
    }

    logAgentActivity(
      agentName,
      triggerActionName,
      newException.id,
      triggerDetails
    );
  }, [addTelemetry, logAgentActivity, agents]);

  // Reset simulation completely
  const handleResetDemo = useCallback(() => {
    setIsSequencing(false);
    setSequenceExceptionId(null);
    setSequenceStep('idle');
    setIsPaused(false);
    loggedStepRef.current = {};

    setAgents(JSON.parse(JSON.stringify(initialAgents)));
    setIntegrations(JSON.parse(JSON.stringify(initialIntegrations)));
    setExceptions(JSON.parse(JSON.stringify(initialExceptions)));
    setOrders(JSON.parse(JSON.stringify(initialOrders)));
    setTelemetry(JSON.parse(JSON.stringify(initialTelemetry)));
    setAutonomousMode(false);
    setSimulationSpeed(1);
    setSapStatus('connected');
    setMetrics({
      totalOrdersToday: 412,
      completedOrdersToday: 215,
      averageFulfillmentTimeMin: 38.5,
      agentSuccessRatePercent: 64.2,
      currentThroughputHr: 590
    });
    addTelemetry('Operations Console reset successfully. Nominal baseline conditions restored.', 'system');
    toast.success("♻️ Operations reset to baseline status.");
  }, [addTelemetry]);

  // Launch sequenced autonomous agent loop
  const handleLaunchAutonomousSequence = useCallback(() => {
    if (isSequencing) {
      if (isPaused) {
        setIsPaused(false);
        addTelemetry("Autonomous Operations resumed.", "system");
        toast.info("▶️ Autonomous operations resumed");
      }
      return;
    }

    loggedStepRef.current = {};
    addTelemetry("Starting interactive autonomous agent operations loop...", "system");
    setAutonomousMode(true);
    setIsSequencing(true);
    setIsPaused(false);
    
    // Reset and load the 4 precise exceptions
    setExceptions(JSON.parse(JSON.stringify(simExceptions)));
    setSequenceStep('monitor');
    setSequenceExceptionId('Issue-001');
    
    toast.success("🤖 Swarm Autonomous Operations activated.");
  }, [isSequencing, isPaused, addTelemetry]);

  // Pause / Resume operations
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      addTelemetry(`Autonomous Operations ${next ? 'PAUSED' : 'RESUMED'}.`, "system");
      if (next) {
        toast.warning("⏸️ Autonomous operations paused");
      } else {
        toast.info("▶️ Autonomous operations resumed");
      }
      return next;
    });
  }, [addTelemetry]);

  // Main step-by-step Sequencer Effect
  useEffect(() => {
    if (!isSequencing || isPaused) return;

    // Find first pending exception if none is active
    if (!sequenceExceptionId) {
      const pending = exceptions.filter((e) => e.resolutionStatus === 'pending_approval');
      if (pending.length === 0) {
        addTelemetry("No active exceptions in queue. Commencing full systems diagnostics sweep for priority operational exceptions.", "system");
        toast.info("🚀 Active queue clear. Performing sweep for next exception alerts...");
        
        // Inject a conveyor jam
        triggerAnomaly('conveyor_jam');
        // Inject an AGV obstacle after a tiny delay
        setTimeout(() => {
          triggerAnomaly('agv_obstruction');
        }, 600);
        return;
      } else {
        setSequenceExceptionId(pending[0].id);
        setSequenceStep('monitor');
        return;
      }
    }

    const currentExc = exceptions.find((e) => e.id === sequenceExceptionId);
    if (!currentExc || currentExc.resolutionStatus !== 'pending_approval') {
      // If the exception was resolved, deleted, or cleared, find the next one or complete
      const remaining = exceptions.filter((e) => e.resolutionStatus === 'pending_approval' && e.id !== sequenceExceptionId);
      if (remaining.length > 0) {
        setSequenceExceptionId(remaining[0].id);
        setSequenceStep('monitor');
      } else {
        setIsSequencing(false);
        setSequenceExceptionId(null);
        setSequenceStep('idle');
        toast.success("🏆 Autonomous Workflow Complete! All warehouse exceptions have been resolved.", { duration: 5000 });
        addTelemetry("Global Autonomous Simulation Cycle finished successfully.", "system");
      }
      return;
    }

    const assignedAgentId = currentExc.assignedAgentId;
    let timer: NodeJS.Timeout;

    if (sequenceStep === 'idle') {
      setSequenceStep('monitor');
    }
    else if (sequenceStep === 'monitor') {
      toast.info(`🔍 [Monitor Agent] Telemetry anomaly detected in ${currentExc.zone}: "${currentExc.title}"`, { duration: 3500 });
      addTelemetry(`[Monitor Agent] Detected exception ${currentExc.id} signature in ${currentExc.zone}. Initiating diagnostic sweep.`, 'agent');

      if (loggedStepRef.current[currentExc.id] !== 'monitor') {
        loggedStepRef.current[currentExc.id] = 'monitor';
        logAgentActivity(
          'Monitor Agent',
          'Telemetry Anomaly Scanned',
          currentExc.id,
          `🔍 [Monitor Agent] Trapped exception signature in ${currentExc.zone}: "${currentExc.title}". Initiating qRFC queue and IDoc trace. Handing off to Diagnostic Agent.`
        );
      }

      // Update agent load and status
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === assignedAgentId) {
            return {
              ...a,
              status: 'busy',
              load: 45,
              currentTask: `[MONITOR] Scanning LiDAR sensor frames for ${currentExc.title}`
            };
          }
          return a;
        })
      );

      timer = setTimeout(() => {
        setSequenceStep('diagnostic');
      }, 1650 / simulationSpeed);
    } 
    else if (sequenceStep === 'diagnostic') {
      toast(`🧠 [Diagnostic Agent] Analysing telemetry logs. Root Cause: ${currentExc.aiDiagnosis || 'Telemetry drift detected'}`, {
        icon: '🧠',
        duration: 3500
      });
      addTelemetry(`[Diagnostic Agent] Diagnosis complete for ${currentExc.id}: "${currentExc.aiDiagnosis}". Confidence: ${currentExc.confidence}%.`, 'agent');

      if (loggedStepRef.current[currentExc.id] !== 'diagnostic') {
        loggedStepRef.current[currentExc.id] = 'diagnostic';
        logAgentActivity(
          'Diagnostic Agent',
          'Payload Isolated',
          currentExc.id,
          `🧠 [Diagnostic Agent] Analysed root cause: "${currentExc.aiDiagnosis || 'Telemetry drift detected'}". Created correct SAP transaction repair proposal and handed off to Resolution Agent.`
        );
      }

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === assignedAgentId) {
            return {
              ...a,
              load: 75,
              currentTask: `[DIAGNOSTIC] Analyzing structural bottleneck in ${currentExc.zone}`
            };
          }
          return a;
        })
      );

      timer = setTimeout(() => {
        setSequenceStep('resolution');
      }, 1650 / simulationSpeed);
    } 
    else if (sequenceStep === 'resolution') {
      // Determine action toast text and telemetry messages using exact RFC and BAPI names
      let actionToast = "";
      let telemetryMsg = "";

      if (currentExc.id === 'Issue-001') {
        actionToast = "Resolution Agent executed /SCWM/RFC_QUEUE_REPROCESS successfully";
        telemetryMsg = `[Resolution Agent] Overriding EWM queue lock on SMQ1. Calling /SCWM/RFC_QUEUE_REPROCESS for Inbound Delivery 1800001245.`;
      } else if (currentExc.id === 'Issue-002') {
        actionToast = "Resolution Agent executed /SCWM/TO_CONFIRM and created Warehouse Task via /SCWM/TO_CREATE successfully";
        telemetryMsg = `[Resolution Agent] Confirming WT-98432 with alternate bin override via /SCWM/TO_CONFIRM. Creating new WT via BAPI /SCWM/TO_CREATE.`;
      } else if (currentExc.id === 'Issue-003') {
        actionToast = "Integration Agent executed BAPI_IDOC_INPUT and simulated WE19 interface successfully";
        telemetryMsg = `[Integration Agent] Reprocessing failed IDoc E1WDL02. Initiating BAPI_IDOC_INPUT with WE19 partner profile definition.`;
      } else if (currentExc.id === 'Issue-004') {
        actionToast = "AGV Fleet Agent executed /SCWM/RSRC_REASSIGN successfully to bypass path deadlock";
        telemetryMsg = `[AGV Fleet Agent] Triggering corridor resource reallocation. Executing /SCWM/RSRC_REASSIGN to bypass coordinate deadlock.`;
      } else {
        actionToast = `⚡ [Resolution Agent] Dispatching SAP override: "${currentExc.suggestedResolution}"`;
        telemetryMsg = `[Resolution Agent] Overriding PLC registers on conveyor/AGV node.`;
      }

      toast.success(actionToast, { duration: 4000 });
      addTelemetry(telemetryMsg, 'resolution');

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === assignedAgentId) {
            return {
              ...a,
              load: 95,
              currentTask: `[RESOLUTION] Executing direct API transaction for ${currentExc.title}`
            };
          }
          return a;
        })
      );

      // Call handleApproveResolution
      handleApproveResolution(currentExc.id);

      timer = setTimeout(() => {
        setSequenceStep('validation');
      }, 1650 / simulationSpeed);
    } 
    else if (sequenceStep === 'validation') {
      // Determine validation success toast and telemetry messages
      let toastMsg = "";
      let validationMsg = "";

      if (currentExc.id === 'Issue-001') {
        toastMsg = "Validation Agent successfully verified SMQ1 queue reprocess and closed the loop";
        validationMsg = `[Validation Agent] qRFC SMQ1 queue status moved to "Running" and IDoc reached status 53.`;
      } else if (currentExc.id === 'Issue-002') {
        toastMsg = "Validation Agent successfully completed alternative bin WT-98432 routing";
        validationMsg = `[Validation Agent] Confirmed alternate Bin 03-01-05 capacity update and RF terminal sync.`;
      } else if (currentExc.id === 'Issue-003') {
        toastMsg = "Validation Agent successfully confirmed IDoc E1WDL02 transmission status";
        validationMsg = `[Validation Agent] Confirmed IDoc Status moved to 03 (Sent to port) successfully.`;
      } else if (currentExc.id === 'Issue-004') {
        toastMsg = "Validation Agent successfully confirmed Zone C corridor recovery";
        validationMsg = `[Validation Agent] LiDAR scanner reports aisle clear. AGV traffic restored to nominal velocity.`;
      } else {
        toastMsg = `✅ [Validation Agent] Verification successful. Normal traffic restored in ${currentExc.zone}.`;
        validationMsg = `[Validation Agent] Automated loop closed. Exception ${currentExc.id} resolved. SLA successfully met.`;
      }

      toast.success(toastMsg, { duration: 3500 });
      addTelemetry(validationMsg, 'resolution');

      if (loggedStepRef.current[currentExc.id] !== 'validation') {
        loggedStepRef.current[currentExc.id] = 'validation';
        let valDetails = `✅ [Validation Agent] Verified S/4HANA status code restored to nominal and closed autonomous loop.`;
        if (currentExc.id === 'Issue-001') {
          valDetails = `✅ [Validation Agent] Confirmed qRFC SMQ1 queue reprocessed successfully. IDoc Status reached 53 (Application document posted).`;
        } else if (currentExc.id === 'Issue-002') {
          valDetails = `✅ [Validation Agent] Verified alternate bin WT-98432 routing. Confirmed Bin 03-01-05 capacity update.`;
        } else if (currentExc.id === 'Issue-003') {
          valDetails = `✅ [Validation Agent] Confirmed BD87 IDoc Status moved to 03 (Sent to port) successfully.`;
        } else if (currentExc.id === 'Issue-004') {
          valDetails = `✅ [Validation Agent] Confirmed LiDAR safety scanner reports corridor path clear. Traffic restored.`;
        }
        logAgentActivity(
          'Validation Agent',
          'Workflow Audited',
          currentExc.id,
          valDetails
        );
      }

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === assignedAgentId) {
            return {
              ...a,
              status: 'idle',
              load: 10,
              currentTask: 'Monitoring telemetry queues',
              logs: [`Resolved exception ${currentExc.id} autonomously.`, ...a.logs]
            };
          }
          return a;
        })
      );

      timer = setTimeout(() => {
        // Find next exception
        const remaining = exceptions.filter((e) => e.resolutionStatus === 'pending_approval' && e.id !== currentExc.id);
        if (remaining.length > 0) {
          setSequenceExceptionId(remaining[0].id);
          setSequenceStep('monitor');
        } else {
          setIsSequencing(false);
          setSequenceExceptionId(null);
          setSequenceStep('idle');
          toast.success("🏆 Autonomous Workflow Complete! All warehouse exceptions have been resolved.", { duration: 5000 });
          addTelemetry("Global Autonomous Operations Cycle finished successfully.", "system");
        }
      }, 1650 / simulationSpeed);
    }

    return () => clearTimeout(timer);
  }, [
    isSequencing,
    sequenceExceptionId,
    sequenceStep,
    isPaused,
    exceptions,
    simulationSpeed,
    triggerAnomaly,
    handleApproveResolution,
    addTelemetry
  ]);

  // Ping a connection node manually
  const handlePingNode = useCallback((id: string) => {
    addTelemetry(`Pinging ${id} connection node...`, 'system');
    setIntegrations((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            latency: Math.max(4, Math.floor(node.latency * 0.85 + Math.random() * 10)),
            syncCount: node.syncCount + 1,
            lastSync: 'Just now'
          };
        }
        return node;
      })
    );
  }, [addTelemetry]);

  // Toggle individual agent permission
  const handleToggleAgentPermission = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextVal = !a.autonomousAllowed;
          addTelemetry(`Security policy updated: ${a.name} autonomous self-resolve ${nextVal ? 'ALLOWED' : 'DISABLED'}.`, 'system');
          return {
            ...a,
            autonomousAllowed: nextVal
          };
        }
        return a;
      })
    );
  }, [addTelemetry]);

  const activeExceptionCount = exceptions.filter((e) => e.resolutionStatus === 'pending_approval').length;

  const resolvedCountForBanner = exceptions.filter((e) => e.severity === 'resolved' || e.resolutionStatus === 'completed').length;
  const bannerInterventionsAvoided = 1420 + resolvedCountForBanner * 12;
  const bannerEstCostSavings = 12450 + resolvedCountForBanner * 145;
  const bannerThroughputPercentVal = ((metrics.currentThroughputHr - 720) / 720 * 100);
  const bannerThroughputText = bannerThroughputPercentVal > 0 ? `+${bannerThroughputPercentVal.toFixed(1)}%` : `+0.0%`;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col text-text-dark font-sans select-none antialiased">
      {/* 1. Header Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        autonomousMode={autonomousMode}
        toggleAutonomousMode={() => {
          const nextMode = !autonomousMode;
          setAutonomousMode(nextMode);
          addTelemetry(`Global Autonomous decision loop set to ${nextMode ? 'ACTIVE' : 'SUPERVISED_ONLY'}.`, 'system');
        }}
        activeExceptionCount={activeExceptionCount}
      />

      {/* 2. Main Content Dashboard Container */}
      <main id="main-content-tower" className="flex-1 mx-auto w-full max-w-[1600px] p-6 pb-24 space-y-6">
        
        {/* Dynamic global AI Impact Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary via-[#0f5ca6] to-accent-ai text-white py-3.5 px-6 border border-white/10 shadow-[0_4px_20px_rgba(10,77,140,0.15)] flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden"
        >
          {/* Animated glowing mesh background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,180,216,0.15),transparent_60%)] animate-pulse pointer-events-none" />
          
          <div className="flex items-center gap-2.5 relative z-10 shrink-0">
            <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-[0.18em] uppercase text-cyan-300 font-mono block">
                COCKPIT DECISION TRACKER
              </span>
              <span className="text-[9px] font-mono text-slate-300">Real-Time Autonomous Impact Trace</span>
            </div>
          </div>

          {/* The actual ticker metrics: "X human interventions avoided • $X,XXX saved • Throughput +XX%" */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold relative z-10 font-mono text-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">🤖</span>
              <span>
                <motion.span 
                  key={bannerInterventionsAvoided}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-white font-black text-sm"
                >
                  {bannerInterventionsAvoided.toLocaleString()}
                </motion.span> human interventions avoided
              </span>
            </div>
            
            <span className="hidden md:inline text-white/30">•</span>

            <div className="flex items-center gap-2">
              <span className="text-emerald-400">💰</span>
              <span>
                <motion.span 
                  key={bannerEstCostSavings}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-400 font-black text-sm"
                >
                  ${bannerEstCostSavings.toLocaleString()}
                </motion.span> saved
              </span>
            </div>

            <span className="hidden md:inline text-white/30">•</span>

            <div className="flex items-center gap-2">
              <span className="text-cyan-400">📈</span>
              <span>
                Throughput <motion.span 
                  key={bannerThroughputText}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-cyan-300 font-black text-sm"
                >
                  {bannerThroughputText}
                </motion.span> (vs baseline 720/hr)
              </span>
            </div>
          </div>

          {/* Badge status */}
          <div className="hidden lg:flex items-center gap-1.5 relative z-10 shrink-0 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-[9px] font-bold text-white tracking-wider uppercase font-mono">
              Live Swarm Active
            </span>
          </div>
        </motion.div>

        {/* Active Content view switcher */}
        {currentTab === 'overview' && (
          <OverviewTab
            metrics={metrics}
            exceptions={exceptions}
            telemetry={telemetry}
            agents={agents}
            autonomousMode={autonomousMode}
            onSelectTab={setCurrentTab}
            onApproveResolution={handleApproveResolution}
            onDeclineResolution={handleDeclineResolution}
            activityLogs={activityLogs}
            setSelectedExceptionId={setSelectedExceptionId}
            isSequencing={isSequencing}
            isPaused={isPaused}
            sequenceStep={sequenceStep}
            sequenceExceptionId={sequenceExceptionId}
            onLaunchSequence={handleLaunchAutonomousSequence}
            onTogglePause={handleTogglePause}
            onResetDemo={handleResetDemo}
            triggerAnomaly={triggerAnomaly}
          />
        )}

        {currentTab === 'live' && (
          <LiveOperationsTab
            orders={orders}
            exceptions={exceptions}
            telemetry={telemetry}
          />
        )}

        {currentTab === 'agents' && (
          <AIAgentsTab
            agents={agents}
            onToggleAgentPermission={handleToggleAgentPermission}
          />
        )}

        {currentTab === 'resolutions' && (
          <ResolutionsTab
            exceptions={exceptions}
            agents={agents}
            onApproveResolution={handleApproveResolution}
            onDeclineResolution={handleDeclineResolution}
            selectedExceptionId={selectedExceptionId}
            setSelectedExceptionId={setSelectedExceptionId}
          />
        )}

        {currentTab === 'integrations' && (
          <IntegrationsTab
            integrations={integrations}
            onPingNode={handlePingNode}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsTab exceptions={exceptions} />
        )}

      </main>

      {/* 3. Floating Operations Console Controls */}
      <OperationsConsole
        autonomousMode={autonomousMode}
        toggleAutonomousMode={() => {
          const nextMode = !autonomousMode;
          setAutonomousMode(nextMode);
          addTelemetry(`Global Autonomous decision loop set to ${nextMode ? 'ACTIVE' : 'SUPERVISED_ONLY'}.`, 'system');
        }}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        sapStatus={sapStatus}
        setSapStatus={setSapStatus}
        triggerAnomaly={triggerAnomaly}
        onResetDemo={handleResetDemo}
        isSequencing={isSequencing}
        isPaused={isPaused}
        sequenceStep={sequenceStep}
        sequenceExceptionId={sequenceExceptionId}
        onLaunchSequence={handleLaunchAutonomousSequence}
        onTogglePause={handleTogglePause}
        exceptions={exceptions}
      />
      


      {/* Real-time styled Toast notifications */}
      <Toaster position="top-right" richColors closeButton theme="light" />
    </div>
  );
}
