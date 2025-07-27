import { runDocumentationAgent } from '../../agents/documentation-agent.js';
import { loggingService } from '../../services/logging-service.js';
import { TestCacheService } from '../../services/test-cache-service.js';
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
  const { emitEvent, useTestCache, cacheEmitter } = context;

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
      
      const generator = runDocumentationAgent({ ideas: criticallyEvaluatedIdeas });
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
            
          case 'idea-processed':
            console.log(`✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`);
            
            emitEvent(
              'progress',
              'DocumentationAgent',
              `✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`,
              'info',
              {
                progress: Math.round((event.data.index / event.data.total) * 100),
                stage: 'documentation',
                data: {
                  index: event.data.index,
                  total: event.data.total,
                  title: event.data.title
                }
              }
            );
            break;
            
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