import { FastifyPluginAsync } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';

const documentationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get documentation for a specific idea or consolidated report
  fastify.get<{
    Params: { ideaId: string };
  }>('/api/documentation/:ideaId', async (request, reply) => {
    const { ideaId } = request.params;
    
    try {
      // First try to find the file in the ideas subfolder
      let filePath = join(process.cwd(), '..', '..', 'docs', 'output', 'ideas', `${ideaId}.md`);
      
      try {
        await fs.access(filePath);
      } catch {
        // If not found in ideas subfolder, try the output folder directly (for consolidated reports)
        filePath = join(process.cwd(), '..', '..', 'docs', 'output', `${ideaId}.md`);
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      
      return reply.send({ content });
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return reply.status(404).send({ error: 'Documentation not found' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to read documentation' });
    }
  });

  // Check if documentation exists for an idea or consolidated report
  fastify.get<{
    Params: { ideaId: string };
  }>('/api/documentation/:ideaId/status', async (request, reply) => {
    const { ideaId } = request.params;
    
    try {
      // First try to find the file in the ideas subfolder
      let filePath = join(process.cwd(), '..', '..', 'docs', 'output', 'ideas', `${ideaId}.md`);
      
      try {
        await fs.access(filePath);
        return reply.send({ exists: true });
      } catch {
        // If not found in ideas subfolder, try the output folder directly (for consolidated reports)
        filePath = join(process.cwd(), '..', '..', 'docs', 'output', `${ideaId}.md`);
        await fs.access(filePath);
        return reply.send({ exists: true });
      }
    } catch (_error) {
      return reply.send({ exists: false });
    }
  });
};

export default documentationRoutes;