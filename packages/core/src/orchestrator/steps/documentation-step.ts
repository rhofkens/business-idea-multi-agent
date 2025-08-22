import { runDocumentationAgent } from '../../agents/documentation-agent.js';
import { loggingService } from '../../services/logging-service.js';
import { TestCacheService } from '../../services/test-cache-service.js';
import { runRepository } from '../../data/repositories/run-repository.js';
import { ideaRepository } from '../../data/repositories/idea-repository.js';
import type { DocumentationAgentOutput } from '../../types/agent-types.js';
import type {
  StepParams,
  DocumentationStepInput,
  DocumentationStepResult,
} from '../types/orchestrator-types.js';

/**
 * Executes the documentation generation step of the orchestrator
 */
export async function runDocumentationStep({
  context,
  input,
}: StepParams<DocumentationStepInput>): Promise<DocumentationStepResult> {
  const { criticallyEvaluatedIdeas } = input;
  const { emitEvent, useTestCache, cacheEmitter, factory } = context;

  if (criticallyEvaluatedIdeas.length === 0) {
    loggingService.log({
      level: 'INFO',
      message: 'No ideas to document, skipping Documentation Agent',
    });
    return {
      documentationResult: null,
    };
  }

  console.log('\n\n📝 Starting documentation generation...\n');
  
  emitEvent('status', 'DocumentationAgent', `📝 Starting documentation generation for ${criticallyEvaluatedIdeas.length} ideas...`);
  
  loggingService.log({
    level: 'INFO',
    message: 'Starting Documentation Agent',
    details: `Processing ${criticallyEvaluatedIdeas.length} business ideas for documentation`,
  });

  // Use test cache for documentation agent if enabled
  const documentationResult = await TestCacheService.loadOrExecute(
    {
      enabled: useTestCache,
      fileName: 'documentation-output.json'
    },
    async () => {
      console.log('\n🔷 Step 5: Documentation Agent');
      console.log('📝 Generating comprehensive business idea report...\n');
      
      const generator = runDocumentationAgent({ ideas: criticallyEvaluatedIdeas }, factory);
      let iterResult = await generator.next();
      let result: DocumentationAgentOutput | null = null;
      
      while (!iterResult.done) {
        const event = iterResult.value;
        
        switch (event.type) {
          case 'status':
            console.log(`📋 ${event.data}`);
            emitEvent('status', 'DocumentationAgent', event.data);
            break;
            
          case 'chunk':
            // Don't display raw chunks from documentation agent
            break;
            
          case 'idea-processed': {
            console.log(`✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`);
            
            // Find the corresponding idea to get its ID
            const ideaIndex = event.data.index - 1; // Convert 1-based to 0-based index
            const currentIdea = criticallyEvaluatedIdeas[ideaIndex];
            
            emitEvent(
              'progress',
              'DocumentationAgent',
              `✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`,
              'info',
              {
                progress: Math.round((event.data.index / event.data.total) * 100),
                stage: 'documentation',
                data: {
                  ideaId: currentIdea?.id,
                  index: event.data.index,
                  total: event.data.total,
                  title: event.data.title
                }
              }
            );
            break;
          }
            
          case 'section-generated':
            console.log(`📝 Generated section: ${event.data.section}`);
            
            emitEvent(
              'progress',
              'DocumentationAgent',
              `📝 Generated section: ${event.data.section}`,
              'info',
              {
                stage: 'section-generation',
                data: {
                  section: event.data.section
                }
              }
            );
            break;
            
          case 'complete':
            console.log('\n✅ Documentation generation complete!');
            
            emitEvent(
              'status',
              'DocumentationAgent',
              '✅ Documentation generation complete!'
            );
            break;
        }
        
        iterResult = await generator.next();
      }
      
      // When done, iterResult.value contains the return value
      result = iterResult.value as DocumentationAgentOutput;
      
      console.log(`📄 Report saved to: ${result.reportPath}`);
      console.log(`📊 Total ideas documented: ${result.ideasProcessed}`);
      console.log(`⏱️  Processing time: ${result.processingTime}ms`);
      
      // Persist document path to database
      if (context.runId && context.userId && result.reportPath) {
        try {
          // Update run with document path
          await runRepository.updateRunDocumentPath(context.runId, result.reportPath);
          console.log(`   💾 Document path saved to run record`);
          
          // Update all ideas with document path and stage
          for (const idea of criticallyEvaluatedIdeas) {
            await ideaRepository.updateIdeaStage(idea.id, 'documented', {});
            await ideaRepository.updateIdeaDocumentPath(idea.id, result.reportPath);
          }
          console.log(`   💾 Updated ${criticallyEvaluatedIdeas.length} ideas with document path and stage`);
        } catch (error) {
          console.error(`   ❌ Failed to persist document path:`, error);
          loggingService.log({
            level: 'ERROR',
            message: 'Failed to persist document path to database',
            details: JSON.stringify({ runId: context.runId, error: String(error) }),
          });
        }
      }
      
      emitEvent(
        'result',
        'DocumentationAgent',
        `📄 Report saved to: ${result.reportPath}`,
        'info',
        {
          data: {
            reportPath: result.reportPath,
            ideasProcessed: result.ideasProcessed,
            processingTime: result.processingTime
          }
        }
      );
      
      return result;
    }
  );

  // Update output if loaded from cache
  if (useTestCache && documentationResult) {
    console.log(`\n📦 Loaded documentation result from cache`);
    
    // Use WebSocketCacheEmitter to simulate cached results
    await cacheEmitter.simulateDocumentationAgentCache(
      documentationResult,
      criticallyEvaluatedIdeas
    );
  }

  if (documentationResult) {
    loggingService.log({
      level: 'INFO',
      message: 'Documentation Agent finished successfully.',
      details: `Generated report at ${documentationResult.reportPath} with ${documentationResult.ideasProcessed} ideas.`,
    });
  }

  return {
    documentationResult,
  };
}