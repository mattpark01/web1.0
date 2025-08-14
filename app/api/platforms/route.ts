import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/platforms - Get available app platforms
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when next-auth is set up
    // For now, allow public access to platforms
    
    // Return the platforms that support integrations
    const platforms = [
      {
        id: 'bank',
        name: 'Bank',
        description: 'Financial accounts and transactions',
        icon: '💰',
      },
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Events and scheduling',
        icon: '📅',
      },
      {
        id: 'tasks',
        name: 'Tasks',
        description: 'Task and project management',
        icon: '✅',
      },
      {
        id: 'mail',
        name: 'Mail',
        description: 'Email and messaging',
        icon: '📧',
      },
      {
        id: 'notes',
        name: 'Notes',
        description: 'Documents and knowledge base',
        icon: '📝',
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        description: 'Investment tracking',
        icon: '📈',
      },
      {
        id: 'code',
        name: 'Code',
        description: 'Development tools and repositories',
        icon: '💻',
      },
      {
        id: 'sheets',
        name: 'Sheets',
        description: 'Spreadsheets and data',
        icon: '📊',
      },
      {
        id: 'quant',
        name: 'Quant',
        description: 'Quantitative analysis',
        icon: '🧮',
      },
    ]
    
    return NextResponse.json(platforms)
    
  } catch (error) {
    console.error('Failed to fetch platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}