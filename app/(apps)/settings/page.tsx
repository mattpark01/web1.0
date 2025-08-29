"use client"

import { useState, useEffect, useRef } from "react"
import { useSettings } from "@/contexts/settings-context"
import { useAuth } from "@/contexts/auth-context"
import { DEFAULT_SETTINGS } from "@/types/settings"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2, Settings, User, Bell, Shield, Palette, Globe } from "lucide-react"

const timezones = [
  "America/New_York",
  "America/Chicago", 
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
]

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
]

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "account", label: "Account", icon: User },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { settings, isLoading, updateSettings, resetSettings } = useSettings()
  const [activeSection, setActiveSection] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleUpdate = async (updates: any) => {
    setIsSaving(true)
    try {
      await updateSettings(updates)
      toast.success("Settings updated")
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsSaving(true)
    try {
      await resetSettings()
      toast.success("Settings reset")
    } catch (error) {
      toast.error("Failed to reset settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Navigation functions
  const navigateToSection = (sectionId: string) => {
    if (sectionId !== activeSection && !isTransitioning) {
      setIsTransitioning(true)
      setActiveSection(sectionId)
      setTimeout(() => setIsTransitioning(false), 200)
    }
  }

  const getCurrentSectionIndex = () => {
    return sections.findIndex(s => s.id === activeSection)
  }

  const navigateNext = () => {
    const currentIndex = getCurrentSectionIndex()
    const nextIndex = (currentIndex + 1) % sections.length
    navigateToSection(sections[nextIndex].id)
  }

  const navigatePrevious = () => {
    const currentIndex = getCurrentSectionIndex()
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1
    navigateToSection(sections[prevIndex].id)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while swiping
    if (touchStartX.current !== null) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current
    const minSwipeDistance = 100
    const maxVerticalDistance = 150

    // Check if horizontal swipe is dominant over vertical
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous section
        navigatePrevious()
      } else {
        // Swipe left - go to next section
        navigateNext()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Mouse event handlers for desktop drag
  const [isDragging, setIsDragging] = useState(false)
  const mouseStartX = useRef<number | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mouseStartX.current === null) return
    e.preventDefault()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || mouseStartX.current === null) return

    const deltaX = e.clientX - mouseStartX.current
    const minSwipeDistance = 100

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        navigatePrevious()
      } else {
        navigateNext()
      }
    }

    setIsDragging(false)
    mouseStartX.current = null
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigatePrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSection])

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const SettingRow = ({ label, description, children }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode 
  }) => (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center">
        {children}
      </div>
    </div>
  )

  const SectionDivider = () => (
    <div className="border-b border-border/50 my-6" />
  )

  const renderGeneralSettings = () => (
    <div className="space-y-0">
      <SettingRow label="Language">
        <Select
          value={settings.language}
          onValueChange={(value) => handleUpdate({ language: value })}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Timezone">
        <Select
          value={settings.timezone}
          onValueChange={(value) => handleUpdate({ timezone: value })}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Date Format">
        <Select
          value={settings.dateFormat}
          onValueChange={(value) => handleUpdate({ dateFormat: value })}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Time Format">
        <RadioGroup
          value={settings.timeFormat}
          onValueChange={(value: '12h' | '24h') => handleUpdate({ timeFormat: value })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="12h" id="12h" className="h-4 w-4" />
            <Label htmlFor="12h" className="text-sm">12-hour</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="24h" id="24h" className="h-4 w-4" />
            <Label htmlFor="24h" className="text-sm">24-hour</Label>
          </div>
        </RadioGroup>
      </SettingRow>

      <SettingRow label="Week Starts On">
        <Select
          value={(settings.weekStartsOn ?? 0).toString()}
          onValueChange={(value) => handleUpdate({ weekStartsOn: parseInt(value) })}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sunday</SelectItem>
            <SelectItem value="1">Monday</SelectItem>
            <SelectItem value="6">Saturday</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-0">
      <SettingRow label="Theme">
        <Select
          value={settings.theme}
          onValueChange={(value: 'light' | 'dark' | 'system') => handleUpdate({ theme: value })}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Font Size">
        <RadioGroup
          value={settings.appearance?.fontSize || 'medium'}
          onValueChange={(value: 'small' | 'medium' | 'large') => 
            handleUpdate({ appearance: { ...settings.appearance || DEFAULT_SETTINGS.appearance, fontSize: value } })
          }
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="small" id="small" className="h-4 w-4" />
            <Label htmlFor="small" className="text-sm">Small</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="medium" className="h-4 w-4" />
            <Label htmlFor="medium" className="text-sm">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="large" id="large" className="h-4 w-4" />
            <Label htmlFor="large" className="text-sm">Large</Label>
          </div>
        </RadioGroup>
      </SettingRow>

      <SettingRow 
        label="Compact Mode" 
        description="Reduce spacing between elements"
      >
        <Switch
          checked={settings.appearance?.compactMode || false}
          onCheckedChange={(checked) =>
            handleUpdate({ appearance: { ...settings.appearance || DEFAULT_SETTINGS.appearance, compactMode: checked } })
          }
        />
      </SettingRow>

      <SettingRow 
        label="Animations" 
        description="Enable interface animations"
      >
        <Switch
          checked={settings.appearance?.showAnimations ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ appearance: { ...settings.appearance || DEFAULT_SETTINGS.appearance, showAnimations: checked } })
          }
        />
      </SettingRow>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-0">
      <SettingRow 
        label="Email Notifications" 
        description="Receive notifications via email"
      >
        <Switch
          checked={settings.notifications?.email ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, email: checked } })
          }
        />
      </SettingRow>

      <SettingRow 
        label="Push Notifications" 
        description="Receive push notifications in your browser"
      >
        <Switch
          checked={settings.notifications?.push ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, push: checked } })
          }
        />
      </SettingRow>

      <SettingRow 
        label="Desktop Notifications" 
        description="Show desktop notifications"
      >
        <Switch
          checked={settings.notifications?.desktop ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, desktop: checked } })
          }
        />
      </SettingRow>

      <SettingRow 
        label="Sound Notifications" 
        description="Play sound for notifications"
      >
        <Switch
          checked={settings.notifications?.soundEnabled ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, soundEnabled: checked } })
          }
        />
      </SettingRow>

      <SettingRow label="Email Digest">
        <Select
          value={settings.notifications?.emailDigest || 'weekly'}
          onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'never') =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, emailDigest: value } })
          }
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow 
        label="Mentions Only" 
        description="Only notify when directly mentioned"
      >
        <Switch
          checked={settings.notifications?.mentionsOnly || false}
          onCheckedChange={(checked) =>
            handleUpdate({ notifications: { ...settings.notifications || DEFAULT_SETTINGS.notifications, mentionsOnly: checked } })
          }
        />
      </SettingRow>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-0">
      <SettingRow label="Profile Visibility">
        <Select
          value={settings.privacy?.profileVisibility || 'public'}
          onValueChange={(value: 'public' | 'private' | 'friends') =>
            handleUpdate({ privacy: { ...settings.privacy || DEFAULT_SETTINGS.privacy, profileVisibility: value } })
          }
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="friends">Friends Only</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow 
        label="Show Email" 
        description="Display email address on profile"
      >
        <Switch
          checked={settings.privacy?.showEmail || false}
          onCheckedChange={(checked) =>
            handleUpdate({ privacy: { ...settings.privacy || DEFAULT_SETTINGS.privacy, showEmail: checked } })
          }
        />
      </SettingRow>

      <SettingRow 
        label="Show Activity" 
        description="Display activity status to others"
      >
        <Switch
          checked={settings.privacy?.showActivity ?? true}
          onCheckedChange={(checked) =>
            handleUpdate({ privacy: { ...settings.privacy || DEFAULT_SETTINGS.privacy, showActivity: checked } })
          }
        />
      </SettingRow>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="space-y-0">
      <SettingRow 
        label="Email Address"
        description={user?.email || "No email set"}
      >
        <Button variant="outline" size="sm" disabled>
          Change
        </Button>
      </SettingRow>

      <SettingRow 
        label="Password"
        description="Last changed 30 days ago"
      >
        <Button variant="outline" size="sm" disabled>
          Change
        </Button>
      </SettingRow>

      <SectionDivider />

      <SettingRow 
        label="Reset Settings"
        description="Reset all settings to their default values"
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
        </Button>
      </SettingRow>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "general": return renderGeneralSettings()
      case "appearance": return renderAppearanceSettings()
      case "notifications": return renderNotificationSettings()
      case "privacy": return renderPrivacySettings()
      case "account": return renderAccountSettings()
      default: return renderGeneralSettings()
    }
  }

  return (
    <div 
      ref={containerRef}
      className="max-w-6xl mx-auto select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false)
          mouseStartX.current = null
        }
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Navigation */}
        <nav className="w-48 flex-shrink-0">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => navigateToSection(section.id)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2 text-left text-sm rounded-md transition-colors
                    ${activeSection === section.id 
                      ? 'bg-accent text-accent-foreground font-medium' 
                      : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Swipe or use arrows to navigate</span>
                <div className="flex gap-1 ml-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        section.id === activeSection
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={`transition-opacity duration-200 ${
              isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}