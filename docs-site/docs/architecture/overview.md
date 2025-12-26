---
sidebar_position: 1
---

# Architecture Overview

The Autonomous Agents Platform is built as a monorepo with clear separation of concerns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
│                    (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  Chat Interface  │  Wizard  │  Build Monitor  │
└──────┬──────┴────────┬─────────┴────┬─────┴────────┬────────┘
       │               │              │              │
       ▼               ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│        /api/builds  /api/chat  /api/specs  /api/projects    │
└──────────────────────────┬──────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌───────────────┐
│  @repo/      │  │  @repo/        │  │  @repo/       │
│  agent-core  │  │  database      │  │  sandbox-     │
│              │  │                │  │  providers    │
└──────┬───────┘  └───────┬────────┘  └───────┬───────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌───────────────┐
│ Claude Agent │  │   PostgreSQL   │  │  E2B / Daytona│
│     SDK      │  │                │  │   Sandboxes   │
└──────────────┘  └────────────────┘  └───────────────┘
```

## Request Flow

1. **User Interaction** - User defines requirements via chat or wizard
2. **Spec Generation** - AI generates an app specification
3. **Build Creation** - Build record created in database
4. **Sandbox Provisioning** - Cloud sandbox spun up via E2B
5. **Agent Execution** - Claude Agent SDK runs in sandbox
6. **Progress Streaming** - Real-time updates via SSE
7. **Artifact Storage** - Generated code stored in S3/local

## Key Concepts

### Agent Harnesses

Pre-configured agent profiles that define:
- System prompts for initializing agents
- Allowed bash commands (security)
- MCP servers to enable
- Completion and progress tracking logic

### Sandboxes

Isolated execution environments where agents run:
- **E2B** - Fast, ephemeral sandboxes for quick builds
- **Daytona** - Development environments with persistence

### App Specifications

Structured documents that define what to build:
- Project name and description
- Technology stack
- Feature list with acceptance criteria
- Styling and design requirements

