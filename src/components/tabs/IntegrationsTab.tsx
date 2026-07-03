import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  CloudLightning, 
  ShieldAlert,
  Terminal,
  Server,
  Globe,
  Database,
  Cpu,
  Wifi,
  Send,
  Lock,
  Cable,
  CornerDownRight,
  ExternalLink,
  Search,
  Check,
  FileText,
  Bot
} from 'lucide-react';
import { motion } from 'motion/react';
import { IntegrationNode } from '../../types';

interface IntegrationsTabProps {
  integrations: IntegrationNode[];
  onPingNode: (id: string) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  service: 'odata' | 'btp' | 'connector' | 'event';
  level: 'info' | 'success' | 'warn' | 'error';
  endpoint: string;
  message: string;
  latencyMs: number;
}

export default function IntegrationsTab({
  integrations,
  onPingNode
}: IntegrationsTabProps) {
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'odata' | 'btp' | 'connector' | 'event'>('all');
  
  // Local system clock reference for live updating logs
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePing = (id: string) => {
    setPingingId(id);
    onPingNode(id);
    setTimeout(() => {
      setPingingId(null);
    }, 1000);
  };

  // Generate ultra-realistic logs that align with the current date/time
  const mockLogs = useMemo<LogEntry[]>(() => {
    const formatTime = (offsetSec: number) => {
      const d = new Date(currentTime.getTime() - offsetSec * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    };

    return [
      {
        id: 'log-1',
        timestamp: formatTime(2),
        service: 'odata',
        level: 'success',
        endpoint: 'GET /sap/opu/odata/sap/EWM_WAREHOUSE_TASKS/$metadata',
        message: 'Schema fetched successfully. EWM entities bound to AI Agent state.',
        latencyMs: 14
      },
      {
        id: 'log-2',
        timestamp: formatTime(6),
        service: 'btp',
        level: 'info',
        endpoint: 'POST /oauth/token',
        message: 'BTP Destination Service refreshed trust token. RSA-256 validation complete.',
        latencyMs: 245
      },
      {
        id: 'log-3',
        timestamp: formatTime(12),
        service: 'event',
        level: 'success',
        endpoint: 'SUBSCRIBE sap/ewm/warehouse/task/created',
        message: 'SAP Event Mesh: Dispatching queue payload to Autonomous Router Agent.',
        latencyMs: 8
      },
      {
        id: 'log-4',
        timestamp: formatTime(18),
        service: 'connector',
        level: 'success',
        endpoint: 'TUNNEL tls://scc-subaccount-prod.eu10.hanacloud.ondemand.com:443',
        message: 'HANA Cloud Connector: Tunnel handshake established. TLS 1.3 encryption active.',
        latencyMs: 38
      },
      {
        id: 'log-5',
        timestamp: formatTime(25),
        service: 'odata',
        level: 'success',
        endpoint: 'POST /sap/opu/odata/sap/EWM_RESOURCES/UpdatePosition',
        message: 'SAP ERP updated. AGV #04 telemetry route push completed.',
        latencyMs: 19
      },
      {
        id: 'log-6',
        timestamp: formatTime(32),
        service: 'event',
        level: 'info',
        endpoint: 'PUBLISH sap/ewm/anomalies/triage',
        message: 'Published exception telemetry to live diagnostic queues. Priority: CRITICAL.',
        latencyMs: 6
      },
      {
        id: 'log-7',
        timestamp: formatTime(44),
        service: 'connector',
        level: 'success',
        endpoint: 'PROPAGATE principal://shana-user-propagation',
        message: 'Principal Propagation validated. Mapping security context to backend user ERP_AI_AGENT.',
        latencyMs: 42
      },
      {
        id: 'log-8',
        timestamp: formatTime(55),
        service: 'odata',
        level: 'warn',
        endpoint: 'GET /sap/opu/odata/sap/EWM_STOCK_LEVELS',
        message: 'OData response degraded. Internal database buffer threshold exceeded (82% usage).',
        latencyMs: 184
      },
      {
        id: 'log-9',
        timestamp: formatTime(75),
        service: 'btp',
        level: 'success',
        endpoint: 'GET /sap/api/v1/subaccounts/destinations/EWM_S4_DEST',
        message: 'Destination ping returned response 200 OK.',
        latencyMs: 54
      },
      {
        id: 'log-10',
        timestamp: formatTime(90),
        service: 'event',
        level: 'success',
        endpoint: 'ACK queue://sap-ewm-warehouse-exception-listener',
        message: 'Acknowledged message-id msg_901a82b7. Queue size reduced to 0.',
        latencyMs: 4
      },
      {
        id: 'log-11',
        timestamp: formatTime(120),
        service: 'odata',
        level: 'success',
        endpoint: 'PATCH /sap/opu/odata/sap/EWM_WAREHOUSE_TASKS(id=\'WT-2041\')',
        message: 'PLC Overrides applied. Conveyor jam status flag set to RESOLVED.',
        latencyMs: 24
      }
    ];
  }, [currentTime]);

  // Filter logs based on filters
  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = activeFilter === 'all' || log.service === activeFilter;
      return matchesSearch && matchesService;
    });
  }, [mockLogs, searchQuery, activeFilter]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="font-bold text-text-dark text-lg mb-1 flex items-center gap-2">
            <Layers className="h-5.5 w-5.5 text-primary" />
            Enterprise System Integrations & Gateway
          </h3>
          <p className="text-sm text-text-secondary">
            Inspect live secure connections, event queues, OData endpoint service level agreements, and SAP cloud connectors routing automation actions.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold shrink-0">
          <CloudLightning className="h-4 w-4 text-primary" />
          Active SAP Gateway: Online
        </div>
      </div>

      {/* Technical Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 via-cyan-500 to-emerald-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
          ENTERPRISE INTEGRATION BUS & DATA FLOW ARTIFACT
        </span>
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 max-w-5xl my-2">
          {/* Block 1: SAP S/4HANA EWM */}
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-3xs transition-all hover:bg-slate-100/50">
            <Server className="h-6 w-6 text-indigo-600 mb-1.5" />
            <span className="text-xs font-extrabold text-slate-850">SAP S/4HANA EWM</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">On-Premise ERP Backend</span>
          </div>
          
          {/* Connect 1 */}
          <div className="flex flex-col items-center justify-center text-slate-400 shrink-0">
            <span className="hidden lg:block text-[11px] font-mono font-black text-cyan-600 animate-pulse bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full">← Cloud Connector →</span>
            <span className="lg:hidden text-[10px] font-mono font-black text-cyan-600 animate-pulse bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full">↑ Cloud Connector ↓</span>
          </div>

          {/* Block 2: OData & BTP Gateway */}
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-3xs transition-all hover:bg-slate-100/50">
            <Layers className="h-6 w-6 text-blue-600 mb-1.5" />
            <span className="text-xs font-extrabold text-slate-850">OData & BTP Gateway</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">SAP BTP Cloud Destination</span>
          </div>

          {/* Connect 2 */}
          <div className="flex flex-col items-center justify-center text-slate-400 shrink-0">
            <span className="hidden lg:block text-[11px] font-mono font-black text-primary animate-pulse bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">← JSON REST / MQTT →</span>
            <span className="lg:hidden text-[10px] font-mono font-black text-primary animate-pulse bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">↑ JSON REST / MQTT ↓</span>
          </div>

          {/* Block 3: AI Agents Orchestration */}
          <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md text-white transition-all hover:bg-slate-850">
            <Bot className="h-6 w-6 text-cyan-400 mb-1.5 animate-bounce" style={{ animationDuration: '3s' }} />
            <span className="text-xs font-black text-cyan-400">Autonomous AI Agents</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">Reasoning & SLA Resolver</span>
          </div>

          {/* Connect 3 */}
          <div className="flex flex-col items-center justify-center text-slate-400 shrink-0">
            <span className="hidden lg:block text-[11px] font-mono font-black text-emerald-600 animate-pulse bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">← Secured State Sync →</span>
            <span className="lg:hidden text-[10px] font-mono font-black text-emerald-600 animate-pulse bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">↑ Secured State Sync ↓</span>
          </div>

          {/* Block 4: UI State Persistence */}
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-3xs transition-all hover:bg-slate-100/50">
            <Database className="h-6 w-6 text-emerald-600 mb-1.5" />
            <span className="text-xs font-extrabold text-slate-850">Firestore DB</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">Real-time UI State</span>
          </div>
        </div>
      </div>

      {/* Modern 4-Pillar Visual Architecture Architecture Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Pillar 1: OData Services Health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-1">
                <Database className="h-3 w-3 text-blue-500" /> OData Services
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <Check className="h-3 w-3" /> 200 OK
              </span>
            </div>

            <h4 className="font-bold text-text-dark text-base mb-1">OData Services (EWM)</h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Real-time read/write interface for WarehouseTask, WarehouseOrder, StorageBins, and qRFC queue monitoring inside SAP S/4HANA EWM.
            </p>

            <div className="space-y-2.5 font-mono text-[11px] mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate pr-2">/EWM_WarehouseTasks</span>
                <span className="text-success-ewm font-bold shrink-0">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate pr-2">/EWM_WarehouseOrders</span>
                <span className="text-success-ewm font-bold shrink-0">99.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate pr-2">/EWM_QueueMonitoring</span>
                <span className="text-warning-ewm font-bold shrink-0">98.4%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary">
            <span>Agg. Latency:</span>
            <span className="font-bold text-text-dark font-mono">18.4 ms</span>
          </div>
        </div>

        {/* Pillar 2: SAP BTP Connection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-1">
                <Globe className="h-3 w-3 text-cyan-500" /> SAP BTP Platform
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <Check className="h-3 w-3" /> Secure BTP
              </span>
            </div>

            <h4 className="font-bold text-text-dark text-base mb-1">SAP BTP Extension</h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              SAP Business Technology Platform (BTP) destination management and extension registry, coordinating multi-tenant AI Agents orchestration.
            </p>

            <div className="space-y-2.5 font-mono text-[11px] mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Destination ID</span>
                <span className="text-text-dark font-semibold">S4_EWM_PROD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Security Token</span>
                <span className="text-blue-600 font-semibold flex items-center gap-0.5">OAuth2 <Lock className="h-2.5 w-2.5" /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Region</span>
                <span className="text-text-dark font-semibold">eu10 (AWS)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary">
            <span>Uptime SLA:</span>
            <span className="font-bold text-text-dark font-mono">99.98%</span>
          </div>
        </div>

        {/* Pillar 3: HANA Cloud Connector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-1">
                <Cable className="h-3 w-3 text-indigo-500" /> Tunnel Gateway
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <Check className="h-3 w-3" /> TLS Active
              </span>
            </div>

            <h4 className="font-bold text-text-dark text-base mb-1">Cloud Connector</h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              SAP Cloud Connector (SCC) secure TLS 1.3 reverse-proxy tunnel connecting on-premise SAP ERP / EWM networks to SAP BTP.
            </p>

            <div className="space-y-2.5 font-mono text-[11px] mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Propagation</span>
                <span className="text-success-ewm font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Virtual Host</span>
                <span className="text-text-dark font-semibold truncate max-w-[100px]" title="s4ewm.virtual.corp">s4ewm.virtual</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Proxy Mode</span>
                <span className="text-text-dark font-semibold">HTTPS Only</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary">
            <span>Encryption:</span>
            <span className="font-bold text-text-dark font-mono">AES-256-GCM</span>
          </div>
        </div>

        {/* Pillar 4: Event-Driven Ingestion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono flex items-center gap-1">
                <Server className="h-3 w-3 text-purple-500" /> Pub / Sub Broker
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <Check className="h-3 w-3" /> Event Mesh
              </span>
            </div>

            <h4 className="font-bold text-text-dark text-base mb-1">Event Ingestion</h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              SAP Event Mesh ingestion broker receiving and dispatching real-time MQTT/AMQP signals (e.g. queue alerts, AGV telemetry, LiDAR sensor streams).
            </p>

            <div className="space-y-2.5 font-mono text-[11px] mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate">task/created</span>
                <span className="text-text-dark font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate">anomaly/alert</span>
                <span className="text-text-dark font-semibold text-purple-600">Subscribed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary truncate">agv/telemetry</span>
                <span className="text-text-dark font-semibold">Active</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary">
            <span>Rate (avg):</span>
            <span className="font-bold text-text-dark font-mono">142 events/s</span>
          </div>
        </div>

      </div>

      {/* Enterprise Service Nodes Grid */}
      <div>
        <h4 className="text-sm font-bold text-text-dark mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Integration Core Node Heartbeat Registers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {integrations.map((node) => {
            const isPinging = pingingId === node.id;
            
            let statusColor = 'bg-success-ewm text-white';
            let statusText = 'Online';
            let borderColor = 'border-slate-200';
            let bgPill = 'bg-emerald-50 text-emerald-700 border-emerald-200';

            if (node.status === 'degraded') {
              statusColor = 'bg-warning-ewm text-white';
              statusText = 'Latency Alert';
              borderColor = 'border-amber-200';
              bgPill = 'bg-amber-50 text-amber-700 border-amber-200';
            } else if (node.status === 'disconnected') {
              statusColor = 'bg-danger-ewm text-white';
              statusText = 'Offline';
              borderColor = 'border-rose-200';
              bgPill = 'bg-rose-50 text-rose-700 border-rose-200';
            }

            return (
              <div 
                key={node.id} 
                className={`rounded-2xl border bg-white p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[215px] ${borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                      {node.type}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bgPill}`}>
                      {statusText}
                    </span>
                  </div>

                  <h4 className="font-bold text-text-dark text-xs.5 mb-1 truncate" title={node.name}>{node.name}</h4>
                  <div className="text-[10px] text-text-secondary font-mono">
                    Sync: <span className="text-text-dark font-sans">{node.lastSync}</span>
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="my-2.5 py-2 border-t border-b border-slate-100 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <div className="text-[8.5px] font-bold text-text-secondary uppercase font-mono">Payloads</div>
                    <div className="text-xs font-black text-text-dark font-mono">{node.syncCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[8.5px] font-bold text-text-secondary uppercase font-mono">Latency</div>
                    <div className="text-xs font-black text-text-dark font-mono flex items-center gap-0.5">
                      <Activity className={`h-3 w-3 ${node.status === 'connected' ? 'text-success-ewm' : 'text-warning-ewm'}`} />
                      {node.latency}ms
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePing(node.id)}
                  disabled={isPinging || node.status === 'disconnected'}
                  className={`w-full py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    node.status === 'disconnected'
                      ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-50 border border-slate-200 text-text-dark hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${isPinging ? 'animate-spin' : ''}`} />
                  {isPinging ? 'Pinging...' : 'Ping Node'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live API Ledger Log Console (Highly Professional Visual Feature) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Header toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-primary" />
            <div>
              <h4 className="text-xs font-bold text-text-dark">Live Enterprise API Ledger</h4>
              <p className="text-[10px] text-text-secondary">Traces actual authenticated proxy requests and MQTT queue acknowledgements.</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search endpoints, statuses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-primary w-48 font-sans"
              />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
              {(['all', 'odata', 'btp', 'connector', 'event'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-dark'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Console display */}
        <div className="bg-slate-950 p-4 font-mono text-[11px] leading-relaxed max-h-[350px] overflow-y-auto space-y-1.5 text-slate-300">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              let levelBadge = 'text-sky-400';
              let methodColor = 'text-emerald-400';

              if (log.level === 'warn') {
                levelBadge = 'text-amber-400';
              } else if (log.level === 'error') {
                levelBadge = 'text-rose-500';
              } else if (log.level === 'info') {
                levelBadge = 'text-slate-400';
              }

              if (log.endpoint.includes('GET')) methodColor = 'text-cyan-400';
              else if (log.endpoint.includes('POST')) methodColor = 'text-emerald-400';
              else if (log.endpoint.includes('PATCH')) methodColor = 'text-amber-400';
              else if (log.endpoint.includes('SUBSCRIBE') || log.endpoint.includes('PUBLISH')) methodColor = 'text-purple-400';

              return (
                <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/50 py-1 px-1.5 rounded transition-colors group">
                  <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`font-extrabold uppercase shrink-0 text-[10px] w-14 ${levelBadge}`}>{log.service}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`font-bold mr-2 ${methodColor}`}>{log.endpoint}</span>
                    <span className="text-slate-300 group-hover:text-white transition-colors">{log.message}</span>
                  </div>
                  <span className="text-slate-500 shrink-0 text-[10px] font-bold">{log.latencyMs}ms</span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
              No logs matching query found. Try selecting "All" or altering filter tags.
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900 text-slate-400 px-4 py-2 flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" /> Connection security: WPA3/TLS 1.3
          </span>
          <span>Buffer: 100/100 packets synced</span>
        </div>

      </div>

    </div>
  );
}
