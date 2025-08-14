import { ActionDefinition } from '../../types'

export const taskActions: ActionDefinition[] = [
  {
    id: 'tasks.create',
    actionId: 'tasks.create',
    platform: 'tasks',
    provider: 'native',
    name: 'Create Task',
    description: 'Create a new task',
    icon: 'CheckSquare',
    category: 'primary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        dueDate: { type: 'string', format: 'date', description: 'Due date' },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description: 'Task priority'
        },
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          default: 'TODO'
        },
        projectId: { type: 'string', description: 'Project ID' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task labels'
        }
      },
      required: ['title']
    },
    outputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  {
    id: 'tasks.list',
    actionId: 'tasks.list',
    platform: 'tasks',
    provider: 'native',
    name: 'List Tasks',
    description: 'List tasks with optional filters',
    icon: 'List',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          description: 'Filter by status'
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description: 'Filter by priority'
        },
        projectId: { type: 'string', description: 'Filter by project' },
        dueDate: { type: 'string', format: 'date', description: 'Filter by due date' },
        limit: { type: 'number', default: 50, description: 'Maximum number of tasks' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              priority: { type: 'string' },
              dueDate: { type: 'string' },
              createdAt: { type: 'string' },
              completedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  },
  {
    id: 'tasks.update',
    actionId: 'tasks.update',
    platform: 'tasks',
    provider: 'native',
    name: 'Update Task',
    description: 'Update an existing task',
    icon: 'Edit',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to update' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        dueDate: { type: 'string', format: 'date' }
      },
      required: ['taskId']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  {
    id: 'tasks.complete',
    actionId: 'tasks.complete',
    platform: 'tasks',
    provider: 'native',
    name: 'Complete Task',
    description: 'Mark a task as completed',
    icon: 'CheckCircle',
    category: 'primary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to complete' }
      },
      required: ['taskId']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        completedAt: { type: 'string' }
      }
    }
  },
  {
    id: 'tasks.bulk_update',
    actionId: 'tasks.bulk_update',
    platform: 'tasks',
    provider: 'native',
    name: 'Bulk Update Tasks',
    description: 'Update multiple tasks at once',
    icon: 'Layers',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task IDs to update'
        },
        updates: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
            },
            projectId: { type: 'string' }
          }
        }
      },
      required: ['taskIds', 'updates']
    },
    outputSchema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  }
]