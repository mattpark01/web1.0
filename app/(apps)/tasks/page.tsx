"use client"

import { useState } from "react"
import { ItemList, ListItem, ItemSection } from "@/components/shared/item-list"
import { AppSidebar, AppSidebarItem } from "@/components/layout/app-sidebar"
import { BarChart3, Eye, Circle, MoreHorizontal, CheckCircle, Filter, Search, Calendar, Users } from "lucide-react"

interface Task {
  id: string
  title: string
  status: 'in-review' | 'todo' | 'backlog' | 'done'
  type: 'bug' | 'feature' | 'improvement' | 'research'
  assignee: {
    name: string
    avatar?: string
    initials: string
  }
  date: string
  project: string
}

const mockTasks: Task[] = [
  {
    id: "SPTO-212",
    title: "Command palette navigation bug: active item jumps up after scrolling down",
    status: "in-review",
    type: "bug",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-215",
    title: "If there is only one match in the command list, then do not render a list just render the enter icon indicating to enter",
    status: "todo",
    type: "feature",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-213",
    title: "We need to integrate a new improvement where core actions from another app render their parent app's icon then the core action icon at the bottom right with circle background",
    status: "todo",
    type: "improvement",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-216",
    title: "Design Cloud Backend",
    status: "backlog",
    type: "research",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-217",
    title: "When pressing / or \\ they should enter their respective unique placeholders",
    status: "done",
    type: "feature",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-204",
    title: "Fix CommandDialog border-radius transition delay",
    status: "done",
    type: "bug",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 4",
    project: "Tomorrow"
  },
  {
    id: "SPTO-208",
    title: "Implement autocomplete on type",
    status: "done",
    type: "feature",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  },
  {
    id: "SPTO-206",
    title: "Implement proper bottom-anchored dimension transitions for CommandDialog",
    status: "done",
    type: "improvement",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 4",
    project: "Tomorrow"
  },
  {
    id: "SPTO-205",
    title: "Fix CommandDialog positioning to start from bottom instead of center",
    status: "done",
    type: "bug",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 4",
    project: "Tomorrow"
  },
  {
    id: "SPTO-207",
    title: "Remove bottom border from CommandInput in dialog",
    status: "done",
    type: "improvement",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 4",
    project: "Tomorrow"
  },
  {
    id: "SPTO-210",
    title: "Fix undefined path error in status-bar.tsx",
    status: "done",
    type: "bug",
    assignee: { name: "Spatio Labs Web v1", initials: "SL", avatar: undefined },
    date: "Aug 6",
    project: "Spatio Labs Web v1"
  }
]

const statusConfig = {
  'in-review': { 
    label: 'In Review', 
    color: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    headerColor: 'bg-white/[0.025]',
    icon: Eye,
    count: mockTasks.filter(t => t.status === 'in-review').length
  },
  'todo': { 
    label: 'Todo', 
    color: 'bg-gray-500',
    iconColor: 'text-gray-500',
    headerColor: 'bg-white/[0.025]',
    icon: Circle,
    count: mockTasks.filter(t => t.status === 'todo').length
  },
  'backlog': { 
    label: 'Backlog', 
    color: 'bg-gray-500',
    iconColor: 'text-gray-500',
    headerColor: 'bg-white/[0.025]',
    icon: MoreHorizontal,
    count: mockTasks.filter(t => t.status === 'backlog').length
  },
  'done': { 
    label: 'Done', 
    color: 'bg-blue-600',
    iconColor: 'text-blue-600',
    headerColor: 'bg-white/[0.025]',
    icon: CheckCircle,
    count: mockTasks.filter(t => t.status === 'done').length
  }
}

const typeConfig = {
  'bug': { color: 'bg-red-500' },
  'feature': { color: 'bg-purple-500' },
  'improvement': { color: 'bg-blue-500' },
  'research': { color: 'bg-blue-500' }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [openSections, setOpenSections] = useState<string[]>(["in-review", "todo", "backlog", "done"])
  const [activeSidebarItem, setActiveSidebarItem] = useState("all-tasks")

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  const sidebarItems: AppSidebarItem[] = [
    {
      id: "all-tasks",
      label: "All Tasks",
      icon: BarChart3,
      count: tasks.length,
      isActive: activeSidebarItem === "all-tasks",
      onClick: () => setActiveSidebarItem("all-tasks")
    },
    {
      id: "my-tasks",
      label: "My Tasks",
      icon: Users,
      count: tasks.filter(t => t.assignee.name.includes("SL")).length,
      isActive: activeSidebarItem === "my-tasks",
      onClick: () => setActiveSidebarItem("my-tasks")
    },
    {
      id: "recent",
      label: "Recent",
      icon: Calendar,
      isActive: activeSidebarItem === "recent",
      onClick: () => setActiveSidebarItem("recent")
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      isActive: activeSidebarItem === "search",
      onClick: () => setActiveSidebarItem("search")
    },
    {
      id: "filters",
      label: "Filters",
      icon: Filter,
      isActive: activeSidebarItem === "filters",
      onClick: () => setActiveSidebarItem("filters")
    }
  ]

  const sections: ItemSection<Task>[] = (Object.keys(statusConfig) as Task['status'][]).map(status => {
    const config = statusConfig[status]
    return {
      id: status,
      label: config.label,
      icon: config.icon,
      iconColor: config.iconColor,
      headerColor: config.headerColor,
      items: getTasksByStatus(status),
      count: config.count
    }
  })

  const renderTaskItem = (task: Task) => (
    <ListItem
      icon={BarChart3}
      id={task.id}
      title={task.title}
      type={{
        label: task.type,
        color: typeConfig[task.type].color
      }}
      badge={{
        label: task.type === 'bug' ? 'Bug' : 
               task.type === 'feature' ? 'Feature' :
               task.type === 'improvement' ? 'Improvement' : 
               'Research',
        variant: "secondary"
      }}
      assignee={task.assignee}
      date={task.date}
    />
  )

  return (
    <div className="space-y-0">
      {/* <AppSidebar items={sidebarItems} /> */}
      {/* <div className="flex-1 space-y-0 overflow-auto"> */}
        <ItemList
          sections={sections}
          renderItem={renderTaskItem}
          openSections={openSections}
          onSectionToggle={setOpenSections}
          onAddItem={(sectionId) => console.log('Add item to', sectionId)}
        />
      {/* </div> */}
    </div>
  )
}