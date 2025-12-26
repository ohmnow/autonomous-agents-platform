# Autonomous Agents Platform - Master Plan

**Date:** December 11, 2025  
**Version:** 1.0  
**Status:** Active Planning

---

## Vision

**"Plan once, build autonomously."**

An Autonomous App Factory where users define what they want through guided planning, then our system builds production-ready applications while they focus on other things. Unlike Lovable, v0, or Figma Make where users sit and prompt iteratively, we handle the entire build process autonomously.

---

## Target Audiences

| Audience | Need | Value Proposition |
|----------|------|-------------------|
| **Developers** | Rapid prototyping, MVP creation | Skip boilerplate, get to features faster |
| **Non-technical users** | App ideas without coding skills | Plan your idea, get a working app |
| **Agencies/Freelancers** | Client project delivery | Build more projects, faster turnaround |
| **Knowledge Workers** | Automation of repetitive tasks | Custom tools without the coding |

---

## Core Principles

1. **Autonomy First** - Build while users do other things
2. **Production Quality** - Not prototypes, but deployable apps
3. **Zero Configuration** - Works out of the box with NO external API keys required
4. **Graceful Degradation** - Features upgrade automatically when keys are provided
5. **Predictable Outcomes** - Consistent quality through standardized templates

> **Design Principle:** Everything works out of the box with zero external API keys. Features gracefully upgrade when keys are provided.

---

## Primary Use Cases

### Phase 1: Web Applications (MVP)
- Landing pages
- Dashboards
- Full-stack web apps
- E-commerce sites
- Blog platforms

### Phase 2: Autonomous Workflows (Future)
- Email triaging
- Calendar management
- Data processing pipelines
- Research & analysis agents
- Custom automation workflows

### Phase 3: Extended Platforms (Future)
- Mobile apps (React Native/Expo)
- Desktop apps (Electron)
- API services
- Chrome extensions

---

## MVP Tech Stack Decision

### Stack Overview

| Layer | Choice | Zero-Config? | Notes |
|-------|--------|--------------|-------|
| **Framework** | Next.js 15 (App Router) | ✅ | Server Actions, RSC, no API boilerplate |
| **Language** | TypeScript (strict) | ✅ | End-to-end type safety |
| **Styling** | Tailwind CSS 4 | ✅ | Utility-first, no build config |
| **UI Components** | shadcn/ui (all) | ✅ | Copy-paste, no version lock-in |
| **Icons** | Lucide React | ✅ | Tree-shakeable, consistent |
| **ORM** | Drizzle | ✅ | No binary, edge-ready, SQL-like |
| **Database** | SQLite (libSQL) | ✅ | Embedded, zero network config |
| **Validation** | Zod | ✅ | Integrates with Server Actions + forms |
| **Auth** | Auth.js v5 | ✅* | SQLite sessions, credentials provider |
| **Email** | React Email + Resend | ⚡ | Console fallback → Resend with key |
| **File Uploads** | UploadThing | ⚡ | Local `/uploads` → UploadThing with key |
| **Client State** | Zustand | ✅ | Minimal, when RSC isn't enough |
| **Server State** | TanStack Query v5 | ✅ | Mutations, optimistic updates |
| **Date/Time** | date-fns | ✅ | Tree-shakeable, no moment.js bloat |

**Legend:** ✅ = Works immediately | ⚡ = Graceful degradation (works locally, upgrades with key)

### Why This Stack?
- **Next.js 15**: Server Actions, App Router, RSC - no API boilerplate needed
- **React 19**: Latest features, best AI training data
- **TypeScript (strict)**: Type safety, better AI code generation
- **Drizzle over Prisma**: No binary engine, faster cold starts, edge-ready
- **SQLite (libSQL)**: Zero configuration, embedded database, Turso-compatible upgrade path

### Key Architecture Decisions

#### Why Drizzle over Prisma

| Factor | Prisma | Drizzle | Winner |
|--------|--------|---------|--------|
| Binary engine | Required (~15MB) | None | Drizzle |
| Cold start | Slower (binary init) | Instant | Drizzle |
| E2B container size | Larger | Smaller | Drizzle |
| Edge runtime | Partial | Full | Drizzle |
| Type inference | Generated | Native TS | Drizzle |
| SQL familiarity | Abstracted | SQL-like | Drizzle |

**Bottom line:** Drizzle is faster to install, faster to start, and has no binary dependencies—critical for autonomous container builds.

#### Why SQLite (libSQL) as Default

1. **Zero configuration** — No connection strings, no external services
2. **Embedded** — Database file lives in the project
3. **Fast** — No network latency for reads/writes
4. **Turso-compatible** — Same libSQL, easy upgrade to edge replication
5. **Portable** — User can download their entire database

#### Why Auth.js v5 with Credentials

Most auth providers (Clerk, Auth0, Supabase Auth) require API keys. Auth.js v5 can work **immediately** with:
1. **SQLite session storage** — No Redis, no external DB
2. **Credentials provider** — Email/password works without OAuth keys
3. **Upgradeable** — Add Google/GitHub OAuth when user provides keys

### Graceful Degradation Pattern

Services work locally without keys, then upgrade when keys are provided:

| Service | Zero-Config Mode | With API Key |
|---------|------------------|--------------|
| **Email** | Console log + file | Resend delivery |
| **File Uploads** | Local `/uploads` folder | UploadThing cloud |
| **Auth** | Credentials only | + OAuth providers |
| **Database** | SQLite file | Turso edge replication |

---

## Phased Implementation

### Phase 1: Template Foundation ⏳
**Goal:** Pre-configured E2B templates that eliminate cold-start setup time

- [Phase 1 Plan →](./01-phase-template-foundation.md)
- Create `nextjs-shadcn-fullstack` template
- Environment discovery system
- Dynamic template selection
- Context-aware agent prompts

### Phase 2: Graceful Degradation Services 📋
**Goal:** Apps that work immediately with zero API keys, upgrade when keys provided

- [Phase 2 Plan →](./02-phase-zero-config-services.md)
- Auth.js v5 with credentials (works without OAuth keys)
- SQLite database (embedded, zero config)
- Email logging fallback (console + file, upgrades to Resend)
- File upload fallback (local storage, upgrades to UploadThing)
- "Add Your API Keys" UI component for production upgrades

### Phase 3: Build Quality & Speed 📋
**Goal:** Faster, more reliable autonomous builds

- [Phase 3 Plan →](./03-phase-build-quality.md)
- Sandbox persistence for long builds
- Build resumption on failure
- Parallel feature implementation
- Better progress tracking

### Phase 4: Deployment Pipeline 📋
**Goal:** One-click deployment to production

- [Phase 4 Plan →](./04-phase-deployment.md)
- Cloudflare/Vercel integration
- Automatic domain setup
- SSL/CDN configuration
- Environment variable management

### Phase 5: Non-Code Workflows 📋
**Goal:** Autonomous agents for knowledge worker tasks

- [Phase 5 Plan →](./05-phase-non-code-workflows.md)
- Claude Code template integration
- MCP Gateway for external tools
- Workflow templates (email, calendar, research)
- Scheduled/triggered execution

### Phase 6: Extended Platforms 📋
**Goal:** Beyond web apps

- [Phase 6 Plan →](./06-phase-extended-platforms.md)
- Mobile templates (Expo)
- Desktop templates (Electron)
- API-only templates
- Chrome extension templates

---

## Success Metrics

| Metric | Current | Phase 1 Target | Long-term Target |
|--------|---------|----------------|------------------|
| Cold start time | ~75s | ~5s | <3s |
| Time to first feature | ~10min | ~2min | ~30s |
| Build completion rate | TBD | >80% | >95% |
| User intervention needed | High | Low | Minimal |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Wizard  │  │   Chat   │  │  Builds  │  │  Deployment  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
└───────┼─────────────┼─────────────┼───────────────┼─────────┘
        │             │             │               │
        ▼             ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Platform                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Spec Engine  │  │ Build Runner  │  │ Deploy Pipeline  │  │
│  │ (Discovery → │  │ (Template →   │  │ (Cloudflare/     │  │
│  │  Expansion)  │  │  Agent Loop)  │  │  Vercel)         │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    E2B Sandbox Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Pre-configured Templates                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │ Next.js  │  │  React   │  │  Claude  │  │  Data  │ │ │
│  │  │ Fullstack│  │   Vite   │  │   Code   │  │ Science│ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────┐ │
│  │ Auth.js │  │ SQLite │  │Cloudfl.│  │ Resend │  │  MCP  │ │
│  │ (Auth)  │  │  (DB)  │  │(Deploy)│  │(Email) │  │(Tools)│ │
│  └─────────┘  └────────┘  └────────┘  └────────┘  └───────┘ │
│                   ↓            ↓            ↓                │
│              [Zero-Config: Works without external services]  │
│              [Upgrades: Turso, Vercel, UploadThing, etc.]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Decisions (Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | SQLite (libSQL) | Zero config, embedded, Turso upgrade path |
| **ORM** | Drizzle | No binary, edge-ready, faster cold starts |
| **Auth** | Auth.js v5 | Works without OAuth keys, SQLite sessions |
| **Email** | React Email + Resend | Console fallback when no key |
| **Uploads** | UploadThing | Local folder fallback when no key |
| **Deployment** | Cloudflare/Vercel | Both supported, user choice |

## Open Decisions

1. **Deployment Default**: Cloudflare Pages vs Vercel?
2. **System Key Injection**: How to inject keys for feature verification during builds?
3. **Billing Model**: Usage-based vs subscription for autonomous builds?

---

## Next Steps

1. ✅ Create master plan (this document)
2. ⏳ Create Phase 1 detailed plan
3. 📋 Create template directory structure
4. 📋 Implement first custom template
5. 📋 Test environment discovery

---

## Related Documents

- [E2B Template Reference](./e2b-template-reference.md) - Research on E2B template capabilities
- [Phase 1: Template Foundation](./01-phase-template-foundation.md) - First implementation phase
- [Wizard Configuration](../apps/web/src/lib/wizard/config.ts) - Current wizard options

