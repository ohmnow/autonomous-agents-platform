# Autonomous Agents Platform - Roadmap

This directory contains the implementation roadmap for the Autonomous Agents Platform.

> **Design Principle:** Everything works out of the box with zero external API keys. Features gracefully upgrade when keys are provided.

## Quick Links

| Document | Status | Description |
|----------|--------|-------------|
| [Master Plan](./00-master-plan.md) | ✅ Active | Vision, architecture, and phase overview |
| [Phase 1: Template Foundation](./01-phase-template-foundation.md) | ⏳ Ready | E2B templates with zero-config stack |
| [Phase 2: Graceful Degradation](./02-phase-zero-config-services.md) | 📋 Planned | Local fallbacks, optional key upgrades |
| [Phase 3: Build Quality](./03-phase-build-quality.md) | 📋 Planned | Persistence, checkpoints, recovery |
| [Phase 4: Deployment](./04-phase-deployment.md) | 📋 Planned | Cloudflare/Vercel integration |
| [Phase 5: Non-Code Workflows](./05-phase-non-code-workflows.md) | 📋 Future | Claude Code, MCP, automation |
| [Phase 6: Extended Platforms](./06-phase-extended-platforms.md) | 📋 Future | Mobile, desktop, APIs |

## Reference

| Document | Description |
|----------|-------------|
| [E2B Template Reference](./e2b-template-reference.md) | Research on E2B template capabilities |

## Core Stack

| Layer | Choice | Zero-Config? |
|-------|--------|--------------|
| **Framework** | Next.js 15 (App Router) | ✅ |
| **UI** | Tailwind CSS 4 + shadcn/ui | ✅ |
| **ORM** | Drizzle | ✅ |
| **Database** | SQLite (libSQL) | ✅ |
| **Auth** | Auth.js v5 | ✅ |
| **Email** | React Email + Resend | ⚡ Local fallback |
| **Uploads** | UploadThing | ⚡ Local fallback |
| **State** | TanStack Query + Zustand | ✅ |

## Current Focus

**Phase 1: Template Foundation** is ready to implement. This phase will:
- Create `nextjs-shadcn-fullstack` E2B template
- Pre-install zero-config stack (Drizzle, SQLite, Auth.js)
- Implement environment discovery
- Add context-aware prompts
- Reduce cold start from ~75s to ~5s

## Key Differences from Previous Approach

| Previous | Current |
|----------|---------|
| Org-level API keys required | Zero API keys required |
| Clerk for auth | Auth.js v5 with credentials |
| Prisma ORM | Drizzle ORM (no binary) |
| External database (Neon/Turso) | Embedded SQLite |
| Services fail without keys | Graceful local fallbacks |

## Getting Started

1. Read the [Master Plan](./00-master-plan.md) for the full vision
2. Review [Phase 1](./01-phase-template-foundation.md) for immediate next steps
3. Check the [E2B Template Reference](./e2b-template-reference.md) for technical details



