/**
 * Toolbar component for SmartTable with selection and bulk actions
 */

import { TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, ChevronDown } from "lucide-react";

interface SmartTableToolbarProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  onSelectAll: (checked: boolean) => void;
  onDeleteClick: () => void;
}

export function SmartTableToolbar({
  allSelected,
  someSelected,
  selectedCount,
  onSelectAll,
  onDeleteClick,
}: SmartTableToolbarProps) {
  return (
    <TableHead className="w-12">
      <div className="flex items-center gap-1">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all"
        />
        {someSelected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={onDeleteClick}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedCount})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TableHead>
  );
}