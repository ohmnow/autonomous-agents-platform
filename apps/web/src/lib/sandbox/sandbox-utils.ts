/**
 * Sandbox Utilities
 * 
 * Shared utility functions for E2B sandbox management.
 */

import type { Sandbox } from '@repo/sandbox-providers';

// Target Node.js version for modern framework compatibility
const DEFAULT_NODE_VERSION = '22';

/**
 * Ensure the sandbox has a compatible Node.js version installed.
 * Uses 'n' package manager for simple upgrade.
 * 
 * This is needed because:
 * - E2B's 'base' template has Node.js 20.9.0
 * - Modern frameworks like Vite 6.x require Node.js 20.19+ or 22.12+
 * 
 * @param sandbox - The E2B sandbox instance
 * @param targetVersion - Target Node.js major version (default: '22')
 * @returns true if Node.js is at the target version, false if upgrade failed
 */
export async function ensureNodeVersion(
  sandbox: Sandbox,
  targetVersion: string = DEFAULT_NODE_VERSION
): Promise<boolean> {
  try {
    // Check current version
    const versionCheck = await sandbox.exec('node -v');
    const currentVersion = versionCheck.stdout.trim();
    console.log(`[sandbox-utils] Current Node.js version: ${currentVersion}`);
    
    // If already on target version, skip upgrade
    if (currentVersion.startsWith(`v${targetVersion}.`)) {
      console.log(`[sandbox-utils] Node.js ${currentVersion} meets requirements, no upgrade needed`);
      return true;
    }
    
    // Check if we have a recent enough 20.x version (20.19+)
    const versionMatch = currentVersion.match(/^v(\d+)\.(\d+)\./);
    if (versionMatch) {
      const major = parseInt(versionMatch[1], 10);
      const minor = parseInt(versionMatch[2], 10);
      
      // Node 20.19+ is acceptable for Vite 6.x
      if (major === 20 && minor >= 19) {
        console.log(`[sandbox-utils] Node.js ${currentVersion} meets minimum requirements`);
        return true;
      }
      // Node 22.12+ is also acceptable
      if (major === 22 && minor >= 12) {
        console.log(`[sandbox-utils] Node.js ${currentVersion} meets minimum requirements`);
        return true;
      }
    }
    
    // Upgrade using n package manager
    console.log(`[sandbox-utils] Upgrading Node.js from ${currentVersion} to v${targetVersion}...`);
    
    // Install n globally and use it to install target Node version
    const upgradeResult = await sandbox.exec(`
      npm install -g n --quiet 2>&1 &&
      n ${targetVersion} 2>&1 &&
      hash -r 2>/dev/null || true
    `);
    
    if (upgradeResult.exitCode !== 0) {
      console.warn(`[sandbox-utils] Node upgrade command had issues: ${upgradeResult.stderr}`);
      // Don't fail immediately - the upgrade might have worked anyway
    }
    
    // Verify upgrade succeeded
    const newVersionCheck = await sandbox.exec('node -v');
    const newVersion = newVersionCheck.stdout.trim();
    console.log(`[sandbox-utils] Node.js is now ${newVersion}`);
    
    // Check if we got a compatible version
    const newMatch = newVersion.match(/^v(\d+)\./);
    if (newMatch && parseInt(newMatch[1], 10) >= 22) {
      console.log(`[sandbox-utils] Node.js upgrade successful`);
      return true;
    }
    
    // Check for 20.19+ as fallback
    const newMinorMatch = newVersion.match(/^v20\.(\d+)\./);
    if (newMinorMatch && parseInt(newMinorMatch[1], 10) >= 19) {
      console.log(`[sandbox-utils] Node.js upgrade to ${newVersion} meets requirements`);
      return true;
    }
    
    console.warn(`[sandbox-utils] Node.js upgrade may not have succeeded: got ${newVersion}`);
    return false;
  } catch (error) {
    console.error(`[sandbox-utils] Error ensuring Node version: ${error}`);
    return false;
  }
}

/**
 * Get Node.js version information from the sandbox
 */
export async function getNodeVersion(sandbox: Sandbox): Promise<string> {
  try {
    const result = await sandbox.exec('node -v');
    return result.stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get npm version information from the sandbox
 */
export async function getNpmVersion(sandbox: Sandbox): Promise<string> {
  try {
    const result = await sandbox.exec('npm -v');
    return result.stdout.trim();
  } catch {
    return 'unknown';
  }
}

