# ADR 006: Markdown Report Generation Approach

## Status

Accepted

## Context

The Documentation Agent needs to generate a structured Markdown report from the fully-analyzed array of business ideas. The report must include specific sections (title, introduction, individual idea tables, top 3 summary, metadata) and be saved with a timestamp-based filename.

There are two main approaches to consider:
1. **Prompt-based generation**: Use the LLM to generate the entire markdown content based on a detailed prompt
2. **Template-based generation**: Use TypeScript code to format the data into markdown using string templates

## Decision

We will use a **single-idea iterative approach** where the LLM formats each business idea individually:

1. **LLM handles (through multiple calls)**:
   - Formatting each business idea into a complete markdown section (one at a time)
   - Creating the introduction section
   - Generating the top 3 summary with narrative descriptions
   - All markdown formatting including tables

2. **Simple TypeScript utilities handle**:
   - Stitching the generated parts together
   - File system operations (saving to docs/output)
   - Timestamp generation for filenames
   - Orchestrating the iterative LLM calls

3. **Input validation**: The Documentation Agent will validate its input using a zod schema to ensure data integrity before processing.

## Rationale

- **Simplicity**: LLM is excellent at markdown formatting when given clear instructions
- **Scalability**: Processing one idea at a time prevents context overload
- **Consistency**: Each idea gets the same formatting treatment
- **Flexibility**: Easy to adjust formatting through prompt engineering
- **Minimal code**: Reduces TypeScript complexity to just orchestration and file operations

## Consequences

**Pros:**
- Leverages LLM's natural language and formatting capabilities
- Avoids complex TypeScript formatting logic
- Prevents context overload by processing ideas individually
- Easy to modify output format through prompt changes
- Maintains data integrity through schema validation

**Cons:**
- Requires multiple LLM calls (12 total: intro + 10 ideas + summary)
- Slightly slower than a single-pass approach
- Depends on prompt quality for consistent formatting