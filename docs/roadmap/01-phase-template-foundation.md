# Phase 1: Template Foundation

**Status:** Ready to Implement  
**Priority:** High  
**Estimated Duration:** 1-2 weeks  
**Dependencies:** None

---

## Objective

Create pre-configured E2B templates that eliminate cold-start setup time and enable the agent to begin feature implementation immediately.

---

## Problem Statement

Currently, every build:
1. Creates a fresh `base` sandbox (~5s)
2. Agent installs all dependencies (~45-60s)
3. Agent creates project structure (~20s)
4. Agent starts dev server (~10s)
5. **Only then** begins implementing features

With pre-configured templates, steps 2-4 are eliminated, and the dev server is already running.

---

## Deliverables

### 1. Template Directory Structure

```
/templates
├── README.md                    # Overview of templates
├── package.json                 # Build dependencies
├── tsconfig.json
├── shared/
│   ├── manifest-schema.ts       # TypeScript types for manifests
│   └── build-utils.ts           # Shared build utilities
├── nextjs-shadcn-fullstack/
│   ├── template.ts              # Template definition
│   ├── build.ts                 # Build script
│   ├── files/                   # Files to copy into template
│   │   └── template-manifest.json
│   └── README.md
├── react-vite/
│   ├── template.ts
│   ├── build.ts
│   └── files/
└── claude-code/
    ├── template.ts
    ├── build.ts
    └── files/
```

### 2. Primary Template: `nextjs-shadcn-fullstack`

**Design Principle:** Everything works out of the box with zero external API keys.

**Pre-installed:**
- Next.js 15.x with TypeScript (strict)
- React 19
- Tailwind CSS 4
- shadcn/ui (all components)
- Lucide React icons
- Drizzle ORM + libSQL client
- Auth.js v5 with Drizzle adapter
- React Email + Resend (with fallback)
- UploadThing (with local fallback)
- TanStack Query v5, Zustand
- Zod validation
- date-fns

**Pre-configured:**
- Dev server running on port 3000
- SQLite database initialized (`./data/app.db`)
- TypeScript strict mode
- ESLint + Prettier
- Standard project structure with `src/` directory
- Graceful degradation utilities for email/uploads

**Template Definition:**
```typescript
// templates/nextjs-shadcn-fullstack/template.ts
import { Template, waitForPort } from 'e2b';

export const template = Template()
  .fromNodeImage('21-slim')
  .aptInstall(['curl', 'git', 'ripgrep', 'chromium'])
  .setEnvs({
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
    PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
  })
  .setWorkdir('/home/user')
  
  // Create Next.js 15 project with App Router
  .runCmd([
    'npx create-next-app@15 . --ts --tailwind --eslint --import-alias "@/*" --use-npm --app --src-dir',
  ])
  
  // Install shadcn/ui
  .runCmd([
    'npx shadcn@latest init -d -y',
    'npx shadcn@latest add --all -y',
  ])
  
  // Install core dependencies (zero-config stack)
  .runCmd(`npm install \\
    drizzle-orm @libsql/client \\
    next-auth@beta @auth/drizzle-adapter \\
    zod @tanstack/react-query zustand \\
    lucide-react class-variance-authority clsx tailwind-merge \\
    resend @react-email/components \\
    uploadthing @uploadthing/react \\
    date-fns`)
  
  // Install dev dependencies
  .runCmd('npm install -D drizzle-kit puppeteer @types/node')
  
  // Create data directory for SQLite
  .runCmd('mkdir -p data public/uploads')
  
  // Initialize SQLite database
  .runCmd('touch data/app.db')
  
  // Write template manifest
  .copy('files/template-manifest.json', '/home/user/.template-manifest.json')
  
  // Copy pre-configured lib files (db, auth, email, upload with fallbacks)
  .copy('files/lib/', '/home/user/src/lib/')
  
  // Copy drizzle config
  .copy('files/drizzle.config.ts', '/home/user/drizzle.config.ts')
  
  // Copy .env.example
  .copy('files/.env.example', '/home/user/.env.example')
  
  // Start dev server (will be running when sandbox spawns)
  .setStartCmd('npm run dev', waitForPort(3000));
```

**Key Pre-configured Files:**

```typescript
// templates/nextjs-shadcn-fullstack/files/lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

// Zero-config: Works immediately with local SQLite
const client = createClient({ 
  url: process.env.DATABASE_URL || 'file:./data/app.db'
});

export const db = drizzle(client);
```

```typescript
// templates/nextjs-shadcn-fullstack/files/lib/email.ts
import { Resend } from 'resend';
import fs from 'fs/promises';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(options: EmailOptions) {
  if (resend) {
    // Production: Send via Resend
    return resend.emails.send(options);
  } else {
    // Development: Log to console + write to file
    console.log('📧 EMAIL (dev mode):', {
      to: options.to,
      subject: options.subject,
    });
    
    await fs.appendFile(
      './data/emails.log',
      JSON.stringify({ ...options, timestamp: new Date() }) + '\n'
    );
    
    return { id: `dev-${Date.now()}` };
  }
}
```

```typescript
// templates/nextjs-shadcn-fullstack/files/lib/upload.ts
import fs from 'fs/promises';
import path from 'path';

export async function uploadFile(file: File): Promise<UploadResult> {
  if (process.env.UPLOADTHING_SECRET) {
    // Production: Use UploadThing
    return uploadToUploadThing(file);
  } else {
    // Development: Local file storage
    const filename = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join('./public/uploads', filename), buffer);
    
    return {
      url: `/uploads/${filename}`,
      key: filename,
      name: file.name,
      size: file.size,
    };
  }
}
```

### 3. Template Manifest Schema

```typescript
// templates/shared/manifest-schema.ts
export interface TemplateManifest {
  templateId: string;
  templateVersion: string;
  createdAt: string;
  
  preConfigured: {
    framework: 'nextjs' | 'react-vite' | 'remix' | 'nuxt';
    frameworkVersion: string;
    language: 'typescript' | 'javascript';
    
    features: string[];  // e.g., ['tailwind', 'shadcn-ui', 'drizzle', 'auth-js']
    
    // Zero-config indicator
    zeroConfig: boolean;
    requiresKeys: boolean;
    
    // Optional keys that enhance functionality
    optionalKeys: string[];  // e.g., ['RESEND_API_KEY', 'UPLOADTHING_SECRET']
    
    devServer?: {
      running: boolean;
      port: number;
      command: string;
    };
    
    projectStructure: {
      sourceDir: string;       // e.g., 'src'
      pagesDir?: string;       // e.g., 'src/app' for App Router
      componentsDir: string;   // e.g., 'src/components'
      libDir: string;          // e.g., 'src/lib'
    };
    
    database?: {
      orm: 'drizzle' | 'prisma' | 'none';
      provider: 'sqlite' | 'postgresql' | 'mysql' | 'none';
      initialized: boolean;
      connected: boolean;
      location?: string;       // e.g., './data/app.db'
    };
    
    auth?: {
      provider: 'auth-js' | 'clerk' | 'supabase' | 'none';
      configured: boolean;
      sessionStrategy: 'database' | 'jwt';
    };
    
    // Graceful degradation services
    gracefulDegradation?: {
      email: {
        fallback: 'console' | 'file';
        upgradeTo: 'resend' | 'sendgrid';
      };
      uploads: {
        fallback: 'local';
        upgradeTo: 'uploadthing' | 's3';
      };
    };
  };
}
```

**Example Manifest:**

```json
{
  "templateId": "nextjs-shadcn-fullstack",
  "templateVersion": "1.0.0",
  "createdAt": "2024-12-11T00:00:00Z",
  
  "preConfigured": {
    "framework": "nextjs",
    "frameworkVersion": "15.0.0",
    "language": "typescript",
    
    "features": [
      "tailwind",
      "shadcn-ui",
      "drizzle",
      "sqlite",
      "auth-js",
      "react-email",
      "uploadthing",
      "tanstack-query",
      "zustand"
    ],
    
    "zeroConfig": true,
    "requiresKeys": false,
    
    "optionalKeys": [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET", 
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
      "RESEND_API_KEY",
      "UPLOADTHING_SECRET",
      "UPLOADTHING_APP_ID",
      "DATABASE_URL"
    ],
    
    "devServer": {
      "running": true,
      "port": 3000,
      "command": "npm run dev"
    },
    
    "projectStructure": {
      "sourceDir": "src",
      "pagesDir": "src/app",
      "componentsDir": "src/components",
      "libDir": "src/lib"
    },
    
    "database": {
      "orm": "drizzle",
      "provider": "sqlite",
      "initialized": true,
      "connected": true,
      "location": "./data/app.db"
    },
    
    "auth": {
      "provider": "auth-js",
      "configured": true,
      "sessionStrategy": "database"
    },
    
    "gracefulDegradation": {
      "email": {
        "fallback": "file",
        "upgradeTo": "resend"
      },
      "uploads": {
        "fallback": "local",
        "upgradeTo": "uploadthing"
      }
    }
  }
}
```

### 4. Environment Discovery Function

```typescript
// apps/web/src/lib/sandbox/environment-discovery.ts
import type { Sandbox } from '@repo/sandbox-providers';
import type { TemplateManifest } from '@repo/templates';

export interface EnvironmentContext {
  hasManifest: boolean;
  manifest?: TemplateManifest;
  
  // Detected state
  framework: string | null;
  devServerRunning: boolean;
  devServerPort: number | null;
  
  // File system state
  hasPackageJson: boolean;
  hasDrizzleSchema: boolean;
  existingDirectories: string[];
  
  // Process state
  runningProcesses: string[];
}

export async function discoverEnvironment(
  sandbox: Sandbox
): Promise<EnvironmentContext> {
  const context: EnvironmentContext = {
    hasManifest: false,
    framework: null,
    devServerRunning: false,
    devServerPort: null,
    hasPackageJson: false,
    hasDrizzleSchema: false,
    existingDirectories: [],
    runningProcesses: [],
  };

  // 1. Check for template manifest
  try {
    const manifestContent = await sandbox.readFile('/home/user/.template-manifest.json');
    context.manifest = JSON.parse(manifestContent);
    context.hasManifest = true;
    context.framework = context.manifest.preConfigured.framework;
    context.devServerRunning = context.manifest.preConfigured.devServer?.running ?? false;
    context.devServerPort = context.manifest.preConfigured.devServer?.port ?? null;
  } catch {
    // No manifest - likely base template
  }

  // 2. Check for package.json
  try {
    await sandbox.readFile('/home/user/package.json');
    context.hasPackageJson = true;
  } catch {
    // No package.json
  }

  // 3. Check for Drizzle schema
  try {
    await sandbox.readFile('/home/user/src/lib/db/schema.ts');
    context.hasDrizzleSchema = true;
  } catch {
    // No Drizzle schema
  }

  // 4. Check directory structure
  const lsResult = await sandbox.exec('ls -d */ 2>/dev/null || true');
  if (lsResult.stdout) {
    context.existingDirectories = lsResult.stdout
      .split('\n')
      .map(d => d.replace('/', '').trim())
      .filter(Boolean);
  }

  // 5. Verify dev server is actually running
  if (context.devServerPort) {
    const portCheck = await sandbox.exec(`lsof -i :${context.devServerPort} 2>/dev/null | head -1`);
    context.devServerRunning = portCheck.exitCode === 0 && portCheck.stdout.length > 0;
  }

  // 6. List running processes
  const psResult = await sandbox.exec('ps aux --no-headers 2>/dev/null | awk \'{print $11}\' | sort -u');
  if (psResult.stdout) {
    context.runningProcesses = psResult.stdout.split('\n').filter(Boolean);
  }

  return context;
}
```

### 5. Context-Aware Prompt Generator

```typescript
// apps/web/src/lib/sandbox/prompt-generator.ts
import type { EnvironmentContext } from './environment-discovery';

export function generateSystemPrompt(
  env: EnvironmentContext,
  targetFeatures: number
): string {
  const basePrompt = `You are an expert full-stack developer building a production-quality application.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files  
- read_file: Read file contents

`;

  if (env.hasManifest && env.manifest) {
    const m = env.manifest.preConfigured;
    
    return basePrompt + `
## 🚀 PRE-CONFIGURED ZERO-CONFIG ENVIRONMENT

This sandbox is pre-configured with everything you need. **DO NOT** reinstall or recreate what's already set up.

### ✅ Zero-Config Stack (Works Immediately):
- **Framework:** Next.js ${m.frameworkVersion} with App Router
- **UI:** Tailwind CSS 4 + shadcn/ui (all components)
- **Database:** Drizzle ORM + SQLite at \`./data/app.db\`
- **Auth:** Auth.js v5 with credentials provider + SQLite sessions
- **Icons:** Lucide React
- **State:** TanStack Query + Zustand
- **Validation:** Zod
${m.devServer?.running ? `- **Dev Server:** ALREADY RUNNING on port ${m.devServer.port}` : ''}

### 📧 Graceful Degradation (Works Without API Keys):
- **Email:** Logs to console + \`./data/emails.log\` (use \`lib/email.ts\`)
- **File Uploads:** Saves to \`./public/uploads/\` (use \`lib/upload.ts\`)
- **OAuth:** Credentials-only auth works; OAuth activates when keys provided

### Project Structure:
\`\`\`
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── ui/           # shadcn components (pre-installed)
│   ├── forms/        # Form components
│   └── layout/       # Layout components
├── lib/
│   ├── db/           # Drizzle client + schema
│   ├── auth.ts       # Auth.js configuration
│   ├── email.ts      # Email with fallback
│   ├── upload.ts     # Upload with fallback
│   └── utils.ts      # cn() helper
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── types/            # TypeScript types
data/
├── app.db            # SQLite database
└── emails.log        # Dev email log
public/
└── uploads/          # Local upload storage
\`\`\`

### ⚠️ DO NOT:
- Run \`npx create-next-app\` or any project scaffolding commands
- Run \`npm install\` for packages listed above
- Start the dev server (it's already running)
- Recreate directories that exist
- Install Prisma (we use Drizzle)

### ✅ START BY:
1. Read \`app_spec.txt\` to understand the requirements
2. Create \`feature_list.json\` with ~${targetFeatures} test cases
3. **Immediately begin implementing features** - the foundation is ready!

### 💡 Tips:
- Use \`npx drizzle-kit push\` to apply schema changes
- Import shadcn components from \`@/components/ui/\`
- Use Server Actions for form handling (no API routes needed)
- Email and uploads work immediately without API keys

Focus your time on building application features, not setup.
`;
  }

  // Fallback for base template (no manifest)
  return basePrompt + `
## Starting Fresh

This is a base environment. You'll need to:

1. Read \`app_spec.txt\` to understand the requirements
2. Set up the project structure and install dependencies
3. Create \`feature_list.json\` with ~${targetFeatures} test cases
4. Implement each feature one by one

FIRST: Read app_spec.txt to understand what you're building.
THEN: Set up the project based on the technology requirements in the spec.
FINALLY: Create feature_list.json and begin implementing features.
`;
}
```

### 6. Template Selection Logic

```typescript
// apps/web/src/lib/sandbox/template-selector.ts

export type TemplateId = 
  | 'nextjs-shadcn-fullstack'
  | 'react-vite'
  | 'claude-code'
  | 'base';

interface TemplateMatch {
  templateId: TemplateId;
  confidence: number;  // 0-1
  reason: string;
}

export function selectTemplateForSpec(appSpec: string): TemplateMatch {
  const specLower = appSpec.toLowerCase();
  
  // Check for explicit framework mentions
  if (specLower.includes('next.js') || specLower.includes('nextjs')) {
    return {
      templateId: 'nextjs-shadcn-fullstack',
      confidence: 0.95,
      reason: 'Explicit Next.js requirement in spec',
    };
  }
  
  // Check for React + Vite preference
  if (specLower.includes('vite') && specLower.includes('react')) {
    return {
      templateId: 'react-vite',
      confidence: 0.9,
      reason: 'React + Vite mentioned in spec',
    };
  }
  
  // Check for non-code workflow indicators
  if (
    specLower.includes('workflow') ||
    specLower.includes('automation') ||
    specLower.includes('email triage') ||
    specLower.includes('calendar')
  ) {
    return {
      templateId: 'claude-code',
      confidence: 0.8,
      reason: 'Non-code workflow detected',
    };
  }
  
  // Default: Check project type indicators
  const webAppIndicators = [
    'web app', 'dashboard', 'landing page', 'e-commerce',
    'blog', 'saas', 'authentication', 'database',
  ];
  
  const matchCount = webAppIndicators.filter(i => specLower.includes(i)).length;
  
  if (matchCount >= 2) {
    return {
      templateId: 'nextjs-shadcn-fullstack',
      confidence: 0.7 + (matchCount * 0.05),
      reason: `Web app indicators found: ${matchCount} matches`,
    };
  }
  
  // Ultimate fallback
  return {
    templateId: 'base',
    confidence: 0.5,
    reason: 'No specific template match, using base',
  };
}
```

### 7. Updated Build Runner Integration

```typescript
// Update to apps/web/src/lib/sandbox/build-runner.ts

import { selectTemplateForSpec } from './template-selector';
import { discoverEnvironment } from './environment-discovery';
import { generateSystemPrompt } from './prompt-generator';

async function runRealBuild(
  buildId: string,
  appSpec: string,
  harnessId: string,
  targetFeatureCount: number,
  addLog: (level: string, message: string) => void,
  emitEvent: (...) => void
): Promise<void> {
  
  // NEW: Select template based on app spec
  const templateMatch = selectTemplateForSpec(appSpec);
  addLog('info', `Selected template: ${templateMatch.templateId} (${Math.round(templateMatch.confidence * 100)}% confidence)`);
  addLog('info', `Reason: ${templateMatch.reason}`);
  
  // Create sandbox with selected template
  const sandbox = await e2bProvider.create({
    template: templateMatch.templateId,
    timeout: 3600,
    env: { ANTHROPIC_API_KEY: ANTHROPIC_API_KEY || '' },
  });

  activeSandboxes.set(buildId, sandbox);
  addLog('info', `Sandbox created: ${sandbox.id}`);
  
  // NEW: Discover environment
  addLog('info', 'Discovering environment...');
  const envContext = await discoverEnvironment(sandbox);
  
  if (envContext.hasManifest) {
    addLog('info', `Template manifest found: ${envContext.manifest?.templateId}`);
    addLog('info', `Dev server: ${envContext.devServerRunning ? 'Running' : 'Not running'}`);
  } else {
    addLog('info', 'No template manifest - using base environment');
  }
  
  // Run sandbox agent with environment context
  await runSandboxAgent({
    buildId,
    sandbox,
    appSpec,
    targetFeatureCount,
    environmentContext: envContext,  // NEW: Pass environment context
    maxIterations: 20,
    onLog: (level, message) => addLog(level, message),
    onProgress: async (completed, total, currentFeature) => {
      // ... existing progress handling
    },
    onEvent: (event) => emitEvent(event),
  });
}
```

---

## Implementation Tasks

### Week 1: Template Infrastructure

- [ ] Create `/templates` directory structure
- [ ] Set up `package.json` for template builds
- [ ] Define `TemplateManifest` TypeScript types
- [ ] Create template build utilities

### Week 1: First Template

- [ ] Implement `nextjs-shadcn-fullstack` template definition
- [ ] Create build script for the template
- [ ] Create template manifest file
- [ ] Build and test template in E2B
- [ ] Verify dev server runs on spawn

### Week 2: Integration

- [ ] Implement `discoverEnvironment()` function
- [ ] Implement `generateSystemPrompt()` function
- [ ] Implement `selectTemplateForSpec()` function
- [ ] Update `build-runner.ts` to use template selection
- [ ] Update `sandbox-agent.ts` to use environment-aware prompts

### Week 2: Testing & Validation

- [ ] Test build with new template vs base template
- [ ] Measure and document cold start improvements
- [ ] Verify agent skips redundant setup
- [ ] Test continuation sessions (existing feature_list.json)
- [ ] Fix any issues discovered

---

## Success Criteria

| Metric | Before | After | Verified |
|--------|--------|-------|----------|
| Cold start to first feature | ~75s | <10s | ⬜ |
| Agent's first action | "npm install..." | "Creating feature_list.json..." | ⬜ |
| Setup-related errors | Possible | None | ⬜ |
| Dev server available | After setup | Immediately | ⬜ |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template build fails | High | Fallback to base template |
| Template gets stale | Medium | Version templates, regular updates |
| Dev server crashes | Medium | Health check before agent starts |
| Manifest mismatch | Low | Validate manifest on discovery |

---

## Next Phase

Once Phase 1 is complete, proceed to [Phase 2: Graceful Degradation Services](./02-phase-zero-config-services.md) to refine the local fallback patterns and optional key upgrades.
