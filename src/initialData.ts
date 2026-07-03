import { AIAgent, IntegrationNode, WarehouseException, WarehouseOrder, LiveTelemetryLog, ActivityLog } from './types';

export const initialAgents: AIAgent[] = [
  {
    id: 'allocator',
    name: 'WMS Task Allocator',
    role: 'WMS Task Allocator & S/4HANA Release Manager',
    status: 'idle',
    efficiency: 98.4,
    load: 12,
    currentTask: 'Monitoring S/4HANA OData warehouse task releases',
    logs: [
      'WMS Task Allocator online. Subscribing to S/4HANA outfeed queue.',
      'Releasing warehouse task queue waves for picking and packing operations.',
      'Checking resource availability profiles and EWM queue assignments.'
    ],
    autonomousAllowed: true
  },
  {
    id: 'router',
    name: 'AGV Fleet Agent',
    role: 'AGV Fleet Router & Travel Path Coordinator',
    status: 'idle',
    efficiency: 99.1,
    load: 28,
    currentTask: 'Optimizing travel path nodes for 18 active AGVs',
    logs: [
      'AGV Fleet Router online. Active LiDAR sensory checkpoints engaged.',
      'Dynamic path calculation initialized for active fleet of 18 resources.',
      'Bypassing Aisle 8 corridor lock. Executing /SCWM/RSRC_REASSIGN to alternative AGV #08.'
    ],
    autonomousAllowed: true
  },
  {
    id: 'rebalancer',
    name: 'Slotting Optimizer Agent',
    role: 'SAP EWM Putaway Strategy & Capacity Rebalancer',
    status: 'idle',
    efficiency: 95.6,
    load: 18,
    currentTask: 'Optimizing slotting matrix & resolving Putaway WT blockages via dynamic bin search strategies',
    logs: [
      'EWM Slotting Optimizer initialized successfully.',
      'Analyzing bin capacity usage and product master putaway rules (height/weight limits).',
      'Identified storage bin 02-04-12 capacity threshold (88% filled) conflict with pallet weight profile.',
      'Evaluating alternate storage bins in Zone Beta via EWM slotting search strategy.',
      'Generated BAPI /SCWM/TO_CREATE payload for optimized alternative Storage Bin 03-01-05.'
    ],
    autonomousAllowed: true
  },
  {
    id: 'safety',
    name: 'Safety Hub Agent',
    role: 'LiDAR & Vision Obstacle Detection Coordinator',
    status: 'idle',
    efficiency: 99.8,
    load: 5,
    currentTask: 'Scanning visual security sweeps across zones',
    logs: [
      'Safety Hub watchdog core online.',
      'Scanning corridor grid structures for physical floor obstructions.',
      'Fallen shipping carton detected in Zone B. Dispatching physical sweep drone #02.'
    ],
    autonomousAllowed: false
  },
  {
    id: 'integrator',
    name: 'SAP Integration Agent',
    role: 'qRFC & IDoc Pipeline Integration Watchdog',
    status: 'idle',
    efficiency: 97.5,
    load: 15,
    currentTask: 'Monitoring SMQ1 queue locks & WE02 IDoc deliveries',
    logs: [
      'SAP Integration core queue listener engaged.',
      'Analyzing outbound and inbound qRFC queues via SMQ1/SMQ2.',
      'Blocked LUW detected on SMQ1 queue for delivery 1800001245. Attempting reprocess via /SCWM/RFC_QUEUE_REPROCESS.'
    ],
    autonomousAllowed: true
  }
];

export const initialIntegrations: IntegrationNode[] = [
  {
    id: 'sap_s4',
    name: 'SAP S/4HANA ERP Core',
    type: 'erp',
    status: 'connected',
    latency: 18,
    lastSync: 'Just now',
    syncCount: 4122
  },
  {
    id: 'robo_api',
    name: 'Warehouse Robotics Fleet API',
    type: 'robotics',
    status: 'connected',
    latency: 42,
    lastSync: 'Just now',
    syncCount: 12845
  },
  {
    id: 'iot_sensors',
    name: 'IoT Smart Sensor Mesh',
    type: 'iot',
    status: 'connected',
    latency: 8,
    lastSync: 'Just now',
    syncCount: 84902
  },
  {
    id: 'carrier_gw',
    name: 'Logistics Carrier Gateway',
    type: 'carrier',
    status: 'connected',
    latency: 112,
    lastSync: '1 min ago',
    syncCount: 845
  },
  {
    id: 'gemini_ai',
    name: 'Gemini Orchestrator Service',
    type: 'ai',
    status: 'connected',
    latency: 245,
    lastSync: 'Just now',
    syncCount: 3105
  }
];

export const initialExceptions: WarehouseException[] = [
  {
    id: 'exc-101',
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
    id: 'exc-102',
    timestamp: '2026-07-02T09:48:00-07:00',
    severity: 'critical',
    zone: 'Zone B - Bin 02-04-12',
    title: 'Putaway task WT-98432 failed – Bin capacity exceeded',
    description: 'WT-98432 failed during putaway of HU 9876543210 into Bin 02-04-12',
    assignedAgentId: 'rebalancer',
    resolutionStatus: 'pending_approval',
    suggestedResolution: 'Execute /SCWM/TO_CONFIRM with alternative bin determination + create new Warehouse Task for Bin 03-01-05 using BAPI /SCWM/TO_CREATE.',
    type: 'Warehouse Task',
    aiDiagnosis: 'Diagnostic Agent identified that Bin 02-04-12 has only 12% remaining capacity. HU 9876543210 (palletized, 1.2m height) exceeds available space.',
    resolutionAction: 'Resolution Agent executed /SCWM/TO_CONFIRM with alternative bin determination + created new Warehouse Task for Bin 03-01-05 using BAPI /SCWM/TO_CREATE.',
    confidence: 94,
    timeTakenS: 11
  },
  {
    id: 'exc-103',
    timestamp: '2026-07-02T09:12:00-07:00',
    severity: 'resolved',
    zone: 'WE20 Outbound Gateway',
    title: 'IDoc transmission delay - Outbound dispatch blocked',
    description: 'IDoc E1WDL02 failed to dispatch for Outbound Delivery 800012543 (customer partner profile error)',
    assignedAgentId: 'integrator',
    resolutionStatus: 'completed',
    suggestedResolution: 'Dynamically update partner profile routing definitions, restore port definition, and re-transmit failed IDoc transaction via BD87.',
    type: 'IDoc',
    aiDiagnosis: "Diagnostic Agent identified that partner profile parameters for carrier DHL-EXPRESS were missing in transaction WE20. Partner type 'LS' has invalid port assignment.",
    resolutionAction: "Resolution Agent dynamically updated the partner profile routing matrix, restored port definitions, and re-triggered dispatch via /SCWM/IDOC_RETRY.",
    confidence: 95,
    timeTakenS: 6,
    autoResolvedAt: '2026-07-02T09:12:06-07:00'
  },
  {
    id: 'exc-104',
    timestamp: '2026-07-02T08:50:00-07:00',
    severity: 'resolved',
    zone: 'Aisle 8 Grid',
    title: 'AGV #04 Stall – Collision avoidance lock in aisle 8',
    description: 'AGV #04 stopped at aisle 8 due to LiDAR sensor field occlusion',
    assignedAgentId: 'router',
    resolutionStatus: 'completed',
    suggestedResolution: 'Initiate safety zone lock in EWM, dispatch automated cleanup drone to sweep block envelope, and issue alternate grid coordinates via dynamic path routing.',
    type: 'Resource',
    aiDiagnosis: 'Safety Agent identified physical aisle blockage (empty plastic container fallen from Row 12, Shelf C). AGV router triggered high-priority safety interlock.',
    resolutionAction: 'Safety Agent deployed cleaning drone #02 to sweep the coordinate envelope and instructed AGV #04 to execute backup turning maneuver to bypass block.',
    confidence: 93,
    timeTakenS: 5,
    autoResolvedAt: '2026-07-02T08:50:05-07:00'
  }
];

export const initialOrders: WarehouseOrder[] = [
  { id: 'ORD-9481', sku: 'SKU-8940-EL', qty: 24, destination: 'Loading Dock A', status: 'shipping', priority: 'high', progress: 95 },
  { id: 'ORD-9482', sku: 'SKU-3120-ME', qty: 150, destination: 'Staging Area B', status: 'packing', priority: 'urgent', progress: 45 },
  { id: 'ORD-9483', sku: 'SKU-5441-CH', qty: 8, destination: 'Conveyor 3', status: 'picking', priority: 'standard', progress: 80 },
  { id: 'ORD-9484', sku: 'SKU-1029-CO', qty: 45, destination: 'Loading Dock B', status: 'picking', priority: 'standard', progress: 20 },
  { id: 'ORD-9485', sku: 'SKU-7729-EL', qty: 120, destination: 'Loading Dock A', status: 'pending', priority: 'high', progress: 0 }
];

export const initialTelemetry: LiveTelemetryLog[] = [
  { id: 'tel-1', timestamp: '09:48:12', type: 'exception', message: 'CRITICAL: Putaway WT-98432 failed on Bin 02-04-12. Capacity exceeded.' },
  { id: 'tel-2', timestamp: '09:43:05', type: 'exception', message: 'CRITICAL: qRFC queue SMQ1 blocked for Inbound Delivery 1800001245.' },
  { id: 'tel-3', timestamp: '09:12:06', type: 'resolution', message: 'RESOLUTION: IDoc outbound delay resolved. WE20 partner profile records updated and transmission verified via BD87.' },
  { id: 'tel-4', timestamp: '08:50:05', type: 'resolution', message: 'RESOLUTION: AGV #04 LiDAR path occlusion cleared. Dynamic path coordinates synchronized successfully.' },
  { id: 'tel-5', timestamp: '08:30:00', type: 'system', message: 'SAP EWM Live Control Tower connected to S/4HANA core instance.' }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act-1',
    timestamp: '09:12:06',
    agentName: 'SAP Integration Agent',
    action: 'Partner Profile Restored',
    issueId: 'exc-103',
    details: 'Corrected WE20 logical system routing records for partner DHL-EXPRESS. Reprocessed outbound IDoc queue via BD87. Transmission verified.'
  },
  {
    id: 'act-2',
    timestamp: '08:50:05',
    agentName: 'AGV Fleet Agent',
    action: 'Route Recalculation',
    issueId: 'exc-104',
    details: 'Recalculated trajectory coordinates for 4 active AGVs to bypass locked segment. Instructed AGV #04 to reverse 1.5m and execute backup turn.'
  },
  {
    id: 'act-3',
    timestamp: '08:49:30',
    agentName: 'Safety Hub Agent',
    action: 'Debris Removal Actuation',
    issueId: 'exc-104',
    details: 'Dispatched physical sweep unit #02 to clear LiDAR field occlusion at Row 12, Shelf C. Path clearance verified via real-time telemetry.'
  }
];


