/**
 * Extract Utilities for App Specifications
 * =========================================
 * 
 * Supports both XML format (new) and Markdown format (legacy).
 * Also supports the two-stage spec generation with App Descriptions.
 */

export type ComplexityTier = 'simple' | 'standard' | 'production';
export type SpecFormat = 'xml' | 'markdown';

export interface ExtractedSpec {
  spec: string;
  format: SpecFormat;
  complexity?: ComplexityTier;
  targetFeatures?: number;
  name?: string;
}

export interface ExtractedDescription {
  description: string;
  name: string;
  complexity: ComplexityTier;
  targetFeatures: number;
  reasoning: string;
}

/**
 * Extract app specification from a message content.
 * Handles both XML and Markdown formats, complete and potentially truncated specs.
 */
export function extractAppSpec(content: string): string | null {
  const result = extractAppSpecWithMetadata(content);
  return result?.spec ?? null;
}

/**
 * Extract app specification with full metadata (format, complexity, etc.)
 */
export function extractAppSpecWithMetadata(content: string): ExtractedSpec | null {
  // Find the start of the app_spec block (handle variations like ```app_spec or ```app_spec\n)
  const patterns = ['```app_spec\n', '```app_spec\r\n', '```app_spec '];
  let startIndex = -1;
  let markerLength = 0;
  
  for (const pattern of patterns) {
    const idx = content.indexOf(pattern);
    if (idx !== -1) {
      startIndex = idx;
      markerLength = pattern.length;
      break;
    }
  }
  
  // Also try a regex to handle more variations
  if (startIndex === -1) {
    const match = content.match(/```app_spec\s*/);
    if (match && match.index !== undefined) {
      startIndex = match.index;
      markerLength = match[0].length;
    }
  }
  
  if (startIndex === -1) {
    return null;
  }
  
  // Get everything after the opening marker
  const afterStart = content.slice(startIndex + markerLength);
  
  // Find the closing backticks that mark the END of the app_spec block
  const lines = afterStart.split('\n');
  const specLines: string[] = [];
  let foundEnd = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if this line is JUST triple backticks (the closing marker)
    if (line.trim() === '```') {
      foundEnd = true;
      break;
    }
    specLines.push(line);
  }
  
  if (specLines.length === 0) {
    return null;
  }
  
  let spec = specLines.join('\n').trim();
  
  // If we didn't find a proper end, check for trailing incomplete backticks
  if (!foundEnd) {
    spec = spec.replace(/`{1,2}$/, '').trim();
  }
  
  // Only return if we have substantial content
  if (spec.length < 50) {
    return null;
  }
  
  // Determine format
  const isXml = spec.includes('<project_specification>') || spec.includes('<project_name>');
  const format: SpecFormat = isXml ? 'xml' : 'markdown';
  
  // Extract metadata
  const name = extractAppName(spec);
  const complexityInfo = extractComplexityFromSpec(spec);
  
  return {
    spec,
    format,
    name,
    complexity: complexityInfo?.tier,
    targetFeatures: complexityInfo?.targetFeatures,
  };
}

/**
 * Extract App Description from Stage 1 (Discovery) response.
 * Returns the description along with inferred complexity.
 */
export function extractAppDescription(content: string): ExtractedDescription | null {
  // Find the start of the app_description block (handle variations)
  const patterns = ['```app_description\n', '```app_description\r\n', '```app_description '];
  let startIndex = -1;
  let markerLength = 0;
  
  for (const pattern of patterns) {
    const idx = content.indexOf(pattern);
    if (idx !== -1) {
      startIndex = idx;
      markerLength = pattern.length;
      break;
    }
  }
  
  // Also try a regex to handle more variations
  if (startIndex === -1) {
    const match = content.match(/```app_description\s*/);
    if (match && match.index !== undefined) {
      startIndex = match.index;
      markerLength = match[0].length;
    }
  }
  
  if (startIndex === -1) {
    return null;
  }
  
  // Get everything after the opening marker
  const afterStart = content.slice(startIndex + markerLength);
  
  // Find the closing backticks
  const lines = afterStart.split('\n');
  const descLines: string[] = [];
  let foundEnd = false;
  
  for (const line of lines) {
    if (line.trim() === '```') {
      foundEnd = true;
      break;
    }
    descLines.push(line);
  }
  
  if (descLines.length === 0) {
    return null;
  }
  
  let description = descLines.join('\n').trim();
  
  // If we didn't find a proper end, check for trailing incomplete backticks
  if (!foundEnd) {
    description = description.replace(/`{1,2}$/, '').trim();
  }
  
  // Only return if we have substantial content
  if (description.length < 50) {
    return null;
  }
  
  // Extract name from markdown title
  const nameMatch = description.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : 'Untitled App';
  
  // Extract complexity info from "## Inferred Complexity" section
  const tierMatch = description.match(/Tier:\s*(simple|standard|production)/i);
  const featuresMatch = description.match(/Estimated Features:\s*(\d+)/i);
  const reasoningMatch = description.match(/Reasoning:\s*(.+?)(?=\n|$)/i);
  
  const tier = (tierMatch ? tierMatch[1].toLowerCase() : 'standard') as ComplexityTier;
  const targetFeatures = featuresMatch ? parseInt(featuresMatch[1], 10) : getDefaultFeaturesForTier(tier);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
  
  return {
    description,
    name,
    complexity: tier,
    targetFeatures,
    reasoning,
  };
}

/**
 * Check if content contains a complete app description.
 */
export function hasAppDescription(content: string): boolean {
  return content.includes('```app_description') && content.includes('## Inferred Complexity');
}

/**
 * Check if content contains a complete app spec.
 */
export function hasAppSpec(content: string): boolean {
  return content.includes('```app_spec');
}

/**
 * Extract app name from spec content.
 * Supports both XML (<project_name>) and Markdown (# Title) formats.
 */
export function extractAppName(content: string): string {
  // Try XML format first: <project_name>...</project_name>
  const xmlMatch = content.match(/<project_name>\s*([^<]+)\s*<\/project_name>/);
  if (xmlMatch) {
    return xmlMatch[1].trim();
  }
  
  // Fall back to markdown title: # App Name
  const mdMatch = content.match(/^#\s+(.+)$/m);
  if (mdMatch) {
    return mdMatch[1].trim();
  }
  
  return 'Untitled App';
}

/**
 * Extract complexity information from spec content.
 */
export function extractComplexityFromSpec(content: string): { 
  tier: ComplexityTier; 
  targetFeatures: number;
} | null {
  // Try XML format: <complexity_tier>...</complexity_tier>
  const tierMatch = content.match(/<complexity_tier>\s*(simple|standard|production)\s*<\/complexity_tier>/i);
  const featuresMatch = content.match(/<target_features>\s*(\d+)\s*<\/target_features>/);
  
  if (tierMatch) {
    const tier = tierMatch[1].toLowerCase() as ComplexityTier;
    const targetFeatures = featuresMatch ? parseInt(featuresMatch[1], 10) : getDefaultFeaturesForTier(tier);
    return { tier, targetFeatures };
  }
  
  return null;
}

/**
 * Get default feature count for a complexity tier.
 */
function getDefaultFeaturesForTier(tier: ComplexityTier): number {
  switch (tier) {
    case 'simple':
      return 30;
    case 'standard':
      return 80;
    case 'production':
      return 200;
    default:
      return 80;
  }
}
