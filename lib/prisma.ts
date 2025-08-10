import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Extended Prisma client with custom types for our integration tables
export interface IntegrationProvider {
  id: string
  slug: string
  name: string
  description?: string | null
  iconUrl?: string | null
  category: string
  authType: string
  authConfig: any
  apiBaseUrl?: string | null
  apiVersion?: string | null
  rateLimit?: any | null
  features: string[]
  endpoints?: any | null
  dataMappings?: any | null
  documentationUrl?: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IntegrationConnection {
  id: string
  userId: string
  providerId: string
  connectionName?: string | null
  accountId?: string | null
  accountEmail?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  apiKey?: string | null
  expiresAt?: Date | null
  tokenType?: string | null
  scopes: string[]
  rawCredentials?: any | null
  status: string
  errorMessage?: string | null
  syncEnabled: boolean
  syncFrequency?: number | null
  lastSyncAt?: Date | null
  nextSyncAt?: Date | null
  metadata?: any | null
  webhookUrl?: string | null
  webhookSecret?: string | null
  createdAt: Date
  updatedAt: Date
}