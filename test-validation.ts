import { businessIdeaSchema } from './src/types/agent-types.js';
import { z } from 'zod';

console.log('🧪 Testing Zod validation error handling...\n');

// Test data with both valid and invalid ideas
const testIdeas = [
  {
    title: "Valid Business Idea",
    description: "This is a valid business idea with all required fields.",
    businessModel: "B2B",
    disruptionPotential: 8,
    marketPotential: 9,
    technicalComplexity: 7,
    capitalIntensity: 6,
    reasoning: {
      disruption: "High disruption potential",
      market: "Large market opportunity",
      technical: "Moderate technical complexity",
      capital: "Medium capital requirements"
    }
  },
  {
    // Missing description field
    title: "Invalid Idea - Missing Description",
    businessModel: "B2C",
    disruptionPotential: 5,
    marketPotential: 6,
    technicalComplexity: 4,
    capitalIntensity: 3,
    reasoning: {
      disruption: "Low disruption",
      market: "Small market",
      technical: "Simple implementation",
      capital: "Low investment"
    }
  },
  {
    title: "Invalid Idea - Wrong BusinessModel Value",
    description: "This idea has an invalid business model value",
    businessModel: "INVALID_MODEL", // Not in enum
    disruptionPotential: 7,
    marketPotential: 8,
    technicalComplexity: 6,
    capitalIntensity: 5,
    reasoning: {
      disruption: "Some disruption",
      market: "Good market",
      technical: "Average complexity",
      capital: "Medium capital"
    }
  },
  {
    title: "Invalid Idea - Score Out of Range",
    description: "This idea has scores outside the 1-10 range",
    businessModel: "B2B2C",
    disruptionPotential: 15, // Out of range
    marketPotential: -2, // Out of range
    technicalComplexity: 5,
    capitalIntensity: 11, // Out of range
    reasoning: {
      disruption: "Invalid score",
      market: "Invalid score",
      technical: "Valid score",
      capital: "Invalid score"
    }
  },
  {
    title: "Another Valid Idea",
    description: "This is another valid business idea to test continued processing after errors.",
    businessModel: "B2B2C",
    disruptionPotential: 9,
    marketPotential: 8,
    technicalComplexity: 8,
    capitalIntensity: 7,
    reasoning: {
      disruption: "Excellent disruption potential",
      market: "Strong market presence",
      technical: "Complex implementation",
      capital: "High investment needed"
    }
  }
];

// Process each idea through Zod validation (simulating what the agent does)
let validIdeas = 0;
let invalidIdeas = 0;

console.log('Processing test ideas...\n');

for (const idea of testIdeas) {
  try {
    const validatedIdea = businessIdeaSchema.parse(idea);
    validIdeas++;
    console.log(`✅ Valid idea: "${validatedIdea.title}"`);
  } catch (error) {
    invalidIdeas++;
    console.error(`\n❌ Invalid idea detected:`);
    if ('title' in idea && idea.title) {
      console.error(`   Title: "${idea.title}"`);
    }
    if (error instanceof z.ZodError) {
      console.error('   Validation errors:');
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    }
    console.log('');
  }
}

console.log('\n📊 Test Results:');
console.log(`   Valid ideas: ${validIdeas}`);
console.log(`   Invalid ideas: ${invalidIdeas}`);
console.log(`   Total ideas processed: ${validIdeas + invalidIdeas}`);

if (invalidIdeas === 3 && validIdeas === 2) {
  console.log('\n✅ Validation error handling is working correctly!');
  console.log('   The system properly identified and handled invalid ideas while continuing to process valid ones.');
} else {
  console.log('\n❌ Unexpected test results. Expected 3 invalid and 2 valid ideas.');
}

// Test the agent's behavior with invalid data
console.log('\n\n🧪 Testing agent behavior with invalid JSON stream...\n');

// Import the streaming JSON parser to test its error handling
import { parseCompleteIdeasFromBuffer } from './src/utils/streaming-json-parser.js';

// Test malformed JSON that the LLM might produce
const malformedStream = `[
  {
    "title": "Test Idea",
    "description": "Valid idea",
    "businessModel": "B2B",
    "disruptionPotential": 8,
    "marketPotential": 9,
    "technicalComplexity": 7,
    "capitalIntensity": 6,
    "reasoning": {
      "disruption": "Good",
      "market": "Large",
      "technical": "Complex",
      "capital": "High"
    }
  },
  {
    "title": "Malformed JSON",
    "description": "Missing comma between properties"
    "businessModel": "B2C"
    "disruptionPotential": 5,
  }
]`;

console.log('Testing parser with malformed JSON...');
const { newIdeas, newBuffer } = parseCompleteIdeasFromBuffer(malformedStream);
console.log(`Ideas parsed before hitting malformed JSON: ${newIdeas.length}`);
console.log(`Remaining buffer contains malformed data: ${newBuffer.length > 10 ? 'Yes' : 'No'}`);

if (newIdeas.length === 1) {
  console.log('\n✅ Parser correctly handled malformed JSON!');
  console.log('   It parsed valid objects and stopped at malformed data.');
} else {
  console.log('\n❌ Parser did not handle malformed JSON as expected.');
}