---
sidebar_position: 1
---

# Roadmap Overview

This document outlines the development roadmap for the Autonomous Agents Platform.

## Vision

**"Plan once, build autonomously."**

An Autonomous App Factory where users define what they want through guided planning, then our system builds production-ready applications while they focus on other things.

## Phases

### Phase 1: Template Foundation

**Goal:** Pre-configured E2B templates that eliminate cold-start setup time

- Create `nextjs-shadcn-fullstack` template
- Environment discovery system
- Dynamic template selection
- Context-aware agent prompts

### Phase 2: Zero-Config Services

**Goal:** Apps that work immediately with zero API keys, upgrade when keys provided

- Auth.js v5 with credentials (works without OAuth keys)
- SQLite database (embedded, zero config)
- Email logging fallback (console + file, upgrades to Resend)
- File upload fallback (local storage, upgrades to UploadThing)

### Phase 3: Build Quality and Speed

**Goal:** Faster, more reliable autonomous builds

- Sandbox persistence for long builds
- Build resumption on failure
- Parallel feature implementation
- Better progress tracking

### Phase 4: Deployment Pipeline

**Goal:** One-click deployment to production

- Cloudflare/Vercel integration
- Automatic domain setup
- SSL/CDN configuration
- Environment variable management

### Phase 5: Non-Code Workflows

**Goal:** Autonomous agents for knowledge worker tasks

- Claude Code template integration
- MCP Gateway for external tools
- Workflow templates (email, calendar, research)
- Scheduled/triggered execution

### Phase 6: Extended Platforms

**Goal:** Beyond web apps

- Mobile templates (Expo)
- Desktop templates (Electron)
- API-only templates
- Chrome extension templates

## Success Metrics

| Metric | Current | Phase 1 Target | Long-term Target |
|--------|---------|----------------|------------------|
| Cold start time | ~75s | ~5s | less than 3s |
| Time to first feature | ~10min | ~2min | ~30s |
| Build completion rate | TBD | more than 80% | more than 95% |
| User intervention needed | High | Low | Minimal |

## Core Principles

1. **Autonomy First** - Build while users do other things
2. **Production Quality** - Not prototypes, but deployable apps
3. **Zero Configuration** - Works out of the box with NO external API keys required
4. **Graceful Degradation** - Features upgrade automatically when keys are provided
5. **Predictable Outcomes** - Consistent quality through standardized templates

