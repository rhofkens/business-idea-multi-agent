import { useState, useCallback } from 'react';
import { documentationApi } from '@/services/documentationApi';
interface DocumentationViewerState {
  isOpen: boolean;
  ideaId: string | null;
  content: string | null;
  isLoading: boolean;
  error: string | null;
  title?: string;
}

export function useDocumentationViewer() {
  const [state, setState] = useState<DocumentationViewerState>({
    isOpen: false,
    ideaId: null,
    content: null,
    isLoading: false,
    error: null,
  });

  const openDocumentation = useCallback(async (ideaId: string) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      ideaId,
      isLoading: true,
      error: null,
    }));

    try {
      const doc = await documentationApi.getDocumentation(ideaId);
      setState(prev => ({
        ...prev,
        content: doc,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load documentation',
        isLoading: false,
      }));
    }
  }, []);

  const closeDocumentation = useCallback(() => {
    setState({
      isOpen: false,
      ideaId: null,
      content: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    openDocumentation,
    closeDocumentation,
  };
}