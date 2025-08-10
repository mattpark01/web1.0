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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ReplyAll className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Forward className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onArchive}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStarToggle}>
              <Star className={cn(
                "h-4 w-4",
                mail.isStarred && "text-yellow-500 fill-yellow-500"
              )} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Email Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-4">{mail.subject}</h1>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {mail.sender.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{mail.sender}</span>
                  <span className="text-sm text-muted-foreground">&lt;{mail.sender.toLowerCase().replace(' ', '.')}@example.com&gt;</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  to {mail.to}
                  {mail.cc && <span> • cc: {mail.cc}</span>}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {mail.date} at {mail.time}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {mail.body}
          </div>
        </div>

        {/* Attachments */}
        {mail.hasAttachments && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Attachments ({mail.attachmentCount})</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">project-update.pdf</p>
                    <p className="text-xs text-muted-foreground">2.4 MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">design-mockups.fig</p>
                    <p className="text-xs text-muted-foreground">5.1 MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply Section */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Button variant="default" className="gap-2">
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" className="gap-2">
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}