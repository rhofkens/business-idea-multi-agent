import { ExecutionModeFactory } from '../base/ExecutionModeFactory';

export class ExecutionModeRegistry {
  private factories = new Map<string, ExecutionModeFactory>();
  
  register(factory: ExecutionModeFactory): void {
    if (this.factories.has(factory.mode)) {
      throw new Error(`Execution mode ${factory.mode} is already registered`);
    }
    this.factories.set(factory.mode, factory);
    console.log(`[Registry] Registered execution mode: ${factory.mode}`);
  }
  
  getFactory(mode: string): ExecutionModeFactory {
    const factory = this.factories.get(mode);
    if (!factory) {
      throw new Error(`Unknown execution mode: ${mode}. Available modes: ${this.getSupportedModes().join(', ')}`);
    }
    return factory;
  }
  
  getSupportedModes(): string[] {
    return Array.from(this.factories.keys());
  }
  
  hasMode(mode: string): boolean {
    return this.factories.has(mode);
  }
  
  getFactories(): ExecutionModeFactory[] {
    return Array.from(this.factories.values());
  }
}