/**
 * Score cell component for displaying idea metrics with tooltips
 */

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { getScoreColor, getScoreBg } from "@/utils/smart-table-utils";
import { ScoreIcon } from "@/types/smart-table.types";

interface SmartTableScoreCellProps {
  score: number | null | undefined;
  reasoning: string;
  type: keyof typeof ScoreIcon;
  onDoubleClick?: () => void;
}

export function SmartTableScoreCell({
  score,
  reasoning,
  type,
  onDoubleClick,
}: SmartTableScoreCellProps) {
  const Icon = ScoreIcon[type];
  const isPending = score === null || score === undefined;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "score-cell flex items-center gap-1 px-2 py-1 rounded-md",
              onDoubleClick ? "cursor-pointer" : "cursor-help",
              isPending ? "loading-shimmer" : getScoreBg(score)
            )}
            onDoubleClick={onDoubleClick}
          >
            <Icon className={cn("h-3 w-3", isPending && "opacity-50")} />
            <span className={cn(
              "font-medium text-sm",
              isPending ? "text-muted-foreground" : getScoreColor(score)
            )}>
              {score !== null && score !== undefined ? score.toFixed(1) : "—"}
            </span>
            <Info className={cn(
              "h-3 w-3",
              isPending ? "opacity-50" : "text-muted-foreground"
            )} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{reasoning || "Analysis in progress..."}</p>
          {onDoubleClick && <p className="text-xs mt-1 text-muted-foreground">Double-click for details</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}