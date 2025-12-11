# Autonomous Agents Platform

> Transform the CLI-based autonomous coding agent into a web application with a chat interface for configuring and launching autonomous agent builds.

## Overview

This is a monorepo for the Autonomous Agents Platform - a web application that enables users to:

1. **Chat their way** to defining an app spec through conversation
2. **Or use a step-by-step wizard** to configure the app spec
3. **Launch autonomous builds** in secure cloud sandboxes
4. **Monitor progress** in real-time via streaming UI
5. **Extend to other domains** beyond coding (AI workflows, research, etc.)

## Project Structure

```
autonomous-agents-platform/
├── apps/
│   └── web/                    # Next.js web application (Phase 2)
│
├── packages/
│   ├── agent-core/             # Core agent logic
│   │   ├── src/
│   │   │   ├── agent.ts        # Agent session management
│   │   │   ├── security.ts     # Security hooks
│   │   │   ├── progress.ts     # Progress tracking
│   │   │   ├── prompts.ts      # Prompt templates
│   │   │   ├── types.ts        # Shared types
│   │   │   └── harnesses/      # Agent harnesses
│   │   └── package.json
│   │
│   ├── sandbox-providers/      # Cloud sandbox integration
│   │   ├── src/
│   │   │   ├── interface.ts    # Provider interface
│   │   │   ├── e2b.ts          # E2B implementation
│   │   │   └── daytona.ts      # Daytona implementation (stub)
│   │   └── package.json
│   │
│   └── database/               # Prisma + data layer
│       ├── prisma/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── client.ts       # Prisma client
│       │   └── helpers/        # Data access helpers
│       └── package.json
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database
- Anthropic API key
- E2B API key (for sandbox execution)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client
pnpm --filter @repo/database db:generate

# Push schema to database (development)
pnpm --filter @repo/database db:push

# Build all packages
pnpm build
```

### Development

```bash
# Start development mode
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Packages

### @repo/agent-core

Core functionality for running autonomous agents:

- **Security hooks**: Allowlist-based bash command validation
- **Progress tracking**: Parse and display feature_list.json progress
- **Agent session**: Run agent sessions with Claude Agent SDK
- **Harnesses**: Pre-configured agent profiles for different tasks

```typescript
import {
  runAgentInSandbox,
  codingHarness,
  bashSecurityHook,
} from '@repo/agent-core';
```

### @repo/sandbox-providers

Unified interface for cloud sandbox providers:

- **E2B**: Fast, secure sandboxes for code execution
- **Daytona**: Development environments with Git integration (coming soon)

```typescript
import { createSandbox, e2bProvider } from '@repo/sandbox-providers';

const sandbox = await createSandbox('e2b', {
  template: 'base',
  timeout: 300,
});
```

### @repo/database

Database models and data access:

- **Users**: User management with Clerk integration
- **Projects**: Project organization
- **Builds**: Build tracking and logging

```typescript
import { prisma, createBuild, getBuildWithLogs } from '@repo/database';
```

## Architecture

### Cloud Sandbox Strategy

Based on the [Claude Agent SDK Hosting Guide](https://platform.claude.com/docs/en/agent-sdk/hosting), we use cloud sandbox providers for secure, isolated agent execution:

| Provider | Best For | Features |
|----------|----------|----------|
| **E2B** | Quick prototyping | Fast spin-up, good DX |
| **Daytona** | Development environments | Git integration, persistence |

### Agent Harnesses

Pre-configured agent profiles for different use cases:

```typescript
const codingHarness: AgentHarness = {
  id: 'coding',
  name: 'Autonomous Coding',
  description: 'Build web applications from app_spec.txt',
  initializerPrompt: '...',
  continuationPrompt: '...',
  allowedCommands: ['ls', 'cat', 'npm', 'node', 'git', ...],
  mcpServers: [{ name: 'puppeteer', command: 'npx', args: ['puppeteer-mcp-server'] }],
  completionCheck: async (sandbox) => { /* ... */ },
  progressTracker: async (sandbox) => { /* ... */ },
};
```

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Initialize monorepo with pnpm workspaces + Turborepo
- [x] Create `@repo/agent-core` package
  - [x] Port security hooks from Python
  - [x] Port agent session logic from Python
  - [x] Port progress tracking from Python
  - [x] Implement harness interface
  - [x] Create coding harness
- [x] Create `@repo/sandbox-providers` package
  - [x] Define provider interface
  - [x] Implement E2B provider
- [x] Create `@repo/database` package
  - [x] Define Prisma schema
  - [x] Create data access helpers

### Phase 2: Web App Core (Upcoming)
- [ ] Initialize Next.js 15 app with App Router
- [ ] Set up Tailwind + shadcn/ui
- [ ] Set up Clerk authentication
- [ ] Build dashboard layout
- [ ] Implement build monitoring page

### Phase 3: Chat Interface (Upcoming)
- [ ] Build chat UI components
- [ ] Implement chat API route
- [ ] Add spec editing/confirmation UI

### Phase 4: Wizard (Upcoming)
- [ ] Design wizard flow
- [ ] Build wizard components

### Phase 5: Polish & Deploy (Upcoming)
- [ ] Error handling & recovery
- [ ] Deploy to Vercel

## Environment Variables

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# E2B Sandbox
E2B_API_KEY=e2b_...

# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | pnpm workspaces + Turborepo | Fast builds, shared deps |
| **Web** | Next.js 15 (App Router) | Dashboard, API routes, streaming |
| **UI** | Tailwind + shadcn/ui | Modern, accessible components |
| **Database** | Prisma + PostgreSQL | Builds, projects, users |
| **Auth** | Clerk | Authentication & user management |
| **Realtime** | Server-Sent Events | Streaming agent output |
| **Agent** | Claude Agent SDK | Core AI integration |
| **Sandboxes** | E2B / Daytona | Secure agent execution |

## License

MIT
