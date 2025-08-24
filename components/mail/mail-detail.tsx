"use client";

import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Trash2, 
  Star,
  MoreVertical,
  Paperclip,
  Download,
  Calendar,
  Clock,
  User,
  Users,
  Mail,
  Tag,
  FileText,
  Image,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MailItem } from "./mail-list";

interface MailDetailProps {
  mail: MailItem | null;
  onStarToggle?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export function MailDetail({ mail, onStarToggle, onDelete, onArchive }: MailDetailProps) {
  if (!mail) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/5">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
            <Reply className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No conversation selected</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Choose a conversation from the list to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Email Actions Bar */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-muted"
                  title="Reply"
                >
                  <Reply className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-muted"
                  title="Reply All"
                >
                  <ReplyAll className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-muted"
                  title="Forward"
                >
                  <Forward className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              {/* Organization Actions */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-muted"
                  onClick={onArchive}
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDelete}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-muted"
                  onClick={onStarToggle}
                  title={mail.isStarred ? "Unstar" : "Star"}
                >
                  <Star className={cn(
                    "h-4 w-4 transition-colors",
                    mail.isStarred && "text-yellow-500 fill-yellow-500"
                  )} />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              {/* More Options */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hover:bg-muted"
                title="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>1 of 25</span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-auto">
        {/* Email Header */}
        <div className="px-6 pt-6 pb-4">
          {/* Subject and Labels */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight flex-1">{mail.subject}</h1>
              <div className="flex items-center gap-2">
                {mail.hasAttachments && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {mail.attachmentCount || 1} attachment{(mail.attachmentCount || 1) !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Sender Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${mail.sender}`} />
                  <AvatarFallback className="text-sm font-semibold">
                    {mail.sender.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{mail.sender}</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      &lt;{mail.sender.toLowerCase().replace(' ', '.')}@example.com&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>To:</span>
                      <span className="font-medium text-foreground">{mail.to}</span>
                    </div>
                    {mail.cc && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>CC:</span>
                          <span className="font-medium text-foreground">{mail.cc}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{mail.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{mail.time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />

        {/* Email Body */}
        <div className="px-6 py-6">
          <div className="prose prose-base dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {mail.body}
            </div>
          </div>
        </div>

        {/* Attachments */}
        {mail.hasAttachments && (
          <>
            <Separator />
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Attachments</h3>
                <Badge variant="secondary" className="text-xs">
                  {mail.attachmentCount}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">project-update.pdf</p>
                      <p className="text-xs text-muted-foreground">PDF Document • 2.4 MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Image className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">design-mockups.fig</p>
                      <p className="text-xs text-muted-foreground">Figma File • 5.1 MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <File className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">meeting-notes.docx</p>
                      <p className="text-xs text-muted-foreground">Word Document • 856 KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reply Section */}
      <div className="border-t border-border bg-muted/5">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="gap-2">
                <Reply className="h-4 w-4" />
                Reply
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ReplyAll className="h-4 w-4" />
                Reply All
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Forward className="h-4 w-4" />
                Forward
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">R</kbd> to reply or <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">F</kbd> to forward
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}