---
sidebar_position: 3
---

# Database Schema

The platform uses PostgreSQL with Prisma ORM.

## Entity Relationship Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────<│  Project │────<│  Build   │
└──────────┘     └──────────┘     └────┬─────┘
     │                │                │
     │                │           ┌────┴────┐
     │                │           │         │
     ▼                ▼           ▼         ▼
┌──────────┐    ┌──────────┐  ┌────────┐ ┌────────────┐
│ ChatSess │    │  AppSpec │  │BuildLog│ │ BuildEvent │
└──────────┘    └──────────┘  └────────┘ └────────────┘
```

## Models

### User

Represents authenticated users.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key (CUID) |
| `clerkId` | String | Clerk user ID |
| `email` | String | User email |
| `name` | String? | Display name |

### Project

Organizes builds into projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `name` | String | Project name |
| `description` | String? | Project description |
| `userId` | String | Owner reference |

### Build

Tracks autonomous build execution.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `status` | BuildStatus | Current status |
| `appSpec` | Text | App specification content |
| `sandboxId` | String? | Cloud sandbox ID |
| `progress` | JSON? | Feature progress state |
| `outputUrl` | String? | Download URL |
| `artifactKey` | String? | Storage key for artifacts |

### BuildStatus Enum

```prisma
enum BuildStatus {
  PENDING
  INITIALIZING
  RUNNING
  PAUSED
  AWAITING_DESIGN_REVIEW
  AWAITING_FEATURE_REVIEW
  COMPLETED
  FAILED
  CANCELLED
}
```

### BuildLog

Detailed logs from build execution.

| Field | Type | Description |
|-------|------|-------------|
| `level` | String | Log level (info, warn, error, tool) |
| `message` | Text | Log message |
| `metadata` | JSON? | Additional context |

### BuildEvent

Structured events for the activity feed.

| Field | Type | Description |
|-------|------|-------------|
| `type` | String | Event type (file_created, command_run, etc.) |
| `data` | JSON | Event-specific data |

## Indexes

The schema includes optimized indexes for common queries:

- `builds.userId` - Filter by user
- `builds.status` - Filter by status
- `builds.createdAt` - Sort by date
- `build_logs.buildId` - Fetch logs for a build
- `build_events.buildId` - Fetch events for a build

## Migrations

Run migrations with:

```bash
pnpm --filter @repo/database db:migrate
```

Generate a new migration:

```bash
pnpm --filter @repo/database db:migrate:dev --name your_migration_name
```

