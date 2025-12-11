/**
 * Coding Harness
 * ==============
 *
 * Pre-configured harness for autonomous coding tasks.
 * This harness is optimized for building web applications from an app_spec.txt.
 */

import type { AgentHarness, ProgressState, Sandbox, FeatureStatus } from '../types.js';
import { INITIALIZER_PROMPT, CODING_PROMPT } from '../prompts.js';

/**
 * Allowed bash commands for the coding harness.
 * Minimal set needed for development tasks.
 */
export const CODING_ALLOWED_COMMANDS = [
  // File inspection
  'ls',
  'cat',
  'head',
  'tail',
  'wc',
  'grep',
  // File operations
  'cp',
  'mkdir',
  'chmod',
  // Directory
  'pwd',
  // Node.js development
  'npm',
  'node',
  // Version control
  'git',
  // Process management
  'ps',
  'lsof',
  'sleep',
  'pkill',
  // Script execution
  'init.sh',
];

/**
 * Feature list item as stored in feature_list.json
 */
interface FeatureListItem {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
}

/**
 * Parse the feature_list.json content.
 */
function parseFeatureList(content: string): FeatureListItem[] {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      return [];
    }
    return data as FeatureListItem[];
  } catch {
    return [];
  }
}

/**
 * Check if all features are complete.
 */
async function checkCompletion(sandbox: Sandbox): Promise<boolean> {
  try {
    const content = await sandbox.readFile('feature_list.json');
    const features = parseFeatureList(content);

    if (features.length === 0) {
      return false;
    }

    return features.every((f) => f.passes === true);
  } catch {
    return false;
  }
}

/**
 * Track progress from the sandbox.
 */
async function trackProgress(sandbox: Sandbox): Promise<ProgressState> {
  try {
    const content = await sandbox.readFile('feature_list.json');
    const features = parseFeatureList(content);

    if (features.length === 0) {
      return {
        total: 0,
        completed: 0,
        features: [],
      };
    }

    const featureStatuses: FeatureStatus[] = features.map((f, index) => ({
      id: `feature-${index + 1}`,
      category: f.category,
      description: f.description,
      steps: f.steps,
      status: f.passes ? 'passed' : 'pending',
    }));

    return {
      total: features.length,
      completed: features.filter((f) => f.passes).length,
      features: featureStatuses,
    };
  } catch {
    return {
      total: 0,
      completed: 0,
      features: [],
    };
  }
}

/**
 * Coding harness for autonomous web application development.
 *
 * This harness is designed to:
 * - Build web applications from an app_spec.txt specification
 * - Generate and track 200+ feature tests
 * - Use browser automation for verification
 * - Maintain production-quality code
 */
export const codingHarness: AgentHarness = {
  id: 'coding',
  name: 'Autonomous Coding',
  description:
    'Build web applications from app_spec.txt with automated testing and verification',

  initializerPrompt: INITIALIZER_PROMPT,
  continuationPrompt: CODING_PROMPT,

  allowedCommands: CODING_ALLOWED_COMMANDS,

  mcpServers: [
    {
      name: 'puppeteer',
      command: 'npx',
      args: ['puppeteer-mcp-server', '--headless'],
    },
  ],

  completionCheck: checkCompletion,
  progressTracker: trackProgress,
};
