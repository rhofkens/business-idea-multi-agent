import { useState, useEffect, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, Search, MessageSquare, FileText } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import type { WorkflowEvent } from "@business-idea/shared";

interface AgentStatus {
  id: string;
  name: string;
  progress: number; // 0-10 scale
  status: 'idle' | 'active' | 'completed' | 'error';
  currentTask?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AgentProgressDashboardProps {
  className?: string;
  // Allow passing initial agents state, useful for testing
  initialAgents?: AgentStatus[];
}

const statusConfig = {
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-primary text-primary-foreground animate-pulse" },
  completed: { label: "Completed", className: "bg-success text-success-foreground" },
  error: { label: "Error", className: "bg-destructive text-destructive-foreground" },
};

const defaultAgents: AgentStatus[] = [
  {
    id: "ideation",
    name: "Ideation Agent",
    progress: 0,
    status: "idle",
    icon: Brain,
    color: "text-agent-ideation",
  },
  {
    id: "competitor",
    name: "Competitor Agent",
    progress: 0,
    status: "idle",
    icon: Search,
    color: "text-agent-competitor",
  },
  {
    id: "critic",
    name: "Business Critic",
    progress: 0,
    status: "idle",
    icon: MessageSquare,
    color: "text-agent-critic",
  },
  {
    id: "documentation",
    name: "Documentation Agent",
    progress: 0,
    status: "idle",
    icon: FileText,
    color: "text-agent-documentation",
  },
];

export function AgentProgressDashboard({
  className,
  initialAgents = defaultAgents
}: AgentProgressDashboardProps) {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const workflowStartedRef = useRef(false);
  
  // Use WebSocket hook to get real-time events
  const {
    events: wsEvents,
    isConnected,
    subscribe,
    unsubscribe
  } = useWebSocketContext();

  // Subscribe to all agents on mount
  useEffect(() => {
    const agentNames = ['IdeationAgent', 'CompetitorAgent', 'CriticAgent', 'DocumentationAgent'];
    
    agentNames.forEach(agent => subscribe(agent));

    return () => {
      agentNames.forEach(agent => unsubscribe(agent));
    };
  }, [subscribe, unsubscribe]);

  // Update agent status when the workflow starts
  useEffect(() => {
    const startEvent = wsEvents.find(event =>
      event.type === 'status' &&
      event.message.includes('Starting business idea generation')
    );
    
    if (startEvent) {
      workflowStartedRef.current = true;
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'idle',
        progress: 0,
        currentTask: undefined
      })));
    }
  }, [wsEvents]);

  // Handle IdeationAgent progress events
  useEffect(() => {
    const ideationEvents = wsEvents.filter(event =>
      event.agentName === 'IdeationAgent' &&
      event.type === 'result' &&
      event.message.includes('Refined')
    );

    if (ideationEvents.length > 0) {
      const latestEvent = ideationEvents[ideationEvents.length - 1];
      const eventData = latestEvent.metadata?.data as { refinedIdeaCount?: number };
      const refinedCount = eventData?.refinedIdeaCount || ideationEvents.length;
      
      setAgents(prev => prev.map(agent => {
        if (agent.id === 'ideation') {
          const newProgress = Math.min(refinedCount, 10);
          return {
            ...agent,
            progress: newProgress,
            status: newProgress >= 10 ? 'completed' : 'active',
            currentTask: newProgress >= 10
              ? 'Completed - Generated 10 ideas'
              : `Refining idea ${refinedCount}/10`
          };
        }
        return agent;
      }));
    }
  }, [wsEvents]);

  // Handle CompetitorAgent progress events
  useEffect(() => {
    // Only process events if workflow has started
    if (!workflowStartedRef.current) return;
    
    const competitorEvents = wsEvents.filter(event =>
      event.agentName === 'CompetitorAgent' &&
      event.type === 'progress' &&
      event.metadata?.progress !== undefined
    );

    if (competitorEvents.length > 0) {
      const latestEvent = competitorEvents[competitorEvents.length - 1];
      const progress = latestEvent.metadata.progress as number;
      const eventData = latestEvent.metadata.data as { 
        totalIdeas?: number; 
        analysis?: { ideaTitle?: string } 
      };
      const currentIdea = Math.ceil((progress / 100) * (eventData?.totalIdeas || 10));
      
      setAgents(prev => prev.map(agent => {
        if (agent.id === 'competitor') {
          return {
            ...agent,
            progress: progress / 10,  // Convert percentage to 0-10 scale
            status: progress >= 100 ? 'completed' : 'active',
            currentTask: progress >= 100
              ? 'Completed - Analyzed all competitors'
              : `Analyzing competitors for idea ${currentIdea}/${eventData?.totalIdeas || 10}: ${eventData?.analysis?.ideaTitle || 'Unknown'}`
          };
        }
        return agent;
      }));
    }
  }, [wsEvents]);

  // Handle CriticAgent progress events
  useEffect(() => {
    // Only process events if workflow has started
    if (!workflowStartedRef.current) return;
    
    const criticEvents = wsEvents.filter(event =>
      event.agentName === 'CriticAgent' &&
      event.type === 'progress' &&
      event.metadata?.progress !== undefined
    );

    if (criticEvents.length > 0) {
      const latestEvent = criticEvents[criticEvents.length - 1];
      const progress = latestEvent.metadata.progress as number;
      const eventData = latestEvent.metadata.data as {
        totalIdeas?: number;
        analysis?: { ideaTitle?: string }
      };
      const currentIdea = Math.ceil((progress / 100) * (eventData?.totalIdeas || 10));
      
      setAgents(prev => prev.map(agent => {
        if (agent.id === 'critic') {
          return {
            ...agent,
            progress: progress / 10,  // Convert percentage to 0-10 scale
            status: progress >= 100 ? 'completed' : 'active',
            currentTask: progress >= 100
              ? 'Completed - Analyzed all ideas critically'
              : `Critically analyzing idea ${currentIdea}/${eventData?.totalIdeas || 10}: ${eventData?.analysis?.ideaTitle || 'Unknown'}`
          };
        }
        return agent;
      }));
    }
  }, [wsEvents]);

  // Handle DocumentationAgent progress events
  useEffect(() => {
    // Only process events if workflow has started
    if (!workflowStartedRef.current) return;
    
    const documentationEvents = wsEvents.filter(event =>
      event.agentName === 'DocumentationAgent' &&
      event.type === 'progress' &&
      event.metadata?.progress !== undefined
    );

    if (documentationEvents.length > 0) {
      const latestEvent = documentationEvents[documentationEvents.length - 1];
      const progress = latestEvent.metadata.progress as number;
      const eventData = latestEvent.metadata.data as {
        totalIdeas?: number;
        analysis?: { ideaTitle?: string }
      };
      const currentIdea = Math.ceil((progress / 100) * (eventData?.totalIdeas || 10));
      
      setAgents(prev => prev.map(agent => {
        if (agent.id === 'documentation') {
          return {
            ...agent,
            progress: progress / 10,  // Convert percentage to 0-10 scale
            status: progress >= 100 ? 'completed' : 'active',
            currentTask: progress >= 100
              ? 'Completed - Generated all documentation'
              : `Documenting idea ${currentIdea}/${eventData?.totalIdeas || 10}: ${eventData?.analysis?.ideaTitle || 'Unknown'}`
          };
        }
        return agent;
      }));
    }
  }, [wsEvents]);

  return (
    <Card className={cn("shadow-elegant", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Agent Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const statusInfo = statusConfig[agent.status];
          const progressPercentage = (agent.progress / 10) * 100;

          return (
            <div key={agent.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", agent.color)} />
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", statusInfo.className)}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              
              <Progress 
                value={progressPercentage} 
                className="h-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{agent.currentTask || "Waiting..."}</span>
                <span>{agent.progress}/10</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}