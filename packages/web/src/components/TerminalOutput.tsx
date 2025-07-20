import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Terminal, 
  Play, 
  Pause, 
  Trash2, 
  ArrowDown, 
  ArrowUp 
} from "lucide-react";

interface TerminalEvent {
  id: string;
  timestamp: string;
  agent: 'ideation' | 'competitor' | 'critic' | 'documentation' | 'system';
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

interface TerminalOutputProps {
  events: TerminalEvent[];
  isActive?: boolean;
  className?: string;
}

const agentColors = {
  ideation: "text-agent-ideation",
  competitor: "text-agent-competitor", 
  critic: "text-agent-critic",
  documentation: "text-agent-documentation",
  system: "text-primary",
};

const levelColors = {
  info: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

export function TerminalOutput({ 
  events = [], 
  isActive = true,
  className 
}: TerminalOutputProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && !isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, autoScroll, isPaused]);

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const clearEvents = () => {
    // This would typically call a prop function to clear events
    console.log("Clear events requested");
  };

  if (isCollapsed) {
    return (
      <Card className={cn("shadow-elegant", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="h-4 w-4" />
              Terminal Output
              {!isPaused && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-elegant h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Terminal Output
            {!isPaused && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEvents}
              title="Clear terminal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {!autoScroll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToBottom}
                title="Scroll to bottom"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea 
          className="h-full px-4 pb-4"
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          <div 
            className="space-y-1 font-mono text-xs shadow-terminal rounded-lg bg-card/50 p-3 min-h-full"
          >
            {events.length === 0 ? (
              <div className="text-muted-foreground italic">
                Waiting for agent activity...
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex gap-2 items-start">
                  <span className="text-muted-foreground text-[10px] mt-0.5 min-w-[60px]">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  <span className={cn(
                    "font-medium min-w-[80px] text-[10px] mt-0.5",
                    agentColors[event.agent]
                  )}>
                    [{event.agent.toUpperCase()}]
                  </span>
                  <span className={cn(
                    "flex-1 break-words",
                    levelColors[event.level]
                  )}>
                    {event.message}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}