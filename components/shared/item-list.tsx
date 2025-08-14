"use client"

import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, LucideIcon } from "lucide-react"

export interface ItemSection<T> {
  id: string
  label: string
  icon: LucideIcon
  iconColor: string
  headerColor: string
  items: T[]
  count?: number
}

export interface ItemListProps<T> {
  sections: ItemSection<T>[]
  renderItem: (item: T, index: number) => ReactNode
  openSections?: string[]
  onSectionToggle?: (sections: string[]) => void
  onAddItem?: (sectionId: string) => void
  className?: string
}

export function ItemList<T>({
  sections,
  renderItem,
  openSections = [],
  onSectionToggle,
  onAddItem,
  className = ""
}: ItemListProps<T>) {
  return (
    <Accordion 
      type="multiple" 
      value={openSections} 
      onValueChange={onSectionToggle}
      className={`space-y-0 ${className}`}
    >
      {sections.map(section => {
        const Icon = section.icon
        const itemCount = section.count ?? section.items.length
        
        return (
          <AccordionItem key={section.id} value={section.id} className="border-0">
            <AccordionTrigger className={`w-full py-2 px-6 hover:no-underline ${section.headerColor}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${section.iconColor}`} />
                  <h3 className="font-medium text-sm">{section.label}</h3>
                  <span className="text-xs text-muted-foreground">{itemCount}</span>
                </div>
                {onAddItem && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddItem(section.id)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-0">
                {section.items.map((item, index) => (
                  <div key={index}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

export interface ListItemProps {
  icon?: LucideIcon
  iconClassName?: string
  id?: string
  title: string
  type?: {
    label: string
    color: string
  }
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  assignee?: {
    name: string
    avatar?: string
    initials: string
  }
  date?: string
  indicator?: {
    color: string
    tooltip?: string
  }
  onClick?: () => void
  isSelected?: boolean
  className?: string
}

export function ListItem({
  icon: Icon,
  iconClassName = "text-muted-foreground",
  id,
  title,
  type,
  badge,
  assignee,
  date,
  indicator,
  onClick,
  isSelected = false,
  className = ""
}: ListItemProps) {
  return (
    <div 
      className={`flex items-center justify-between gap-3 py-2 px-6 hover:bg-muted/30 border-l-2 ${onClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-muted/50 border-primary' : 'border-transparent'} ${className}`}
      onClick={onClick}
      data-task-id={id}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {(Icon || id) && (
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${iconClassName}`} />}
            {id && <span className="text-sm font-medium text-muted-foreground">{id}</span>}
          </div>
        )}
        {indicator && (
          <div 
            className={`w-2 h-2 rounded-full flex-shrink-0 ${indicator.color}`}
            title={indicator.tooltip}
          />
        )}
        {type && (
          <div 
            className={`w-2 h-2 rounded-full flex-shrink-0 ${type.color}`}
            title={type.label}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed truncate">{title}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        {badge && (
          <Badge variant={badge.variant || "secondary"} className="text-xs">
            {badge.label}
          </Badge>
        )}
        {assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatar} />
            <AvatarFallback className="text-xs">{assignee.initials}</AvatarFallback>
          </Avatar>
        )}
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
      </div>
    </div>
  )
}