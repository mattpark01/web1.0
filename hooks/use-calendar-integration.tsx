import { useState, useEffect } from 'react'
import { IntegrationConnection } from '@/lib/integrations'

export function useCalendarIntegration() {
  const [connections, setConnections] = useState<IntegrationConnection[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active calendar integrations only once
  useEffect(() => {
    let mounted = true
    const loadConnections = async () => {
      if (mounted) {
        await fetchConnections()
      }
    }
    loadConnections()
    return () => { mounted = false }
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/integrations?category=calendar', {
        cache: 'force-cache',
        next: { revalidate: 300 } // Cache for 5 minutes
      })
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      } else if (response.status === 401) {
        // User not authenticated, skip calendar integration
        setConnections([])
      }
    } catch (err) {
      console.error('Failed to fetch calendar connections:', err)
      setConnections([])
    }
  }

  // Sync events from all connected calendars
  const syncEvents = async () => {
    // Don't sync if no connections available
    if (connections.length === 0) {
      return { events: [] }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'calendar' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        return data
      } else {
        throw new Error('Sync failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Connect a new calendar provider
  const connectProvider = (provider: string) => {
    window.location.href = `/api/integrations/${provider}/auth`
  }

  // Disconnect a calendar integration
  const disconnectProvider = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/integrations/${connectionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchConnections()
      }
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }

  // Create event (will use the first available integration or local)
  const createEvent = async (event: any) => {
    const connection = connections.find(c => c.status === 'active')
    
    if (connection) {
      // Use integration
      const response = await fetch(`/api/integrations/${connection.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
      
      if (response.ok) {
        const newEvent = await response.json()
        setEvents([...events, newEvent])
        return newEvent
      }
    } else {
      // Fall back to local storage
      const localEvent = { ...event, id: Date.now().toString(), source: 'local' }
      setEvents([...events, localEvent])
      // Save to database
      await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localEvent)
      })
      return localEvent
    }
  }

  // Update event
  const updateEvent = async (eventId: string, updates: any) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    if (event.source === 'integration' && event.connectionId) {
      // Update via integration
      const response = await fetch(`/api/integrations/${event.connectionId}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedEvent = await response.json()
        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
        return updatedEvent
      }
    } else {
      // Update local event
      const updatedEvent = { ...event, ...updates }
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
      await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return updatedEvent
    }
  }

  // Delete event
  const deleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    if (event.source === 'integration' && event.connectionId) {
      // Delete via integration
      await fetch(`/api/integrations/${event.connectionId}/events/${eventId}`, {
        method: 'DELETE'
      })
    } else {
      // Delete local event
      await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      })
    }
    
    setEvents(events.filter(e => e.id !== eventId))
  }

  return {
    connections,
    events,
    loading,
    error,
    syncEvents,
    connectProvider,
    disconnectProvider,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchConnections: fetchConnections,
  }
}