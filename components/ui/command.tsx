"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Superellipse } from "@/components/ui/superellipse/superellipse";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  cornerRadius = 8,
  animatedWidth,
  isCompact = false,
  dialogWidth = "normal",
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  cornerRadius?: any;
  animatedWidth?: any;
  isCompact?: boolean;
  dialogWidth?: "compact" | "normal" | "wide";
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {/* Invisible overlay to handle click outside */}
      <div 
        className="fixed inset-0 z-[9998]"
        onClick={() => props.onOpenChange?.(false)}
      />
      <motion.div
        className="fixed z-[9999]"
        style={{
          position: "fixed",
          top: "auto",
          bottom:
            typeof window !== "undefined" && window.chrome
              ? "3rem"
              : "4rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: animatedWidth || (isCompact
            ? "20rem"
            : dialogWidth === "wide"
              ? "40rem"
              : dialogWidth === "compact"
                ? "24rem"
                : "32rem"),
          maxWidth: "calc(100vw - 2rem)",
          zIndex: 9999,
          // Browser-specific positioning adjustments
          WebkitTransform: "translateX(-50%)",
          MozTransform: "translateX(-50%)",
          msTransform: "translateX(-50%)",
        }}
      >
        <Superellipse
          cornerRadius={cornerRadius}
          cornerSmoothing={0.7}
          width={animatedWidth}
          className={cn("overflow-hidden bg-background p-0", className)}
        >
          <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 !rounded-none !border-0 focus:outline-none focus-visible:outline-none [&:focus]:outline-none [&:focus-visible]:outline-none [&_*]:focus:outline-none [&_*]:focus-visible:outline-none" style={{ '--cmd-item-padding': '0.375rem 0.5rem' } as any}>
            {children}
          </Command>
        </Superellipse>
      </motion.div>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-12 items-center gap-2 px-3"
    >
      {/* <SearchIcon className="size-4 shrink-0 opacity-50" /> */}
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-12 w-full bg-transparent py-4 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:outline-none [&:focus]:outline-none [&:focus-visible]:outline-none",
          className,
        )}
        style={{ outline: "none !important" }}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 px-2 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      style={{ padding: '0.5rem', ...props.style }}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
