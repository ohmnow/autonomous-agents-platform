# E2B Template Customization and Implementation Plan

**Date:** December 11, 2025  
**Author:** Autonomous Agents Platform Team  
**Status:** Research & Planning

---

## Executive Summary

This document outlines how we can leverage E2B's template system to accelerate our autonomous agent build process. Templates are pre-configured sandbox snapshots that include the filesystem state AND running processes, allowing near-instant sandbox startup with zero wait time for users.

Key opportunities identified:
1. **Pre-built coding environments** with all dependencies installed
2. **Claude Code integration** for non-code autonomous workflows
3. **MCP Gateway access** to 200+ external tools
4. **Sandbox persistence** for long-running or pausable workflows

---

## Table of Contents

1. [Understanding E2B Templates](#understanding-e2b-templates)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Proposed Template Configurations](#proposed-template-configurations)
4. [Quick Wins](#quick-wins)
5. [Claude Code for Non-Code Workflows](#claude-code-for-non-code-workflows)
6. [MCP Gateway Integration](#mcp-gateway-integration)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Technical Specifications](#technical-specifications)

---

## Understanding E2B Templates

### What Are Templates?

E2B templates are **sandbox snapshots** that capture:
- The complete filesystem state
- All running processes
- Loaded variables and memory state
- Environment configuration

When you spawn a sandbox from a template, it resumes exactly where the snapshot was taken—servers are already running, dependencies are installed, and the environment is configured.

### How Templates Work

1. **Define template** using the SDK's fluent API (TypeScript or Python)
2. **Build template** which:
   - Creates a container from your definition
   - Runs all layer commands (installs, copies, etc.)
   - Executes the start command
   - Waits for readiness (port open, file exists, timeout)
   - Snapshots the running sandbox
3. **Use template** by spawning sandboxes with the template alias

### Key Template Features

| Feature | Benefit |
|---------|---------|
| **Start Command** | Pre-run servers/processes that are immediately available |
| **Ready Command Helpers** | `waitForPort()`, `waitForProcess()`, `waitForFile()`, `waitForTimeout()` |
| **Layer Caching** | Subsequent builds reuse unchanged layers (like Docker) |
| **Package Managers** | Built-in `aptInstall()`, `npmInstall()`, `pipInstall()`, `bunInstall()` |
| **Git Operations** | Clone repos directly with `gitClone()` |
| **File Operations** | Copy, rename, remove, symlink, mkdir |
| **Dockerfile Parsing** | Convert existing Dockerfiles via `fromDockerfile()` |

### Base Images Available

```typescript
template.fromUbuntuImage("22.04")
template.fromDebianImage("slim")
template.fromPythonImage("3.13")
template.fromNodeImage("lts")
template.fromBunImage("1.3")
template.fromImage("custom-image:latest")
template.fromBaseImage() // e2bdev/base
```

---

## Current Implementation Analysis

### Our E2B Usage Today

From `packages/sandbox-providers/src/e2b.ts`:

```typescript
async create(config: SandboxConfig): Promise<Sandbox> {
  const template = config.template ?? 'base';
  const sandbox = await E2BSandboxSDK.create(template, {
    envs: config.env,
    timeoutMs: config.timeout ? config.timeout * 1000 : 300_000,
  });
  // ...
}
```

**Current State:**
- Using the default `base` template
- Template can be passed via config but we don't have custom templates
- Every sandbox starts cold—needs dependency installation at runtime

### Pain Points Addressed by Templates

1. **Slow startup**: Installing npm dependencies on every run
2. **Inconsistent environments**: Different dependency versions
3. **Wasted compute**: Repeating identical setup operations
4. **No pre-running services**: Servers start after sandbox creation

---

## Proposed Template Configurations

### Template 1: Next.js Fullstack (Zero-Config)

**Purpose:** Pre-configured Next.js 15 + Tailwind + shadcn + Drizzle/SQLite + Auth.js for zero-config web app development

> **Design Principle:** Everything works out of the box with zero external API keys.

```typescript
// templates/nextjs-shadcn-fullstack.ts
import { Template, waitForPort } from 'e2b';

export const nextjsFullstackTemplate = Template()
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
  
  // Install shadcn/ui with all components
  .runCmd([
    'npx shadcn@latest init -d -y',
    'npx shadcn@latest add --all -y',
  ])
  
  // Install zero-config stack dependencies
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
  
  // Create data directories
  .runCmd('mkdir -p data public/uploads')
  .runCmd('touch data/app.db data/emails.log public/uploads/.gitkeep')
  
  // Copy pre-configured lib files with graceful degradation
  .copy('files/lib/', '/home/user/src/lib/')
  .copy('files/drizzle.config.ts', '/home/user/drizzle.config.ts')
  .copy('files/.env.example', '/home/user/.env.example')
  .copy('files/template-manifest.json', '/home/user/.template-manifest.json')
  
  // Development server running and ready
  .setStartCmd('npm run dev', waitForPort(3000));
```

**Template Manifest:**
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
    }
  }
}
```

**Build Script:**
```typescript
// templates/build-nextjs-fullstack.ts
import { Template, defaultBuildLogger } from 'e2b';
import { nextjsFullstackTemplate } from './nextjs-shadcn-fullstack';

await Template.build(nextjsFullstackTemplate, {
  alias: 'nextjs-shadcn-fullstack',
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
});
```

### Template 2: Claude Code Agent

**Purpose:** Claude Code CLI for autonomous coding and non-code workflows

```typescript
// templates/claude-code.ts
import { Template, waitForTimeout } from 'e2b';

export const claudeCodeTemplate = Template()
  .fromNodeImage('24')
  .aptInstall(['curl', 'git', 'ripgrep', 'jq', 'python3', 'python3-pip'])
  // Install Claude Code globally
  .npmInstall('@anthropic-ai/claude-code@latest', { g: true })
  // Add common tools for non-code workflows
  .pipInstall(['pandas', 'requests', 'beautifulsoup4', 'PyYAML'])
  .setWorkdir('/home/user/workspace')
  .setEnvs({
    TERM: 'xterm-256color',
    FORCE_COLOR: '1',
  });
```

### Template 3: Full Development + Browser Testing (Primary Template)

**Purpose:** Complete zero-config environment with Puppeteer for autonomous coding harness

> This is the **primary template** for autonomous app building. It includes everything needed for a production-ready full-stack application with zero external dependencies.

```typescript
// templates/coding-harness.ts (alias: nextjs-shadcn-fullstack)
import { Template, waitForPort } from 'e2b';

export const codingHarnessTemplate = Template()
  .fromNodeImage('21-slim')
  .aptInstall([
    'curl',
    'git',
    'ripgrep',
    // Puppeteer dependencies
    'chromium',
    'libnss3',
    'libatk1.0-0',
    'libatk-bridge2.0-0',
    'libcups2',
    'libdrm2',
    'libxcomposite1',
    'libxdamage1',
    'libxrandr2',
    'libgbm1',
    'libasound2',
    'libpangocairo-1.0-0',
  ])
  .setEnvs({
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
    PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
  })
  .setWorkdir('/home/user')
  
  // Create Next.js 15 project with App Router
  .runCmd([
    'npx create-next-app@15 . --ts --tailwind --eslint --import-alias "@/*" --use-npm --app --src-dir',
  ])
  
  // Install shadcn/ui with all components
  .runCmd([
    'npx shadcn@latest init -d -y',
    'npx shadcn@latest add --all -y',
  ])
  
  // Install zero-config stack (Drizzle, Auth.js, etc.)
  .runCmd(`npm install \\
    drizzle-orm @libsql/client \\
    next-auth@beta @auth/drizzle-adapter \\
    zod @tanstack/react-query zustand \\
    lucide-react class-variance-authority clsx tailwind-merge \\
    resend @react-email/components \\
    uploadthing @uploadthing/react \\
    date-fns`)
  
  // Install dev dependencies (including Puppeteer for testing)
  .runCmd('npm install -D drizzle-kit puppeteer @types/node')
  
  // Create data directories for SQLite and local uploads
  .runCmd('mkdir -p data public/uploads')
  .runCmd('touch data/app.db data/emails.log public/uploads/.gitkeep')
  
  // Copy pre-configured lib files with graceful degradation utilities
  .copy('files/lib/', '/home/user/src/lib/')
  .copy('files/drizzle.config.ts', '/home/user/drizzle.config.ts')
  .copy('files/.env.example', '/home/user/.env.example')
  .copy('files/template-manifest.json', '/home/user/.template-manifest.json')
  
  .setStartCmd('npm run dev', waitForPort(3000));
```

**Pre-configured Files Structure:**
```
files/
├── lib/
│   ├── db/
│   │   ├── index.ts         # Drizzle client (SQLite/Turso fallback)
│   │   └── schema.ts        # Base schema with users, sessions
│   ├── auth.ts              # Auth.js config (credentials + optional OAuth)
│   ├── email.ts             # Email utility (console/Resend fallback)
│   ├── upload.ts            # Upload utility (local/UploadThing fallback)
│   ├── utils.ts             # cn() helper
│   └── validations/
│       └── index.ts         # Common Zod schemas
├── drizzle.config.ts        # Drizzle Kit configuration
├── .env.example             # Environment variable documentation
└── template-manifest.json   # Template metadata
```

### Template 4: Data Analysis Environment

**Purpose:** Python-focused for data processing and analysis tasks

```typescript
// templates/data-analysis.ts
import { Template } from 'e2b';

export const dataAnalysisTemplate = Template()
  .fromPythonImage('3.11')
  .aptInstall(['curl', 'git'])
  .pipInstall([
    'pandas',
    'numpy',
    'matplotlib',
    'seaborn',
    'plotly',
    'scipy',
    'scikit-learn',
    'jupyter',
    'requests',
    'beautifulsoup4',
    'lxml',
  ])
  .setWorkdir('/home/user/data')
  .setEnvs({
    PYTHONUNBUFFERED: '1',
  });
```

### Template 5: Desktop/GUI Environment

**Purpose:** Full Linux desktop for visual tasks and browser automation

```typescript
// templates/desktop.ts
import { Template, waitForPort } from 'e2b';

export const desktopTemplate = Template()
  .fromUbuntuImage('22.04')
  .runCmd([
    'yes | unminimize',
    'apt-get update',
    'apt-get install -y xfce4 xfce4-goodies xvfb x11vnc nodejs npm chromium-browser',
    'apt-get clean',
  ])
  .runCmd([
    'git clone --branch e2b-desktop https://github.com/e2b-dev/noVNC.git /opt/noVNC',
    'git clone --branch v0.12.0 https://github.com/novnc/websockify /opt/noVNC/utils/websockify',
  ])
  .copy('scripts/start_desktop.sh', '/start_command.sh')
  .runCmd('chmod +x /start_command.sh')
  .setStartCmd('/start_command.sh', waitForPort(6080));
```

---

## Quick Wins

### 1. Replace Base Template with Pre-Configured Template (Effort: Low, Impact: High)

**Current State:** Every sandbox installs dependencies at runtime  
**Proposed:** Create `autonomous-coding` template with everything pre-installed

**Estimated Time Savings:**
- npm install: ~30-60 seconds saved per sandbox
- shadcn setup: ~20 seconds saved
- Total: **~1 minute faster per build**

**Implementation:**
```typescript
// packages/sandbox-providers/src/e2b.ts
async create(config: SandboxConfig): Promise<Sandbox> {
  // Use our pre-built template instead of 'base'
  const template = config.template ?? 'autonomous-coding';
  // ...
}
```

### 2. Pre-Running Development Server (Effort: Low, Impact: High)

**Current State:** Must start `npm run dev` after sandbox creation  
**Proposed:** Server already running when sandbox spawns

**Implementation:** Use `setStartCmd()` with `waitForPort(3000)`

### 3. Template Variants for Different CPU/RAM (Effort: Low, Impact: Medium)

E2B's caching system allows building the same template with different resource configs:

```typescript
// Build lightweight version
await Template.build(codingTemplate, {
  alias: 'autonomous-coding-1cpu',
  cpuCount: 1,
  memoryMB: 1024,
});

// Build high-performance version
await Template.build(codingTemplate, {
  alias: 'autonomous-coding-4cpu',
  cpuCount: 4,
  memoryMB: 8192,
});
```

Layers are shared via caching—only builds once, multiple configs available.

### 4. Add Template Selection to UI (Effort: Medium, Impact: Medium)

Allow users to choose template based on their needs:
- Quick prototype → `autonomous-coding-1cpu`
- Production app → `autonomous-coding-4cpu`
- Data analysis → `data-analysis`
- Visual testing → `desktop`

---

## Claude Code for Non-Code Workflows

### Overview

The Claude Code template enables autonomous AI workflows beyond just coding:

```typescript
const sbx = await Sandbox.create('claude-code', {
  envs: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
});

// Run a prompt with Claude Code
const result = await sbx.commands.run(
  `echo 'Research the top 10 AI startups and create a comparison spreadsheet' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 0 }
);
```

### Non-Code Workflow Use Cases

#### 1. Research & Analysis
```bash
echo 'Analyze the competitive landscape for ${industry} and create a report' | claude -p --dangerously-skip-permissions
```

#### 2. Data Processing
```bash
echo 'Download the CSV from ${url}, clean the data, and generate summary statistics' | claude -p --dangerously-skip-permissions
```

#### 3. Content Generation
```bash
echo 'Create a marketing email sequence for ${product_type} targeting ${audience}' | claude -p --dangerously-skip-permissions
```

#### 4. File Operations & Organization
```bash
echo 'Organize the files in /data according to their content type and create an index' | claude -p --dangerously-skip-permissions
```

#### 5. API Integration
```bash
echo 'Fetch data from ${api_endpoint}, transform it to ${format}, and save to /output' | claude -p --dangerously-skip-permissions
```

### Integration with Our Platform

**New Harness Type: `research`**

```typescript
// packages/agent-core/src/harnesses/research.ts
export const researchHarness: AgentHarness = {
  id: 'research',
  name: 'Autonomous Research',
  description: 'Research, analyze, and synthesize information',
  
  // Uses Claude Code instead of our agent
  executionMode: 'claude-code',
  
  initializerPrompt: `
    You are a research assistant. Given a topic or question:
    1. Break down the research into subtasks
    2. Gather information from available sources
    3. Synthesize findings into a structured report
    4. Save outputs to /output directory
  `,
  
  allowedCommands: [...RESEARCH_ALLOWED_COMMANDS],
  completionCheck: async (sandbox) => {
    return await sandbox.readFile('/output/report.md').catch(() => false);
  },
};
```

---

## MCP Gateway Integration

### Overview

E2B provides a built-in MCP Gateway that gives sandboxes access to 200+ MCP tools from the Docker MCP Catalog.

### Available Integration Types

1. **Docker MCP Catalog** - Pre-built servers
2. **Custom MCP Servers** - From GitHub or local
3. **Custom Templates** - Pre-pull servers for faster runtime

### Example: Multi-Tool Agent

```typescript
const sbx = await Sandbox.create({
  mcp: {
    browserbase: {
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    },
    exa: {
      apiKey: process.env.EXA_API_KEY,
    },
    github: {
      token: process.env.GITHUB_TOKEN,
    },
    stripe: {
      apiKey: process.env.STRIPE_API_KEY,
    },
  },
});

const mcpUrl = sbx.getMcpUrl();
const mcpToken = await sbx.getMcpToken();

// Connect to Claude with MCP tools
await sbx.commands.run(`
  claude mcp add --transport http e2b-mcp-gateway ${mcpUrl} --header "Authorization: Bearer ${mcpToken}"
`);

// Now Claude Code has access to browser, search, GitHub, and Stripe
await sbx.commands.run(`
  echo 'Create a Stripe checkout page and push it to GitHub' | claude -p --dangerously-skip-permissions
`);
```

### MCP-Enabled Template

Pre-configure MCP servers in a template for even faster startup:

```typescript
// templates/mcp-enabled.ts
export const mcpEnabledTemplate = Template()
  .fromNodeImage('24')
  .aptInstall(['curl', 'git', 'ripgrep', 'docker.io'])
  .npmInstall('@anthropic-ai/claude-code@latest', { g: true })
  // Pre-pull common MCP server images
  .runCmd([
    'docker pull mcp/browserbase',
    'docker pull mcp/exa',
    'docker pull mcp/github',
  ])
  .setEnvs({
    MCP_SERVERS_PREPULLED: 'browserbase,exa,github',
  });
```

### Useful MCP Servers for Our Platform

| Server | Use Case |
|--------|----------|
| **Browserbase** | Web scraping, visual testing |
| **Exa** | Web search and research |
| **GitHub** | Version control, repo management |
| **Notion** | Documentation, knowledge base |
| **Stripe** | Payment integration testing |
| **Airtable** | Structured data storage |
| **Slack** | Notifications, team updates |
| **Linear** | Issue tracking |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Create `/templates` directory in monorepo
- [ ] Implement `autonomous-coding` template (Next.js + shadcn + Puppeteer)
- [ ] Add template build scripts
- [ ] Update E2B provider to use custom template
- [ ] Test cold start time improvements

### Phase 2: Claude Code Integration (Week 2)

- [ ] Create `claude-code` template
- [ ] Implement `research` harness type
- [ ] Add non-code workflow examples
- [ ] Create UI for selecting workflow type
- [ ] Document Claude Code usage patterns

### Phase 3: MCP Gateway (Week 3)

- [ ] Evaluate useful MCP servers for our use cases
- [ ] Create MCP-enabled template variant
- [ ] Implement MCP configuration in harness definitions
- [ ] Add MCP tool documentation
- [ ] Create example workflows using MCP tools

### Phase 4: Advanced Features (Week 4)

- [ ] Implement sandbox persistence for long-running tasks
- [ ] Add template variant selection (CPU/RAM)
- [ ] Create desktop template for visual tasks
- [ ] Add data analysis template
- [ ] Build template management UI in dashboard

---

## Technical Specifications

### Template Build Requirements

```typescript
interface TemplateBuildConfig {
  alias: string;          // Unique identifier for the template
  cpuCount: 1 | 2 | 4 | 8;
  memoryMB: 512 | 1024 | 2048 | 4096 | 8192;
  onBuildLogs?: (log: LogEntry) => void;
  skipCache?: boolean;    // Force rebuild ignoring cache
  apiKey?: string;        // Override API key
}
```

### Template Definition Structure

```typescript
// All template methods are chainable
const template = Template({
  fileContextPath: ".",                    // Where to find files to copy
  fileIgnorePatterns: [".git", "node_modules"],
})
  .fromBaseImage()                         // Base image selection
  .setWorkdir('/app')                      // Working directory
  .setUser('node')                         // User context
  .setEnvs({ NODE_ENV: 'production' })     // Environment variables
  .copy('src/', '/app/src/')               // Copy files
  .runCmd('npm install')                   // Run commands
  .aptInstall(['curl', 'git'])             // System packages
  .npmInstall(['express'], { g: true })    // npm packages
  .gitClone('https://...', '/repo')        // Clone repos
  .setStartCmd('npm start', readyCheck);   // Start command + ready check
```

### Ready Command Helpers

```typescript
import {
  waitForPort,      // Wait for TCP port
  waitForProcess,   // Wait for process name
  waitForFile,      // Wait for file existence
  waitForTimeout,   // Wait for duration
  waitForURL,       // Wait for HTTP 200
} from 'e2b';

// Examples
waitForPort(3000)
waitForProcess('node')
waitForFile('/tmp/ready')
waitForTimeout(10_000)
waitForURL('http://localhost:3000')
```

### Sandbox Persistence API

```typescript
// Pause sandbox (saves state)
await sandbox.betaPause();

// Resume sandbox (restores state)
const resumedSandbox = await Sandbox.connect(sandboxId);

// Auto-pause on timeout
const sandbox = await Sandbox.betaCreate({
  autoPause: true,
  timeoutMs: 10 * 60 * 1000,
});
```

---

## Cost-Benefit Analysis

### Current State (Base Template)

| Operation | Time | Cost Factor |
|-----------|------|-------------|
| Sandbox creation | ~5s | Base |
| npm install | ~45s | Compute |
| shadcn setup | ~20s | Compute |
| Dev server start | ~5s | Compute |
| **Total cold start** | **~75s** | - |

### With Custom Template

| Operation | Time | Cost Factor |
|-----------|------|-------------|
| Sandbox creation | ~5s | Base |
| (Dependencies pre-installed) | 0s | Template build |
| (Dev server pre-running) | 0s | Template build |
| **Total cold start** | **~5s** | - |

**Time saved per sandbox: ~70 seconds**

### Template Build Costs

- One-time build: ~5-10 minutes
- Cached rebuilds: ~1-2 minutes
- Multiple CPU/RAM variants share cached layers

---

## Current System Flow Analysis

### Where Sandbox Creation Happens

```
User triggers build
       ↓
apps/web/src/lib/sandbox/build-runner.ts
       ↓ (line 307)
e2bProvider.create({ template: 'base', ... })
       ↓
sandbox-agent.ts::runSandboxAgent()
       ↓
Writes app_spec.txt to sandbox
       ↓
Runs Claude with system prompt + tools
       ↓
Agent reads app_spec → creates feature_list → installs deps → implements
```

### The Problem

Even with a pre-configured template, the **current prompts** tell the agent to:
1. Install dependencies (which already exist)
2. Create project structure (which already exists)
3. Set up dev server (which is already running)

**Result:** Agent wastes time on redundant setup or creates conflicts.

### The Solution: Environment-Aware Initialization

The agent should "wake up, see its environment, look at its spec, and start building features."

---

## Proposed Architecture Changes

### 1. Template Metadata File

Each template should include a manifest that describes what's pre-configured:

```json
// Template writes this during build
// /home/user/.template-manifest.json
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

### 2. Environment Discovery Phase

Before the main agent prompt, run an **environment check**:

```typescript
// sandbox-agent.ts - new flow
export async function runSandboxAgent(config: SandboxAgentConfig): Promise<void> {
  const { sandbox, appSpec, ... } = config;

  // === NEW: Environment Discovery ===
  const envContext = await discoverEnvironment(sandbox);
  
  // Write app_spec.txt
  await sandbox.writeFile('/home/user/app_spec.txt', appSpec);
  
  // Generate context-aware system prompt
  const systemPrompt = generateSystemPrompt(envContext, targetFeatureCount);
  
  // Run agent with environment awareness
  // ...
}

async function discoverEnvironment(sandbox: Sandbox): Promise<EnvironmentContext> {
  const context: EnvironmentContext = {
    hasManifest: false,
    framework: null,
    devServerRunning: false,
    existingFiles: [],
    packageJson: null,
  };

  // Check for template manifest
  try {
    const manifest = await sandbox.readFile('/home/user/.template-manifest.json');
    context.hasManifest = true;
    context.manifest = JSON.parse(manifest);
    context.framework = context.manifest.preConfigured.framework;
    context.devServerRunning = context.manifest.preConfigured.devServer?.running ?? false;
  } catch {
    // No manifest - base template
  }

  // Check for existing package.json
  try {
    const pkg = await sandbox.readFile('/home/user/package.json');
    context.packageJson = JSON.parse(pkg);
  } catch {
    // No package.json yet
  }

  // List existing files
  const lsResult = await sandbox.exec('ls -la /home/user');
  context.existingFiles = parseFileList(lsResult.stdout);

  // Check if dev server is running
  const portCheck = await sandbox.exec('lsof -i :3000');
  context.devServerRunning = portCheck.exitCode === 0;

  return context;
}
```

### 3. Context-Aware Prompts

Update the system prompt based on discovered environment:

```typescript
function generateSystemPrompt(env: EnvironmentContext, targetFeatures: number): string {
  const basePrompt = `You are an expert full-stack developer building a production-quality application.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files
- read_file: Read file contents

`;

  // Add environment context for zero-config template
  if (env.hasManifest) {
    return basePrompt + `
## 🚀 PRE-CONFIGURED ZERO-CONFIG ENVIRONMENT

This sandbox is pre-configured with everything you need. **DO NOT** reinstall or recreate what's already set up.

### ✅ Zero-Config Stack (Works Immediately):
- **Framework:** Next.js 15 with App Router
- **UI:** Tailwind CSS 4 + shadcn/ui (all components)
- **Database:** Drizzle ORM + SQLite at \`./data/app.db\`
- **Auth:** Auth.js v5 with credentials provider + SQLite sessions
- **Icons:** Lucide React
- **State:** TanStack Query + Zustand
- **Validation:** Zod
${env.devServerRunning ? '- **Dev Server:** ALREADY RUNNING on port 3000' : ''}

### 📧 Graceful Degradation (Works Without API Keys):
- **Email:** Logs to console + \`./data/emails.log\` (use \`lib/email.ts\`)
- **File Uploads:** Saves to \`./public/uploads/\` (use \`lib/upload.ts\`)
- **OAuth:** Credentials-only auth works; OAuth activates when keys provided

### Project Structure:
\`\`\`
src/
├── app/              # Next.js App Router pages
├── components/ui/    # shadcn components (pre-installed)
├── lib/
│   ├── db/           # Drizzle client + schema
│   ├── auth.ts       # Auth.js configuration
│   ├── email.ts      # Email with fallback
│   ├── upload.ts     # Upload with fallback
│   └── utils.ts      # cn() helper
data/
├── app.db            # SQLite database
└── emails.log        # Dev email log
\`\`\`

### ⚠️ DO NOT:
- Run \`npx create-next-app\` or any project scaffolding commands
- Run \`npm install\` for packages listed above
- Start the dev server (it's already running)
- Install Prisma (we use Drizzle)

### ✅ START BY:
1. Read \`app_spec.txt\` to understand the requirements
2. Create \`feature_list.json\` with ~${targetFeatures} test cases
3. Start implementing features immediately - the foundation is ready!

### 💡 Tips:
- Use \`npx drizzle-kit push\` to apply schema changes
- Import shadcn components from \`@/components/ui/\`
- Use Server Actions for form handling (no API routes needed)
- Email and uploads work immediately without API keys

Focus your time on building application features, not setup.
`;
  }

  // Fallback for base template
  return basePrompt + `
FIRST: Read app_spec.txt to understand what you're building.
THEN: Set up the project and create feature_list.json with ~${targetFeatures} features.
FINALLY: Implement each feature one by one.
`;
}
```

### 4. Build Runner Changes

Update `build-runner.ts` to select the right template:

```typescript
async function runRealBuild(
  buildId: string,
  appSpec: string,
  harnessId: string,
  targetFeatureCount: number,
  addLog: (level: string, message: string) => void,
  emitEvent: (...) => void
): Promise<void> {
  
  // NEW: Determine template based on app spec analysis
  const template = selectTemplateForSpec(appSpec);
  addLog('info', `Selected template: ${template}`);
  
  const sandbox = await e2bProvider.create({
    template,  // Dynamic template selection
    timeout: 3600,
    env: { ANTHROPIC_API_KEY: ANTHROPIC_API_KEY || '' },
  });
  // ...
}

function selectTemplateForSpec(appSpec: string): string {
  // Analyze app_spec to determine best template
  const specLower = appSpec.toLowerCase();
  
  // Check for Next.js/React indicators
  if (specLower.includes('next.js') || 
      specLower.includes('react') || 
      specLower.includes('tailwind')) {
    return 'nextjs-shadcn-dev';
  }
  
  // Check for Python/data science
  if (specLower.includes('python') || 
      specLower.includes('pandas') || 
      specLower.includes('data analysis')) {
    return 'data-analysis';
  }
  
  // Default
  return 'base';
}
```

### 5. Updated Harness Definition

Add template preference to harness:

```typescript
// packages/agent-core/src/harnesses/coding.ts
export const codingHarness: AgentHarness = {
  id: 'coding',
  name: 'Autonomous Coding',
  description: 'Build web applications from app_spec.txt',

  // NEW: Preferred templates in order
  preferredTemplates: ['nextjs-shadcn-dev', 'base'],
  
  // NEW: Template selection logic
  selectTemplate: (appSpec: string) => {
    // Logic to pick best template
  },

  // Existing...
  initializerPrompt: INITIALIZER_PROMPT,
  continuationPrompt: CODING_PROMPT,
  allowedCommands: CODING_ALLOWED_COMMANDS,
  // ...
};
```

---

## Implementation Sequence

### Phase 1: Template Creation (Days 1-2)

1. Create `/templates` directory in monorepo
2. Implement `nextjs-shadcn-dev` template with manifest
3. Build and test template
4. Verify dev server is running on spawn

### Phase 2: Environment Discovery (Days 3-4)

1. Add `discoverEnvironment()` function to `sandbox-agent.ts`
2. Parse template manifest if present
3. Detect running services (port checks)
4. Log environment context

### Phase 3: Context-Aware Prompts (Days 5-6)

1. Create `generateSystemPrompt()` with environment context
2. Update prompts to skip redundant setup
3. Add "DO NOT" instructions for pre-configured items
4. Test that agent skips setup correctly

### Phase 4: Template Selection (Days 7-8)

1. Add `selectTemplateForSpec()` to analyze app spec
2. Integrate with build-runner
3. Add template preference to harness definition
4. Test end-to-end with different app types

### Phase 5: Validation & Polish (Days 9-10)

1. Compare build times: base vs custom template
2. Verify no duplicate installations
3. Test continuation sessions (feature_list.json exists)
4. Document the full flow

---

## Expected Outcomes

| Metric | Before (Base Template) | After (Custom Template) |
|--------|------------------------|-------------------------|
| Cold start time | ~75 seconds | ~5 seconds |
| Agent first action | "npm install next..." | "Creating feature_list.json..." |
| Setup errors | Possible version conflicts | Consistent environment |
| Time to first feature | ~10 minutes | ~2 minutes |

## Next Steps

1. **Immediate Actions:**
   - Create `/templates` directory structure
   - Build initial `autonomous-coding` template
   - Measure and document cold start improvements

2. **Validation:**
   - Test template with existing coding harness
   - Verify all dependencies work correctly
   - Ensure Puppeteer browser automation functions

3. **Rollout:**
   - Deploy to staging environment
   - Gather performance metrics
   - Gradual production rollout

---

## References

- [E2B Templates Quickstart](https://e2b.dev/docs/template/quickstart)
- [E2B Template Examples](https://e2b.dev/docs/template/examples)
- [E2B Claude Code Example](https://e2b.dev/docs/template/examples/claude-code)
- [E2B MCP Gateway](https://e2b.dev/docs/mcp)
- [E2B Sandbox Persistence](https://e2b.dev/docs/sandbox/persistence)
- [Docker MCP Catalog](https://hub.docker.com/mcp)
