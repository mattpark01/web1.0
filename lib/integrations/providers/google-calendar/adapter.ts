import { BaseIntegrationAdapter } from '../../core/base-adapter'
import { IntegrationConnection, IntegrationProvider, SyncOptions, SyncResult, FetchParams } from '../../core/types'
import { OAuth2Client } from '../../core/oauth2-client'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  organizer?: {
    email: string
    displayName?: string
  }
  recurrence?: string[]
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: string
      minutes: number
    }>
  }
  status?: string
  visibility?: string
  colorId?: string
  created?: string
  updated?: string
}

export interface InternalCalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  timezone: string
  attendees?: string[]
  organizer?: string
  recurrenceRule?: string
  reminders?: number[]
  status: string
  visibility: string
  color?: string
  externalId: string
  lastModified: Date
}

export class GoogleCalendarAdapter extends BaseIntegrationAdapter<InternalCalendarEvent> {
  private oauth2Client: OAuth2Client

  constructor(provider: IntegrationProvider) {
    super(provider)
    this.oauth2Client = new OAuth2Client(provider.auth.config as any)
  }

  async authenticate(config: Record<string, any>): Promise<IntegrationConnection> {
    const { code, codeVerifier } = config
    
    const tokens = await this.oauth2Client.exchangeCodeForTokens(code, codeVerifier)
    
    // Get user info
    const userInfo = await this.getUserInfo(tokens.accessToken)
    
    const connection: IntegrationConnection = {
      id: '', // Will be set by database
      userId: config.userId,
      providerId: this.provider.slug,
      connectionName: `Google Calendar - ${userInfo.email}`,
      accountId: userInfo.id,
      accountEmail: userInfo.email,
      credentials: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
        tokenType: tokens.tokenType,
        scopes: tokens.scope?.split(' '),
      },
      status: 'active',
      syncEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    return connection
  }

  async refreshToken(connection: IntegrationConnection): Promise<IntegrationConnection> {
    if (!connection.credentials.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokens = await this.oauth2Client.refreshAccessToken(connection.credentials.refreshToken)
    
    connection.credentials.accessToken = tokens.accessToken
    if (tokens.refreshToken) {
      connection.credentials.refreshToken = tokens.refreshToken
    }
    if (tokens.expiresIn) {
      connection.credentials.expiresAt = new Date(Date.now() + tokens.expiresIn * 1000)
    }
    connection.credentials.tokenType = tokens.tokenType
    connection.updatedAt = new Date()
    
    return connection
  }

  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      // Check if token is expired
      if (OAuth2Client.isTokenExpired(connection)) {
        await this.refreshToken(connection)
      }
      
      // Try to fetch calendar list
      await this.makeRequest(connection, '/users/me/calendarList', {
        method: 'GET',
      })
      
      return true
    } catch (error) {
      console.error('Connection validation failed:', error)
      return false
    }
  }

  async sync(connection: IntegrationConnection, options?: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      itemsFailed: 0,
      errors: [],
    }

    try {
      // Check and refresh token if needed
      if (OAuth2Client.isTokenExpired(connection)) {
        await this.refreshToken(connection)
      }

      // Get all calendars
      const calendars = await this.getCalendars(connection)
      
      // Sync events from primary calendar (can be extended to sync all calendars)
      const primaryCalendar = calendars.find((cal: any) => cal.primary) || calendars[0]
      
      if (primaryCalendar) {
        const events = await this.getEvents(connection, primaryCalendar.id, options?.since)
        
        result.itemsProcessed = events.length
        
        // Here you would typically:
        // 1. Compare with existing events in database
        // 2. Create new events
        // 3. Update existing events
        // 4. Mark deleted events
        
        // For now, we'll just count them as created
        result.itemsCreated = events.length
      }
      
      result.success = true
    } catch (error) {
      result.success = false
      result.errors?.push({
        item: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return result
  }

  async fetch(connection: IntegrationConnection, params?: FetchParams): Promise<InternalCalendarEvent[]> {
    const calendarId = params?.filters?.calendarId || 'primary'
    const events = await this.getEvents(connection, calendarId, params?.since, params?.until)
    
    return events.map(event => this.transformToInternal(event))
  }

  async create(connection: IntegrationConnection, data: Partial<InternalCalendarEvent>): Promise<InternalCalendarEvent> {
    const googleEvent = this.transformToExternal(data as InternalCalendarEvent)
    
    const created = await this.makeRequest<GoogleCalendarEvent>(
      connection,
      `/calendars/primary/events`,
      {
        method: 'POST',
        body: JSON.stringify(googleEvent),
      }
    )
    
    return this.transformToInternal(created)
  }

  async update(connection: IntegrationConnection, id: string, data: Partial<InternalCalendarEvent>): Promise<InternalCalendarEvent> {
    const googleEvent = this.transformToExternal(data as InternalCalendarEvent)
    
    const updated = await this.makeRequest<GoogleCalendarEvent>(
      connection,
      `/calendars/primary/events/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(googleEvent),
      }
    )
    
    return this.transformToInternal(updated)
  }

  async delete(connection: IntegrationConnection, id: string): Promise<void> {
    await this.makeRequest(
      connection,
      `/calendars/primary/events/${id}`,
      {
        method: 'DELETE',
      }
    )
  }

  transformToInternal(googleEvent: GoogleCalendarEvent): InternalCalendarEvent {
    const startDate = googleEvent.start.dateTime 
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start.date!)
    
    const endDate = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end.date!)

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime: startDate,
      endTime: endDate,
      allDay: !googleEvent.start.dateTime,
      timezone: googleEvent.start.timeZone || 'UTC',
      attendees: googleEvent.attendees?.map(a => a.email),
      organizer: googleEvent.organizer?.email,
      recurrenceRule: googleEvent.recurrence?.[0],
      reminders: googleEvent.reminders?.overrides?.map(r => r.minutes),
      status: googleEvent.status || 'confirmed',
      visibility: googleEvent.visibility || 'default',
      color: googleEvent.colorId,
      externalId: googleEvent.id,
      lastModified: new Date(googleEvent.updated || googleEvent.created || Date.now()),
    }
  }

  transformToExternal(event: InternalCalendarEvent): Partial<GoogleCalendarEvent> {
    const googleEvent: Partial<GoogleCalendarEvent> = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString(), timeZone: event.timezone },
      end: event.allDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString(), timeZone: event.timezone },
      status: event.status,
      visibility: event.visibility,
    }

    if (event.attendees) {
      googleEvent.attendees = event.attendees.map(email => ({ email }))
    }

    if (event.recurrenceRule) {
      googleEvent.recurrence = [event.recurrenceRule]
    }

    if (event.reminders) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map(minutes => ({
          method: 'popup',
          minutes,
        })),
      }
    }

    return googleEvent
  }

  // Helper methods
  private async getUserInfo(accessToken: string): Promise<{ id: string; email: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  private async getCalendars(connection: IntegrationConnection): Promise<any[]> {
    const response = await this.makeRequest<{ items: any[] }>(
      connection,
      '/users/me/calendarList',
      { method: 'GET' }
    )
    
    return response.items || []
  }

  private async getEvents(
    connection: IntegrationConnection,
    calendarId: string,
    since?: Date,
    until?: Date
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams()
    
    if (since) {
      params.append('timeMin', since.toISOString())
    }
    
    if (until) {
      params.append('timeMax', until.toISOString())
    }
    
    params.append('singleEvents', 'true')
    params.append('orderBy', 'startTime')
    params.append('maxResults', '100')
    
    const response = await this.makeRequest<{ items: GoogleCalendarEvent[] }>(
      connection,
      `/calendars/${calendarId}/events?${params.toString()}`,
      { method: 'GET' }
    )
    
    return response.items || []
  }
}