import { FastifyInstance } from 'fastify';
import { ideaRepository } from '../data/repositories/idea-repository.js';
import { loggingService } from '../services/logging-service.js';
import { SessionUtils } from '../services/session-utils.js';
import type { BusinessIdea } from '@business-idea/shared';

/**
 * Registers ideas-related routes
 */
export function registerIdeasRoutes(fastify: FastifyInstance): void {
  // Get all ideas for the authenticated user
  fastify.get<{
    Querystring: { starred?: string };
    Reply: { ideas: BusinessIdea[] } | { error: string };
  }>('/api/ideas', async (request, reply) => {
    try {
      // Get user from session
      const user = SessionUtils.getSessionUser(request);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const getStarred = (query?: string): boolean | undefined => {
        if (query === 'true') return true;
        if (query === 'false') return false;
        return undefined;
      };
      const starred = getStarred(request.query.starred);
      
      loggingService.log({
        level: 'INFO',
        message: 'Fetching ideas for user',
        details: JSON.stringify({ userId: user.id, starred }),
      });

      const ideas = await ideaRepository.getIdeasByUser(user.id, starred);
      
      return reply.send({ ideas });
    } catch (error) {
      loggingService.log({
        level: 'ERROR',
        message: 'Failed to fetch ideas',
        details: JSON.stringify({ error: String(error) }),
      });
      return reply.code(500).send({ error: 'Failed to fetch ideas' });
    }
  });
// Get a specific idea by ID
fastify.get<{
  Params: { id: string };
  Reply: { idea: BusinessIdea } | { error: string };
}>('/api/ideas/:id', async (request, reply) => {
  try {
    // Get user from session
    const user = SessionUtils.getSessionUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params;
    
    loggingService.log({
      level: 'INFO',
      message: 'Fetching idea by ID',
      details: JSON.stringify({ userId: user.id, ideaId: id }),
    });

    const idea = await ideaRepository.getIdeaById(id);
    
    if (!idea) {
      return reply.code(404).send({ error: 'Idea not found' });
    }
    
    // Check if the idea belongs to the user - need to check in the database
    const userIdeas = await ideaRepository.getIdeasByUser(user.id);
    const userIdea = userIdeas.find(i => i.id === id);
    
    if (!userIdea) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    return reply.send({ idea });
  } catch (error) {
    loggingService.log({
      level: 'ERROR',
      message: 'Failed to fetch idea',
      details: JSON.stringify({ error: String(error) }),
    });
    return reply.code(500).send({ error: 'Failed to fetch idea' });
  }
});
  // Update idea starred status
  fastify.patch<{
    Params: { id: string };
    Body: { starred: boolean };
    Reply: { success: boolean } | { error: string };
  }>('/api/ideas/:id/star', async (request, reply) => {
    try {
      // Get user from session
      const user = SessionUtils.getSessionUser(request);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const { starred } = request.body;
      
      loggingService.log({
        level: 'INFO',
        message: 'Updating idea starred status',
        details: JSON.stringify({ userId: user.id, ideaId: id, starred }),
      });

      // Check if the idea exists and belongs to the user
      const userIdeas = await ideaRepository.getIdeasByUser(user.id);
      const userIdea = userIdeas.find(i => i.id === id);
      
      if (!userIdea) {
        return reply.code(404).send({ error: 'Idea not found' });
      }
      
      await ideaRepository.setStarred(id, starred);
      
      return reply.send({ success: true });
    } catch (error) {
      loggingService.log({
        level: 'ERROR',
        message: 'Failed to update idea starred status',
        details: JSON.stringify({ error: String(error) }),
      });
      return reply.code(500).send({ error: 'Failed to update idea' });
    }
  });

  // Bulk delete ideas
  fastify.delete<{
    Body: { ids: string[] };
    Reply: { success: boolean } | { error: string };
  }>('/api/ideas', async (request, reply) => {
    try {
      // Get user from session
      const user = SessionUtils.getSessionUser(request);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { ids } = request.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({ error: 'Invalid request: ids array is required' });
      }
      
      loggingService.log({
        level: 'INFO',
        message: 'Bulk deleting ideas',
        details: JSON.stringify({ userId: user.id, ideaIds: ids }),
      });

      // Check if all ideas belong to the user
      const userIdeas = await ideaRepository.getIdeasByUser(user.id);
      const userIdeaIds = new Set(userIdeas.map(i => i.id));
      const invalidIds = ids.filter(id => !userIdeaIds.has(id));
      
      if (invalidIds.length > 0) {
        return reply.code(403).send({ error: 'Some ideas do not belong to the user' });
      }
      
      // Delete the ideas
      await ideaRepository.deleteIdeas(ids);
      
      return reply.send({ success: true });
    } catch (error) {
      loggingService.log({
        level: 'ERROR',
        message: 'Failed to delete ideas',
        details: JSON.stringify({ error: String(error) }),
      });
      return reply.code(500).send({ error: 'Failed to delete ideas' });
    }
  });
}