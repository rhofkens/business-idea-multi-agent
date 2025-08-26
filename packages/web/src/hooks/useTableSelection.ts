/**
 * Hook for managing table row selection and bulk actions
 */

import { useState, useCallback } from "react";
import type { BusinessIdea } from "@/types/business-idea";
import { ideasApi } from "@/services/ideas-api";

interface UseTableSelectionReturn {
  selectedIds: Set<string>;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  allSelected: boolean;
  someSelected: boolean;
  handleSelectAll: (checked: boolean) => void;
  handleSelectIdea: (id: string, checked: boolean) => void;
  handleBulkDelete: () => Promise<void>;
  setDeleteDialogOpen: (open: boolean) => void;
}

/**
 * Custom hook for managing table selection state and bulk actions
 */
export function useTableSelection(
  filteredIdeas: BusinessIdea[],
  showCurrentRun: boolean,
  setDatabaseIdeas: React.Dispatch<React.SetStateAction<BusinessIdea[]>>
): UseTableSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if all visible ideas are selected
  const allSelected = filteredIdeas.length > 0 && filteredIdeas.every(idea => selectedIds.has(idea.id));
  const someSelected = filteredIdeas.some(idea => selectedIds.has(idea.id));

  // Handle select all checkbox
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredIdeas.map(idea => idea.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredIdeas]);

  // Handle individual idea selection
  const handleSelectIdea = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      // Call API to delete selected ideas
      await ideasApi.deleteIdeas(Array.from(selectedIds));
      
      // Remove deleted ideas from database ideas
      if (!showCurrentRun) {
        setDatabaseIdeas(prev => prev.filter(idea => !selectedIds.has(idea.id)));
      }
      
      // Clear selection
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('[SmartTable] Error deleting ideas:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, showCurrentRun, setDatabaseIdeas]);

  return {
    selectedIds,
    isDeleting,
    deleteDialogOpen,
    allSelected,
    someSelected,
    handleSelectAll,
    handleSelectIdea,
    handleBulkDelete,
    setDeleteDialogOpen,
  };
}