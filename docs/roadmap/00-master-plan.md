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
3. **Zero Configuration** - Works out of the box with org-level keys
4. **Bring Your Own Keys** - Users can swap in their own API keys later
5. **Predictable Outcomes** - Consistent quality through standardized templates

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

### Core Framework
**Vite + React + TypeScript** with Next.js for full-stack capabilities

### Why This Stack?
- **Vite**: Fast dev experience, modern tooling
- **React**: Largest ecosystem, most AI training data
- **Next.js**: SSR, API routes, edge functions, proven at scale
- **TypeScript**: Type safety, better AI code generation

### UI Layer
- **Tailwind CSS**: Utility-first, predictable output
- **shadcn/ui**: Accessible components, customizable

### Backend Services (Zero-Config with Org Keys)

| Service | Purpose | Why This Choice |
|---------|---------|-----------------|
| **Clerk** | Authentication | Generous free tier, easy setup, org-level keys work |
| **Neon** or **Turso** | Database | Serverless PostgreSQL/SQLite, free tiers, edge-ready |
| **Cloudflare** | Hosting/Edge | Free tier, global edge, R2 storage |
| **Vercel** | Alternative hosting | Seamless Next.js integration |
| **Stripe** | Payments | Industry standard, test mode by default |

### The "Bring Your Own Keys" Flow
1. App builds with our org-level keys (works immediately)
2. User downloads/deploys the app
3. UI prompts user to add their own keys for production
4. Keys stored in environment variables, not code

---

## Phased Implementation

### Phase 1: Template Foundation ⏳
**Goal:** Pre-configured E2B templates that eliminate cold-start setup time

- [Phase 1 Plan →](./01-phase-template-foundation.md)
- Create `nextjs-shadcn-fullstack` template
- Environment discovery system
- Dynamic template selection
- Context-aware agent prompts

### Phase 2: Zero-Config Services 📋
**Goal:** Apps that work immediately with org-level API keys

- [Phase 2 Plan →](./02-phase-zero-config-services.md)
- Clerk integration (auth works out of box)
- Database setup (Neon/Turso auto-provisioning)
- Environment variable injection
- "Bring Your Own Keys" UI component

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
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────┐ │
│  │ Clerk  │  │  Neon  │  │Cloudfl.│  │ Stripe │  │  MCP  │ │
│  │ (Auth) │  │  (DB)  │  │(Deploy)│  │(Paymnt)│  │(Tools)│ │
│  └────────┘  └────────┘  └────────┘  └────────┘  └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Open Decisions

1. **Database Choice**: Neon (PostgreSQL) vs Turso (SQLite) vs Supabase?
2. **Deployment Default**: Cloudflare Pages vs Vercel?
3. **Org Key Management**: How to securely store and inject org-level keys?
4. **Billing Model**: How does "bring your own keys" affect our pricing?

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
