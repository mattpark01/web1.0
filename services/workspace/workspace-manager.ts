import { WORKSPACE_LIMITS, WorkspaceTier } from '@/types/workspace';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class WorkspaceManager {
  /**
   * Get or create a workspace for a user
   */
  async getOrCreateWorkspace(userId: string, tier: WorkspaceTier = 'free') {
    // Check for existing workspace
    const existing = await prisma.workspaces.findFirst({
      where: { user_id: userId }
    });
    
    if (existing) {
      // Resume if stopped
      if (existing.state === 'stopped') {
        await this.resumeWorkspace(existing);
      }
      
      return existing;
    }
    
    // Create new workspace
    return await this.createWorkspace(userId, tier);
  }

  /**
   * Create a new workspace for a user
   */
  private async createWorkspace(userId: string, tier: WorkspaceTier) {
    const workspaceId = `ws-${userId}-${Date.now()}`;
    const machineId = crypto.randomUUID();
    const hostname = `workspace-${userId.substring(0, 8)}`;
    
    const limits = WORKSPACE_LIMITS[tier];
    
    const workspace = await prisma.workspaces.create({
      data: {
        user_id: userId,
        workspace_id: workspaceId,
        hostname,
        machine_id: machineId,
        state: 'provisioning',
        tier,
        environment: {
          HOME: '/home/user',
          USER: `user-${userId.substring(0, 8)}`,
          HOSTNAME: hostname,
          MACHINE_ID: machineId,
          SHELL: '/bin/bash',
          TERM: 'xterm-256color',
        },
        storage: {
          r2Bucket: 'spatiolabs-workspaces',  // Single bucket for all users
          r2Prefix: `users/${userId}`,         // User-specific path within bucket
          homeDir: '/home/user',
          systemDir: '/var/workspace',
        },
        resources: limits,
        dns_name: `${userId.substring(0, 8)}.workspace.spatiolabs.org`
      }
    });
    
    // Initialize R2 storage structure
    await this.initializeStorage(userId);
    
    // Deploy Cloud Run service
    await this.deployCloudRunService(workspace);
    
    // Update state to stopped (ready to start)
    await prisma.workspaces.update({
      where: { workspace_id: workspaceId },
      data: { state: 'stopped' }
    });
    
    return workspace;
  }

  /**
   * Resume a stopped workspace
   */
  private async resumeWorkspace(workspace: any): Promise<void> {
    // Update state to provisioning
    await prisma.workspaces.update({
      where: { workspace_id: workspace.workspace_id },
      data: { state: 'provisioning' }
    });
    
    try {
      // Start Cloud Run service
      const serviceUrl = await this.startCloudRunService(workspace);
      
      // Update workspace with service URL and state
      await prisma.workspaces.update({
        where: { workspace_id: workspace.workspace_id },
        data: {
          state: 'active',
          service_url: serviceUrl,
          last_accessed_at: new Date()
        }
      });
    } catch (error) {
      // Set error state if provisioning fails
      await prisma.workspaces.update({
        where: { workspace_id: workspace.workspace_id },
        data: { state: 'error' }
      });
      throw error;
    }
  }

  /**
   * Initialize R2 storage for a user
   */
  private async initializeStorage(userId: string): Promise<void> {
    // This would integrate with your R2 setup
    // Creating the bucket structure:
    // users-{userId}/
    //   home/
    //     .bashrc
    //     .profile
    //   system/
    //     packages.txt
    //     machine-id
    
    console.log(`Initializing R2 storage for user ${userId}`);
    // Implementation depends on your R2 client setup
  }

  /**
   * Deploy Cloud Run service for workspace
   */
  private async deployCloudRunService(workspace: any): Promise<void> {
    // This would integrate with Google Cloud Run API
    console.log(`Deploying Cloud Run service for workspace ${workspace.workspaceId}`);
    
    // Example deployment configuration:
    const deployConfig = {
      name: workspace.workspaceId,
      image: 'gcr.io/spatiolabs/workspace:latest',
      minInstances: 0, // Scale to zero
      maxInstances: 1,
      env: {
        WORKSPACE_ID: workspace.workspaceId,
        USER_ID: workspace.userId,
        MACHINE_ID: workspace.machineId,
        R2_BUCKET: (workspace.storage as any).r2Bucket,
        R2_PREFIX: (workspace.storage as any).r2Prefix,
        ...workspace.environment,
      },
      resources: workspace.resources,
    };
    
    // Deploy using gcloud SDK or API
  }

  /**
   * Start a Cloud Run service
   */
  private async startCloudRunService(workspace: any): Promise<string> {
    // This would make a request to wake up the Cloud Run service
    // and return the service URL
    return `https://${workspace.workspace_id}-spatiolabs.a.run.app`;
  }

  /**
   * Create a new session for a workspace
   */
  async createSession(workspaceId: string, userId: string) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    return await prisma.workspace_sessions.create({
      data: {
        workspace_id: workspaceId,
        user_id: userId,
        session_token: sessionToken,
        state: 'connecting'
      }
    });
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await prisma.workspace_sessions.update({
      where: { id: sessionId },
      data: {
        last_activity_at: new Date(),
        state: 'active',
        idle_since: null
      }
    });
    
    // Also update workspace last accessed time
    const session = await prisma.workspace_sessions.findUnique({
      where: { id: sessionId }
    });
    
    if (session) {
      await prisma.workspaces.update({
        where: { workspace_id: session.workspace_id },
        data: { last_accessed_at: new Date() }
      });
    }
  }

  /**
   * Mark session as idle
   */
  async markSessionIdle(sessionId: string): Promise<void> {
    await prisma.workspace_sessions.update({
      where: { id: sessionId },
      data: {
        state: 'idle',
        idle_since: new Date()
      }
    });
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    await prisma.workspace_sessions.update({
      where: { id: sessionId },
      data: {
        state: 'disconnected',
        ended_at: new Date()
      }
    });
    
    // Check if workspace should be suspended
    await this.checkAndSuspendWorkspace(sessionId);
  }

  /**
   * Check if workspace should be suspended after session ends
   */
  private async checkAndSuspendWorkspace(sessionId: string): Promise<void> {
    // Get workspace and check for other active sessions
    const session = await prisma.workspace_sessions.findUnique({
      where: { id: sessionId },
      include: {
        workspaces: {
          include: {
            workspace_sessions: {
              where: { state: 'active' }
            }
          }
        }
      }
    });
    
    if (session && session.workspaces.workspace_sessions.length === 0) {
      const limits = WORKSPACE_LIMITS[session.workspaces.tier as WorkspaceTier];
      
      // Schedule suspension based on tier
      setTimeout(async () => {
        await this.suspendWorkspace(session.workspace_id);
      }, limits.idleTimeout * 1000);
    }
  }

  /**
   * Suspend a workspace
   */
  async suspendWorkspace(workspaceId: string): Promise<void> {
    await prisma.workspaces.updateMany({
      where: {
        workspace_id: workspaceId,
        state: 'active'
      },
      data: {
        state: 'suspended',
        suspended_at: new Date()
      }
    });
    
    // Stop the Cloud Run service
    console.log(`Suspending Cloud Run service for workspace ${workspaceId}`);
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(userId: string) {
    const workspace = await prisma.workspaces.findFirst({
      where: { user_id: userId },
      include: {
        workspace_sessions: true,
        _count: {
          select: {
            workspace_sessions: true,
            workspace_events: true,
            workspace_packages: true
          }
        }
      }
    });
    
    if (!workspace) return null;
    
    const activeSessions = workspace.workspace_sessions.filter(s => s.state === 'active').length;
    
    return {
      tier: workspace.tier,
      state: workspace.state,
      totalRuntimeSeconds: workspace.total_runtime_seconds,
      totalStorageBytes: workspace.total_storage_bytes,
      createdAt: workspace.created_at,
      lastAccessedAt: workspace.last_accessed_at,
      totalSessions: workspace._count.workspace_sessions,
      activeSessions,
      totalEvents: workspace._count.workspace_events,
      installedPackages: workspace._count.workspace_packages
    };
  }
}

export const workspaceManager = new WorkspaceManager();