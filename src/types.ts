export interface WarehouseException {
  id: string;
  timestamp: string;
  severity: 'warning' | 'critical' | 'resolved';
  zone: string;
  title: string;
  description: string;
  assignedAgentId: string;
  resolutionStatus: 'pending_approval' | 'resolving' | 'completed' | 'ignored';
  suggestedResolution: string;
  autoResolvedAt?: string;
  timeTakenS?: number;
  type?: 'qRFC' | 'IDoc' | 'Warehouse Task' | 'Resource';
  aiDiagnosis?: string;
  resolutionAction?: string;
  confidence?: number;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'offline';
  efficiency: number; // percentage
  load: number; // percentage
  currentTask: string;
  logs: string[];
  autonomousAllowed: boolean;
}

export interface WarehouseOrder {
  id: string;
  sku: string;
  qty: number;
  destination: string;
  status: 'pending' | 'picking' | 'packing' | 'shipping' | 'completed';
  priority: 'standard' | 'high' | 'urgent';
  progress: number; // percentage of completion of current stage
}

export interface IntegrationNode {
  id: string;
  name: string;
  type: 'erp' | 'robotics' | 'iot' | 'carrier' | 'ai';
  status: 'connected' | 'degraded' | 'disconnected';
  latency: number; // ms
  lastSync: string;
  syncCount: number;
}

export interface WarehouseMetrics {
  totalOrdersToday: number;
  completedOrdersToday: number;
  averageFulfillmentTimeMin: number;
  agentSuccessRatePercent: number;
  currentThroughputHr: number;
}

export interface LiveTelemetryLog {
  id: string;
  timestamp: string;
  type: 'info' | 'agent' | 'system' | 'exception' | 'resolution';
  message: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  issueId: string;
  details: string;
}

