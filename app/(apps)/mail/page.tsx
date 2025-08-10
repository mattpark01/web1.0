"use client";

import { useState } from "react";
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Star,
  Trash2,
  Paperclip,
} from "lucide-react";
import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar";
import { MailList, type MailItem } from "@/components/mail/mail-list";
import { MailDetail } from "@/components/mail/mail-detail";
import { cn } from "@/lib/utils";

export default function MailPage() {
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [mails, setMails] = useState<MailItem[]>([
    {
      id: "1",
      sender: "John Doe",
      subject: "Re: Project Update",
      preview: "Thanks for the update on the project. I've reviewed the latest changes and they look great...",
      body: `Hi Team,

Thanks for the update on the project. I've reviewed the latest changes and they look great. The new features are working smoothly and the performance improvements are noticeable.

I have a few suggestions for the next iteration:
1. We could optimize the database queries further
2. The UI could use some polish in the dashboard section
3. Consider adding more comprehensive error handling

Let's discuss these points in our next meeting. I've attached the detailed review document and some mockups for your reference.

Best regards,
John`,
      time: "2:30 PM",
      date: "Today",
      to: "me",
      isStarred: true,
      hasAttachments: true,
      attachmentCount: 2,
      isRead: false,
    },
    {
      id: "2",
      sender: "Sarah Wilson",
      subject: "Meeting Reminder",
      preview: "Don't forget about our team meeting tomorrow at 10 AM. We'll be discussing...",
      body: `Hello everyone,

This is a friendly reminder about our team meeting scheduled for tomorrow at 10 AM in Conference Room B.

Agenda:
• Q3 Performance Review
• New Project Kickoff
• Resource Allocation
• Team Building Activity Planning

Please come prepared with your status updates and any blockers you're facing. If you can't attend, please let me know ASAP so we can reschedule if needed.

See you there!
Sarah`,
      time: "1:15 PM",
      date: "Today",
      to: "team@company.com",
      cc: "managers@company.com",
      isStarred: false,
      hasAttachments: false,
      isRead: true,
    },
    {
      id: "3",
      sender: "GitHub",
      subject: "[repo/project] New pull request",
      preview: "A new pull request has been opened for review...",
      body: `A new pull request has been opened in repo/project:

#234: Fix critical bug in authentication flow

Opened by: developer123

Description:
This PR fixes a critical bug in the authentication flow that was causing users to be logged out unexpectedly. The issue was related to token refresh logic.

Changes:
• Fixed token refresh timing
• Added better error handling
• Updated tests

View the pull request: https://github.com/repo/project/pull/234

You are receiving this because you are watching this repository.`,
      time: "11:30 AM",
      date: "Today",
      to: "notifications@github.com",
      isStarred: false,
      hasAttachments: false,
      isRead: true,
    },
    {
      id: "4",
      sender: "Marketing Team",
      subject: "New Campaign Launch - Action Required",
      preview: "We're launching our Q4 marketing campaign next week and need your input...",
      body: `Hi Team,

We're excited to announce the launch of our Q4 marketing campaign starting next Monday. We need your help to make this a success!

Key Points:
• Campaign focuses on our new product line
• Social media push across all platforms
• Email marketing to 50,000+ subscribers
• Influencer partnerships ready to go

Action Required:
1. Review the campaign materials (attached)
2. Provide feedback by Friday EOD
3. Share with your networks on launch day

This is a big opportunity for us to expand our reach and drive sales for the holiday season. Let's make it count!

Thanks,
Marketing Team`,
      time: "10:45 AM",
      date: "Today",
      to: "all@company.com",
      isStarred: true,
      hasAttachments: true,
      attachmentCount: 3,
      isRead: false,
    },
    {
      id: "5",
      sender: "Alex Chen",
      subject: "Code Review Feedback",
      preview: "I've completed the code review for your recent PR. Overall it looks good but...",
      body: `Hey,

I've completed the code review for PR #189. Overall, the implementation looks solid! Great work on the refactoring.

A few minor suggestions:
• Consider extracting the validation logic into a separate utility function
• The error messages could be more descriptive
• Add some unit tests for the edge cases we discussed

I've left detailed comments on the PR. Once you address these small issues, it's good to merge.

Let me know if you have any questions!

Best,
Alex`,
      time: "9:20 AM",
      date: "Today",
      to: "me",
      isStarred: false,
      hasAttachments: false,
      isRead: true,
    },
  ]);

  const sidebarItems: AppSidebarItem[] = [
    {
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      count: 12,
      isActive: true,
    },
    {
      id: "starred",
      label: "Starred",
      icon: Star,
      count: 3,
    },
    {
      id: "sent",
      label: "Sent",
      icon: Send,
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
    },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
    },
  ];

  const handleSelectMail = (mail: MailItem) => {
    setSelectedMail(mail);
    // Mark as read when selected
    setMails(prev => prev.map(m => 
      m.id === mail.id ? { ...m, isRead: true } : m
    ));
  };

  const handleStarToggle = () => {
    if (!selectedMail) return;
    setMails(prev => prev.map(m => 
      m.id === selectedMail.id ? { ...m, isStarred: !m.isStarred } : m
    ));
    setSelectedMail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
  };

  const handleDelete = () => {
    if (!selectedMail) return;
    setMails(prev => prev.filter(m => m.id !== selectedMail.id));
    setSelectedMail(null);
  };

  const handleArchive = () => {
    if (!selectedMail) return;
    setMails(prev => prev.filter(m => m.id !== selectedMail.id));
    setSelectedMail(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {/* <AppSidebar items={sidebarItems} /> */}

      {/* Main content with split view - list takes 60%, detail takes 40% */}
      <div className="flex-1 flex">
        {/* Email list - left side (larger) */}
        <div className="flex-[3] min-w-0 flex flex-col border-r border-border">
          <div className="border-b border-border p-4 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Inbox</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {mails.filter(m => !m.isRead).length} unread 
                  {mails.filter(m => !m.isRead).length === 1 ? ' message' : ' messages'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
          <MailList 
            mails={mails}
            selectedMailId={selectedMail?.id || null}
            onSelectMail={handleSelectMail}
          />
        </div>

        {/* Email detail - right side (smaller) */}
        <div className={cn(
          "flex-[2] min-w-0",
          !selectedMail && "hidden lg:flex"
        )}>
          <MailDetail 
            mail={selectedMail}
            onStarToggle={handleStarToggle}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        </div>
      </div>
    </div>
  );
}
