# ADR-004: Business Verticals JSON Structure

## Status
Accepted

## Context
The business verticals taxonomy is currently documented in markdown format (business_verticals_taxonomy.md) and needs to be converted to JSON for use in the application. The structure needs to support validation, frontend consumption, and potential future extensions.

## Decision
We will use a hierarchical JSON structure with the following format:

```json
{
  "version": "1.0.0",
  "verticals": [
    {
      "id": "health-wellness",
      "name": "Health & Wellness",
      "description": "Healthcare, fitness, mental health, and wellness services",
      "subverticals": [
        {
          "id": "healthcare-services",
          "name": "Healthcare Services",
          "examples": ["Telehealth platforms", "Mental health apps"]
        }
      ]
    }
  ]
}
```

Key decisions:
- Use kebab-case IDs for consistency with web standards
- Include descriptions at the vertical level only
- Include examples at the subvertical level
- Add version field for future migrations

## Consequences
- **Positive**: Easy to validate with JSON Schema
- **Positive**: Frontend-friendly structure
- **Positive**: Extensible (can add fields without breaking)
- **Positive**: Supports localization in the future
- **Negative**: Requires manual ID assignment during conversion
- **Negative**: Larger file size than a flat structure

## Alternatives Considered
- **Flat array**: Less intuitive, requires client-side grouping
- **Map structure**: Not JSON-serializable without conversion
- **Nested objects**: Harder to iterate over