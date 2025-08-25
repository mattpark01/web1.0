export interface UserSettings {
  id?: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
  createdAt?: Date
  updatedAt?: Date
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  desktop: boolean
  soundEnabled: boolean
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'never'
  mentionsOnly: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  showEmail: boolean
  showActivity: boolean
}

export interface AppearanceSettings {
  fontSize: 'small' | 'medium' | 'large'
  sidebarCollapsed: boolean
  compactMode: boolean
  showAnimations: boolean
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId'> = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  weekStartsOn: 0,
  notifications: {
    email: true,
    push: true,
    desktop: true,
    soundEnabled: true,
    emailDigest: 'weekly',
    mentionsOnly: false,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
  },
  appearance: {
    fontSize: 'medium',
    sidebarCollapsed: false,
    compactMode: false,
    showAnimations: true,
  },
}