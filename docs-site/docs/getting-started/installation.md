---
sidebar_position: 1
---

# Installation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install with `npm install -g pnpm`
- **PostgreSQL** - Local instance or cloud provider
- **Anthropic API key** - [Get one here](https://console.anthropic.com/)
- **E2B API key** - [Sign up for E2B](https://e2b.dev/)

## Clone the Repository

```bash
git clone https://github.com/ohmnow/autonomous-agents-platform.git
cd autonomous-agents-platform
```

## Install Dependencies

```bash
pnpm install
```

## Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your API keys. See [Configuration](/docs/getting-started/configuration) for details.

## Initialize the Database

Generate the Prisma client:

```bash
pnpm --filter @repo/database db:generate
```

Push the schema to your database (development):

```bash
pnpm --filter @repo/database db:push
```

Or run migrations (production):

```bash
pnpm --filter @repo/database db:migrate
```

## Build All Packages

```bash
pnpm build
```

## Start Development Server

```bash
pnpm dev
```

The web application will be available at [http://localhost:3000](http://localhost:3000).

