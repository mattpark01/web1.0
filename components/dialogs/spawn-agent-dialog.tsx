import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot } from "lucide-react";

interface SpawnAgentDialogProps {
  onBack: () => void;
  onComplete: () => void;
}

export function SpawnAgentDialog({
  onBack,
  onComplete,
}: SpawnAgentDialogProps) {
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSpawn = () => {
    console.log("Spawning agent:", { name: agentName, prompt: agentPrompt });
    onComplete();
  };

  // Focus the first input when the dialog opens with delay to prevent focus ring
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (agentName.trim()) {
          handleSpawn();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, agentName, handleSpawn]);

  return (
    <div
      className="px-1"
      onFocus={(e) => (e.target.style.outline = "none")}
      onBlur={(e) => (e.target.style.outline = "none")}
      style={{
        outline: "none !important",
        boxShadow: "none !important",
        WebkitAppearance: "none",
        MozAppearance: "none",
        WebkitTapHighlightColor: "transparent",
        WebkitFocusRingColor: "transparent",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6  bg-primary/10">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-foreground">
              Spawn Agent
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
          <span>to go back</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-6 space-y-3">
        {/* Agent Name Field */}
        <div className="space-y-2">
          <input
            ref={nameInputRef}
            placeholder="Agent name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            onFocus={(e) => (e.target.style.outline = "none")}
            onBlur={(e) => (e.target.style.outline = "none")}
            className="h-12 w-full text-lg font-medium bg-transparent border-0 shadow-none px-0 placeholder:text-muted-foreground/60 text-foreground"
            style={{
              outline: "none !important",
              boxShadow: "none !important",
              background: "transparent !important",
              border: "none !important",
              WebkitAppearance: "none",
              MozAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              WebkitFocusRingColor: "transparent",
              WebkitUserSelect: "text",
            }}
          />
        </div>

        {/* Initial Prompt Field */}
        <div className="space-y-3">
          <textarea
            placeholder="Add description..."
            value={agentPrompt}
            onChange={(e) => {
              setAgentPrompt(e.target.value);
              // Auto-resize textarea
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
              }
            }}
            onFocus={(e) => (e.target.style.outline = "none")}
            onBlur={(e) => (e.target.style.outline = "none")}
            className="w-full min-h-[80px] max-h-[200px] px-0 py-2 text-sm border-0 shadow-none bg-transparent resize-none placeholder:text-muted-foreground/60 overflow-y-auto"
            style={{
              outline: "none !important",
              boxShadow: "none !important",
              background: "transparent !important",
              border: "none !important",
              WebkitAppearance: "none",
              MozAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              WebkitFocusRingColor: "transparent",
              WebkitUserSelect: "text",
              resize: "none !important",
              MozResize: "none",
              WebkitResize: "none",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
            rows={4}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-border/50">
        <div></div>
        <Button
          size="lg"
          onClick={handleSpawn}
          disabled={!agentName.trim()}
          className="text-xs"
        >
          Spawn Agent
        </Button>
      </div>
    </div>
  );
}
