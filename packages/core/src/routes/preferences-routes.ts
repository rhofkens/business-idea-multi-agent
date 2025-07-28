import type { FastifyInstance, FastifyRequest, FastifyReply, RouteShorthandOptions } from 'fastify';
import { type Static } from '@sinclair/typebox';
import { ulid } from 'ulidx';
import { loggingService } from '../services/logging-service.js';
import { AgentOrchestrator } from '../orchestrator/agent-orchestrator.js';
import {
  BusinessPreferencesRequestSchema,
  PreferencesResponseSchema,
  PreferencesErrorResponseSchema,
  BusinessOptionsResponseSchema
} from '../schemas/preferences-schemas.js';
import { SessionUtils } from '../services/session-utils.js';
import {
  validateSubverticalsForVertical,
  getSubverticalOptions,
  getVerticalOptions,
  getBusinessModelOptions
} from '@business-idea/shared';

// Route options with full JSON Schema validation
const preferencesRouteOptions: RouteShorthandOptions = {
  schema: {
    body: BusinessPreferencesRequestSchema,
    response: {
      200: PreferencesResponseSchema,
      400: PreferencesErrorResponseSchema,
      500: PreferencesErrorResponseSchema
    }
  }
};

export async function registerPreferencesRoutes(app: FastifyInstance): Promise<void> {
  // GET endpoint to fetch business options for dropdowns
  app.get<{
    Reply: Static<typeof BusinessOptionsResponseSchema>;
  }>('/preferences/options', {
    schema: {
      response: {
        200: BusinessOptionsResponseSchema
      }
    }
  }, async (request, reply) => {
    // Get all verticals
    const verticals = getVerticalOptions();
    
    // Build verticals with their subverticals
    const verticalsWithSubverticals = verticals.map(vertical => ({
      id: vertical.id,
      name: vertical.name,
      description: vertical.description,
      subverticals: getSubverticalOptions(vertical.id)
    }));
    
    // Get business models
    const businessModels = getBusinessModelOptions();
    
    return reply.send({
      verticals: verticalsWithSubverticals,
      businessModels
    });
  });

  // POST endpoint to save business preferences and trigger agent workflow
  app.post<{
    Body: Static<typeof BusinessPreferencesRequestSchema>
  }>('/preferences', preferencesRouteOptions, async (
    request: FastifyRequest<{ Body: Static<typeof BusinessPreferencesRequestSchema> }>,
    reply: FastifyReply
  ) => {
    try {
      const { vertical, subVertical, businessModel, additionalContext } = request.body;

      // Validate subVertical belongs to the selected vertical
      const isValid = validateSubverticalsForVertical(vertical, [subVertical]);
      if (!isValid) {
        loggingService.log({
          level: 'ERROR',
          message: 'Invalid subVertical for vertical',
          details: `Vertical: ${vertical}, SubVertical: ${subVertical}`
        });
        
        const availableSubVerticals = getSubverticalOptions(vertical);
        return reply.code(400).send({
          error: 'Invalid subVertical for the selected vertical',
          statusCode: 400,
          details: {
            vertical,
            subvertical: subVertical,
            validSubverticals: availableSubVerticals.map(s => s.id)
          }
        });
      }

      // Generate process ID
      const processId = ulid();

      // Create business preferences object
      const businessPreferences = {
        vertical,
        subVertical,
        businessModel,
        additionalContext
      };

      // Store preferences in session using SessionUtils
      SessionUtils.setSessionData(request, 'businessPreferences', businessPreferences);

      loggingService.log({
        level: 'INFO',
        message: 'Business preferences received',
        details: `Process ID: ${processId}, Vertical: ${vertical}, SubVertical: ${subVertical}, BusinessModel: ${businessModel}`
      });

      // Trigger agent workflow asynchronously (ADR-002)
      setImmediate(async () => {
        try {
          loggingService.log({
            level: 'INFO',
            message: 'Starting agent workflow',
            details: `Process ID: ${processId}`
          });

          // Import the test cache flag check function
          const { isTestCacheEnabled } = await import('../server.js');
          
          // Get the user from the session
          const user = SessionUtils.getSessionUser(request);
          const userId = user?.id;
          
          const orchestrator = new AgentOrchestrator();
          await orchestrator.runChain(businessPreferences, isTestCacheEnabled(), request.session.sessionId, userId);

          loggingService.log({
            level: 'INFO',
            message: 'Agent workflow completed successfully',
            details: `Process ID: ${processId}, User ID: ${userId || 'anonymous'}`
          });
        } catch (error) {
          loggingService.log({
            level: 'ERROR',
            message: 'Agent workflow failed',
            details: `Process ID: ${processId}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      });

      // Return immediate response
      return reply.code(200).send({
        processId,
        message: 'Business preferences submitted successfully. Processing has started.',
        preferences: {
          vertical,
          subVertical,
          businessModel,
          additionalContext
        }
      });

    } catch (error) {
      loggingService.log({
        level: 'ERROR',
        message: 'Failed to process business preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to process business preferences'
      });
    }
  });
}