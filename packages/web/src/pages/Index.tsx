import { useState } from "react";
import { IdeaGenerationForm } from "@/components/IdeaGenerationForm";
import { AgentProgressDashboard } from "@/components/AgentProgressDashboard";
import { TerminalOutput } from "@/components/TerminalOutput";
import { SmartTable } from "@/components/SmartTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";

interface FormData {
  vertical: string;
  subVertical: string;
  businessModel: string;
  additionalContext: string;
}

interface BusinessIdea {
  id: number;
  starred: boolean;
  title: string;
  name: string;
  description: string;
  businessModel: string;
  scores: {
    overall: number | null;
    disruption: number;
    market: number;
    technical: number;
    capital: number;
    blueOcean: number | null;
  };
  reasoning: {
    overall: string;
    disruption: string;
    market: string;
    technical: string;
    capital: string;
    blueOcean: string;
  };
  competitorAnalysis: string | null;
  criticalAnalysis: string | null;
  reportPath: string | null;
  lastUpdated: string;
  isCurrentRun: boolean;
}

interface AgentStatus {
  id: string;
  name: string;
  progress: number;
  status: 'idle' | 'active' | 'completed' | 'error';
  currentTask?: string;
  icon: () => React.ReactNode;
  color: string;
}

interface TerminalEvent {
  id: string;
  timestamp: string;
  agent: 'ideation' | 'competitor' | 'critic' | 'documentation' | 'system';
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

const Index = () => {
  const { user, logout, isLoading } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      id: "ideation",
      name: "Ideation Agent",
      progress: 10,
      status: "completed",
      currentTask: "Generated 10 business ideas",
      icon: () => null,
      color: "text-agent-ideation",
    },
    {
      id: "competitor",
      name: "Competitor Agent", 
      progress: 6,
      status: "active",
      currentTask: "Analyzing market competition...",
      icon: () => null,
      color: "text-agent-competitor",
    },
    {
      id: "critic",
      name: "Business Critic",
      progress: 3,
      status: "active",
      currentTask: "Evaluating business viability...",
      icon: () => null,
      color: "text-agent-critic",
    },
    {
      id: "documentation",
      name: "Documentation Agent",
      progress: 0,
      status: "idle",
      currentTask: "Waiting for analysis completion...",
      icon: () => null,
      color: "text-agent-documentation",
    },
  ]);
  const [terminalEvents, setTerminalEvents] = useState<TerminalEvent[]>([]);
  const [selectedReport, setSelectedReport] = useState<BusinessIdea | null>(null);

  // Mock data for demonstration
  const mockIdeas: BusinessIdea[] = [
    {
      id: 1,
      starred: true,
      title: "AI-Powered Personal Finance Coach",
      name: "FinanceGPT",
      description: "An intelligent financial advisor that uses machine learning to provide personalized investment strategies and spending insights based on user behavior patterns.",
      businessModel: "Subscription",
      scores: {
        overall: 8.2,
        disruption: 7.5,
        market: 8.8,
        technical: 6.5,
        capital: 7.0,
        blueOcean: 8.5,
      },
      reasoning: {
        overall: "Strong market potential with innovative AI approach to personal finance. Good differentiation from existing players.",
        disruption: "Leverages latest AI/ML technologies to disrupt traditional financial advisory services.",
        market: "Large addressable market with growing demand for digital financial services.",
        technical: "Moderate technical complexity requiring AI/ML expertise and financial data integration.",
        capital: "Moderate capital requirements for AI infrastructure and regulatory compliance.",
        blueOcean: "Creates new market space by combining AI coaching with behavioral finance insights.",
      },
      competitorAnalysis: "Competes with Mint, YNAB, and Personal Capital but differentiates through AI-powered coaching and behavioral analysis. Market gap exists for proactive financial guidance.",
      criticalAnalysis: "Strong concept but requires significant user trust and regulatory compliance. Customer acquisition cost may be high in competitive fintech space.",
      reportPath: "/reports/idea-1-full-analysis.md",
      lastUpdated: new Date().toISOString(),
      isCurrentRun: true,
    },
    {
      id: 2,
      starred: false,
      title: "Smart Contract Insurance Platform",
      name: "ChainSure",
      description: "Blockchain-based insurance platform that automates claim processing and payouts using smart contracts, reducing fraud and processing time.",
      businessModel: "Transaction-based",
      scores: {
        overall: null,
        disruption: 9.2,
        market: 7.5,
        technical: 8.8,
        capital: 8.5,
        blueOcean: null,
      },
      reasoning: {
        overall: "",
        disruption: "Revolutionary approach to insurance using blockchain technology and automated claims processing.",
        market: "Insurance market is large but heavily regulated and slow to adopt new technologies.",
        technical: "High technical complexity requiring blockchain expertise and insurance domain knowledge.",
        capital: "High capital requirements for regulatory compliance and blockchain infrastructure.",
        blueOcean: "",
      },
      competitorAnalysis: null,
      criticalAnalysis: null,
      reportPath: null,
      lastUpdated: new Date().toISOString(),
      isCurrentRun: true,
    },
  ];

  const mockEvents: TerminalEvent[] = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      agent: "system",
      message: "Starting business idea generation process...",
      level: "info",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 25000).toISOString(),
      agent: "ideation",
      message: "Generating 10 innovative business ideas for FinTech/Payments vertical...",
      level: "info",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 20000).toISOString(),
      agent: "ideation",
      message: "Idea 1: AI-Powered Personal Finance Coach - FinanceGPT created",
      level: "success",
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 15000).toISOString(),
      agent: "competitor",
      message: "Analyzing market competition for FinanceGPT...",
      level: "info",
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 10000).toISOString(),
      agent: "competitor",
      message: "Blue Ocean score calculated: 8.5/10 - Strong differentiation potential",
      level: "success",
    },
    {
      id: "6",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      agent: "critic",
      message: "Conducting critical analysis of business viability...",
      level: "info",
    },
  ];

  const handleFormSubmit = async (formData: FormData) => {
    setIsGenerating(true);
    
    // Simulate the generation process with mock data
    setTimeout(() => {
      setIdeas(mockIdeas);
      setTerminalEvents(mockEvents);
      setIsGenerating(false);
    }, 2000);
  };

  const handleStarToggle = (id: number) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id ? { ...idea, starred: !idea.starred } : idea
    ));
  };

  const handleViewReport = (idea: BusinessIdea) => {
    if (idea.reportPath) {
      setSelectedReport(idea);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* User Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-muted-foreground capitalize">{user?.role} User</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Business Idea Generator v2.0
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered business idea generation with real-time agent orchestration and comprehensive analysis
          </p>
        </div>

        {/* Input Form */}
        <div className="w-full">
          <IdeaGenerationForm 
            onSubmit={handleFormSubmit} 
            isGenerating={isGenerating}
          />
        </div>

        {/* Business Ideas Analysis */}
        {(ideas.length > 0 || isGenerating) && (
          <div className="w-full">
            <SmartTable
              ideas={ideas}
              onStarToggle={handleStarToggle}
              onViewReport={handleViewReport}
            />
          </div>
        )}

        {/* Agent Progress and Terminal Output */}
        {(ideas.length > 0 || isGenerating) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AgentProgressDashboard agents={agents} />
            </div>
            <div className="space-y-6">
              <TerminalOutput events={terminalEvents} isActive={isGenerating} />
            </div>
          </div>
        )}

        {/* Report Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Full Business Report - {selectedReport?.title}
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <ScrollArea className="max-h-[60vh] px-1">
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Executive Summary</h3>
                  <p className="text-muted-foreground">
                    {selectedReport?.description}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Market Analysis</h3>
                  <p className="text-muted-foreground">
                    {selectedReport?.competitorAnalysis || "Detailed market analysis would appear here..."}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Critical Assessment</h3>
                  <p className="text-muted-foreground">
                    {selectedReport?.criticalAnalysis || "Critical business assessment would appear here..."}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Scoring Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport && Object.entries(selectedReport.scores).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">
                          {value !== null ? `${value.toFixed(1)}/10` : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
