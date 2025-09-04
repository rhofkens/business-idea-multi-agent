import { anthropic } from '@ai-sdk/anthropic';

console.log('Available tools:', Object.keys(anthropic.tools || {}));
