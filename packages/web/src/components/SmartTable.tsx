import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Star, 
  Info, 
  FileText, 
  Filter,
  TrendingUp,
  Target,
  Cpu,
  DollarSign,
  Waves,
  Building
} from "lucide-react";

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

interface SmartTableProps {
  ideas: BusinessIdea[];
  onStarToggle: (id: number) => void;
  onViewReport: (idea: BusinessIdea) => void;
  className?: string;
}

const ScoreIcon = {
  overall: TrendingUp,
  disruption: Waves,
  market: Target,
  technical: Cpu,
  capital: DollarSign,
  blueOcean: Building,
};

const getScoreColor = (score: number | null) => {
  if (score === null) return "text-muted-foreground";
  if (score >= 7) return "text-score-high";
  if (score >= 4) return "text-score-medium";
  return "text-score-low";
};

const getScoreBg = (score: number | null) => {
  if (score === null) return "bg-muted";
  if (score >= 7) return "bg-success/10";
  if (score >= 4) return "bg-warning/10";
  return "bg-destructive/10";
};

const truncateText = (text: string, length: number = 100) => {
  if (!text) return "Not available";
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export function SmartTable({ 
  ideas, 
  onStarToggle, 
  onViewReport,
  className 
}: SmartTableProps) {
  const [showCurrentRun, setShowCurrentRun] = useState(true);
  
  const filteredIdeas = ideas.filter(idea => 
    showCurrentRun ? idea.isCurrentRun : !idea.isCurrentRun
  );

  const renderScoreCell = (
    score: number | null, 
    reasoning: string, 
    type: keyof typeof ScoreIcon
  ) => {
    const Icon = ScoreIcon[type];
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md cursor-help transition-colors",
              getScoreBg(score)
            )}>
              <Icon className="h-3 w-3" />
              <span className={cn("font-medium text-sm", getScoreColor(score))}>
                {score !== null ? score.toFixed(1) : "—"}
              </span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{reasoning || "Analysis in progress..."}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={cn("shadow-elegant", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Business Ideas Analysis
            <Badge variant="secondary" className="ml-2">
              {filteredIdeas.length} ideas
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="filter-toggle" className="text-sm">
              Current run only
            </Label>
            <Switch
              id="filter-toggle"
              checked={showCurrentRun}
              onCheckedChange={setShowCurrentRun}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[200px]">Idea</TableHead>
                <TableHead className="w-24">Overall</TableHead>
                <TableHead className="w-24">Disruption</TableHead>
                <TableHead className="w-24">Market</TableHead>
                <TableHead className="w-24">Technical</TableHead>
                <TableHead className="w-24">Capital</TableHead>
                <TableHead className="w-24">Blue Ocean</TableHead>
                <TableHead className="min-w-[150px]">Competitor Analysis</TableHead>
                <TableHead className="min-w-[150px]">Critical Analysis</TableHead>
                <TableHead className="w-32">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIdeas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    {showCurrentRun 
                      ? "No ideas generated yet. Start by filling out the form above." 
                      : "No previous ideas found."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredIdeas.map((idea) => (
                  <TableRow key={idea.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => onStarToggle(idea.id)}
                         className="h-8 w-8 p-0 group"
                       >
                         <Star 
                           className={cn(
                             "h-4 w-4 transition-colors",
                             idea.starred 
                               ? "fill-yellow-400 text-yellow-400" 
                               : "text-muted-foreground group-hover:text-yellow-400"
                           )} 
                         />
                       </Button>
                    </TableCell>
                    
                    <TableCell className="font-medium text-sm">
                      {idea.id}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{idea.title}</div>
                        <div className="text-xs text-muted-foreground">{idea.name}</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground cursor-help">
                                {truncateText(idea.description, 50)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p>{idea.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.overall, idea.reasoning.overall, 'overall')}
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.disruption, idea.reasoning.disruption, 'disruption')}
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.market, idea.reasoning.market, 'market')}
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.technical, idea.reasoning.technical, 'technical')}
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.capital, idea.reasoning.capital, 'capital')}
                    </TableCell>
                    
                    <TableCell>
                      {renderScoreCell(idea.scores.blueOcean, idea.reasoning.blueOcean, 'blueOcean')}
                    </TableCell>
                    
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs cursor-help">
                              {truncateText(idea.competitorAnalysis || "Analysis pending...")}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p>{idea.competitorAnalysis || "Competitor analysis is being generated..."}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs cursor-help">
                              {truncateText(idea.criticalAnalysis || "Analysis pending...")}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p>{idea.criticalAnalysis || "Critical analysis is being generated..."}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant={idea.reportPath ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => onViewReport(idea)}
                        disabled={!idea.reportPath}
                        className="h-8"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {idea.reportPath ? "View" : "Pending"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}