# Step 7: Smart Table Documentation Agent Integration - Task Breakdown

This document provides a detailed breakdown of tasks for implementing documentation viewing capabilities in the Smart Table UI.

## Backend Tasks

### API Implementation Tasks

#### Task 1: Create Documentation REST Routes
Add REST endpoints for retrieving documentation content.

File: `packages/core/src/routes/documentation-routes.ts`
```typescript
import { FastifyPluginAsync } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';

const documentationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get documentation for a specific idea
  fastify.get<{
    Params: { ideaId: string };
  }>('/api/documentation/:ideaId', async (request, reply) => {
    const { ideaId } = request.params;
    
    try {
      const filePath = join(process.cwd(), 'docs', 'output', 'ideas', `${ideaId}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return reply.send({ content });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return reply.status(404).send({ error: 'Documentation not found' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to read documentation' });
    }
  });

  // Check if documentation exists for an idea
  fastify.get<{
    Params: { ideaId: string };
  }>('/api/documentation/:ideaId/status', async (request, reply) => {
    const { ideaId } = request.params;
    
    try {
      const filePath = join(process.cwd(), 'docs', 'output', 'ideas', `${ideaId}.md`);
      await fs.access(filePath);
      
      return reply.send({ exists: true });
    } catch (error) {
      return reply.send({ exists: false });
    }
  });
};

export default documentationRoutes;
```

#### Task 2: Register Documentation Routes
Register the documentation routes with the Fastify server.

File: `packages/core/src/server/fastify-server.ts`
Add to imports:
```typescript
import documentationRoutes from '../routes/documentation-routes';
```

Add in the route registration section:
```typescript
// Register documentation routes
await app.register(documentationRoutes);
```

## Frontend Tasks

### API Client Tasks

#### Task 3: Create Documentation API Client
Create a client module for fetching documentation from the REST API.

File: `packages/web/src/services/documentationApi.ts`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const documentationApi = {
  async getDocumentation(ideaId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documentation/${ideaId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch documentation');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching documentation:', error);
      throw error;
    }
  },
  
  async checkDocumentationExists(ideaId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documentation/${ideaId}/status`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking documentation status:', error);
      return false;
    }
  }
};
```

### Component Implementation Tasks

#### Task 4: Update Component Exports
Export the new UI components.

File: `packages/web/src/components/ui/index.ts`
Add exports:
```typescript
export * from './dialog';
export * from './scroll-area';
```

#### Task 5: Create CSS Variables for Prose Styling
Add prose-related CSS variables for markdown styling.

File: `packages/web/src/App.css`
Add to the :root section:
```css
/* Prose colors for markdown content */
--prose-body: hsl(var(--foreground));
--prose-headings: hsl(var(--foreground));
--prose-links: hsl(var(--primary));
--prose-bold: hsl(var(--foreground));
--prose-counters: hsl(var(--muted-foreground));
--prose-bullets: hsl(var(--muted-foreground));
--prose-hr: hsl(var(--border));
--prose-quotes: hsl(var(--foreground));
--prose-quote-borders: hsl(var(--border));
--prose-code: hsl(var(--foreground));
--prose-pre-code: hsl(var(--foreground));
--prose-pre-bg: hsl(var(--muted));
--prose-th-borders: hsl(var(--border));
--prose-td-borders: hsl(var(--border));
```

#### Task 6: Install Markdown Dependencies
Add react-markdown and related dependencies.

Action: Run in packages/web directory:
```bash
pnpm add react-markdown remark-gfm
pnpm add -D @types/react-markdown
```

#### Task 7: Create MarkdownViewerModal Component
Implement the modal component for displaying markdown content.

File: `packages/web/src/components/MarkdownViewerModal.tsx`
```typescript
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface MarkdownViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  contentUrl?: string;
  content?: string;
}

export function MarkdownViewerModal({
  isOpen,
  onClose,
  title,
  description,
  contentUrl,
  content: directContent,
}: MarkdownViewerModalProps) {
  const [content, setContent] = useState<string | null>(directContent || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    if (directContent) {
      setContent(directContent);
      return;
    }
    
    if (contentUrl) {
      setIsLoading(true);
      setError(null);
      
      fetch(contentUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load content');
          return res.text();
        })
        .then(text => {
          setContent(text);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [isOpen, contentUrl, directContent]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="text-destructive text-center p-4">
              Error loading content: {error}
            </div>
          )}
          
          {content && !isLoading && !error && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

#### Task 8: Create Documentation Viewer Hook
Create a custom hook to manage documentation viewing state.

File: `packages/web/src/hooks/useDocumentationViewer.ts`
```typescript
import { useState, useCallback } from 'react';
import { documentationApi } from '@/services/documentationApi';

interface DocumentationViewerState {
  isOpen: boolean;
  ideaId: string | null;
  content: string | null;
  isLoading: boolean;
  error: string | null;
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
```

#### Task 9: Update SmartTable Component Structure
Prepare SmartTable to handle documentation functionality.

File: `packages/web/src/components/SmartTable.tsx`
Add imports and state:
```typescript
import { useDocumentationViewer } from '@/hooks/useDocumentationViewer';
import { MarkdownViewerModal } from './MarkdownViewerModal';
import { FileText } from 'lucide-react';

// In component
const documentationViewer = useDocumentationViewer();
```

#### Task 10: Add hardcoded view documentation buttons in UI to test endpoint
Two buttons add the bottom of the UI in a separate card:
View ID1 report
View full report
These will be removed later

#### Task 11: Handle DocumentationAgent WebSocket Events
Process documentation generation events in SmartTable following the established pattern.

File: `packages/web/src/components/SmartTable.tsx`
Add to the event filtering in the existing pattern (similar to lines 144-164):
```typescript
// In the relevantEvents filter, add DocumentationAgent event handling:
// Accept DocumentationAgent progress events (individual idea documentation updates)
if (e.agentName === "DocumentationAgent" && e.type === "progress" && e.metadata?.data) {
  return true;
}
// Accept DocumentationAgent result event (complete documentation workflow finished)
if (e.agentName === "DocumentationAgent" && e.type === "result" && e.metadata?.data) {
  return true;
}

Stop the flow.
ASK THE USER how to continue with the rest of the implementation

#### Task 14: Update Generate Ideas Button State Management
Ensure the Generate Ideas button in the preferences dialog properly reflects the generation state.

File: `packages/web/src/components/SmartTable.tsx`
The Generate Ideas button is already disabled during generation with a "Generating ideas" spinner. The DocumentationAgent result event (handled in Task 11) will re-enable the button by setting `isGeneratingIdeas: false` when the complete workflow finishes.

Verify that:
1. The button shows "Generating ideas..." with a spinner during the workflow
2. The button is disabled during generation
3. The DocumentationAgent result event re-enables the button to its normal state

## Summary

This completes the implementation tasks for Step 7 - Smart Table Documentation Agent Integration. The implementation adds:

1. **Backend REST API** - Two endpoints for retrieving documentation content and checking existence
2. **Frontend Components** - Markdown viewer modal with scrollable content area
3. **API Client** - Service for fetching documentation from the backend
4. **UI Integration** - Documentation view buttons in the SmartTable actions column
5. **WebSocket Handling** - Real-time updates for documentation generation progress
6. **State Management** - Tracking which ideas have documentation available

### Key Implementation Notes:
- Documentation files are read directly from the filesystem at `docs/output/ideas/${idea.id}.md`
- The modal uses react-markdown with GitHub Flavored Markdown support
- WebSocket events follow the established pattern with progress and result events
- The Generate Ideas button state is managed through the DocumentationAgent result event

### Manual Testing Checklist:
1. Verify documentation API endpoints return correct content
2. Test documentation modal opens and displays markdown correctly
3. Confirm loading states appear during documentation generation
4. Ensure documentation buttons only appear for ideas with available documentation
5. Verify Generate Ideas button is properly disabled/enabled during workflow