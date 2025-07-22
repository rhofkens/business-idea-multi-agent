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
import type { BusinessIdea } from "@/types/business-idea";

interface FormData {
  vertical: string;
  subVertical: string;
  businessModel: string;
  additionalContext: string;
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

const Index = () => {
  const { user, logout, isLoading } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedReport, setSelectedReport] = useState<BusinessIdea | null>(null);

  const handleFormSubmit = async (formData: FormData) => {
    setIsGenerating(true);
    // The IdeaGenerationForm component handles the API submission.
    // The SmartTable and TerminalOutput components will automatically pick up WebSocket events
    // because they are now active.
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

        {/* Business Ideas Analysis, Agent Progress and Terminal Output */}
        {isGenerating && (
          <>
            <div className="w-full">
              <SmartTable
                isActive={isGenerating}
                onViewReport={handleViewReport}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <AgentProgressDashboard agents={agents} />
              </div>
              <div className="space-y-6">
                <TerminalOutput isActive={isGenerating} />
              </div>
            </div>
          </>
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
