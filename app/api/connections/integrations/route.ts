import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Use public CDN logos as a fallback until R2 bucket is configured
const LOGO_URLS: Record<string, string> = {
  'google-calendar': 'https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png',
  'outlook-calendar': 'https://img.icons8.com/color/480/microsoft-outlook-2019.png',
  'calendly': 'https://assets.calendly.com/packs/frontend/media/calendly-33a0809a1a617c5a6b0f.svg',
  'plaid': 'https://plaid.com/assets/img/company/thumbnail.png',
  'yodlee': 'https://www.yodlee.com/sites/default/files/2023-08/Envestnet_Yodlee_Logo.svg',
  'mx': 'https://www.mx.com/hubfs/2022%20Website%20Redesign/mx-logo-color-wide.svg',
  'github-issues': 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
  'google-tasks': 'https://ssl.gstatic.com/tasks/embed/tasks_icon_2021q4.png',
  'microsoft-todo': 'https://to-do.live.com/favicon.ico',
  'gmail': 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
  'outlook-mail': 'https://img.icons8.com/color/480/microsoft-outlook-2019.png',
  'google-drive': 'https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png',
  'dropbox': 'https://cfl.dropboxstatic.com/static/metaserver/static/images/icons/dropbox_logo_glyph_m1.svg',
  'github-gists': 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
  'coinbase': 'https://assets.coinbase.com/assets/coinbase.1b82c32fa387f08be039f00d614eb638.png',
  'robinhood': 'https://cdn.robinhood.com/assets/generated_assets/brand/_next/static/images/logo__d0a8c6397fb10ba0c6235fa41051c3fa.svg',
  'alpaca': 'https://files.alpaca.markets/webassets/alpaca-logo.png',
  'github': 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
  'gitlab': 'https://about.gitlab.com/images/press/press-kit-icon.svg',
  'vercel': 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
  'google-sheets': 'https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png',
  'airtable': 'https://www.airtable.com/favicon.ico',
  'alpha-vantage': 'https://www.alphavantage.co/favicon.ico',
  'polygon': 'https://polygon.io/imgs/favicon.png',
  'linear': 'https://linear.app/favicon.ico',
}

// Alternative: Use R2 bucket when configured
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_BUCKET_URL || ''
const USE_R2 = false // Set to true when R2 bucket is configured

function getLogoUrl(integrationId: string): string {
  if (USE_R2 && R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/png/${integrationId}.png`
  }
  return LOGO_URLS[integrationId] || ''
}

/**
 * GET /api/connections/integrations - Get available integrations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'popular'
    const userId = searchParams.get('userId') // Optional user ID to check installation status
    
    // Build where clause
    const where: any = {}
    if (platform && platform !== 'all') {
      where.platformId = platform
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ]
    }
    
    // Build order by
    let orderBy: any = {}
    switch (sortBy) {
      case 'rating':
        orderBy = { averageRating: 'desc' }
        break
      case 'newest':
        orderBy = { lastUpdated: 'desc' }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'popular':
      default:
        orderBy = { installCount: 'desc' }
        break
    }
    
    // Check if catalog table exists and has data
    let integrations = []
    try {
      const catalogCount = await prisma.integrationCatalog.count()
      
      if (catalogCount > 0) {
        // Fetch from database
        const dbIntegrations = await prisma.integrationCatalog.findMany({
          where,
          orderBy,
          include: userId ? {
            userIntegrations: {
              where: { userId },
              select: {
                isInstalled: true,
                isFavorite: true,
                installedAt: true,
              }
            }
          } : undefined,
        })
        
        // Transform to match expected format
        integrations = dbIntegrations.map(integration => ({
          id: integration.integrationId,
          name: integration.name,
          provider: integration.provider,
          icon: integration.icon,
          iconUrl: integration.iconUrl || getLogoUrl(integration.integrationId),
          description: integration.description,
          category: integration.category,
          platformId: integration.platformId,
          version: integration.version,
          authType: integration.authType,
          status: integration.status,
          pricingType: integration.pricingType,
          pricingDetails: integration.pricingDetails,
          capabilities: integration.capabilities,
          tags: integration.tags,
          permissions: integration.permissions,
          dataAccess: integration.dataAccess,
          installCount: integration.installCount,
          averageRating: integration.averageRating ? Number(integration.averageRating) : null,
          reviewCount: integration.reviewCount,
          lastUpdated: integration.lastUpdated.toISOString(),
          documentationUrl: integration.documentationUrl,
          websiteUrl: integration.websiteUrl,
          supportUrl: integration.supportUrl,
          requiredScopes: integration.requiredScopes,
          isInstalled: userId && integration.userIntegrations?.length > 0 
            ? integration.userIntegrations[0].isInstalled 
            : false,
          isFavorite: userId && integration.userIntegrations?.length > 0
            ? integration.userIntegrations[0].isFavorite
            : false,
          installedAt: userId && integration.userIntegrations?.length > 0
            ? integration.userIntegrations[0].installedAt?.toISOString()
            : null,
        }))
      } else {
        // Return mock data if database is empty
        integrations = getMockIntegrations()
        
        // Apply filters
        if (platform && platform !== 'all') {
          integrations = integrations.filter(i => i.platformId === platform)
        }
        if (category && category !== 'all') {
          integrations = integrations.filter(i => i.category === category)
        }
        if (search) {
          const searchLower = search.toLowerCase()
          integrations = integrations.filter(i =>
            i.name.toLowerCase().includes(searchLower) ||
            i.description.toLowerCase().includes(searchLower) ||
            i.provider.toLowerCase().includes(searchLower) ||
            i.tags.some(tag => tag.toLowerCase().includes(searchLower))
          )
        }
        
        // Sort
        switch (sortBy) {
          case 'rating':
            integrations.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            break
          case 'newest':
            integrations.sort((a, b) => 
              new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
            )
            break
          case 'name':
            integrations.sort((a, b) => a.name.localeCompare(b.name))
            break
          case 'popular':
          default:
            integrations.sort((a, b) => b.installCount - a.installCount)
            break
        }
      }
    } catch (error) {
      console.log('Database not ready, using mock data:', error)
      integrations = getMockIntegrations()
      
      // Apply filters to mock data when database fails
      if (platform && platform !== 'all') {
        integrations = integrations.filter(i => i.platformId === platform)
      }
      if (category && category !== 'all') {
        integrations = integrations.filter(i => i.category === category)
      }
      if (search) {
        const searchLower = search.toLowerCase()
        integrations = integrations.filter(i =>
          i.name.toLowerCase().includes(searchLower) ||
          i.description.toLowerCase().includes(searchLower) ||
          i.provider.toLowerCase().includes(searchLower) ||
          i.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
      
      // Sort
      switch (sortBy) {
        case 'rating':
          integrations.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          break
        case 'newest':
          integrations.sort((a, b) => 
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          )
          break
        case 'name':
          integrations.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'popular':
        default:
          integrations.sort((a, b) => b.installCount - a.installCount)
          break
      }
    }
    
    return NextResponse.json({
      integrations,
      total: integrations.length,
    })
    
  } catch (error) {
    console.error('Failed to fetch integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

function getMockIntegrations() {
  return [
    // Calendar Platform Integrations
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      provider: 'Google',
      icon: '📅',
      iconUrl: getLogoUrl('google-calendar'),
      description: 'Sync your Google Calendar events and manage your schedule',
      category: 'productivity',
      platformId: 'calendar',
      version: '1.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_events', 'write_events', 'manage_calendar'],
      tags: ['calendar', 'google', 'productivity', 'scheduling'],
      permissions: [
        {
          id: 'cal-read',
          name: 'View calendar events',
          description: 'Read access to all your calendar events and details',
          category: 'read',
          required: true,
        },
        {
          id: 'cal-write',
          name: 'Create and modify events',
          description: 'Create, update, and delete calendar events',
          category: 'write',
          required: true,
        },
        {
          id: 'cal-share',
          name: 'Share calendar',
          description: 'Share your calendar with others',
          category: 'write',
          required: false,
        },
      ],
      dataAccess: {
        read: ['calendar events', 'availability', 'attendees'],
        write: ['calendar events', 'reminders'],
      },
      installCount: 2450,
      averageRating: 4.8,
      reviewCount: 342,
      lastUpdated: '2024-01-15',
      documentationUrl: 'https://developers.google.com/calendar',
      websiteUrl: 'https://calendar.google.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'outlook-calendar',
      name: 'Outlook Calendar',
      provider: 'Microsoft',
      icon: '📆',
      iconUrl: getLogoUrl('outlook-calendar'),
      description: 'Connect Microsoft Outlook Calendar for scheduling and events',
      category: 'productivity',
      platformId: 'calendar',
      version: '1.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_events', 'write_events', 'manage_calendar'],
      tags: ['calendar', 'microsoft', 'outlook', 'scheduling'],
      installCount: 1823,
      averageRating: 4.5,
      reviewCount: 267,
      lastUpdated: '2024-01-18',
      documentationUrl: 'https://docs.microsoft.com/graph',
      websiteUrl: 'https://outlook.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'calendly',
      name: 'Calendly',
      provider: 'Calendly',
      icon: '🗓️',
      iconUrl: getLogoUrl('calendly'),
      description: 'Automate scheduling with Calendly integration',
      category: 'productivity',
      platformId: 'calendar',
      version: '2.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Basic features free, premium starts at $10/month',
      capabilities: ['read_availability', 'create_events', 'manage_invites'],
      tags: ['calendar', 'scheduling', 'meetings', 'automation'],
      installCount: 892,
      averageRating: 4.7,
      reviewCount: 156,
      lastUpdated: '2024-01-20',
      documentationUrl: 'https://developer.calendly.com',
      websiteUrl: 'https://calendly.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Bank Platform
    {
      id: 'plaid',
      name: 'Plaid',
      provider: 'Plaid',
      icon: '💰',
      iconUrl: getLogoUrl('plaid'),
      description: 'Connect your bank accounts and view transactions',
      category: 'finance',
      platformId: 'bank',
      version: '3.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free for up to 100 accounts, then $0.30 per account',
      capabilities: ['read_accounts', 'read_transactions', 'read_balances'],
      tags: ['plaid', 'banking', 'finance', 'transactions'],
      permissions: [
        {
          id: 'bank-accounts',
          name: 'Access bank accounts',
          description: 'View all linked bank account information',
          category: 'read',
          required: true,
        },
        {
          id: 'bank-balance',
          name: 'Read account balances',
          description: 'View current and available balances',
          category: 'read',
          required: true,
        },
        {
          id: 'bank-transactions',
          name: 'Access transaction history',
          description: 'Read all transaction data',
          category: 'read',
          required: true,
        },
      ],
      dataAccess: {
        read: ['bank accounts', 'balances', 'transactions'],
        write: [],
      },
      installCount: 1234,
      averageRating: 4.5,
      reviewCount: 189,
      lastUpdated: '2024-01-10',
      documentationUrl: 'https://plaid.com/docs',
      websiteUrl: 'https://plaid.com',
      isInstalled: true,
      isFavorite: false,
    },
    {
      id: 'yodlee',
      name: 'Yodlee',
      provider: 'Envestnet',
      icon: '🏦',
      iconUrl: getLogoUrl('yodlee'),
      description: 'Alternative bank aggregation service for account data',
      category: 'finance',
      platformId: 'bank',
      version: '2.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'paid',
      pricingDetails: 'Enterprise pricing',
      capabilities: ['read_accounts', 'read_transactions', 'categorize_spending'],
      tags: ['yodlee', 'banking', 'finance', 'aggregation'],
      installCount: 456,
      averageRating: 4.2,
      reviewCount: 78,
      lastUpdated: '2024-01-15',
      documentationUrl: 'https://developer.yodlee.com',
      websiteUrl: 'https://yodlee.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'mx',
      name: 'MX',
      provider: 'MX Technologies',
      icon: '💸',
      iconUrl: getLogoUrl('mx'),
      description: 'Financial data platform for account aggregation and insights',
      category: 'finance',
      platformId: 'bank',
      version: '3.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'paid',
      pricingDetails: 'Contact for pricing',
      capabilities: ['read_accounts', 'analyze_spending', 'financial_insights'],
      tags: ['mx', 'banking', 'finance', 'analytics'],
      installCount: 234,
      averageRating: 4.4,
      reviewCount: 45,
      lastUpdated: '2024-01-18',
      documentationUrl: 'https://docs.mx.com',
      websiteUrl: 'https://mx.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Tasks Platform
    {
      id: 'linear',
      name: 'Linear',
      provider: 'Linear',
      icon: '🚀',
      iconUrl: getLogoUrl('linear'),
      description: 'Sync Linear issues and manage project tasks',
      category: 'productivity',
      platformId: 'tasks',
      version: '2.5.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free for up to 10 users',
      capabilities: ['sync_issues', 'create_tasks', 'manage_projects', 'track_progress'],
      tags: ['linear', 'project management', 'issues', 'tasks'],
      permissions: [
        {
          id: 'linear-read-issues',
          name: 'Read issues and projects',
          description: 'View all issues, projects, and team information',
          category: 'read',
          required: true,
        },
        {
          id: 'linear-write-issues',
          name: 'Create and modify issues',
          description: 'Create, update, and manage issues and projects',
          category: 'write',
          required: true,
        },
        {
          id: 'linear-admin',
          name: 'Admin access',
          description: 'Manage team settings and workflows',
          category: 'admin',
          required: false,
        },
      ],
      dataAccess: {
        read: ['issues', 'projects', 'teams', 'workflows'],
        write: ['issues', 'projects', 'comments'],
      },
      installCount: 3456,
      averageRating: 4.9,
      reviewCount: 567,
      lastUpdated: '2024-01-25',
      documentationUrl: 'https://developers.linear.app',
      websiteUrl: 'https://linear.app',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'github-issues',
      name: 'GitHub Issues',
      provider: 'GitHub',
      icon: '🐛',
      iconUrl: getLogoUrl('github-issues'),
      description: 'Import GitHub issues as tasks',
      category: 'development',
      platformId: 'tasks',
      version: '1.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['import_issues', 'sync_status', 'create_tasks'],
      tags: ['github', 'issues', 'development', 'tasks'],
      installCount: 1234,
      averageRating: 4.6,
      reviewCount: 189,
      lastUpdated: '2024-01-20',
      documentationUrl: 'https://docs.github.com',
      websiteUrl: 'https://github.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'google-tasks',
      name: 'Google Tasks',
      provider: 'Google',
      icon: '✓',
      iconUrl: getLogoUrl('google-tasks'),
      description: 'Sync with Google Tasks',
      category: 'productivity',
      platformId: 'tasks',
      version: '1.2.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['sync_tasks', 'create_tasks', 'manage_lists'],
      tags: ['google', 'tasks', 'productivity', 'sync'],
      installCount: 892,
      averageRating: 4.4,
      reviewCount: 145,
      lastUpdated: '2024-01-18',
      documentationUrl: 'https://developers.google.com/tasks',
      websiteUrl: 'https://tasks.google.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'microsoft-todo',
      name: 'Microsoft To Do',
      provider: 'Microsoft',
      icon: '📋',
      iconUrl: getLogoUrl('microsoft-todo'),
      description: 'Sync with Microsoft To Do',
      category: 'productivity',
      platformId: 'tasks',
      version: '1.5.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['sync_tasks', 'create_tasks', 'manage_lists'],
      tags: ['microsoft', 'todo', 'tasks', 'productivity'],
      installCount: 678,
      averageRating: 4.3,
      reviewCount: 112,
      lastUpdated: '2024-01-15',
      documentationUrl: 'https://docs.microsoft.com/graph',
      websiteUrl: 'https://todo.microsoft.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Mail Platform
    {
      id: 'gmail',
      name: 'Gmail',
      provider: 'Google',
      icon: '📧',
      iconUrl: getLogoUrl('gmail'),
      description: 'Connect your Gmail account to manage emails',
      category: 'communication',
      platformId: 'mail',
      version: '2.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_emails', 'send_emails', 'manage_labels'],
      tags: ['gmail', 'google', 'email', 'communication'],
      installCount: 3892,
      averageRating: 4.7,
      reviewCount: 567,
      lastUpdated: '2024-01-21',
      documentationUrl: 'https://developers.google.com/gmail',
      websiteUrl: 'https://gmail.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'outlook-mail',
      name: 'Outlook Mail',
      provider: 'Microsoft',
      icon: '📨',
      iconUrl: getLogoUrl('outlook-mail'),
      description: 'Connect your Outlook account to manage emails',
      category: 'communication',
      platformId: 'mail',
      version: '2.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_emails', 'send_emails', 'manage_folders'],
      tags: ['outlook', 'microsoft', 'email', 'communication'],
      installCount: 2134,
      averageRating: 4.5,
      reviewCount: 334,
      lastUpdated: '2024-01-18',
      documentationUrl: 'https://docs.microsoft.com/graph',
      websiteUrl: 'https://outlook.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Notes Platform
    {
      id: 'google-drive',
      name: 'Google Drive',
      provider: 'Google',
      icon: '📁',
      iconUrl: getLogoUrl('google-drive'),
      description: 'Import documents from Google Drive',
      category: 'productivity',
      platformId: 'notes',
      version: '1.3.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['import_docs', 'sync_files', 'export_notes'],
      tags: ['google', 'drive', 'documents', 'storage'],
      installCount: 2134,
      averageRating: 4.5,
      reviewCount: 334,
      lastUpdated: '2024-01-19',
      documentationUrl: 'https://developers.google.com/drive',
      websiteUrl: 'https://drive.google.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      provider: 'Dropbox',
      icon: '💧',
      iconUrl: getLogoUrl('dropbox'),
      description: 'Sync notes with Dropbox storage',
      category: 'productivity',
      platformId: 'notes',
      version: '2.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free up to 2GB',
      capabilities: ['sync_files', 'backup_notes', 'version_history'],
      tags: ['dropbox', 'storage', 'sync', 'backup'],
      installCount: 892,
      averageRating: 4.4,
      reviewCount: 156,
      lastUpdated: '2024-01-17',
      documentationUrl: 'https://www.dropbox.com/developers',
      websiteUrl: 'https://dropbox.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'github-gists',
      name: 'GitHub Gists',
      provider: 'GitHub',
      icon: '📝',
      iconUrl: getLogoUrl('github-gists'),
      description: 'Import and sync code snippets from GitHub Gists',
      category: 'development',
      platformId: 'notes',
      version: '1.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['import_gists', 'sync_snippets', 'code_highlighting'],
      tags: ['github', 'gists', 'code', 'snippets'],
      installCount: 567,
      averageRating: 4.7,
      reviewCount: 89,
      lastUpdated: '2024-01-16',
      documentationUrl: 'https://docs.github.com',
      websiteUrl: 'https://gist.github.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Portfolio Platform
    {
      id: 'coinbase',
      name: 'Coinbase',
      provider: 'Coinbase',
      icon: '₿',
      iconUrl: getLogoUrl('coinbase'),
      description: 'Track cryptocurrency portfolio from Coinbase',
      category: 'finance',
      platformId: 'portfolio',
      version: '2.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_portfolio', 'track_transactions', 'view_prices'],
      tags: ['coinbase', 'crypto', 'bitcoin', 'portfolio'],
      installCount: 1567,
      averageRating: 4.5,
      reviewCount: 289,
      lastUpdated: '2024-01-20',
      documentationUrl: 'https://developers.coinbase.com',
      websiteUrl: 'https://coinbase.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'robinhood',
      name: 'Robinhood',
      provider: 'Robinhood',
      icon: '📈',
      iconUrl: getLogoUrl('robinhood'),
      description: 'Connect Robinhood for stock portfolio tracking',
      category: 'finance',
      platformId: 'portfolio',
      version: '1.3.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_positions', 'track_orders', 'view_analytics'],
      tags: ['robinhood', 'stocks', 'investing', 'portfolio'],
      installCount: 892,
      averageRating: 4.2,
      reviewCount: 156,
      lastUpdated: '2024-01-18',
      documentationUrl: 'https://robinhood.com/api',
      websiteUrl: 'https://robinhood.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'alpaca',
      name: 'Alpaca',
      provider: 'Alpaca',
      icon: '🦙',
      iconUrl: getLogoUrl('alpaca'),
      description: 'Algorithmic trading and portfolio management',
      category: 'finance',
      platformId: 'portfolio',
      version: '3.0.0',
      authType: 'api_key',
      status: 'available',
      pricingType: 'free',
      capabilities: ['execute_trades', 'manage_portfolio', 'access_market_data'],
      tags: ['alpaca', 'trading', 'algorithmic', 'portfolio'],
      installCount: 423,
      averageRating: 4.7,
      reviewCount: 67,
      lastUpdated: '2024-01-22',
      documentationUrl: 'https://alpaca.markets/docs',
      websiteUrl: 'https://alpaca.markets',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Code Platform
    {
      id: 'github',
      name: 'GitHub',
      provider: 'GitHub',
      icon: '🐙',
      iconUrl: getLogoUrl('github'),
      description: 'Connect your GitHub repositories and manage issues, PRs, and more',
      category: 'development',
      platformId: 'code',
      version: '2.1.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_repos', 'write_repos', 'manage_issues', 'manage_prs'],
      tags: ['github', 'git', 'development', 'version-control'],
      installCount: 3892,
      averageRating: 4.9,
      reviewCount: 567,
      lastUpdated: '2024-01-20',
      documentationUrl: 'https://docs.github.com',
      websiteUrl: 'https://github.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      provider: 'GitLab',
      icon: '🦊',
      iconUrl: getLogoUrl('gitlab'),
      description: 'Integrate GitLab for DevOps and CI/CD workflows',
      category: 'development',
      platformId: 'code',
      version: '2.0.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free for public projects',
      capabilities: ['manage_repos', 'run_pipelines', 'track_issues'],
      tags: ['gitlab', 'git', 'devops', 'ci-cd'],
      installCount: 1234,
      averageRating: 4.6,
      reviewCount: 223,
      lastUpdated: '2024-01-17',
      documentationUrl: 'https://docs.gitlab.com',
      websiteUrl: 'https://gitlab.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      provider: 'Vercel',
      icon: '▲',
      iconUrl: getLogoUrl('vercel'),
      description: 'Deploy and manage projects with Vercel',
      category: 'development',
      platformId: 'code',
      version: '1.8.0',
      authType: 'api_key',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free for personal use',
      capabilities: ['deploy_projects', 'manage_domains', 'view_analytics'],
      tags: ['vercel', 'deployment', 'hosting', 'nextjs'],
      installCount: 789,
      averageRating: 4.8,
      reviewCount: 134,
      lastUpdated: '2024-01-19',
      documentationUrl: 'https://vercel.com/docs',
      websiteUrl: 'https://vercel.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Sheets Platform
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      provider: 'Google',
      icon: '📊',
      iconUrl: getLogoUrl('google-sheets'),
      description: 'Connect Google Sheets for spreadsheet automation',
      category: 'productivity',
      platformId: 'sheets',
      version: '1.5.0',
      authType: 'oauth2',
      status: 'available',
      pricingType: 'free',
      capabilities: ['read_sheets', 'write_sheets', 'create_sheets'],
      tags: ['google-sheets', 'spreadsheets', 'productivity', 'data'],
      installCount: 2134,
      averageRating: 4.6,
      reviewCount: 334,
      lastUpdated: '2024-01-16',
      documentationUrl: 'https://developers.google.com/sheets',
      websiteUrl: 'https://sheets.google.com',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'airtable',
      name: 'Airtable',
      provider: 'Airtable',
      icon: '🗂️',
      iconUrl: getLogoUrl('airtable'),
      description: 'Database-spreadsheet hybrid for organizing anything',
      category: 'productivity',
      platformId: 'sheets',
      version: '2.3.0',
      authType: 'api_key',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free for up to 1,200 records',
      capabilities: ['manage_bases', 'sync_records', 'create_views'],
      tags: ['airtable', 'database', 'spreadsheets', 'organization'],
      installCount: 1456,
      averageRating: 4.7,
      reviewCount: 245,
      lastUpdated: '2024-01-14',
      documentationUrl: 'https://airtable.com/developers',
      websiteUrl: 'https://airtable.com',
      isInstalled: false,
      isFavorite: false,
    },
    
    // Quant Platform
    {
      id: 'alpha-vantage',
      name: 'Alpha Vantage',
      provider: 'Alpha Vantage',
      icon: '📉',
      iconUrl: getLogoUrl('alpha-vantage'),
      description: 'Real-time and historical market data for quantitative analysis',
      category: 'finance',
      platformId: 'quant',
      version: '1.2.0',
      authType: 'api_key',
      status: 'available',
      pricingType: 'freemium',
      pricingDetails: 'Free tier with rate limits',
      capabilities: ['fetch_quotes', 'historical_data', 'technical_indicators'],
      tags: ['alpha-vantage', 'market-data', 'quant', 'trading'],
      installCount: 567,
      averageRating: 4.4,
      reviewCount: 89,
      lastUpdated: '2024-01-21',
      documentationUrl: 'https://www.alphavantage.co/documentation',
      websiteUrl: 'https://www.alphavantage.co',
      isInstalled: false,
      isFavorite: false,
    },
    {
      id: 'polygon',
      name: 'Polygon.io',
      provider: 'Polygon',
      icon: '📊',
      iconUrl: getLogoUrl('polygon'),
      description: 'Stock market data API for quantitative trading',
      category: 'finance',
      platformId: 'quant',
      version: '2.0.0',
      authType: 'api_key',
      status: 'available',
      pricingType: 'paid',
      pricingDetails: 'Starting at $29/month',
      capabilities: ['real_time_data', 'websocket_streams', 'historical_data'],
      tags: ['polygon', 'market-data', 'quant', 'real-time'],
      installCount: 234,
      averageRating: 4.8,
      reviewCount: 45,
      lastUpdated: '2024-01-23',
      documentationUrl: 'https://polygon.io/docs',
      websiteUrl: 'https://polygon.io',
      isInstalled: false,
      isFavorite: false,
    },
  ]
}