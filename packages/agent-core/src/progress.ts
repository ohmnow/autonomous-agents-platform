/**
 * Progress Tracking Utilities
 * ===========================
 *
 * Functions for tracking and displaying progress of the autonomous coding agent.
 * Ported from Python implementation.
 */

import type { FeatureStatus, ProgressState, Sandbox } from './types.js';

// ============================================================================
// Feature List Types (JSON format)
// ============================================================================

export interface FeatureListItem {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
}

// ============================================================================
// Progress Tracking Functions
// ============================================================================

/**
 * Parse the feature_list.json content into FeatureListItem array.
 */
export function parseFeatureList(content: string): FeatureListItem[] {
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
 * Count passing and total tests from feature list content.
 */
export function countPassingTests(featureListContent: string): { passing: number; total: number } {
  const features = parseFeatureList(featureListContent);

  if (features.length === 0) {
    return { passing: 0, total: 0 };
  }

  const total = features.length;
  const passing = features.filter((f) => f.passes === true).length;

  return { passing, total };
}

/**
 * Count passing tests from a sandbox by reading feature_list.json.
 */
export async function countPassingTestsFromSandbox(
  sandbox: Sandbox
): Promise<{ passing: number; total: number }> {
  try {
    const content = await sandbox.readFile('feature_list.json');
    return countPassingTests(content);
  } catch {
    return { passing: 0, total: 0 };
  }
}

/**
 * Convert feature list to ProgressState format.
 */
export function featureListToProgressState(features: FeatureListItem[]): ProgressState {
  const total = features.length;
  const completed = features.filter((f) => f.passes).length;

  const featureStatuses: FeatureStatus[] = features.map((f, index) => ({
    id: `feature-${index + 1}`,
    category: f.category,
    description: f.description,
    steps: f.steps,
    status: f.passes ? 'passed' : 'pending',
  }));

  return {
    total,
    completed,
    features: featureStatuses,
  };
}

/**
 * Get progress state from feature_list.json content.
 */
export function getProgressFromFeatureList(content: string): ProgressState {
  const features = parseFeatureList(content);
  return featureListToProgressState(features);
}

/**
 * Get progress state from a sandbox.
 */
export async function getProgressFromSandbox(sandbox: Sandbox): Promise<ProgressState> {
  try {
    const content = await sandbox.readFile('feature_list.json');
    return getProgressFromFeatureList(content);
  } catch {
    return {
      total: 0,
      completed: 0,
      features: [],
    };
  }
}

// ============================================================================
// Display Utilities (for CLI/logging)
// ============================================================================

/**
 * Format a session header string.
 */
export function formatSessionHeader(sessionNum: number, isInitializer: boolean): string {
  const sessionType = isInitializer ? 'INITIALIZER' : 'CODING AGENT';
  const divider = '='.repeat(70);

  return `
${divider}
  SESSION ${sessionNum}: ${sessionType}
${divider}
`;
}

/**
 * Format a progress summary string.
 */
export function formatProgressSummary(passing: number, total: number): string {
  if (total === 0) {
    return '\nProgress: feature_list.json not yet created';
  }

  const percentage = ((passing / total) * 100).toFixed(1);
  return `\nProgress: ${passing}/${total} tests passing (${percentage}%)`;
}

/**
 * Format progress summary from ProgressState.
 */
export function formatProgressSummaryFromState(state: ProgressState): string {
  return formatProgressSummary(state.completed, state.total);
}

// ============================================================================
// Completion Check
// ============================================================================

/**
 * Check if all features are passing.
 */
export function isComplete(features: FeatureListItem[]): boolean {
  if (features.length === 0) {
    return false;
  }
  return features.every((f) => f.passes === true);
}

/**
 * Check if the project is complete by reading feature_list.json from sandbox.
 */
export async function isCompleteFromSandbox(sandbox: Sandbox): Promise<boolean> {
  try {
    const content = await sandbox.readFile('feature_list.json');
    const features = parseFeatureList(content);
    return isComplete(features);
  } catch {
    return false;
  }
}
