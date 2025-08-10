// Workspace types matching database schema

export interface Workspace {
  id: string;
  userId: string;
  workspaceId: string;
  hostname: string;
  machineId: string;
  state: 'active' | 'suspended' | 'stopped' | 'provisioning' | 'error';
  tier: 'free' | 'basic' | 'pro' | 'power';
  
  environment: {
    HOME?: string;
    USER?: string;
    HOSTNAME?: string;
    MACHINE_ID?: string;
    [key: string]: string | undefined;
  };
  
  storage: {
    r2Bucket?: string;
    homeDir?: string;
    systemDir?: string;
    [key: string]: string | undefined;
  };
  
  resources?: {
    cpu: string;
    memory: string;
    storage: string;
    timeout: string;
  };
  
  ipAddress?: string;
  dnsName?: string;
  ports?: Array<{
    port: number;
    protocol: 'tcp' | 'udp';
    service?: string;
  }>;
  
  serviceUrl?: string;
  serviceRevision?: string;
  
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  suspendedAt?: Date;
  
  totalRuntimeSeconds?: number;
  totalStorageBytes?: number;
}

export interface WorkspaceSession {
  id: string;
  workspaceId: string;
  userId: string;
  sessionToken: string;
  
  websocketId?: string;
  terminalPid?: number;
  connectionIp?: string;
  userAgent?: string;
  
  state: 'connecting' | 'active' | 'idle' | 'disconnected';
  idleSince?: Date;
  
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  
  terminalBuffer?: string;
  environmentVars?: Record<string, string>;
  workingDirectory?: string;
}

export interface WorkspaceEvent {
  id: string;
  workspaceId: string;
  userId: string;
  eventType: string;
  eventData?: Record<string, any>;
  createdAt: Date;
}

export interface WorkspacePackage {
  id: string;
  workspaceId: string;
  packageName: string;
  packageVersion?: string;
  installedAt: Date;
}

export type WorkspaceTier = 'free' | 'basic' | 'pro' | 'power';

export const WORKSPACE_LIMITS: Record<WorkspaceTier, {
  cpu: string;
  memory: string;
  storage: string;
  timeout: string;
  maxSessions: number;
  idleTimeout: number; // in seconds
}> = {
  free: {
    cpu: '0.25',
    memory: '512Mi',
    storage: '1Gi',
    timeout: '60m',
    maxSessions: 1,
    idleTimeout: 300, // 5 minutes
  },
  basic: {
    cpu: '1',
    memory: '2Gi',
    storage: '10Gi',
    timeout: '4h',
    maxSessions: 3,
    idleTimeout: 1800, // 30 minutes
  },
  pro: {
    cpu: '2',
    memory: '8Gi',
    storage: '50Gi',
    timeout: '24h',
    maxSessions: 10,
    idleTimeout: 7200, // 2 hours
  },
  power: {
    cpu: '4',
    memory: '32Gi',
    storage: '200Gi',
    timeout: '168h', // 1 week
    maxSessions: 50,
    idleTimeout: 86400, // 24 hours
  },
};