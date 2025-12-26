---
sidebar_position: 1
---

# Introduction

Welcome to the **Autonomous Agents Platform** documentation.

This platform enables you to:

1. **Chat your way** to defining an app spec through conversation
2. **Or use a step-by-step wizard** to configure the app spec
3. **Launch autonomous builds** in secure cloud sandboxes
4. **Monitor progress** in real-time via streaming UI
5. **Extend to other domains** beyond coding (AI workflows, research, etc.)

## Overview

The Autonomous Agents Platform is a web application that transforms the CLI-based autonomous coding agent into a user-friendly interface. It leverages the Claude Agent SDK to run autonomous AI agents in secure cloud sandboxes.

## Quick Links

- [Installation Guide](/docs/getting-started/installation) - Get the platform running locally
- [Configuration](/docs/getting-started/configuration) - Environment variables and setup
- [Architecture Overview](/docs/architecture/overview) - Understand how the system works
- [API Reference](/docs/api) - Detailed API documentation

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | pnpm workspaces + Turborepo | Fast builds, shared deps |
| **Web** | Next.js 16 (App Router) | Dashboard, API routes, streaming |
| **UI** | Tailwind + shadcn/ui | Modern, accessible components |
| **Database** | Prisma + PostgreSQL | Builds, projects, users |
| **Auth** | Clerk | Authentication & user management |
| **Realtime** | Server-Sent Events | Streaming agent output |
| **Agent** | Claude Agent SDK | Core AI integration |
| **Sandboxes** | E2B / Daytona | Secure agent execution |
