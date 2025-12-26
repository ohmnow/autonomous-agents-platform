---
sidebar_position: 2
---

# Packages

The platform is organized into several packages, each with a specific responsibility.

## @repo/agent-core

Core functionality for running autonomous agents.

### Key Exports

- **`runAgentInSandbox`** - Main function to execute agent sessions
- **`codingHarness`** - Pre-configured harness for coding tasks
- **`bashSecurityHook`** - Allowlist-based command validation
- **`ProgressTracker`** - Parse and track feature progress

### Example Usage

```typescript
import {
  runAgentInSandbox,
  codingHarness,
  bashSecurityHook,
} from '@repo/agent-core';

const result = await runAgentInSandbox({
  sandbox,
  harness: codingHarness,
  appSpec: specContent,
  securityHook: bashSecurityHook(codingHarness.allowedCommands),
});
```

## @repo/sandbox-providers

Unified interface for cloud sandbox providers.

### Supported Providers

| Provider | Status | Best For |
|----------|--------|----------|
| **E2B** | ✅ Implemented | Fast prototyping, ephemeral builds |
| **Daytona** | 🚧 Planned | Development environments, persistence |

### Example Usage

```typescript
import { createSandbox, e2bProvider } from '@repo/sandbox-providers';

const sandbox = await createSandbox('e2b', {
  template: 'base',
  timeout: 300,
});

await sandbox.exec('npm init -y');
await sandbox.writeFile('index.js', 'console.log("Hello!")');
```

## @repo/database

Database models and data access layer using Prisma.

### Models

- **User** - User accounts (integrated with Clerk)
- **Project** - Project organization
- **Build** - Build tracking and status
- **BuildLog** - Detailed build logs
- **BuildEvent** - Structured agent events
- **AppSpec** - Saved app specifications
- **ChatSession** - Chat conversation history

### Example Usage

```typescript
import { prisma, createBuild, getBuildWithLogs } from '@repo/database';

const build = await createBuild({
  userId: user.id,
  appSpec: specContent,
  harnessId: 'coding',
});

const buildWithLogs = await getBuildWithLogs(build.id);
```

## @repo/storage

Artifact storage abstraction supporting multiple backends.

### Providers

- **S3Provider** - AWS S3 for production
- **LocalProvider** - Local filesystem for development

### Example Usage

```typescript
import { createStorageProvider } from '@repo/storage';

const storage = createStorageProvider({
  type: 's3',
  bucket: 'my-bucket',
  region: 'us-east-1',
});

await storage.upload('builds/123/artifacts.zip', buffer);
const url = await storage.getSignedUrl('builds/123/artifacts.zip');
```

