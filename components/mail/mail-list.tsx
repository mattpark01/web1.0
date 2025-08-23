"use client";

import { Star, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export interface MailItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  isStarred?: boolean;
  hasAttachments?: boolean;
  attachmentCount?: number;
  isRead?: boolean;
  date: string;
  to: string;
  cc?: string;
}

interface MailListProps {
  mails: MailItem[];
  selectedMailId: string | null;
  onSelectMail: (mail: MailItem) => void;
}

export function MailList({ mails, selectedMailId, onSelectMail }: MailListProps) {
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedMailId && itemRefs.current[selectedMailId]) {
      itemRefs.current[selectedMailId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedMailId]);

  return (
    <div ref={containerRef} className="flex-1 overflow-auto border-r border-border bg-background/50">
      {mails.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          No emails in this folder
        </div>
      ) : (
        mails.map((mail) => (
          <div
            key={mail.id}
            ref={(el) => { itemRefs.current[mail.id] = el; }}
            onClick={() => onSelectMail(mail)}
            className={cn(
              "px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-l-2 border-border transition-colors",
              selectedMailId === mail.id ? "bg-muted/50 border-l-primary shadow-sm" : "border-l-transparent",
              !mail.isRead && "bg-background font-medium"
            )}
          >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={cn(
                "text-xs truncate",
                !mail.isRead ? "font-semibold" : "font-medium"
              )}>
                {mail.sender}
              </span>
              {mail.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
              {mail.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">{mail.time}</span>
          </div>
          <h3 className={cn(
            "text-xs mb-0.5 truncate",
            !mail.isRead ? "font-semibold" : "font-medium"
          )}>
            {mail.subject}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 leading-tight">
            {mail.preview}
          </p>
          </div>
        ))
      )}
    </div>
  );
}