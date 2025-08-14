"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  // p-1 = 0.25rem = 4px padding
  const outerRadius = 8
  const padding = 4 // 1 * 0.25rem
  const innerRadius = Math.max(0, outerRadius - padding)
  
  return (
    <Superellipse cornerRadius={outerRadius} cornerSmoothing={1} className={cn("bg-muted p-1 inline-flex w-fit", className)}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className="bg-transparent text-muted-foreground inline-flex h-auto w-fit items-center justify-center"
        {...props}
      />
    </Superellipse>
  )
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  // TabsList has p-1 (4px padding), so inner items should have radius = outer - padding
  const outerRadius = 8
  const padding = 4 // 1 * 0.25rem
  const innerRadius = Math.max(0, outerRadius - padding) // 4px
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        "group relative data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground inline-flex h-full flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 opacity-0 group-data-[state=active]:opacity-100">
        <Superellipse 
          cornerRadius={innerRadius} 
          cornerSmoothing={1} 
          className="absolute inset-0 bg-background" 
        />
      </span>
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
