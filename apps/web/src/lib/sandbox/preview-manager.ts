/**
 * Preview Manager
 * 
 * Handles starting, stopping, and managing live previews of built applications.
 * Detects framework type and runs appropriate dev/start commands.
 */

import type { Sandbox } from '@repo/sandbox-providers';
import { updateBuild, getBuildById } from '@repo/database';

// Default preview configuration
const DEFAULT_PREVIEW_PORT = 3000;
const DEFAULT_PREVIEW_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_PREVIEW_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (E2B Pro limit)

// Common subdirectories created by scaffolding tools (e.g., npm create vite@latest portfolio)
const COMMON_PROJECT_DIRS = ['portfolio', 'app', 'project', 'frontend', 'client', 'web', 'site'];

// Framework detection result
export interface DetectedFramework {
  name: string;
  startCommand: string;
  port: number;
  buildCommand?: string;
  installCommand?: string;
}

// Preview session info
export interface PreviewSession {
  buildId: string;
  sandboxId: string;
  outputUrl: string;
  port: number;
  framework: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'expired';
  expiresAt: Date;
  startedAt: Date;
}

/**
 * Find the actual project directory within the workspace.
 * Scaffolding tools often create subdirectories (e.g., npm create vite@latest portfolio).
 * This function searches for where package.json or other project files actually live.
 */
export async function findProjectDirectory(
  sandbox: Sandbox,
  basePath: string = '/home/user'
): Promise<string> {
  // First, check if package.json exists at the base path
  try {
    await sandbox.readFile(`${basePath}/package.json`);
    console.log(`[preview-manager] Found package.json at ${basePath}`);
    return basePath;
  } catch {
    // No package.json at base path, continue searching
  }

  // Check common subdirectories created by scaffolding tools
  for (const dir of COMMON_PROJECT_DIRS) {
    try {
      await sandbox.readFile(`${basePath}/${dir}/package.json`);
      console.log(`[preview-manager] Found package.json at ${basePath}/${dir}`);
      return `${basePath}/${dir}`;
    } catch {
      // Not in this directory
    }
  }

  // List directory and find first folder with package.json
  try {
    const result = await sandbox.exec(`ls -d ${basePath}/*/ 2>/dev/null | head -10`);
    const dirs = result.stdout.trim().split('\n').filter(Boolean);
    
    for (const dir of dirs) {
      const cleanDir = dir.replace(/\/$/, '');
      try {
        await sandbox.readFile(`${cleanDir}/package.json`);
        console.log(`[preview-manager] Found package.json at ${cleanDir}`);
        return cleanDir;
      } catch {
        // Not in this directory
      }
    }
  } catch {
    // ls failed, continue with fallbacks
  }

  // Check for Python projects (requirements.txt, app.py, main.py)
  for (const dir of COMMON_PROJECT_DIRS) {
    try {
      const reqExists = await sandbox.exec(`test -f ${basePath}/${dir}/requirements.txt && echo "yes"`);
      if (reqExists.stdout.trim() === 'yes') {
        console.log(`[preview-manager] Found Python project at ${basePath}/${dir}`);
        return `${basePath}/${dir}`;
      }
    } catch {
      // Not a Python project in this directory
    }
  }

  // Check for index.html (static site) in subdirectories
  for (const dir of COMMON_PROJECT_DIRS) {
    try {
      await sandbox.readFile(`${basePath}/${dir}/index.html`);
      console.log(`[preview-manager] Found static site at ${basePath}/${dir}`);
      return `${basePath}/${dir}`;
    } catch {
      // Not in this directory
    }
  }

  // Fallback to base path
  console.log(`[preview-manager] No project found in subdirectories, using ${basePath}`);
  return basePath;
}

/**
 * Detect the framework/project type from files in the sandbox.
 * Returns the appropriate start command and port.
 */
export async function detectFramework(
  sandbox: Sandbox,
  workspacePath: string = '/home/user'
): Promise<DetectedFramework> {
  // Try to read package.json first
  let packageJson: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null = null;
  
  try {
    const packageJsonContent = await sandbox.readFile(`${workspacePath}/package.json`);
    packageJson = JSON.parse(packageJsonContent);
  } catch {
    // No package.json, might be a static site
  }

  // Check for common frameworks based on dependencies
  const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
  const scripts = packageJson?.scripts || {};

  // Next.js
  if (deps?.next) {
    // Prefer production build if available
    if (scripts.start && scripts.build) {
      return {
        name: 'nextjs',
        buildCommand: 'npm run build',
        startCommand: 'npm run start -- -p 3000',
        port: 3000,
        installCommand: 'npm install',
      };
    }
    return {
      name: 'nextjs',
      startCommand: 'npm run dev -- -p 3000',
      port: 3000,
      installCommand: 'npm install',
    };
  }

  // Vite (React, Vue, Svelte, etc.)
  if (deps?.vite) {
    return {
      name: 'vite',
      startCommand: 'npm run dev -- --host 0.0.0.0 --port 5173',
      port: 5173,
      installCommand: 'npm install',
    };
  }

  // Create React App
  if (deps?.['react-scripts']) {
    return {
      name: 'create-react-app',
      startCommand: 'npm start',
      port: 3000,
      installCommand: 'npm install',
    };
  }

  // Express / Node.js server
  if (deps?.express && scripts.start) {
    return {
      name: 'express',
      startCommand: 'npm start',
      port: 3000,
      installCommand: 'npm install',
    };
  }

  // Generic Node.js with start script
  if (scripts.start) {
    return {
      name: 'nodejs',
      startCommand: 'npm start',
      port: 3000,
      installCommand: 'npm install',
    };
  }

  // Python Flask
  try {
    await sandbox.readFile(`${workspacePath}/app.py`);
    return {
      name: 'flask',
      startCommand: 'python app.py',
      port: 5000,
      installCommand: 'pip install -r requirements.txt',
    };
  } catch {
    // Not Flask
  }

  // Python FastAPI
  try {
    const mainPy = await sandbox.readFile(`${workspacePath}/main.py`);
    if (mainPy.includes('fastapi') || mainPy.includes('FastAPI')) {
      return {
        name: 'fastapi',
        startCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000',
        port: 8000,
        installCommand: 'pip install -r requirements.txt',
      };
    }
  } catch {
    // Not FastAPI
  }

  // Static HTML site (fallback)
  try {
    await sandbox.readFile(`${workspacePath}/index.html`);
    return {
      name: 'static',
      startCommand: 'npx serve -l 3000 .',
      port: 3000,
    };
  } catch {
    // No index.html
  }

  // Default fallback - try to serve the directory
  return {
    name: 'unknown',
    startCommand: 'npx serve -l 3000 .',
    port: 3000,
  };
}

/**
 * Start a preview server in the sandbox.
 * Returns the public URL to access the preview.
 */
export async function startPreview(
  buildId: string,
  sandbox: Sandbox,
  options: {
    port?: number;
    ttlMs?: number;
    workspacePath?: string;
  } = {}
): Promise<PreviewSession> {
  const {
    port: requestedPort,
    ttlMs = DEFAULT_PREVIEW_TTL_MS,
    workspacePath: providedPath = '/home/user',
  } = options;

  // Auto-detect the actual project directory
  // This handles cases where scaffolding tools create subdirectories (e.g., npm create vite@latest portfolio)
  const workspacePath = await findProjectDirectory(sandbox, providedPath);
  console.log(`[preview-manager] Using project directory: ${workspacePath}`);

  // Detect framework
  const framework = await detectFramework(sandbox, workspacePath);
  const port = requestedPort || framework.port || DEFAULT_PREVIEW_PORT;

  // Update build status
  await updateBuild(buildId, {
    previewStatus: 'starting',
    previewPort: port,
  });

  try {
    // Install dependencies if needed
    if (framework.installCommand) {
      console.log(`[preview-manager] Installing dependencies: ${framework.installCommand}`);
      const installResult = await sandbox.exec(`cd ${workspacePath} && ${framework.installCommand}`);
      if (installResult.exitCode !== 0) {
        console.warn(`[preview-manager] Install warning: ${installResult.stderr}`);
        // Don't fail - dependencies might already be installed
      }
    }

    // Build if needed
    if (framework.buildCommand) {
      console.log(`[preview-manager] Building: ${framework.buildCommand}`);
      const buildResult = await sandbox.exec(`cd ${workspacePath} && ${framework.buildCommand}`);
      if (buildResult.exitCode !== 0) {
        throw new Error(`Build failed: ${buildResult.stderr}`);
      }
    }

    // Start the server in background
    console.log(`[preview-manager] Starting server: ${framework.startCommand}`);
    // Use nohup and & to run in background, redirect output to files
    const startCmd = `cd ${workspacePath} && nohup ${framework.startCommand} > /tmp/preview.log 2>&1 &`;
    await sandbox.exec(startCmd);

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify server is running by checking the port
    const checkResult = await sandbox.exec(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/ || echo "000"`);
    const httpCode = checkResult.stdout.trim();
    
    // Accept any response (even 404) as long as server is responding
    if (httpCode === '000') {
      // Server didn't respond, check logs
      const logs = await sandbox.exec('cat /tmp/preview.log 2>/dev/null || echo "No logs"');
      throw new Error(`Server failed to start. Logs: ${logs.stdout}`);
    }

    // Get the public URL
    const outputUrl = `https://${sandbox.getHost(port)}`;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + Math.min(ttlMs, MAX_PREVIEW_TTL_MS));
    const startedAt = new Date();

    // Extend sandbox timeout to match preview TTL
    await sandbox.setTimeout(Math.min(ttlMs, MAX_PREVIEW_TTL_MS));

    // Update build with preview info
    await updateBuild(buildId, {
      sandboxId: sandbox.id,
      outputUrl,
      previewStatus: 'running',
      previewPort: port,
      previewExpiresAt: expiresAt,
      previewStartedAt: startedAt,
    });

    console.log(`[preview-manager] Preview started for build ${buildId}: ${outputUrl}`);

    return {
      buildId,
      sandboxId: sandbox.id,
      outputUrl,
      port,
      framework: framework.name,
      status: 'running',
      expiresAt,
      startedAt,
    };
  } catch (error) {
    // Update status on failure
    await updateBuild(buildId, {
      previewStatus: 'stopped',
    });
    throw error;
  }
}

/**
 * Stop a running preview.
 */
export async function stopPreview(
  buildId: string,
  sandbox: Sandbox
): Promise<void> {
  console.log(`[preview-manager] Stopping preview for build ${buildId}`);

  // Update status
  await updateBuild(buildId, {
    previewStatus: 'stopping',
  });

  try {
    // Kill any running server processes
    await sandbox.exec('pkill -f "npm\\|node\\|python\\|serve" || true');
    
    // Destroy the sandbox
    await sandbox.destroy();

    // Update build - use undefined to clear values (Prisma accepts this)
    await updateBuild(buildId, {
      sandboxId: undefined,
      outputUrl: undefined,
      previewStatus: 'stopped',
      previewExpiresAt: undefined,
    });

    console.log(`[preview-manager] Preview stopped for build ${buildId}`);
  } catch (error) {
    console.error(`[preview-manager] Error stopping preview: ${error}`);
    // Still mark as stopped
    await updateBuild(buildId, {
      previewStatus: 'stopped',
    });
    throw error;
  }
}

/**
 * Get the current preview status for a build.
 */
export async function getPreviewStatus(
  buildId: string
): Promise<PreviewSession | null> {
  const build = await getBuildById(buildId);
  if (!build) {
    return null;
  }

  // Check if preview is active
  const previewStatus = build.previewStatus;
  if (!previewStatus || previewStatus === 'stopped' || previewStatus === 'expired') {
    return null;
  }

  // Check if expired
  const previewExpiresAt = build.previewExpiresAt;
  if (previewExpiresAt && new Date() > previewExpiresAt) {
    // Mark as expired
    await updateBuild(buildId, {
      previewStatus: 'expired',
    });
    return null;
  }

  return {
    buildId: build.id,
    sandboxId: build.sandboxId || '',
    outputUrl: build.outputUrl || '',
    port: build.previewPort || DEFAULT_PREVIEW_PORT,
    framework: 'unknown', // We don't store this, could add later
    status: previewStatus as PreviewSession['status'],
    expiresAt: previewExpiresAt || new Date(),
    startedAt: build.previewStartedAt || new Date(),
  };
}

/**
 * Extend a preview's TTL.
 */
export async function extendPreviewTTL(
  buildId: string,
  sandbox: Sandbox,
  additionalMs: number = DEFAULT_PREVIEW_TTL_MS
): Promise<Date> {
  const build = await getBuildById(buildId);
  if (!build) {
    throw new Error('Build not found');
  }

  const currentExpiry = build.previewExpiresAt;
  const now = new Date();
  const baseTime = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseTime.getTime() + additionalMs);

  // Cap at max TTL from now
  const maxExpiry = new Date(now.getTime() + MAX_PREVIEW_TTL_MS);
  const finalExpiry = newExpiry > maxExpiry ? maxExpiry : newExpiry;

  // Extend sandbox timeout
  await sandbox.setTimeout(finalExpiry.getTime() - now.getTime());

  // Update build
  await updateBuild(buildId, {
    previewExpiresAt: finalExpiry,
  });

  console.log(`[preview-manager] Extended preview TTL for build ${buildId} to ${finalExpiry.toISOString()}`);

  return finalExpiry;
}
