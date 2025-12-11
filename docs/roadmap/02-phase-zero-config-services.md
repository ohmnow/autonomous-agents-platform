# Phase 2: Zero-Config Services

**Status:** Planning  
**Priority:** High  
**Estimated Duration:** 2-3 weeks  
**Dependencies:** Phase 1 (Template Foundation)

---

## Objective

Enable apps to work immediately out of the box with organization-level API keys, then allow users to "bring their own keys" for production deployment.

---

## Problem Statement

Currently, built apps require users to:
1. Create accounts with various services (Clerk, database, etc.)
2. Generate API keys
3. Configure environment variables
4. Debug connection issues

This creates friction and prevents the "plan once, build autonomously" experience.

---

## Solution: Org-Level Keys + BYOK

### How It Works

1. **Build Phase**: App uses our organization's API keys
   - Clerk: Our org's development keys
   - Database: Shared development database or auto-provisioned
   - Storage: Our R2/S3 bucket with user-scoped paths

2. **Handoff Phase**: User downloads/deploys the app
   - App includes a "Settings" page for key management
   - Guided flow to replace org keys with user's own keys
   - Validation before switching to production keys

3. **Production Phase**: App uses user's own keys
   - Full data ownership
   - No dependency on our infrastructure
   - User pays their own service costs

---

## Service Stack

### Authentication: Clerk

**Why Clerk?**
- Generous free tier (10,000 MAU)
- Works with org-level keys in dev mode
- Easy to swap keys via environment variables
- Pre-built components (SignIn, SignUp, UserButton)

**Implementation:**
```typescript
// Org-level Clerk configuration in template
// .env.local (injected during build)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_org_xxx
CLERK_SECRET_KEY=sk_test_org_xxx

// User can override later
// .env.production (user provides)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_user_xxx
CLERK_SECRET_KEY=sk_live_user_xxx
```

### Database: Turso (SQLite at Edge) or Neon (PostgreSQL)

**Option A: Turso**
- SQLite-compatible (simpler, portable)
- Edge-native
- Free tier: 9GB storage, 500M rows read
- Easy local development (just a file)

**Option B: Neon**
- Full PostgreSQL
- Serverless (scale to zero)
- Free tier: 0.5 GB storage
- Better for complex queries

**Recommendation:** Start with **Turso** for MVP
- Simpler mental model
- SQLite file can be downloaded as artifact
- Works offline during development

**Implementation:**
```typescript
// Auto-provisioned database per build
// Each build gets a unique database URL
TURSO_DATABASE_URL=libsql://build-{buildId}-{orgId}.turso.io
TURSO_AUTH_TOKEN=org_token_xxx

// Prisma schema uses SQLite provider
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("TURSO_DATABASE_URL")
}
```

### File Storage: Cloudflare R2

**Why R2?**
- S3-compatible API
- No egress fees
- Free tier: 10GB storage, 10M operations
- Works with existing S3 tooling

**Implementation:**
```typescript
// Org-level R2 configuration
R2_ACCESS_KEY_ID=org_xxx
R2_SECRET_ACCESS_KEY=org_secret_xxx
R2_BUCKET=autonomous-builds
R2_USER_PREFIX=builds/{buildId}/  // Scoped per build
```

### Payments: Stripe (Test Mode)

**Implementation:**
- All builds use Stripe test mode by default
- Products/prices created in test mode work immediately
- User swaps to their own Stripe account for production

```typescript
// Test mode keys (our org)
STRIPE_PUBLISHABLE_KEY=pk_test_org_xxx
STRIPE_SECRET_KEY=sk_test_org_xxx

// Production (user provides)
STRIPE_PUBLISHABLE_KEY=pk_live_user_xxx
STRIPE_SECRET_KEY=sk_live_user_xxx
```

---

## Deliverables

### 1. Org Key Management System

```typescript
// packages/org-keys/src/types.ts
interface OrgKeyConfig {
  clerk: {
    publishableKey: string;
    secretKey: string;
  };
  turso: {
    orgToken: string;
    createDatabaseEndpoint: string;
  };
  r2: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint: string;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
  };
}

// Injected into sandbox environment
function getEnvVarsForBuild(buildId: string, config: OrgKeyConfig): Record<string, string> {
  return {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: config.clerk.publishableKey,
    CLERK_SECRET_KEY: config.clerk.secretKey,
    
    // Turso (unique DB per build)
    TURSO_DATABASE_URL: `libsql://build-${buildId}.turso.io`,
    TURSO_AUTH_TOKEN: config.turso.orgToken,
    
    // R2 (scoped path per build)
    R2_ACCESS_KEY_ID: config.r2.accessKeyId,
    R2_SECRET_ACCESS_KEY: config.r2.secretAccessKey,
    R2_BUCKET: config.r2.bucket,
    R2_PREFIX: `builds/${buildId}/`,
    
    // Stripe (test mode)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: config.stripe.publishableKey,
    STRIPE_SECRET_KEY: config.stripe.secretKey,
  };
}
```

### 2. Database Auto-Provisioning

```typescript
// packages/database-provisioner/src/turso.ts
import { createClient } from '@libsql/client';

async function provisionDatabase(buildId: string): Promise<DatabaseInfo> {
  // Create new database for this build
  const response = await fetch('https://api.turso.tech/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TURSO_ORG_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `build-${buildId}`,
      group: 'default',
    }),
  });
  
  const db = await response.json();
  
  return {
    url: db.hostname,
    token: db.token,
  };
}
```

### 3. BYOK Settings Component

```typescript
// Template includes this component
// src/components/settings/api-keys.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ApiKeySettings() {
  const [keys, setKeys] = useState({
    clerkPublishable: '',
    clerkSecret: '',
    databaseUrl: '',
    // ...
  });
  
  return (
    <Card>
      <CardHeader>
        <h2>API Keys</h2>
        <p>Replace development keys with your own for production.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label>Clerk Publishable Key</label>
            <Input 
              placeholder="pk_live_xxx"
              value={keys.clerkPublishable}
              onChange={(e) => setKeys({...keys, clerkPublishable: e.target.value})}
            />
            <a href="https://clerk.com" target="_blank">Get keys from Clerk →</a>
          </div>
          {/* More key inputs... */}
          <Button onClick={handleSave}>
            Validate & Save Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Key Validation System

Before switching to user keys, validate they work:

```typescript
// src/lib/validate-keys.ts
export async function validateKeys(keys: UserKeys): Promise<ValidationResult> {
  const results: ValidationResult = {
    clerk: { valid: false, error: null },
    database: { valid: false, error: null },
    stripe: { valid: false, error: null },
  };
  
  // Validate Clerk
  try {
    const clerk = createClerkClient({ secretKey: keys.clerkSecret });
    await clerk.users.getCount();
    results.clerk.valid = true;
  } catch (e) {
    results.clerk.error = 'Invalid Clerk secret key';
  }
  
  // Validate Database
  try {
    const db = createClient({ url: keys.databaseUrl, authToken: keys.databaseToken });
    await db.execute('SELECT 1');
    results.database.valid = true;
  } catch (e) {
    results.database.error = 'Cannot connect to database';
  }
  
  // Validate Stripe
  try {
    const stripe = new Stripe(keys.stripeSecret);
    await stripe.accounts.retrieve();
    results.stripe.valid = true;
  } catch (e) {
    results.stripe.error = 'Invalid Stripe secret key';
  }
  
  return results;
}
```

---

## Implementation Tasks

### Week 1: Org Key Infrastructure

- [ ] Create org key management package
- [ ] Set up Turso org account and API access
- [ ] Set up Cloudflare R2 bucket
- [ ] Configure Clerk org-level keys
- [ ] Create Stripe test mode setup

### Week 2: Auto-Provisioning

- [ ] Implement database auto-provisioning
- [ ] Create scoped R2 paths per build
- [ ] Inject environment variables into sandbox
- [ ] Update template to use environment variables
- [ ] Test full build with auto-provisioned services

### Week 3: BYOK UI

- [ ] Create API key settings component
- [ ] Implement key validation
- [ ] Create .env file generator
- [ ] Document key replacement process
- [ ] Test end-to-end BYOK flow

---

## Security Considerations

1. **Org Key Protection**
   - Keys stored in encrypted environment variables
   - Never exposed to client-side code
   - Scoped permissions where possible

2. **User Data Isolation**
   - Each build gets unique database
   - R2 paths scoped per build
   - No cross-build data access

3. **Key Rotation**
   - Org keys rotated regularly
   - Build-specific tokens expire after download

---

## Success Criteria

| Feature | Verified |
|---------|----------|
| App works immediately after build | ⬜ |
| Auth (Clerk) functional with org keys | ⬜ |
| Database created and connected | ⬜ |
| File uploads work with R2 | ⬜ |
| Payments work in test mode | ⬜ |
| User can replace keys via settings UI | ⬜ |
| Keys validate before activation | ⬜ |

---

## Next Phase

Once Phase 2 is complete, proceed to [Phase 3: Build Quality & Speed](./03-phase-build-quality.md).
