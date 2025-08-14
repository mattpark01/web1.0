import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding integration catalog...')

  const integrations = [
    // Calendar Platform Integrations
    {
      integrationId: 'google-calendar',
      name: 'Google Calendar',
      provider: 'Google',
      icon: '📅',
      iconUrl: 'https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png',
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
      documentationUrl: 'https://developers.google.com/calendar',
      websiteUrl: 'https://calendar.google.com',
    },
    // Bank Platform Integrations
    {
      integrationId: 'plaid',
      name: 'Plaid',
      provider: 'Plaid',
      icon: '💰',
      iconUrl: 'https://plaid.com/assets/img/company/thumbnail.png',
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
          description: 'View all linked bank account information including account numbers and routing numbers',
          category: 'read',
          required: true,
        },
        {
          id: 'bank-balance',
          name: 'Read account balances',
          description: 'View current and available balances for all accounts',
          category: 'read',
          required: true,
        },
        {
          id: 'bank-transactions',
          name: 'Access transaction history',
          description: 'Read all transaction data including amounts, dates, and merchant information',
          category: 'read',
          required: true,
        },
        {
          id: 'bank-identity',
          name: 'Access identity information',
          description: 'View account holder personal information',
          category: 'read',
          required: false,
        },
      ],
      dataAccess: {
        read: ['bank accounts', 'account balances', 'transaction history', 'account holder info'],
        write: [],
      },
      installCount: 1234,
      averageRating: 4.5,
      reviewCount: 189,
      documentationUrl: 'https://plaid.com/docs',
      websiteUrl: 'https://plaid.com',
    },
    // Tasks Platform - Linear
    {
      integrationId: 'linear',
      name: 'Linear',
      provider: 'Linear',
      icon: '🚀',
      iconUrl: 'https://linear.app/favicon.ico',
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
      documentationUrl: 'https://developers.linear.app',
      websiteUrl: 'https://linear.app',
    },
  ]

  for (const integration of integrations) {
    await prisma.integrationCatalog.upsert({
      where: { integrationId: integration.integrationId },
      update: integration,
      create: integration,
    })
  }

  console.log(`Seeded ${integrations.length} integrations`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })