import { BusinessPreferences } from '@business-idea/shared';

export const getSolopreneurIdeationContext = (preferences: BusinessPreferences): string => {
  return `

EXECUTION MODE: SOLOPRENEUR (1-3 person teams using AI-assisted coding)

CRITICAL SOLOPRENEUR REQUIREMENTS:
1. Ideas MUST have defensible technical complexity that competitors can't easily copy
2. Buildable by 1-3 person teams using AI-assisted coding tools (Claude Code, Cursor, Windsurf)
3. Target markets of $10M-$1B TAM (not micro-niches)
4. Require expertise that creates barriers to entry
5. Leverage AI coding tools for 5-10x development speed

TYPES OF IDEAS TO PRIORITIZE FOR SOLOPRENEURS:

1. TECHNICALLY COMPLEX SAAS ($99-$2,999/month):
   - Advanced data processing and analytics tools
   - ML/AI model integration and orchestration platforms
   - Complex API aggregations with intelligent routing
   - Real-time processing systems with sophisticated algorithms
   - Domain-specific development tools requiring deep expertise
   Example: "AI-powered log analysis with anomaly detection" not "Simple log viewer"

2. SPECIALIZED INFRASTRUCTURE ($299-$9,999/month):
   - Developer infrastructure with complex requirements
   - Data pipeline tools with advanced transformations
   - Security and compliance automation platforms
   - Performance optimization services
   - Custom integrations for enterprise tools
   Example: "Multi-cloud cost optimization with ML predictions" not "Basic cloud monitoring"

3. VERTICAL AI SOLUTIONS ($199-$4,999/month):
   - Industry-specific AI applications requiring domain knowledge
   - Custom LLM fine-tuning and deployment platforms
   - Specialized computer vision applications
   - Advanced NLP for specific professional use cases
   - AI workflow automation for complex processes
   Example: "Legal document analysis with citation verification" not "Generic document summary"

4. ADVANCED DEVELOPER TOOLS ($49-$999/month):
   - Code analysis and optimization tools
   - Testing frameworks for specific technologies
   - Development environment enhancements
   - API development and management platforms
   - Open source with enterprise features
   Example: "GraphQL performance analyzer with query optimization" not "Basic API monitor"

SOLOPRENEUR SCORING ADJUSTMENTS:
- Technical Sophistication: Aim for 6-8 (sweet spot of complexity)
- Market Potential: Must justify $10M+ TAM (score 6+)
- Capital Intensity: Should be LOW (score 1-3)
- Focus on technical moats over marketing/sales requirements

DEFENSIBILITY FACTORS FOR SOLOPRENEURS:
- Technical complexity that requires expertise to replicate
- Proprietary algorithms or unique technical approaches
- Data network effects from usage
- Integration complexity that creates switching costs
- Performance advantages from optimized implementation
- Domain expertise encoded in the solution

USER CONTEXT:
Vertical: ${preferences.vertical}
Sub-vertical: ${preferences.subVertical}
Business Model: ${preferences.businessModel}
Additional Context: ${preferences.additionalContext || 'None provided'}

Remember: Focus on technically sophisticated ideas that a small team can build efficiently with AI assistance, but competitors would struggle to replicate without similar expertise.`;
};