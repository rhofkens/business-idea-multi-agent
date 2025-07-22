import { useState, useEffect, useRef, useCallback } from "react";
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
  ArrowUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WorkflowEvent } from "@business-idea/shared";

interface TerminalOutputProps {
  isActive?: boolean;
  className?: string;
  // Optional filter by agent name
  filterAgent?: string;
}
const agentColors: Record<string, string> = {
  IdeationAgent: "text-agent-ideation",
  CompetitorAgent: "text-agent-competitor",
  CriticAgent: "text-agent-critic",
  DocumentationAgent: "text-agent-documentation",
  Orchestrator: "text-primary",
  System: "text-primary",
};

const levelColors: Record<string, string> = {
  info: "text-foreground",
  warn: "text-warning",
  error: "text-destructive",
  debug: "text-muted-foreground",
};

// Map event type to display level
const getDisplayLevel = (event: WorkflowEvent): string => {
  switch (event.type) {
    case 'error': return 'error';
    case 'status': return 'info';
    case 'progress': return 'info';
    case 'result': return 'success';
    case 'log': return event.level;
    default: return 'info';
  }
};

// Get a more user-friendly agent name
const getAgentDisplayName = (agentName: string): string => {
  return agentName.replace(/Agent$/, '').toUpperCase();
};

export function TerminalOutput({
  isActive = true,
  className,
  filterAgent
}: TerminalOutputProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use WebSocket hook to get real-time events
  const {
    events: wsEvents,
    isConnected,
    clearEvents,
    subscribe,
    unsubscribe
  } = useWebSocket();

  // Filter events if agent filter is provided
  const events = filterAgent
    ? wsEvents.filter(e => e.agentName === filterAgent)
    : wsEvents;

  // Subscribe to all agents on mount
  useEffect(() => {
    // Common agents to subscribe to
    const agents = ['IdeationAgent', 'CompetitorAgent', 'CriticAgent', 'DocumentationAgent', 'Orchestrator'];
    
    agents.forEach(agent => subscribe(agent));

    return () => {
      agents.forEach(agent => unsubscribe(agent));
    };
  }, [subscribe, unsubscribe]);

  // Set up MutationObserver to detect when ScrollArea viewport is rendered
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const observer = new MutationObserver(() => {
      // Look for the viewport element within ScrollArea
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport && viewport instanceof HTMLDivElement) {
        scrollViewportRef.current = viewport;
        observer.disconnect();
      }
    });

    observer.observe(scrollAreaRef.current, {
      childList: true,
      subtree: true
    });

    // Also try to find it immediately in case it's already rendered
    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport && viewport instanceof HTMLDivElement) {
      scrollViewportRef.current = viewport;
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && !isPaused && bottomRef.current && scrollViewportRef.current) {
      // Use the viewport element for scrolling
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [events, autoScroll, isPaused]);

  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    
    const viewport = scrollViewportRef.current;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  // Set up scroll event listener on viewport
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll, scrollViewportRef.current]);

  const scrollToBottom = () => {
    setAutoScroll(true);
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
            {isConnected ? (
              <Wifi className="h-3 w-3 text-success" />
            ) : (
              <WifiOff className="h-3 w-3 text-destructive" />
            )}
            {!isPaused && isConnected && (
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
          className="h-80 px-4 pb-4"
          ref={scrollAreaRef}
        >
          <div 
            className="space-y-1 font-mono text-xs shadow-terminal rounded-lg bg-card/50 p-3 min-h-full"
          >
            {events.length === 0 ? (
              <div className="text-muted-foreground italic">
                {isConnected
                  ? "Waiting for agent activity..."
                  : "Connecting to server..."}
              </div>
            ) : (
              events.map((event) => {
                const displayLevel = getDisplayLevel(event);
                const agentColor = agentColors[event.agentName] || "text-foreground";
                const levelColor = levelColors[displayLevel] || "text-foreground";
                
                return (
                  <div key={event.id} className="flex gap-2 items-start">
                    <span className="text-muted-foreground text-[10px] mt-0.5 min-w-[60px]">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span className={cn(
                      "font-medium min-w-[80px] text-[10px] mt-0.5",
                      agentColor
                    )}>
                      [{getAgentDisplayName(event.agentName)}]
                    </span>
                    <span className={cn(
                      "flex-1 break-words",
                      levelColor
                    )}>
                      {event.message}
                      {event.metadata?.progress !== undefined && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          ({event.metadata.progress}%)
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}