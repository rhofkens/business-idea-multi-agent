/**
 * Header component for SmartTable with filters and controls
 */

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Star, FileText, Filter, Database } from "lucide-react";
import type { ExecutionModeFilter } from "@/types/smart-table.types";

interface SmartTableHeaderProps {
  filteredIdeasCount: number;
  isStreaming: boolean;
  consolidatedReportEnabled: boolean;
  onViewConsolidatedReport: () => void;
  executionModeFilter: ExecutionModeFilter;
  onExecutionModeFilterChange: (value: ExecutionModeFilter) => void;
  showStarredOnly: boolean;
  onShowStarredOnlyChange: (checked: boolean) => void;
  showCurrentRun: boolean;
  onShowCurrentRunChange: (checked: boolean) => void;
}

export function SmartTableHeader({
  filteredIdeasCount,
  isStreaming,
  consolidatedReportEnabled,
  onViewConsolidatedReport,
  executionModeFilter,
  onExecutionModeFilterChange,
  showStarredOnly,
  onShowStarredOnlyChange,
  showCurrentRun,
  onShowCurrentRunChange,
}: SmartTableHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Business Ideas Analysis
          <Badge variant="secondary" className={cn("ml-2", isStreaming && "isStreaming-pulse")}>
            {filteredIdeasCount} ideas
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewConsolidatedReport}
            disabled={!consolidatedReportEnabled}
            className="ml-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            View consolidated report
          </Button>
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={executionModeFilter} 
              onValueChange={onExecutionModeFilterChange}
            >
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ideas</SelectItem>
                <SelectItem value="solopreneur">Solopreneur</SelectItem>
                <SelectItem value="classic-startup">Classic Startup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Star className={cn("h-4 w-4", showStarredOnly ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
            <Label htmlFor="starred-toggle" className="text-sm">Starred only</Label>
            <Switch 
              id="starred-toggle" 
              checked={showStarredOnly} 
              onCheckedChange={onShowStarredOnlyChange} 
            />
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="filter-toggle" className="text-sm">Live agent data</Label>
            <Switch 
              id="filter-toggle" 
              checked={showCurrentRun} 
              onCheckedChange={onShowCurrentRunChange} 
            />
          </div>
        </div>
      </div>
    </CardHeader>
  );
}