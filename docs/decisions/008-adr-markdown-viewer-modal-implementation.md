# ADR-008: Markdown Viewer Modal Implementation

## Status
Accepted

## Context
The DocumentationAgent integration requires displaying full markdown documents in a modal dialog. Current UI components use Tooltip for small content previews, but we need a solution for viewing full documentation reports and individual idea documentation. The documents can be quite large (multiple pages of markdown).

Requirements:
- Display markdown content with proper formatting
- Support for scrolling long documents
- Non-blocking UI (user can interact with table while modal is open)
- Consistent with existing UI patterns
- Should handle large markdown documents efficiently

## Decision
We will implement a custom MarkdownViewerModal component using shadcn/ui Dialog component with a markdown renderer.

Implementation approach:
1. Use shadcn/ui Dialog component as the modal foundation
2. Integrate a lightweight markdown-to-React renderer (react-markdown)
3. Create a reusable MarkdownViewerModal component
4. Load content via REST API when modal opens (lazy loading)
5. Add loading states for content fetching

Example structure:
```typescript
interface MarkdownViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentUrl?: string; // For API fetching
  content?: string;    // For direct content
}
```

## Consequences
- **Positive**: Consistent with existing UI library (shadcn/ui)
- **Positive**: Reusable component for future markdown display needs
- **Positive**: Lazy loading prevents loading large content until needed
- **Positive**: Non-blocking modal allows continued table interaction
- **Negative**: Adds react-markdown dependency
- **Negative**: Need to handle markdown rendering edge cases

## Alternatives Considered
- **iframe with raw markdown**: Poor UX, no styling consistency
- **Pre-rendered HTML from backend**: Security concerns with HTML injection
- **Full-page navigation**: Disrupts workflow, poor UX
- **Inline expansion**: Table becomes unwieldy with large content