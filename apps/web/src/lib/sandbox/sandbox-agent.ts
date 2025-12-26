/**
 * Sandbox Agent
 * 
 * Runs the Claude Agent SDK on the server and redirects tool executions
 * to the E2B sandbox. This provides real-time progress streaming to the UI.
 * 
 * Architecture: Two-model approach for cost/quality optimization
 * - PLANNING MODEL (Sonnet 4.5): High-quality feature list + design planning
 * - BUILDING MODEL (Haiku 4.5): Fast, cheap implementation of individual features
 * 
 * Design System: For projects with UI components, the planning phase also
 * generates a DESIGN.md file with domain-appropriate design decisions.
 * 
 * Design Research: For UI projects, we search for reference designs from:
 * - Top sites in the domain/vertical
 * - Framer templates for modern design inspiration
 */

import Anthropic from '@anthropic-ai/sdk';

// Model configuration - separate models for planning vs building
const PLANNING_MODEL = 'claude-opus-4-5'; // Opus 4.5 for highest quality planning
const BUILDING_MODEL = 'claude-opus-4-5'; // Opus 4.5 for highest quality implementation

// =============================================================================
// AUTHENTICATION HELPER
// =============================================================================

/**
 * Create an Anthropic client with OAuth token support.
 * Supports both ANTHROPIC_AUTH_TOKEN and CLAUDE_CODE_OAUTH_TOKEN for flexibility.
 * OAuth token is preferred over API key when both are present.
 */
function createAnthropicClient(): Anthropic {
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.CLAUDE_CODE_OAUTH_TOKEN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!authToken && !apiKey) {
    throw new Error('Anthropic authentication not configured. Set ANTHROPIC_AUTH_TOKEN, CLAUDE_CODE_OAUTH_TOKEN, or ANTHROPIC_API_KEY.');
  }
  
  return new Anthropic({
    apiKey: apiKey || undefined,
    authToken: authToken || undefined,
  });
}

// =============================================================================
// DESIGN RESEARCH - Web search for reference designs
// =============================================================================

interface DesignReference {
  url: string;
  title: string;
  description: string;
  source: 'web' | 'framer';
}

interface DesignResearch {
  domain: string;
  references: DesignReference[];
  framerTemplates: DesignReference[];
  designInsights: string;
}

/**
 * Detect the domain/vertical from the app spec for design research.
 */
function detectDomain(appSpec: string): string {
  const specLower = appSpec.toLowerCase();
  
  // Check for specific domain indicators
  const domains: Array<{ keywords: RegExp[]; domain: string }> = [
    { keywords: [/fintech/i, /trading/i, /investment/i, /banking/i, /payment/i, /crypto/i], domain: 'FinTech' },
    { keywords: [/health/i, /medical/i, /patient/i, /wellness/i, /fitness/i, /telehealth/i], domain: 'Healthcare' },
    { keywords: [/e-?commerce/i, /shop/i, /store/i, /retail/i, /marketplace/i, /product catalog/i], domain: 'E-Commerce' },
    { keywords: [/saas/i, /dashboard/i, /admin/i, /crm/i, /erp/i, /analytics/i, /b2b/i], domain: 'SaaS' },
    { keywords: [/social/i, /community/i, /messaging/i, /chat/i, /forum/i, /network/i], domain: 'Social' },
    { keywords: [/education/i, /learning/i, /course/i, /student/i, /training/i, /lms/i], domain: 'EdTech' },
    { keywords: [/travel/i, /booking/i, /hotel/i, /flight/i, /vacation/i, /tourism/i], domain: 'Travel' },
    { keywords: [/food/i, /restaurant/i, /delivery/i, /recipe/i, /menu/i, /ordering/i], domain: 'Food & Restaurant' },
    { keywords: [/real estate/i, /property/i, /listing/i, /rental/i, /housing/i], domain: 'Real Estate' },
    { keywords: [/portfolio/i, /creative/i, /agency/i, /design studio/i, /freelancer/i], domain: 'Portfolio & Creative' },
    { keywords: [/blog/i, /news/i, /magazine/i, /content/i, /media/i, /publishing/i], domain: 'Media & Publishing' },
    { keywords: [/landing page/i, /startup/i, /product launch/i, /waitlist/i], domain: 'Startup Landing Page' },
  ];
  
  for (const { keywords, domain } of domains) {
    if (keywords.some(kw => kw.test(specLower))) {
      return domain;
    }
  }
  
  return 'Web Application';
}

/**
 * Run design research using web search to find reference designs.
 * Searches for top sites in the domain AND Framer templates.
 */
async function runDesignResearch(
  anthropic: Anthropic,
  appSpec: string,
  domain: string,
  onLog: (level: string, message: string) => void
): Promise<DesignResearch> {
  onLog('info', `🔍 Researching design references for ${domain}...`);
  
  try {
    // Search for both domain leaders and Framer templates
    // Note: Using 'any' cast because the SDK types may not include the web_search tool type
    const webSearchTool = {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,  // Limit searches per request
    };
    
    // Use streaming to avoid SDK timeout errors
    onLog('info', '🔍 Calling Anthropic API with web search...');
    const stream = anthropic.messages.stream({
      model: PLANNING_MODEL,
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [webSearchTool as any],
      messages: [{
        role: 'user',
        content: `You are a design researcher. Find design inspiration for a ${domain} application.

Search for:
1. "best ${domain.toLowerCase()} website design examples 2024" - Find 2-3 top sites known for excellent UI/UX
2. "framer template ${domain.toLowerCase()}" - Find 1-2 Framer templates in this domain

For each result, extract:
- URL
- Site/template name
- Brief description of what makes the design notable

Then provide a summary of key design patterns you observed:
- Common color schemes used
- Typography patterns
- Layout approaches
- Navigation styles
- Unique design elements

Format your response as:

## Top Reference Sites
1. [Name](URL) - Description
2. [Name](URL) - Description

## Framer Templates
1. [Name](URL) - Description

## Design Insights
- Color: ...
- Typography: ...
- Layout: ...
- Navigation: ...
- Unique elements: ...`
      }]
    });
    const response = await stream.finalMessage();
    onLog('info', '🔍 Received response from web search');

    // Parse the response
    let designInsights = '';
    const references: DesignReference[] = [];
    const framerTemplates: DesignReference[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        const text = block.text;
        designInsights = text;
        
        // Extract URLs from markdown links [Name](URL)
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        let isFramerSection = false;
        
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.includes('Framer Template')) {
            isFramerSection = true;
          } else if (line.includes('Design Insights') || line.includes('## ')) {
            if (!line.includes('Framer')) {
              isFramerSection = false;
            }
          }
          
          while ((match = linkPattern.exec(line)) !== null) {
            const ref: DesignReference = {
              title: match[1],
              url: match[2],
              description: line.replace(linkPattern, '').replace(/^[\d\.\-\*\s]+/, '').trim(),
              source: isFramerSection || match[2].includes('framer') ? 'framer' : 'web',
            };
            
            if (ref.source === 'framer') {
              framerTemplates.push(ref);
            } else {
              references.push(ref);
            }
          }
        }
      }
    }

    onLog('info', `✅ Found ${references.length} reference sites and ${framerTemplates.length} Framer templates`);
    
    return {
      domain,
      references,
      framerTemplates,
      designInsights,
    };
  } catch (error) {
    onLog('warn', `Design research failed: ${error instanceof Error ? error.message : String(error)}`);
    // Return empty research - design will proceed without references
    return {
      domain,
      references: [],
      framerTemplates: [],
      designInsights: '',
    };
  }
}

/**
 * Format design research into a prompt addition for the planning phase.
 */
function formatDesignResearchForPrompt(research: DesignResearch): string {
  if (!research.designInsights && research.references.length === 0) {
    return '';
  }

  let prompt = `

## Design Research Results

Domain: ${research.domain}
`;

  if (research.references.length > 0) {
    prompt += `
### Reference Sites (for inspiration, NOT copying):
${research.references.map(r => `- ${r.title}: ${r.url}`).join('\n')}
`;
  }

  if (research.framerTemplates.length > 0) {
    prompt += `
### Framer Templates (modern design patterns):
${research.framerTemplates.map(r => `- ${r.title}: ${r.url}`).join('\n')}
`;
  }

  if (research.designInsights) {
    // Extract just the Design Insights section
    const insightsMatch = research.designInsights.match(/## Design Insights[\s\S]*$/);
    if (insightsMatch) {
      prompt += `
${insightsMatch[0]}
`;
    }
  }

  prompt += `
Use these references as INSPIRATION for your design decisions in DESIGN.md.
Create something UNIQUE that draws from these patterns but has its own identity.
DO NOT copy designs - create an adjacent, distinctive design.
`;

  return prompt;
}

/**
 * Detect if the project has UI/frontend components that need design consideration.
 * Returns true for web apps, mobile apps, landing pages, dashboards, etc.
 */
function hasUIComponents(appSpec: string): boolean {
  const uiIndicators = [
    // Frameworks
    /\breact\b/i, /\bvue\b/i, /\bangular\b/i, /\bsvelte\b/i,
    /\bnext\.?js\b/i, /\bnuxt\b/i, /\bremix\b/i, /\bastro\b/i,
    /\bflutter\b/i, /\breact.native\b/i, /\bswift\s?ui\b/i,
    // UI terms
    /\bfrontend\b/i, /\bfront-end\b/i, /\bui\b/i, /\bux\b/i,
    /\bdashboard\b/i, /\bwebsite\b/i, /\bweb\s?app\b/i,
    /\blanding\s?page\b/i, /\binterface\b/i, /\bportal\b/i,
    /\bmobile\s?app\b/i, /\bios\s?app\b/i, /\bandroid\s?app\b/i,
    // Styling
    /\btailwind\b/i, /\bcss\b/i, /\bstyled/i, /\bsass\b/i, /\bscss\b/i,
    // Components
    /\bbutton\b/i, /\bform\b/i, /\bmodal\b/i, /\bnavigation\b/i,
    /\bsidebar\b/i, /\bheader\b/i, /\bfooter\b/i, /\bcard\b/i,
  ];
  
  // Count matches - if 3+ indicators, it's likely a UI project
  const matchCount = uiIndicators.filter(pattern => pattern.test(appSpec)).length;
  return matchCount >= 2;
}

/**
 * Domain-Adaptive Design Skill
 * Embedded directly to avoid file system access in serverless environments.
 */
const DESIGN_SKILL = `
## Domain-Adaptive Design Guidelines

Analyze the app_spec to understand the project's domain and create appropriate design decisions.

### Step 1: Detect Domain
Identify the industry vertical:
- FinTech/Finance: Trading, banking, payments → Trust colors (blues, greens), data visualization
- Healthcare: Patient portals, wellness → Calming blues/greens, high readability, accessibility
- E-Commerce: Storefronts, marketplaces → Brand-driven, high-contrast CTAs, product focus
- SaaS/B2B: Dashboards, admin tools → Neutral base, accent colors for status, clean layouts
- Social/Community: Social networks, messaging → Vibrant colors, modern typography
- Education: Learning platforms → Friendly, clear hierarchy, progress indicators
- Creative/Portfolio: Design tools, portfolios → Bold typography, visual-forward

### Step 2: Define Design System
Create a DESIGN.md file with:

1. **Detected Domain**: The identified industry vertical
2. **Target Users**: Demographics and technical sophistication
3. **Color Palette** (as CSS variables):
   - --color-primary: Main brand color
   - --color-secondary: Supporting color
   - --color-accent: Call-to-action color
   - --color-background: Page background
   - --color-surface: Card/component background
   - --color-text: Primary text
   - --color-text-muted: Secondary text

4. **Typography**:
   - Display font: For headings (choose something distinctive, NOT Inter/Roboto)
   - Body font: For content (readable, professional)
   - Monospace: For code/data (if applicable)

5. **Signature Element**: ONE unique design choice that makes this memorable:
   - Unique motion/animation style
   - Distinctive typography treatment
   - Creative color application
   - Spatial/layout innovation
   - Interactive micro-delight

### Step 3: Apply Consistently
When implementing features, always reference DESIGN.md for:
- Color usage
- Typography choices
- Component styling patterns
- Motion/animation approach

### What to AVOID
- Generic "AI slop" aesthetics (purple gradients on white, Inter font everywhere)
- Inconsistent styling between components
- Over-animation that hurts performance
- Ignoring accessibility (contrast, focus states)
`;

/**
 * Generate the design planning prompt addition for UI projects.
 * Includes instructions for:
 * 1. Creating DESIGN.md upfront
 * 2. Adding a "Design Polish" feature near the end of the feature list
 */
function getDesignPlanningAddition(): string {
  return `

## Design System Creation (Two-Pass Approach)

Since this project has UI components, implement a TWO-PASS design approach:

### Pass 1: Design Foundation (Before feature_list.json)
Create a DESIGN.md file with:
${DESIGN_SKILL}

The DESIGN.md should be created BEFORE feature_list.json so design decisions inform feature implementation.
Format the DESIGN.md as a markdown file with clear sections for each design decision.

### Pass 2: Design Polish Feature (In feature_list.json)
IMPORTANT: Include a "Design polish and consistency review" feature near the END of the feature list (around 90-95% through).

This feature should be structured like:
{
  "category": "style",
  "description": "Design polish and consistency review",
  "steps": [
    "Review all UI components for design consistency",
    "Ensure color palette from DESIGN.md is applied uniformly",
    "Verify typography hierarchy across all pages",
    "Implement or refine the signature design element",
    "Add micro-interactions for key user actions",
    "Check responsive behavior on mobile viewports",
    "Verify accessibility (contrast ratios, focus states, semantic HTML)"
  ],
  "passes": false
}

This ensures the design is tight and polished after all features are built.
`;
}

/**
 * Generate the design reference for the building phase.
 */
function getDesignBuildingAddition(): string {
  return `

## Design Guidelines

This project has a DESIGN.md file with design decisions. When implementing UI features:
1. Read DESIGN.md first to understand the design system
2. Use the defined color variables and typography
3. Apply the signature element where appropriate
4. Maintain consistency across all components
5. Ensure accessibility (contrast, focus states, semantic HTML)
`;
}
import type { Sandbox } from '@repo/sandbox-providers';
import { updateBuild } from '@repo/database';
import type { BuildStatus } from '@prisma/client';
import type { 
  AgentEvent, 
  ToolStartEvent, 
  ToolEndEvent, 
  FileEvent, 
  CommandEvent, 
  ThinkingEvent, 
  ErrorEvent, 
  ActivityEvent,
  PhaseEvent,
  ProgressEvent,
  FeatureListEvent,
  EventFeatureListItem,
} from '@repo/agent-core';
import { generateEventId, inferLanguage, parseFeatureList } from '@repo/agent-core';

// Types for Claude messages
interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlock;

interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// Tool definitions for the agent
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'bash',
    description: 'Execute a bash command in the sandbox. Use this for running shell commands, installing packages, running scripts, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the sandbox. Creates the file if it does not exist, overwrites if it does.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path to write to',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the sandbox.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read',
        },
      },
      required: ['path'],
    },
  },
];

interface AgentLogCallback {
  (level: string, message: string, metadata?: Record<string, unknown>): void;
}

interface AgentProgressCallback {
  (completed: number, total: number, currentFeature?: string): void;
}

// Use a looser type for the event callback to allow all event variants
type PartialAgentEvent = {
  id: string;
  type: string;
  timestamp: string;
  [key: string]: unknown;
};

interface AgentEventCallback {
  (event: PartialAgentEvent): void;
}

/** Callback for review gate checkpoints */
export type ReviewGateCallback = (gate: 'design' | 'features') => Promise<void>;

export interface SandboxAgentConfig {
  buildId: string;
  sandbox: Sandbox;
  appSpec: string;
  targetFeatureCount?: number;  // Dynamic feature count based on complexity tier
  onLog: AgentLogCallback;
  onProgress: AgentProgressCallback;
  onEvent?: AgentEventCallback;
  /** Optional cancellation check; if true the agent should stop as soon as safe */
  shouldStop?: () => boolean;
  /** Resume context when continuing from a checkpoint */
  resumeContext?: {
    startingFeatureIndex: number;
    completedFeatures: string[];
  };
  /** Enable review gates for DESIGN.md and feature_list.json */
  reviewGatesEnabled?: boolean;
  /** Callback to pause for review gate - should update build status and throw to stop */
  onReviewGate?: ReviewGateCallback;
}

/**
 * Execute a tool in the sandbox and return the result.
 * Emits structured events for tool execution and file operations.
 */
async function executeToolInSandbox(
  sandbox: Sandbox,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolUseId: string,
  onLog: AgentLogCallback,
  onEvent?: AgentEventCallback
): Promise<{ output: string; isError: boolean }> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Emit tool start event
  onEvent?.({
    id: generateEventId(),
    type: 'tool_start',
    timestamp,
    toolName: toolName as 'bash' | 'write_file' | 'read_file' | 'str_replace_editor',
    toolUseId,
    input: toolInput,
    displayInput: JSON.stringify(toolInput).slice(0, 200),
  } as Omit<ToolStartEvent, 'buildId'>);

  const failTool = (errorMsg: string) => {
    const durationMs = Date.now() - startTime;

    // Emit error event
    onEvent?.({
      id: generateEventId(),
      type: 'error',
      timestamp: new Date().toISOString(),
      severity: 'error',
      message: `Tool error: ${errorMsg}`,
      details: `Tool: ${toolName}`,
      recoverable: true,
    } as Omit<ErrorEvent, 'buildId'>);

    // Emit tool end event
    onEvent?.({
      id: generateEventId(),
      type: 'tool_end',
      timestamp: new Date().toISOString(),
      toolUseId,
      success: false,
      error: errorMsg,
      durationMs,
    } as Omit<ToolEndEvent, 'buildId'>);

    onLog('error', `Tool error: ${errorMsg}`);
    return { output: errorMsg, isError: true };
  };

  try {
    switch (toolName) {
      case 'bash': {
        const command = typeof toolInput.command === 'string' ? toolInput.command : '';
        if (!command) {
          return failTool('Invalid tool input: bash requires { command: string }');
        }
        onLog('tool', `bash: ${command.slice(0, 200)}${command.length > 200 ? '...' : ''}`);
        
        const result = await sandbox.exec(command);
        const output = result.stdout + (result.stderr ? `\nSTDERR: ${result.stderr}` : '');
        const durationMs = Date.now() - startTime;
        const isError = result.exitCode !== 0;
        
        // Emit command event with details
        onEvent?.({
          id: generateEventId(),
          type: 'command',
          timestamp: new Date().toISOString(),
          command,
          exitCode: result.exitCode,
          stdout: result.stdout?.slice(0, 500),
          stderr: result.stderr?.slice(0, 500),
          durationMs,
        } as Omit<CommandEvent, 'buildId'>);
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: !isError,
          output: output.slice(0, 500),
          displayOutput: output.length > 500 ? output.slice(0, 500) + '...' : output,
          durationMs,
          error: isError ? `Exit code: ${result.exitCode}` : undefined,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        if (isError) {
          onLog('error', `Command exited with code ${result.exitCode}`);
          return { output: output || `Exit code: ${result.exitCode}`, isError: true };
        }
        
        onLog('info', `[Done] ${output.slice(0, 100)}${output.length > 100 ? '...' : ''}`);
        return { output, isError: false };
      }

      case 'write_file': {
        const path = typeof toolInput.path === 'string' ? toolInput.path : '';
        const content = typeof toolInput.content === 'string' ? toolInput.content : undefined;
        if (!path || content === undefined) {
          return failTool('Invalid tool input: write_file requires { path: string, content: string }');
        }
        onLog('tool', `write_file: ${path} (${content.length} bytes)`);
        
        // Check if file exists first to determine if created or modified
        let isNewFile = true;
        try {
          await sandbox.readFile(path);
          isNewFile = false;
        } catch {
          isNewFile = true;
        }
        
        await sandbox.writeFile(path, content);
        const durationMs = Date.now() - startTime;
        
        // Emit file event
        onEvent?.({
          id: generateEventId(),
          type: isNewFile ? 'file_created' : 'file_modified',
          timestamp: new Date().toISOString(),
          path,
          size: content.length,
          language: inferLanguage(path),
          linesAdded: content.split('\n').length,
        } as Omit<FileEvent, 'buildId'>);
        
        // If this is feature_list.json, emit a feature_list event with parsed content
        if (path.endsWith('feature_list.json')) {
          try {
            const features = parseFeatureList(content);
            // Ensure features is a valid array before proceeding
            if (Array.isArray(features) && features.length > 0) {
              const completed = features.filter(f => f && f.passes).length;
              onEvent?.({
                id: generateEventId(),
                type: 'feature_list',
                timestamp: new Date().toISOString(),
                features: features as EventFeatureListItem[],
                total: features.length,
                completed,
              } as Omit<FeatureListEvent, 'buildId'>);
              onLog('info', `Feature list created: ${features.length} features (${completed} passing)`);
            }
          } catch (parseError) {
            // Silently ignore parse errors - the file might be partial
            console.error('Failed to parse feature_list.json:', parseError);
          }
        }
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: true,
          output: `Successfully wrote to ${path}`,
          displayOutput: `Wrote ${path} (${content.length} bytes, ${content.split('\n').length} lines)`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        onLog('info', `[Done] Wrote ${path}`);
        return { output: `Successfully wrote to ${path}`, isError: false };
      }

      case 'read_file': {
        const path = typeof toolInput.path === 'string' ? toolInput.path : '';
        if (!path) {
          return failTool('Invalid tool input: read_file requires { path: string }');
        }
        const durationMs = Date.now() - startTime;
        onLog('tool', `read_file: ${path}`);
        
        const content = await sandbox.readFile(path);
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: true,
          output: content.slice(0, 500),
          displayOutput: `Read ${path} (${content.length} bytes)`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        onLog('info', `[Done] Read ${path} (${content.length} bytes)`);
        return { output: content, isError: false };
      }

      default: {
        const durationMs = Date.now() - startTime;
        
        // Emit tool end event for unknown tool
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: false,
          error: `Unknown tool: ${toolName}`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        return { output: `Unknown tool: ${toolName}`, isError: true };
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startTime;
    
    // Emit error event
    onEvent?.({
      id: generateEventId(),
      type: 'error',
      timestamp: new Date().toISOString(),
      severity: 'error',
      message: `Tool error: ${errorMsg}`,
      details: `Tool: ${toolName}`,
      recoverable: true,
    } as Omit<ErrorEvent, 'buildId'>);
    
    // Emit tool end event
    onEvent?.({
      id: generateEventId(),
      type: 'tool_end',
      timestamp: new Date().toISOString(),
      toolUseId,
      success: false,
      error: errorMsg,
      durationMs,
    } as Omit<ToolEndEvent, 'buildId'>);
    
    onLog('error', `Tool error: ${errorMsg}`);
    return { output: errorMsg, isError: true };
  }
}

/**
 * Estimate the appropriate feature count based on spec complexity.
 * This provides a suggested range that the planning model can adjust.
 */
function estimateComplexity(appSpec: string): {
  tier: 'simple' | 'standard' | 'production';
  suggestedFeatures: number;
  reasoning: string;
} {
  const specLength = appSpec.length;
  const specLower = appSpec.toLowerCase();
  
  // Count complexity indicators
  const featureMatches = appSpec.match(/feature|functionality|implement|create|build|add|include/gi) || [];
  const pageMatches = appSpec.match(/page|screen|view|route|endpoint/gi) || [];
  const integrationMatches = appSpec.match(/api|database|auth|payment|stripe|supabase|firebase/gi) || [];
  const componentMatches = appSpec.match(/component|widget|modal|form|table|chart/gi) || [];
  
  const featureCount = featureMatches.length;
  const pageCount = pageMatches.length;
  const integrationCount = integrationMatches.length;
  const componentCount = componentMatches.length;
  
  // Simple indicators
  const isHelloWorld = specLower.includes('hello world') || specLower.includes('helloworld');
  const isLandingPage = specLower.includes('landing page') && !specLower.includes('dashboard');
  const isSinglePage = specLower.includes('single page') || specLower.includes('one page');
  const isPrototype = specLower.includes('prototype') || specLower.includes('demo') || specLower.includes('poc');
  
  // Production indicators  
  const isFullStack = specLower.includes('full stack') || specLower.includes('fullstack');
  const hasManyFeatures = featureCount > 20;
  const hasManyPages = pageCount > 10;
  const hasManyIntegrations = integrationCount > 5;
  
  // Determine tier
  if (isHelloWorld || (specLength < 500 && featureCount < 3)) {
    return {
      tier: 'simple',
      suggestedFeatures: 10,
      reasoning: 'Very simple project (hello world or minimal spec)',
    };
  }
  
  if (isLandingPage || isSinglePage || isPrototype) {
    return {
      tier: 'simple',
      suggestedFeatures: 20,
      reasoning: 'Simple project (landing page, single page, or prototype)',
    };
  }
  
  if (specLength < 1000 && featureCount < 5 && pageCount < 3) {
    return {
      tier: 'simple',
      suggestedFeatures: 25,
      reasoning: 'Small project with limited scope',
    };
  }
  
  if (isFullStack || hasManyFeatures || hasManyPages || hasManyIntegrations) {
    // CAP at 80 features max - larger numbers cause write_file issues
    return {
      tier: 'production',
      suggestedFeatures: Math.min(80, 40 + featureCount * 2 + pageCount * 3),
      reasoning: 'Complex full-stack application (capped at 80 features for reliability)',
    };
  }
  
  // Standard tier - calculate based on indicators
  const baseFeatures = 30;
  const calculated = baseFeatures + (featureCount * 2) + (pageCount * 3) + (integrationCount * 5) + (componentCount * 2);
  const suggestedFeatures = Math.max(40, Math.min(120, calculated));
  
  return {
    tier: 'standard',
    suggestedFeatures,
    reasoning: `Standard complexity (${featureCount} features mentioned, ${pageCount} pages, ${integrationCount} integrations)`,
  };
}

/**
 * PLANNING PHASE: Use Sonnet 4.5 to generate a high-quality feature list from the app spec.
 * This runs only once at the start to create feature_list.json.
 * For UI projects, also creates DESIGN.md with domain-appropriate design decisions.
 * 
 * The planning model will determine the appropriate number of features based on the spec complexity.
 */
async function runPlanningPhase(
  anthropic: Anthropic,
  sandbox: Sandbox,
  appSpec: string,
  targetFeatureCount: number,
  onLog: AgentLogCallback,
  onEvent?: AgentEventCallback,
  shouldStop?: () => boolean,
  reviewGatesEnabled?: boolean,
  onReviewGate?: ReviewGateCallback
): Promise<boolean> {
  // Estimate complexity to provide guidance to the planning model
  const complexity = estimateComplexity(appSpec);
  onLog('info', `📊 Estimated complexity: ${complexity.tier} (~${complexity.suggestedFeatures} features) - ${complexity.reasoning}`);
  
  // Use the estimated feature count, but allow the model to adjust
  const suggestedFeatures = complexity.suggestedFeatures;
  const minComplexTests = Math.floor(suggestedFeatures * 0.15);
  
  // Detect if project has UI components
  const isUIProject = hasUIComponents(appSpec);
  if (isUIProject) {
    onLog('info', '🎨 UI project detected - will create DESIGN.md with design system');
  }
  
  // Run design research for UI projects (can be disabled via env var for debugging)
  let designResearch: DesignResearch | null = null;
  const enableDesignResearch = process.env.DISABLE_DESIGN_RESEARCH !== 'true';
  
  if (isUIProject && enableDesignResearch) {
    const domain = detectDomain(appSpec);
    onLog('info', `🔍 Detected domain: ${domain}`);
    
    onEvent?.({
      id: generateEventId(),
      type: 'phase',
      timestamp: new Date().toISOString(),
      phase: 'research',
      message: `Researching ${domain} design patterns and references`,
    });
    
    try {
      designResearch = await runDesignResearch(anthropic, appSpec, domain, onLog);
    } catch (error) {
      onLog('warn', `Design research failed (continuing without): ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue without design research - it's not critical
    }
  } else if (isUIProject && !enableDesignResearch) {
    onLog('info', '🔍 Design research disabled via environment variable');
  }
  
  // Build the planning system prompt
  let planningSystemPrompt = `You are an expert software architect and technical planner.

Your task is to analyze an application specification and create a comprehensive feature list that will guide implementation.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files  
- read_file: Read file contents

## Your Task:
1. Read app_spec.txt to understand the application requirements`;

  // Add design task for UI projects
  if (isUIProject) {
    planningSystemPrompt += `
2. Create DESIGN.md with domain-appropriate design decisions
3. Create feature_list.json with an APPROPRIATE number of features for the project complexity`;
  } else {
    planningSystemPrompt += `
2. Create feature_list.json with an APPROPRIATE number of features for the project complexity`;
  }

  planningSystemPrompt += `

## Feature List Requirements - IMPORTANT: Match Features to Complexity

Based on the app specification, determine the appropriate number of features:
- **Very Simple** (hello world, single HTML page): 5-15 features
- **Simple** (landing pages, prototypes, demos): 15-30 features  
- **Standard** (dashboards, small SaaS, CRUD apps): 40-80 features
- **Complex** (full SaaS, multi-feature apps): 80-150 features
- **Production** (enterprise apps, extensive features): 150-250 features

My analysis suggests this is a "${complexity.tier}" project with approximately ${suggestedFeatures} features.
Adjust this based on your understanding of the spec - use FEWER features for simple projects!
- Both "functional" and "style" categories
- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)
- At least ${minComplexTests} tests MUST have 10+ steps each
- Order features by priority: fundamental features first (project setup, core structure, then features)
- Each feature should be independently testable
- Features should build on each other logically

## Blocking vs Non-Blocking Features - IMPORTANT for Parallelization

Categorize each feature as blocking or non-blocking to enable parallel execution:

- **blocking: true** - Foundation features that MUST complete before others can start:
  - Project initialization and setup
  - Core file structure and configuration
  - Shared utilities, types, or base classes
  - Database schema or data models
  - Authentication/authorization foundation
  - Any feature that creates files/APIs other features depend on

- **blocking: false** - Independent features that CAN be built in parallel:
  - Individual pages or views (after routing is set up)
  - Isolated UI components
  - Independent API endpoints
  - Self-contained features with no shared dependencies
  - Styling and polish tasks

Use **dependsOn** to specify explicit dependencies between features. Reference feature descriptions.

GUIDELINES:
- First 10-20% of features should typically be blocking (foundation)
- Remaining 80-90% can often be non-blocking (parallel-ready)
- When in doubt, mark as blocking - it's safer
- Group related non-blocking features that share no file conflicts

## The feature_list.json format:
[
  { "category": "functional", "description": "Project setup and initialization", "steps": ["Step 1", "Step 2"], "passes": false, "blocking": true, "dependsOn": [] },
  { "category": "functional", "description": "User profile page", "steps": ["Step 1", "Step 2"], "passes": false, "blocking": false, "dependsOn": ["Project setup and initialization", "Core routing structure"] },
  ...
]`;

  // Add design skill for UI projects
  if (isUIProject) {
    planningSystemPrompt += getDesignPlanningAddition();
    
    // Add design research results if available
    if (designResearch) {
      planningSystemPrompt += formatDesignResearchForPrompt(designResearch);
    }
  }

  planningSystemPrompt += `

IMPORTANT: Only create the planning files. Do NOT start implementing features.`;

  // Build the planning prompt
  let planningPrompt = `Read app_spec.txt and `;
  if (isUIProject) {
    if (designResearch && (designResearch.references.length > 0 || designResearch.framerTemplates.length > 0)) {
      planningPrompt += `use the design research I've provided (reference sites and Framer templates) to inform your DESIGN.md, then `;
    } else {
      planningPrompt += `first create DESIGN.md with design decisions for this project's domain, then `;
    }
  }
  planningPrompt += `create a feature_list.json with an APPROPRIATE number of features.

IMPORTANT: Match the number of features to the project complexity:
- For a simple "Hello World" or basic HTML page: 5-15 features
- For a landing page or prototype: 15-30 features
- For a standard web app: 40-80 features
- For a complex application: 80-150+ features

My estimate: ~${suggestedFeatures} features (${complexity.tier} project), but adjust based on actual spec complexity.

Analyze the specification carefully and break it down into testable features. Order them from most fundamental (project setup, dependencies) to most specific (advanced features, polish).`;

  // Add note about design research
  if (isUIProject && designResearch && (designResearch.references.length > 0 || designResearch.framerTemplates.length > 0)) {
    planningPrompt += `

For DESIGN.md, I've researched the ${designResearch.domain} space and found reference designs for inspiration.
Use these as a starting point but create something UNIQUE - draw from the patterns but add your own distinctive flair.
The design should feel like it belongs in the ${designResearch.domain} space but have its own identity.`;
  }

  planningPrompt += `

After creating the feature list, output "PLANNING_COMPLETE" to signal you're done.`;

  onLog('info', `🧠 Starting planning phase with ${PLANNING_MODEL}...`);
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'planning',
    message: `Using ${PLANNING_MODEL} to generate feature list`,
  });

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: planningPrompt },
  ];

  // Planning loop - should complete in 1-3 iterations
  let iteration = 0;
  const maxPlanningIterations = 10;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (iteration < maxPlanningIterations) {
    if (shouldStop?.()) {
      onLog('info', 'Planning stopped by user');
      return false;
    }
    iteration++;
    onLog('info', `Planning iteration ${iteration}...`);
    
    // Emit thinking event for UI feedback
    onEvent?.({
      id: generateEventId(),
      type: 'thinking',
      timestamp: new Date().toISOString(),
      message: iteration === 1 
        ? 'Analyzing app specification and creating feature list...' 
        : 'Continuing feature list generation...',
    });

    try {
      // Use streaming to avoid SDK timeout errors with large max_tokens
      const stream = anthropic.messages.stream({
        model: PLANNING_MODEL,
        max_tokens: 32768, // Larger for comprehensive planning with Opus 4.5
        system: planningSystemPrompt,
        tools: TOOLS,
        messages,
      });
      const response = await stream.finalMessage();

      // Handle all response content - including web search blocks
      // We need to pass through server_tool_use and web_search_tool_result as-is
      const toolResults: ToolResultBlock[] = [];
      let planningComplete = false;
      let hasToolErrors = false;

      for (const block of response.content) {
        if (block.type === 'text') {
          onLog('info', `[Planner] ${block.text.slice(0, 300)}...`);
          
          if (block.text.includes('PLANNING_COMPLETE')) {
            planningComplete = true;
          }
        } else if (block.type === 'tool_use') {
          // Only execute our sandbox tools, not server tools like web_search
          const result = await executeToolInSandbox(
            sandbox,
            block.name,
            block.input as Record<string, unknown>,
            block.id,
            onLog,
            onEvent
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.output.slice(0, 10000),
            is_error: result.isError,
          });
          
          if (result.isError) {
            hasToolErrors = true;
            onLog('warn', `Tool error occurred, model will retry: ${result.output.slice(0, 200)}`);
          }

          // Check for pause/stop after each tool in planning phase
          if (shouldStop?.()) {
            onLog('info', 'Planning paused - detected after tool execution');
            return false;
          }
        }
        // server_tool_use and web_search_tool_result are handled automatically by the API
        // We don't need to do anything with them - just pass the full response through
      }

      // Pass the FULL response content through to maintain web search context
      messages.push({ role: 'assistant', content: response.content as Anthropic.ContentBlock[] });
      
      if (toolResults.length > 0) {
        // Track consecutive errors and provide recovery guidance
        if (hasToolErrors) {
          consecutiveErrors++;
          onLog('warn', `Consecutive tool errors: ${consecutiveErrors}/${maxConsecutiveErrors}`);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            onLog('error', 'Too many consecutive tool errors - providing explicit guidance');
            // Add explicit guidance to help the model recover
            const errorRecovery: ToolResultBlock = {
              type: 'tool_result',
              tool_use_id: toolResults[toolResults.length - 1].tool_use_id,
              content: `IMPORTANT: You've had ${consecutiveErrors} failed tool calls. To use write_file correctly:
1. The tool requires EXACTLY this format: write_file with { "path": "/home/user/filename.json", "content": "file contents here" }
2. Both 'path' and 'content' must be strings
3. For JSON files, the content should be a valid JSON string, not a JavaScript object
4. Keep feature_list.json under 50 features for reliability

Example:
write_file({ "path": "/home/user/feature_list.json", "content": "[{\\"category\\": \\"functional\\", \\"description\\": \\"Example feature\\", \\"steps\\": [\\"Step 1\\"], \\"passes\\": false}]" })

Please try again with the correct format.`,
              is_error: false,
            };
            toolResults.push(errorRecovery);
            consecutiveErrors = 0; // Reset after providing guidance
          }
        } else {
          consecutiveErrors = 0; // Reset on success
        }
        
        messages.push({ role: 'user', content: toolResults });
      }

      // Check if DESIGN.md was created (for UI projects with review gates)
      if (reviewGatesEnabled && isUIProject && onReviewGate) {
        try {
          await sandbox.readFile('/home/user/DESIGN.md');
          // Check if we haven't already triggered design review
          // We use a simple flag via trying to read feature_list.json - if design exists but features don't, trigger review
          try {
            await sandbox.readFile('/home/user/feature_list.json');
            // Both exist, so we've passed the design gate already
          } catch {
            // DESIGN.md exists but feature_list.json doesn't - trigger design review gate
            onLog('info', '⏸️ DESIGN.md created - pausing for design review');
            onEvent?.({
              id: generateEventId(),
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'design_review',
              message: 'Waiting for design review approval',
            });
            await onReviewGate('design');
            // If we get here, the gate threw an exception to pause the build
          }
        } catch {
          // DESIGN.md not created yet
        }
      }

      // Check if feature_list.json was created
      try {
        const featureListContent = await sandbox.readFile('/home/user/feature_list.json');
        const features = JSON.parse(featureListContent);
        if (Array.isArray(features) && features.length > 0) {
          onLog('info', `✅ Planning complete! Created ${features.length} features.`);
          onEvent?.({
            id: generateEventId(),
            type: 'phase',
            timestamp: new Date().toISOString(),
            phase: 'planning',
            message: `Feature list created: ${features.length} features`,
          });
          
          // Trigger feature review gate if enabled
          if (reviewGatesEnabled && onReviewGate) {
            onLog('info', '⏸️ Feature list created - pausing for feature review');
            onEvent?.({
              id: generateEventId(),
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'feature_review',
              message: 'Waiting for feature list review approval',
            });
            await onReviewGate('features');
            // If we get here, the gate threw an exception to pause the build
          }
          
          return true;
        }
      } catch {
        // Feature list not ready yet
      }

      if (planningComplete || response.stop_reason === 'end_turn') {
        // Verify feature list exists
        try {
          const content = await sandbox.readFile('/home/user/feature_list.json');
          const features = JSON.parse(content);
          if (Array.isArray(features) && features.length > 0) {
            return true;
          }
        } catch {
          // Continue if feature list not ready
        }
      }

      if (toolResults.length === 0) {
        onLog('warn', 'Planning phase completed without creating feature list');
        return false;
      }
    } catch (error) {
      onLog('error', `Planning error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  onLog('warn', 'Planning phase exceeded max iterations');
  return false;
}

interface FeatureData {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
  /** If true, must complete before non-blocking features can run in parallel */
  blocking?: boolean;
  /** Feature descriptions this feature depends on (for dependency ordering) */
  dependsOn?: string[];
}

/**
 * Parse feature_list.json and return progress with full feature data.
 */
async function getProgress(sandbox: Sandbox): Promise<{ completed: number; total: number; features: FeatureData[] }> {
  try {
    const content = await sandbox.readFile('/home/user/feature_list.json');
    const rawFeatures = JSON.parse(content);
    // Ensure features is a valid array
    if (!Array.isArray(rawFeatures)) {
      return { completed: 0, total: 0, features: [] };
    }
    // Normalize feature data
    const features: FeatureData[] = rawFeatures.map((f: Record<string, unknown>) => ({
      category: (f.category as 'functional' | 'style') || 'functional',
      description: (f.description as string) || '',
      steps: Array.isArray(f.steps) ? (f.steps as string[]) : [],
      passes: Boolean(f.passes),
      blocking: f.blocking !== undefined ? Boolean(f.blocking) : undefined,
      dependsOn: Array.isArray(f.dependsOn) ? (f.dependsOn as string[]) : undefined,
    }));
    const completed = features.filter(f => f.passes).length;
    return { completed, total: features.length, features };
  } catch {
    return { completed: 0, total: 0, features: [] };
  }
}

// =============================================================================
// PARALLEL FEATURE EXECUTION
// =============================================================================

/** Configuration for parallel feature execution */
const MAX_PARALLEL_AGENTS = 3; // Number of concurrent subagents
const SUBAGENT_MAX_ITERATIONS = 20; // Max iterations per feature subagent

/**
 * Simple mutex for coordinating feature_list.json updates.
 * Prevents race conditions when multiple subagents complete simultaneously.
 */
class FeatureListMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.locked = false;
    }
  }
}

/**
 * Run a single feature as a subagent with isolated conversation context.
 * Returns true if the feature was successfully implemented.
 */
async function runSubagentForFeature(
  anthropic: Anthropic,
  sandbox: Sandbox,
  feature: FeatureData,
  featureIndex: number,
  mutex: FeatureListMutex,
  isUIProject: boolean,
  onLog: AgentLogCallback,
  onEvent?: AgentEventCallback,
  shouldStop?: () => boolean
): Promise<{ success: boolean; featureIndex: number; description: string }> {
  const featureId = `subagent-${featureIndex}`;
  
  onLog('info', `🔀 [${featureId}] Starting: ${feature.description}`);
  
  // Emit feature start event
  onEvent?.({
    id: generateEventId(),
    type: 'feature_start',
    timestamp: new Date().toISOString(),
    featureId,
    featureName: feature.description,
    featureIndex,
  });

  // Build subagent system prompt - focused on implementing just this one feature
  let subagentSystemPrompt = `You are an expert developer implementing a SINGLE feature for an application.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files
- read_file: Read file contents

## Your Task
Implement this specific feature:
**${feature.description}**

Steps to verify:
${feature.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Guidelines
- Focus ONLY on this feature - do not modify unrelated code
- Read existing files before modifying to avoid conflicts
- Keep changes minimal and targeted
- Verify the feature works before finishing
- When done, output "FEATURE_COMPLETE" to signal success

## Important
- Other features are being implemented in parallel - be careful with shared files
- If you need to modify a shared file, read it first to get the latest version
- Do NOT update feature_list.json - that's handled automatically`;

  // Add design guidelines for UI projects
  if (isUIProject) {
    subagentSystemPrompt += `

## Design Guidelines
Reference DESIGN.md for styling decisions. Maintain visual consistency with other components.`;
  }

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Implement this feature: ${feature.description}\n\nVerification steps:\n${feature.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nStart by reading any relevant existing files, then implement the feature.` },
  ];

  let iteration = 0;
  let featureComplete = false;

  while (iteration < SUBAGENT_MAX_ITERATIONS && !featureComplete) {
    if (shouldStop?.()) {
      onLog('info', `🔀 [${featureId}] Stopped by user`);
      return { success: false, featureIndex, description: feature.description };
    }

    iteration++;

    try {
      // Use streaming to avoid SDK timeout errors
      const stream = anthropic.messages.stream({
        model: BUILDING_MODEL,
        max_tokens: 8192,
        system: subagentSystemPrompt,
        tools: TOOLS,
        messages,
      });
      const response = await stream.finalMessage();

      // Process response
      const assistantContent: ContentBlock[] = [];
      const toolResults: ToolResultBlock[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantContent.push(block as TextBlock);
          if (block.text.includes('FEATURE_COMPLETE')) {
            featureComplete = true;
          }
        } else if (block.type === 'tool_use') {
          assistantContent.push(block as ToolUseBlock);
          
          // Execute tool
          const result = await executeToolInSandbox(
            sandbox,
            block.name,
            block.input as Record<string, unknown>,
            block.id,
            (level, msg) => onLog(level, `[${featureId}] ${msg}`),
            onEvent
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.output,
            is_error: result.isError,
          });

          // Check for pause/stop after each tool in subagent
          if (shouldStop?.()) {
            onLog('info', `🔀 [${featureId}] Paused - detected after tool execution`);
            return { success: false, featureIndex, description: feature.description };
          }
        }
      }

      // Add assistant message to conversation
      messages.push({ role: 'assistant', content: assistantContent });

      // Add tool results if any
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      // Check for end_turn or completion
      if (featureComplete || response.stop_reason === 'end_turn') {
        featureComplete = true;
      }

      if (toolResults.length === 0 && response.stop_reason === 'end_turn') {
        // No more work to do
        break;
      }
    } catch (error) {
      onLog('error', `🔀 [${featureId}] Error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, featureIndex, description: feature.description };
    }
  }

  if (featureComplete) {
    onLog('info', `✅ [${featureId}] Completed: ${feature.description}`);
    
    // Update feature_list.json atomically using mutex
    await mutex.acquire();
    try {
      const content = await sandbox.readFile('/home/user/feature_list.json');
      const features = JSON.parse(content);
      if (Array.isArray(features) && features[featureIndex]) {
        features[featureIndex].passes = true;
        await sandbox.writeFile('/home/user/feature_list.json', JSON.stringify(features, null, 2));
      }
    } catch (error) {
      onLog('error', `[${featureId}] Failed to update feature_list.json: ${error}`);
    } finally {
      mutex.release();
    }

    // Emit feature end event
    onEvent?.({
      id: generateEventId(),
      type: 'feature_end',
      timestamp: new Date().toISOString(),
      featureId,
      success: true,
    });

    return { success: true, featureIndex, description: feature.description };
  } else {
    onLog('warn', `⚠️ [${featureId}] Did not complete within max iterations`);
    return { success: false, featureIndex, description: feature.description };
  }
}

/**
 * Chunk array into batches of specified size.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Check if all dependencies for a feature are satisfied (completed).
 */
function areDependenciesSatisfied(feature: FeatureData, completedDescriptions: Set<string>): boolean {
  if (!feature.dependsOn || feature.dependsOn.length === 0) {
    return true;
  }
  return feature.dependsOn.every(dep => completedDescriptions.has(dep));
}

/**
 * Run multiple non-blocking features in parallel using subagents.
 * Features are grouped by dependency satisfaction and executed in batches.
 */
async function runParallelFeatures(
  anthropic: Anthropic,
  sandbox: Sandbox,
  features: Array<{ feature: FeatureData; originalIndex: number }>,
  isUIProject: boolean,
  onLog: AgentLogCallback,
  onProgress: AgentProgressCallback,
  onEvent?: AgentEventCallback,
  shouldStop?: () => boolean
): Promise<{ completedCount: number; failedFeatures: Array<{ feature: FeatureData; originalIndex: number }> }> {
  
  const mutex = new FeatureListMutex();
  const completedDescriptions = new Set<string>();
  const failedFeatures: Array<{ feature: FeatureData; originalIndex: number }> = [];
  let completedCount = 0;
  
  // Get total for progress calculation
  const progress = await getProgress(sandbox);
  const totalFeatures = progress.total;
  const alreadyCompleted = progress.completed;

  onLog('info', `🚀 Starting parallel execution of ${features.length} non-blocking features (max ${MAX_PARALLEL_AGENTS} concurrent)`);
  
  // Emit phase event
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'implementing',
    message: `Parallel execution: ${features.length} features with ${MAX_PARALLEL_AGENTS} concurrent agents`,
  });

  // Process features in waves - each wave contains features whose dependencies are satisfied
  let remainingFeatures = [...features];
  let waveNumber = 0;
  const maxWaves = 50; // Safety limit

  while (remainingFeatures.length > 0 && waveNumber < maxWaves) {
    if (shouldStop?.()) {
      onLog('info', 'Parallel execution stopped by user');
      break;
    }

    waveNumber++;
    
    // Find features ready to execute (dependencies satisfied)
    const readyFeatures = remainingFeatures.filter(f => 
      areDependenciesSatisfied(f.feature, completedDescriptions)
    );
    
    if (readyFeatures.length === 0) {
      // No features ready - there might be a dependency cycle or all remaining have unsatisfied deps
      onLog('warn', `Wave ${waveNumber}: No features ready - possible dependency issue. Forcing remaining ${remainingFeatures.length} features.`);
      // Force all remaining features to be ready
      readyFeatures.push(...remainingFeatures);
    }

    // Remove ready features from remaining
    const readySet = new Set(readyFeatures.map(f => f.originalIndex));
    remainingFeatures = remainingFeatures.filter(f => !readySet.has(f.originalIndex));

    onLog('info', `📦 Wave ${waveNumber}: Executing ${readyFeatures.length} features in parallel`);

    // Chunk into batches of MAX_PARALLEL_AGENTS
    const batches = chunkArray(readyFeatures, MAX_PARALLEL_AGENTS);

    for (const batch of batches) {
      if (shouldStop?.()) break;

      onLog('info', `  Batch: ${batch.map(f => f.feature.description.slice(0, 30) + '...').join(', ')}`);

      // Run batch in parallel
      const results = await Promise.all(
        batch.map(({ feature, originalIndex }) =>
          runSubagentForFeature(
            anthropic,
            sandbox,
            feature,
            originalIndex,
            mutex,
            isUIProject,
            onLog,
            onEvent,
            shouldStop
          )
        )
      );

      // Process results
      for (const result of results) {
        if (result.success) {
          completedCount++;
          completedDescriptions.add(result.description);
          onProgress(alreadyCompleted + completedCount, totalFeatures);
        } else {
          const failedItem = batch.find(f => f.originalIndex === result.featureIndex);
          if (failedItem) {
            failedFeatures.push(failedItem);
          }
        }
      }

      // Emit updated feature list event
      const updatedProgress = await getProgress(sandbox);
      onEvent?.({
        id: generateEventId(),
        type: 'feature_list',
        timestamp: new Date().toISOString(),
        features: updatedProgress.features as EventFeatureListItem[],
        total: updatedProgress.total,
        completed: updatedProgress.completed,
      } as Omit<FeatureListEvent, 'buildId'>);
    }
  }

  onLog('info', `✅ Parallel execution complete: ${completedCount} succeeded, ${failedFeatures.length} failed`);

  return { completedCount, failedFeatures };
}

// =============================================================================
// MAIN AGENT ENTRY POINT
// =============================================================================

/**
 * Run the autonomous agent with sandbox tool execution.
 * This is the main entry point for real builds.
 * 
 * Two-model architecture:
 * - Planning Phase: Uses PLANNING_MODEL (Opus 4.5) for high-quality feature list generation
 * - Building Phase: Uses BUILDING_MODEL (Haiku 4.5) for fast, cheap feature implementation
 * 
 * Three-phase build:
 * 1. Planning: Generate feature_list.json with blocking/non-blocking categorization
 * 2. Sequential: Execute blocking features one-by-one
 * 3. Parallel: Execute non-blocking features with concurrent subagents
 */
export async function runSandboxAgent(config: SandboxAgentConfig): Promise<void> {
  const {
    buildId,
    sandbox,
    appSpec,
    targetFeatureCount = 80,
    onLog,
    onProgress,
    onEvent,
    shouldStop,
  } = config;

  // Emit phase event - initializing
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'initializing',
    message: 'Setting up sandbox environment',
  });

  const anthropic = createAnthropicClient();

  // Write app_spec.txt to sandbox
  onLog('info', 'Writing app specification to sandbox...');
  await sandbox.writeFile('/home/user/app_spec.txt', appSpec);
  onLog('tool', 'write_file: /home/user/app_spec.txt');

  // Check if feature_list.json already exists (continuation/resume)
  let hasFeatureList = false;
  try {
    await sandbox.readFile('/home/user/feature_list.json');
    hasFeatureList = true;
    onLog('info', 'Found existing feature_list.json - skipping planning phase');
    
    const progress = await getProgress(sandbox);
    onProgress(progress.completed, progress.total);
  } catch {
    onLog('info', 'No feature_list.json found - starting planning phase');
  }

  // PHASE 1: PLANNING (Opus 4.5) - only if no feature list exists
  // Detect if project has UI components (used for design skill)
  const isUIProject = hasUIComponents(appSpec);

  // Extract review gates config from the config object
  const { reviewGatesEnabled, onReviewGate } = config;

  if (!hasFeatureList) {
    onLog('info', `🧠 PLANNING PHASE: Using ${PLANNING_MODEL} for feature list generation`);
    const planningSuccess = await runPlanningPhase(
      anthropic,
      sandbox,
      appSpec,
      targetFeatureCount,
      onLog,
      onEvent,
      shouldStop,
      reviewGatesEnabled,
      onReviewGate
    );

    if (!planningSuccess) {
      onLog('error', 'Planning phase failed - cannot proceed with build');
      onEvent?.({
        id: generateEventId(),
        type: 'phase',
        timestamp: new Date().toISOString(),
        phase: 'failed',
        message: 'Planning phase failed to generate feature list',
      });
      return;
    }

    // Get initial progress after planning
    const progress = await getProgress(sandbox);
    onProgress(progress.completed, progress.total);
  }

  // ==========================================================================
  // PHASE 2: BUILDING - Sequential blocking features, then parallel non-blocking
  // ==========================================================================
  
  onLog('info', `🔨 BUILDING PHASE: Using ${BUILDING_MODEL} for feature implementation`);
  if (isUIProject) {
    onLog('info', '🎨 UI project - will reference DESIGN.md for styling decisions');
  }
  
  // Get features and separate blocking from non-blocking
  const initialProgress = await getProgress(sandbox);
  const allFeatures = initialProgress.features;
  
  // Separate features into blocking (sequential) and non-blocking (parallel)
  const blockingFeatures: Array<{ feature: FeatureData; originalIndex: number }> = [];
  const nonBlockingFeatures: Array<{ feature: FeatureData; originalIndex: number }> = [];
  
  allFeatures.forEach((feature, index) => {
    if (feature.passes) {
      // Already complete, skip
      return;
    }
    // Default to blocking if not specified (safer)
    if (feature.blocking === undefined || feature.blocking === true) {
      blockingFeatures.push({ feature, originalIndex: index });
    } else {
      nonBlockingFeatures.push({ feature, originalIndex: index });
    }
  });
  
  onLog('info', `📋 Feature breakdown: ${blockingFeatures.length} blocking (sequential), ${nonBlockingFeatures.length} non-blocking (parallel-ready)`);
  
  // ==========================================================================
  // PHASE 2A: SEQUENTIAL BLOCKING FEATURES
  // ==========================================================================
  
  if (blockingFeatures.length > 0) {
    onLog('info', `🔒 Starting SEQUENTIAL phase: ${blockingFeatures.length} blocking features`);
    
    // Emit phase event
    onEvent?.({
      id: generateEventId(),
      type: 'phase',
      timestamp: new Date().toISOString(),
      phase: 'implementing',
      message: `Sequential phase: ${blockingFeatures.length} blocking features`,
    });
  
    // System prompt for building phase - focused on blocking features
    let buildingSystemPrompt = `You are an expert full-stack developer implementing BLOCKING features for an application.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files
- read_file: Read file contents

The feature_list.json file already exists with all features defined. Your job is to:
1. Check feature_list.json for the next BLOCKING feature with "passes": false
2. Implement that feature
3. Verify it works (check files exist, validate content, run tests if applicable)
4. Update feature_list.json to mark "passes": true
5. Move to the next blocking feature

## IMPORTANT: Blocking Features Only
You are implementing BLOCKING features that must complete before parallel features can start.
Focus on: project setup, core structure, shared utilities, and foundation code.

## Implementation Guidelines:
- Work through features in order (they're prioritized from fundamental to advanced)
- Each feature should be fully working before moving on
- Keep verification simple and direct
- For static HTML/CSS/JS: Verify files exist and have correct content
- For Node.js apps: Use npm scripts to verify
- Avoid background processes (&) - they don't work reliably

When all BLOCKING features (blocking: true) have "passes": true, output "BLOCKING_COMPLETE" to signal you're done.`;

    // Add design guidelines for UI projects
    if (isUIProject) {
      buildingSystemPrompt += getDesignBuildingAddition();
    }

    let buildingPrompt = `Check feature_list.json and implement the next BLOCKING feature (blocking: true) that has "passes": false.`;
    if (isUIProject) {
      buildingPrompt += ` For UI features, reference DESIGN.md for styling decisions.`;
    }
    buildingPrompt += ` Work through each blocking feature methodically. Output "BLOCKING_COMPLETE" when all blocking features are done.`;

  // Conversation history for building phase
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: buildingPrompt },
  ];

  // Emit phase event - implementing
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'implementing',
    message: `Building with ${BUILDING_MODEL}`,
  });

  // Context management settings
  // Anthropic's context limit is 200K tokens - we reset at 180K to have headroom
  const MAX_MESSAGES_BEFORE_TRIM = 100; // Trim if conversation exceeds this many messages
  const MESSAGES_TO_KEEP_AFTER_TRIM = 10; // Keep the most recent N messages after trim
  let contextResetCount = 0;
  const MAX_CONTEXT_RESETS = 10; // Prevent infinite reset loops

  /**
   * Reset the conversation context while preserving recent work.
   * This handles the "prompt is too long" error gracefully.
   */
  async function resetContextWithSummary(): Promise<void> {
    contextResetCount++;
    onLog('info', `🔄 Context reset #${contextResetCount} - conversation too long, resuming with fresh context`);
    
    // Get current progress for context
    const progress = await getProgress(sandbox);
    const completedCount = progress.completed;
    const totalCount = progress.total;
    const remainingFeatures = progress.features
      .filter(f => !f.passes)
      .map(f => f.description)
      .slice(0, 10); // Show first 10 remaining

    // Create a summary message that captures current state
    const contextSummary = `CONTEXT RESET - Previous conversation exceeded token limit.

Current progress: ${completedCount}/${totalCount} features complete.

Remaining features to implement (next ${Math.min(10, remainingFeatures.length)}):
${remainingFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Continue implementing features. Check feature_list.json for the full list and mark each as "passes": true when complete.`;

    // Reset messages with just the summary
    messages.length = 0;
    messages.push({
      role: 'user',
      content: contextSummary,
    });

    onEvent?.({
      id: generateEventId(),
      type: 'activity',
      timestamp: new Date().toISOString(),
      activity: 'planning',
      description: `Context reset (${contextResetCount}/${MAX_CONTEXT_RESETS})`,
    } as Omit<ActivityEvent, 'buildId'>);
  }

  /**
   * Trim older messages if conversation is getting too long.
   * Keeps the first message (initial prompt) and most recent messages.
   */
  function trimMessagesIfNeeded(): boolean {
    if (messages.length > MAX_MESSAGES_BEFORE_TRIM) {
      const initialMessage = messages[0];
      const recentMessages = messages.slice(-MESSAGES_TO_KEEP_AFTER_TRIM);
      
      // Create a trim notice
      const trimNotice = {
        role: 'user' as const,
        content: `[Context trimmed - removed ${messages.length - MESSAGES_TO_KEEP_AFTER_TRIM - 1} older messages to stay within limits. Continue from where you left off.]`,
      };

      messages.length = 0;
      messages.push(initialMessage, trimNotice, ...recentMessages);
      
      onLog('info', `📝 Trimmed conversation from ${messages.length + messages.length - MESSAGES_TO_KEEP_AFTER_TRIM - 2} to ${messages.length} messages`);
      return true;
    }
    return false;
  }

  // Main agent loop - runs until all features complete or agent signals done
  // No artificial iteration limit - the agent works autonomously until the task is finished
  // See: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
  let iteration = 0;
  
  while (true) {
    if (shouldStop?.()) {
      onLog('info', 'Build stopped by user');
      // Emit phase event - cancelled (stored as generic phase for UI)
      onEvent?.({
        id: generateEventId(),
        type: 'phase',
        timestamp: new Date().toISOString(),
        phase: 'failed',
        message: 'Build stopped by user',
      });
      break;
    }

    // Proactively trim messages to prevent hitting the limit
    trimMessagesIfNeeded();

    iteration++;
    onLog('info', `--- Building Iteration ${iteration} ---`);
    
    // Emit activity event
    onEvent?.({
      id: generateEventId(),
      type: 'activity',
      timestamp: new Date().toISOString(),
      activity: 'implementing',
      description: `Building iteration ${iteration}`,
    } as Omit<ActivityEvent, 'buildId'>);

    try {
      // Call Claude with BUILDING_MODEL using streaming to avoid SDK timeout errors
      const stream = anthropic.messages.stream({
        model: BUILDING_MODEL,
        max_tokens: 8192,
        system: buildingSystemPrompt,
        tools: TOOLS,
        messages,
      });
      const response = await stream.finalMessage();

      // Process the response
      const assistantContent: ContentBlock[] = [];
      const toolResults: ToolResultBlock[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          onLog('info', block.text.slice(0, 500) + (block.text.length > 500 ? '...' : ''));
          assistantContent.push({ type: 'text', text: block.text });
          
          // Emit thinking event for agent's text output
          onEvent?.({
            id: generateEventId(),
            type: 'thinking',
            timestamp: new Date().toISOString(),
            content: block.text.slice(0, 1000),
            phase: 'planning',
          } as Omit<ThinkingEvent, 'buildId'>);
        } else if (block.type === 'tool_use') {
          assistantContent.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });

          // Execute the tool with event emission
          const result = await executeToolInSandbox(
            sandbox,
            block.name,
            block.input as Record<string, unknown>,
            block.id,
            onLog,
            onEvent
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.output.slice(0, 10000), // Limit output size
            is_error: result.isError,
          });

          // Check for pause/stop request after each tool execution
          if (shouldStop?.()) {
            onLog('info', 'Build paused/stopped - detected after tool execution');
            break;
          }
        }
      }

      // If stopped mid-iteration, save what we have and exit
      if (shouldStop?.()) {
        // Add assistant message with partial work
        if (assistantContent.length > 0) {
          messages.push({
            role: 'assistant',
            content: assistantContent as Anthropic.ContentBlockParam[],
          });
        }
        onLog('info', 'Build stopped by user (mid-iteration)');
        onEvent?.({
          id: generateEventId(),
          type: 'phase',
          timestamp: new Date().toISOString(),
          phase: 'paused',
          message: 'Build paused by user',
        });
        break;
      }

      // Add assistant message to history
      messages.push({
        role: 'assistant',
        content: assistantContent as Anthropic.ContentBlockParam[],
      });

      // If there were tool uses, add results and continue
      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          content: toolResults as Anthropic.ToolResultBlockParam[],
        });

        // Check progress after tool execution
        const progress = await getProgress(sandbox);
        onProgress(progress.completed, progress.total);
        
        // Emit progress event
        onEvent?.({
          id: generateEventId(),
          type: 'progress',
          timestamp: new Date().toISOString(),
          completed: progress.completed,
          total: progress.total,
          percentComplete: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0,
        });

        // Also emit feature_list event with updated pass statuses for UI checkboxes
        if (progress.features.length > 0) {
          onEvent?.({
            id: generateEventId(),
            type: 'feature_list',
            timestamp: new Date().toISOString(),
            features: progress.features as EventFeatureListItem[],
            total: progress.total,
            completed: progress.completed,
          } as Omit<FeatureListEvent, 'buildId'>);
        }

        // Update database
        try {
          await updateBuild(buildId, {
            progress: {
              completed: progress.completed,
              total: progress.total,
            },
          });
        } catch (e) {
          console.error('Failed to update build progress:', e);
        }

        // Check if all BLOCKING features are done (for sequential phase)
        const blockingDone = progress.features.every((f, idx) => {
          // If it's a blocking feature (or default blocking), check if it passes
          const isBlocking = f.blocking === undefined || f.blocking === true;
          return !isBlocking || f.passes;
        });
        
        if (blockingDone) {
          onLog('info', '🔒 All blocking features complete! Moving to parallel phase...');
          break; // Exit to parallel phase
        }
        
        // Check if ALL features are done (no parallel phase needed)
        if (progress.total > 0 && progress.completed === progress.total) {
          onLog('info', '🎉 All features complete!');
          
          // Emit completion phase event
          onEvent?.({
            id: generateEventId(),
            type: 'phase',
            timestamp: new Date().toISOString(),
            phase: 'completed',
            message: 'All features implemented successfully',
          });
          break;
        }
      }

      // Check stop reason
      if (response.stop_reason === 'end_turn' && toolResults.length === 0) {
        onLog('info', 'Agent finished turn without tool use');
        
        // Prompt to continue with blocking features
        messages.push({
          role: 'user',
          content: 'Continue implementing the remaining BLOCKING features (blocking: true). Check feature_list.json for what needs to be done.',
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is a context length error
      if (errorMessage.includes('prompt is too long') || errorMessage.includes('tokens >')) {
        onLog('warn', `Context limit reached: ${errorMessage}`);
        
        // Check if we've exceeded max resets (prevent infinite loops)
        if (contextResetCount >= MAX_CONTEXT_RESETS) {
          onLog('error', `Exceeded maximum context resets (${MAX_CONTEXT_RESETS}). Stopping build.`);
          onEvent?.({
            id: generateEventId(),
            type: 'phase',
            timestamp: new Date().toISOString(),
            phase: 'failed',
            message: 'Build stopped: exceeded maximum context resets',
          });
          break;
        }

        // Reset context and continue
        await resetContextWithSummary();
        continue; // Retry the iteration with fresh context
      }

      // Check for rate limit errors
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        onLog('warn', `Rate limited, waiting 60 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue; // Retry the iteration
      }

      // For other errors, log and rethrow
      onLog('error', `Agent error: ${errorMessage}`);
      throw error;
    }
  }
  
  } // End of blocking features section
  
  // ==========================================================================
  // PHASE 2B: PARALLEL NON-BLOCKING FEATURES
  // ==========================================================================
  
  // Re-check which non-blocking features still need to be done
  const progressAfterBlocking = await getProgress(sandbox);
  const remainingNonBlocking = progressAfterBlocking.features
    .map((f, idx) => ({ feature: f, originalIndex: idx }))
    .filter(({ feature }) => !feature.passes && feature.blocking === false);
  
  if (remainingNonBlocking.length > 0 && !shouldStop?.()) {
    onLog('info', `🚀 Starting PARALLEL phase: ${remainingNonBlocking.length} non-blocking features`);
    
    const { completedCount, failedFeatures } = await runParallelFeatures(
      anthropic,
      sandbox,
      remainingNonBlocking,
      isUIProject,
      onLog,
      onProgress,
      onEvent,
      shouldStop
    );
    
    // Handle failed features - retry them sequentially
    if (failedFeatures.length > 0) {
      onLog('warn', `⚠️ ${failedFeatures.length} features failed in parallel execution, retrying sequentially...`);
      
      for (const { feature, originalIndex } of failedFeatures) {
        if (shouldStop?.()) break;
        
        onLog('info', `🔄 Retrying: ${feature.description}`);
        const mutex = new FeatureListMutex();
        const result = await runSubagentForFeature(
          anthropic,
          sandbox,
          feature,
          originalIndex,
          mutex,
          isUIProject,
          onLog,
          onEvent,
          shouldStop
        );
        
        if (result.success) {
          const progress = await getProgress(sandbox);
          onProgress(progress.completed, progress.total);
        }
      }
    }
  } else if (remainingNonBlocking.length === 0) {
    onLog('info', '✅ No non-blocking features to process in parallel phase');
  }

  // Final progress check
  const finalProgress = await getProgress(sandbox);
  onProgress(finalProgress.completed, finalProgress.total);
  
  // Emit final completion event if all features are done
  if (finalProgress.completed === finalProgress.total) {
    onEvent?.({
      id: generateEventId(),
      type: 'phase',
      timestamp: new Date().toISOString(),
      phase: 'completed',
      message: 'All features implemented successfully',
    });
  }
  
  onLog('info', `Build complete: ${finalProgress.completed}/${finalProgress.total} features passing`);
}
