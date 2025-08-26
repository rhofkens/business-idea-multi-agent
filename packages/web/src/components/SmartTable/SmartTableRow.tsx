/**
 * Individual row component for SmartTable
 */

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Star, FileText } from "lucide-react";
import { SmartTableScoreCell } from "./SmartTableScoreCell";
import type { BusinessIdea } from "@/types/business-idea";
import { 
  truncateText, 
  getExecutionModeLabel, 
  isSolopreneurMode 
} from "@/utils/smart-table-utils";

interface SmartTableRowProps {
  idea: BusinessIdea;
  index: number;
  isSelected: boolean;
  isNew: boolean;
  isReportAvailable: boolean;
  docLoading: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onToggleStar: (id: string) => void;
  onScoreDoubleClick: () => void;
  onCriticalDoubleClick: () => void;
  onCompetitorDoubleClick: () => void;
  onOpenDocumentation: (id: string) => void;
}

export function SmartTableRow({
  idea,
  index,
  isSelected,
  isNew,
  isReportAvailable,
  docLoading,
  onSelect,
  onToggleStar,
  onScoreDoubleClick,
  onCriticalDoubleClick,
  onCompetitorDoubleClick,
  onOpenDocumentation,
}: SmartTableRowProps) {
  return (
    <TableRow
      className={cn(
        "hover:bg-muted/50 transition-colors",
        isNew && "new-idea-glow",
        isSelected && "bg-muted/30"
      )}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(idea.id, !!checked)}
          aria-label={`Select ${idea.title}`}
        />
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onToggleStar(idea.id)} 
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
        {String(index + 1).padStart(2, '0')}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-semibold text-sm">{idea.title}</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground cursor-help">
                  {truncateText(idea.description, 100)}
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={isSolopreneurMode(idea.executionMode) ? 'secondary' : 'default'} 
                className="whitespace-nowrap cursor-help"
              >
                {getExecutionModeLabel(idea.executionMode)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{idea.executionMode || 'Not specified'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.overall}
          reasoning={idea.reasoning.overall}
          type="overall"
          onDoubleClick={onScoreDoubleClick}
        />
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.disruption}
          reasoning={idea.reasoning.disruption}
          type="disruption"
        />
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.market}
          reasoning={idea.reasoning.market}
          type="market"
        />
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.technical}
          reasoning={idea.reasoning.technical}
          type="technical"
        />
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.capital}
          reasoning={idea.reasoning.capital}
          type="capital"
        />
      </TableCell>
      <TableCell>
        <SmartTableScoreCell
          score={idea.scores.blueOcean}
          reasoning={idea.reasoning.blueOcean}
          type="blueOcean"
        />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="text-xs cursor-pointer hover:underline"
                onDoubleClick={onCompetitorDoubleClick}
              >
                {truncateText(idea.competitorAnalysis || "Analysis pending...")}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>{idea.competitorAnalysis || "Competitor analysis is being generated..."}</p>
              <p className="text-xs mt-1 text-muted-foreground">Double-click for full analysis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="text-xs cursor-pointer hover:underline"
                onDoubleClick={onCriticalDoubleClick}
              >
                {truncateText(idea.criticalAnalysis || "Analysis pending...")}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>{idea.criticalAnalysis || "Critical analysis is being generated..."}</p>
              <p className="text-xs mt-1 text-muted-foreground">Double-click for full analysis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <Button
          variant={isReportAvailable ? "outline" : "ghost"}
          size="sm"
          onClick={() => onOpenDocumentation(idea.id)}
          disabled={!isReportAvailable || docLoading}
          className="h-8"
        >
          <FileText className="h-3 w-3 mr-1" />
          {isReportAvailable ? "View" : "Pending"}
        </Button>
      </TableCell>
    </TableRow>
  );
}