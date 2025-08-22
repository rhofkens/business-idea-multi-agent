import { BusinessIdea } from '@business-idea/shared';

export const getSolopreneurDocumentationContext = (_ideas: BusinessIdea[]): string => {
  return `

EXECUTION MODE: SOLOPRENEUR BUSINESS ANALYSIS

Create a report focused on solopreneur viability (1-3 person teams using AI-assisted development).

SOLOPRENEUR-SPECIFIC ANALYSIS REQUIREMENTS:

### Technical Defensibility Assessment
- Identify the core technical challenges that create moats
- Specify the expertise required that competitors lack
- Explain why competitors can't easily replicate with more resources
- Estimate time/cost advantage from AI-assisted development (5-10x faster)

### Market Opportunity for Small Teams
- Validate TAM is truly $10M-$1B (not smaller, not requiring massive scale)
- Identify specific underserved segments perfect for focused solutions
- Explain why incumbents are vulnerable despite resources
- Show path to $50K-$500K MRR with minimal team growth

### Competitive Advantages at Small Scale
- Speed of iteration advantages over larger competitors
- Direct founder involvement as key differentiator
- Lower cost structure enabling competitive pricing
- Focus advantages from serving specific segment excellently
- Technical excellence over feature breadth

### Solo Team Feasibility
- Can this realistically be built by 1-3 people?
- What % can be built with AI coding tools?
- What are the maintenance requirements?
- Can support scale without hiring?

### Risk Assessment for Solopreneurs
- Platform dependency risks
- Technical debt accumulation
- Customer concentration risks
- Support burden growth
- Competition from funded startups

IMPORTANT: Focus on WHY these ideas work specifically for solopreneurs, not general startup analysis.
Emphasize technical sophistication as competitive advantage.
DO NOT include execution plans or implementation steps.`;
};