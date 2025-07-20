import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, Search, MessageSquare, FileText } from "lucide-react";

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
  agents: AgentStatus[];
  className?: string;
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
  agents = defaultAgents, 
  className 
}: AgentProgressDashboardProps) {
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