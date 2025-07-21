import { Type, Static } from '@sinclair/typebox';

/**
 * Schema for business preferences request.
 *
 * Validates that the request contains:
 * - A valid business vertical
 * - An array of valid subverticals for the selected vertical
 *
 * Used by POST /api/preferences endpoint
 *
 * @example
 * ```json
 * {
 *   "vertical": "fintech",
 *   "subVertical": "payments",
 *   "businessModel": "subscription",
 *   "additionalContext": "Focus on B2B solutions for small businesses"
 * }
 * ```
 */
export const BusinessPreferencesRequestSchema = Type.Object({
  vertical: Type.String({
    description: 'Business vertical category',
    examples: ['fintech', 'healthtech', 'edtech', 'ecommerce', 'saas', 'marketplace', 'mobility', 'proptech']
  }),
  subVertical: Type.String({
    description: 'Sub-vertical within the selected vertical',
    examples: ['payments', 'lending', 'telemedicine', 'k12']
  }),
  businessModel: Type.String({
    description: 'Business model type',
    examples: ['subscription', 'marketplace', 'freemium', 'advertising', 'transaction', 'licensing', 'direct-sales', 'affiliate']
  }),
  additionalContext: Type.String({
    description: 'Additional context or requirements for the business idea',
    default: ''
  })
});

/**
 * TypeScript type derived from BusinessPreferencesRequestSchema
 */
export type BusinessPreferencesRequest = Static<typeof BusinessPreferencesRequestSchema>;

/**
 * Schema for successful preferences submission response.
 *
 * Returns process ID for tracking the agent workflow.
 *
 * @example
 * ```json
 * {
 *   "processId": "01J3K9M8V7E5R6X2Y4D1G9H0N3",
 *   "message": "Business preferences submitted successfully. Processing has started.",
 *   "preferences": {
 *     "vertical": "technology",
 *     "subVertical": "saas",
 *     "businessModel": "subscription",
 *     "additionalContext": "Looking for B2B SaaS ideas"
 *   }
 * }
 * ```
 */
export const PreferencesResponseSchema = Type.Object({
  processId: Type.String({
    description: 'ULID process identifier for tracking the workflow',
    pattern: '^[0-9A-HJKMNP-TV-Z]{26}$'
  }),
  message: Type.String({
    description: 'Success message'
  }),
  preferences: Type.Object({
    vertical: Type.String(),
    subVertical: Type.String(),
    businessModel: Type.String(),
    additionalContext: Type.String()
  })
});

/**
 * TypeScript type derived from PreferencesResponseSchema
 */
export type PreferencesResponse = Static<typeof PreferencesResponseSchema>;

/**
 * Schema for validation error responses.
 * 
 * Used when business preferences validation fails.
 * 
 * @example
 * ```json
 * {
 *   "error": "Invalid subvertical for selected vertical",
 *   "statusCode": 400,
 *   "details": {
 *     "vertical": "Technology",
 *     "subvertical": "Invalid Option",
 *     "validSubverticals": ["Software Development", "Hardware & Electronics", ...]
 *   }
 * }
 * ```
 */
export const PreferencesErrorResponseSchema = Type.Object({
  error: Type.String(),
  statusCode: Type.Number(),
  details: Type.Optional(Type.Object({
    vertical: Type.Optional(Type.String()),
    subvertical: Type.Optional(Type.String()),
    validSubverticals: Type.Optional(Type.Array(Type.String()))
  }))
});

/**
 * TypeScript type derived from PreferencesErrorResponseSchema
 */
export type PreferencesErrorResponse = Static<typeof PreferencesErrorResponseSchema>;

/**
 * Schema for business options GET response
 */
export const BusinessOptionsResponseSchema = Type.Object({
  verticals: Type.Array(Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.String(),
    subverticals: Type.Array(Type.Object({
      id: Type.String(),
      name: Type.String(),
      examples: Type.Array(Type.String())
    }))
  })),
  businessModels: Type.Array(Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.String()
  }))
});

/**
 * TypeScript type derived from BusinessOptionsResponseSchema
 */
export type BusinessOptionsResponse = Static<typeof BusinessOptionsResponseSchema>;