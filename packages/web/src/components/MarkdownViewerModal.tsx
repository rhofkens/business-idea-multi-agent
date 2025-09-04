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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}