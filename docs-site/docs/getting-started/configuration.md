---
sidebar_position: 2
---

# Configuration

The platform uses environment variables for configuration. Create a `.env` file in the root directory based on `.env.example`.

## Required Variables

### Anthropic API

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Your Anthropic API key for Claude models.

### E2B Sandbox

```bash
E2B_API_KEY=e2b_...
```

API key for E2B cloud sandboxes where agents execute code.

### Database

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/autonomous_agents
```

PostgreSQL connection string.

### Clerk Authentication

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Clerk authentication keys for user management.

## Optional Variables

### Storage (S3)

For production artifact storage:

```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Local Storage

For development, artifacts can be stored locally:

```bash
LOCAL_STORAGE_PATH=./storage
```

## Environment-Specific Configuration

### Development

The development server automatically loads `.env` files. You can also use `.env.local` for local overrides.

### Production

For production deployments (e.g., Fly.io), set environment variables through your hosting platform's dashboard or CLI.

