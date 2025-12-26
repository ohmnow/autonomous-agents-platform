# Phase 2: Graceful Degradation Services

**Status:** Planning  
**Priority:** High  
**Estimated Duration:** 2-3 weeks  
**Dependencies:** Phase 1 (Template Foundation)

---

## Objective

Enable apps to work **immediately out of the box with zero external API keys**, then gracefully upgrade features when users provide their own keys for production.

> **Design Principle:** Everything works out of the box with zero external API keys. Features gracefully upgrade when keys are provided.

---

## Problem Statement

Traditional approaches require users to:
1. Create accounts with various services (Clerk, database providers, etc.)
2. Generate API keys before the app can even start
3. Configure environment variables
4. Debug connection issues

This creates friction and prevents the "plan once, build autonomously" experience.

**Previous approach (org-level keys)** had issues:
- Required us to manage and secure org keys
- Created vendor lock-in during development
- Made local development more complex
- Billing complexity for shared resources

---

## Solution: Zero-Config with Graceful Degradation

### How It Works

1. **Build Phase**: App works immediately with **no external services**
   - Auth: Credentials-based login with SQLite sessions
   - Database: Embedded SQLite file (`./data/app.db`)
   - Email: Console logging + file (`./data/emails.log`)
   - Uploads: Local filesystem (`./public/uploads/`)

2. **Verification Phase** (Optional): System injects temporary keys
   - For feature verification during autonomous builds
   - Keys removed after verification
   - Ensures email/upload features work correctly

3. **Production Phase**: User adds their own keys
   - UI shows "Add your API keys to enable full features"
   - Keys stored in `.env.local` or deployment environment
   - Features automatically upgrade when keys detected

---

## Service Stack (Zero-Config First)

### Authentication: Auth.js v5

**Why Auth.js over Clerk?**
- **Zero API keys required** for credentials-based auth
- SQLite session storage (no Redis needed)
- Upgrades to OAuth when keys are provided
- Full control, no vendor lock-in

**Zero-Config Mode:**
```typescript
// Works immediately with no external services
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db), // SQLite via Drizzle
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Local validation against SQLite
        return validateUser(credentials);
      }
    }),
  ],
  session: { strategy: "database" }, // SQLite-backed sessions
});
```

**With OAuth Keys (Optional Upgrade):**
```typescript
// These activate only when env vars are present
providers: [
  Credentials({ ... }),
  ...(process.env.GOOGLE_CLIENT_ID ? [Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })] : []),
  ...(process.env.GITHUB_CLIENT_ID ? [GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  })] : []),
],
```

### Database: SQLite (libSQL)

**Why SQLite over Neon/Turso/Supabase?**
- **Zero configuration** — No connection strings, no accounts
- **Embedded** — Database file lives in the project
- **Portable** — User can download their entire database
- **Turso-compatible** — Easy upgrade to edge replication

**Zero-Config Mode:**
```typescript
// Works immediately, no env vars needed
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({ 
  url: 'file:./data/app.db' // Local file, zero config
});
export const db = drizzle(client);
```

**With Turso (Optional Upgrade):**
```typescript
// Automatically uses Turso when DATABASE_URL is set
const client = createClient({ 
  url: process.env.DATABASE_URL || 'file:./data/app.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
```

### Email: React Email + Resend

**Zero-Config Mode:**
```typescript
// lib/email.ts
import { Resend } from 'resend';
import fs from 'fs/promises';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(options: EmailOptions) {
  if (resend) {
    // Production: Send via Resend
    return resend.emails.send(options);
  } else {
    // Development: Log to console + write to file
    console.log('📧 EMAIL (dev mode):', {
      to: options.to,
      subject: options.subject,
    });
    
    // Write to local file for inspection
    await fs.appendFile(
      './data/emails.log',
      JSON.stringify({ ...options, timestamp: new Date() }) + '\n'
    );
    
    return { id: `dev-${Date.now()}` };
  }
}
```

### File Uploads: UploadThing

**Zero-Config Mode:**
```typescript
// lib/upload.ts
import fs from 'fs/promises';

export async function uploadFile(file: File): Promise<UploadResult> {
  if (process.env.UPLOADTHING_SECRET) {
    // Production: Use UploadThing
    return uploadToUploadThing(file);
  } else {
    // Development: Local file storage
    const filename = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(`./public/uploads/${filename}`, buffer);
    
    return {
      url: `/uploads/${filename}`,
      key: filename,
      name: file.name,
      size: file.size,
    };
  }
}
```

**File Structure:**
```
public/
  uploads/           # Local uploads (dev mode)
    .gitkeep
data/
  app.db            # SQLite database
  emails.log        # Email log (dev mode)
```

---

## Deliverables

### 1. Graceful Degradation Utilities

Pre-built utilities that automatically detect and use available services:

```typescript
// src/lib/db/index.ts - Database with Turso upgrade
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({ 
  url: process.env.DATABASE_URL || 'file:./data/app.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client);

// Helper to check if using remote database
export const isRemoteDatabase = () => !!process.env.DATABASE_URL;
```

```typescript
// src/lib/email.ts - Email with Resend upgrade
import { Resend } from 'resend';
import fs from 'fs/promises';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  const from = options.from || 'onboarding@resend.dev';
  
  if (resend) {
    return resend.emails.send({ ...options, from });
  }
  
  // Development fallback
  console.log('📧 EMAIL (dev mode):', { to: options.to, subject: options.subject });
  await fs.appendFile('./data/emails.log', JSON.stringify({ ...options, timestamp: new Date() }) + '\n');
  return { id: `dev-${Date.now()}` };
}

export const isEmailEnabled = () => !!process.env.RESEND_API_KEY;
```

```typescript
// src/lib/upload.ts - Uploads with UploadThing upgrade
import fs from 'fs/promises';
import path from 'path';

interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  if (process.env.UPLOADTHING_SECRET) {
    // Production: Use UploadThing
    const { uploadToUploadThing } = await import('./uploadthing');
    return uploadToUploadThing(file);
  }
  
  // Development: Local file storage
  const filename = `${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join('./public/uploads', filename), buffer);
  
  return {
    url: `/uploads/${filename}`,
    key: filename,
    name: file.name,
    size: file.size,
  };
}

export const isCloudUploadEnabled = () => !!process.env.UPLOADTHING_SECRET;
```

### 2. System Key Injection (For Verification)

For autonomous build verification, the system can temporarily inject keys:

```typescript
// packages/build-runner/src/key-injection.ts
interface SystemKeys {
  RESEND_API_KEY?: string;
  UPLOADTHING_SECRET?: string;
}

const SYSTEM_KEYS: SystemKeys = {
  RESEND_API_KEY: process.env.SYSTEM_RESEND_KEY,
  UPLOADTHING_SECRET: process.env.SYSTEM_UPLOADTHING_SECRET,
};

export async function verifyFeaturesWithKeys(sandbox: Sandbox) {
  // Inject system keys temporarily
  await sandbox.setEnv(SYSTEM_KEYS);
  
  // Run feature verification tests
  const results = await runFeatureTests(sandbox);
  
  // Remove system keys
  await sandbox.unsetEnv(Object.keys(SYSTEM_KEYS));
  
  return results;
}
```

### 3. Feature Status Component

Shows users what features are active and how to enable more:

```typescript
// src/components/settings/feature-status.tsx
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, ExternalLink } from 'lucide-react';

interface FeatureStatusProps {
  features: {
    database: { enabled: boolean; provider: 'sqlite' | 'turso' };
    email: { enabled: boolean; provider: 'console' | 'resend' };
    uploads: { enabled: boolean; provider: 'local' | 'uploadthing' };
    oauth: { enabled: boolean; providers: string[] };
  };
}

export function FeatureStatus({ features }: FeatureStatusProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Feature Status</h2>
        <p className="text-sm text-muted-foreground">
          Your app works without API keys. Add keys to enable production features.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeatureRow
          name="Database"
          status={features.database.provider === 'turso' ? 'production' : 'development'}
          description={
            features.database.provider === 'turso'
              ? 'Connected to Turso (edge-replicated)'
              : 'Using local SQLite file'
          }
          upgradeUrl="https://turso.tech"
          envVar="DATABASE_URL"
        />
        <FeatureRow
          name="Email"
          status={features.email.provider === 'resend' ? 'production' : 'development'}
          description={
            features.email.provider === 'resend'
              ? 'Sending via Resend'
              : 'Logging to console + file'
          }
          upgradeUrl="https://resend.com"
          envVar="RESEND_API_KEY"
        />
        <FeatureRow
          name="File Uploads"
          status={features.uploads.provider === 'uploadthing' ? 'production' : 'development'}
          description={
            features.uploads.provider === 'uploadthing'
              ? 'Uploading to UploadThing'
              : 'Saving to local /uploads folder'
          }
          upgradeUrl="https://uploadthing.com"
          envVar="UPLOADTHING_SECRET"
        />
        <FeatureRow
          name="OAuth Login"
          status={features.oauth.enabled ? 'production' : 'development'}
          description={
            features.oauth.enabled
              ? `Enabled: ${features.oauth.providers.join(', ')}`
              : 'Using credentials only (email/password)'
          }
          upgradeUrl="https://console.cloud.google.com"
          envVar="GOOGLE_CLIENT_ID"
        />
      </CardContent>
    </Card>
  );
}
```

### 4. Environment Variable Generator

Generates `.env.local` content for users:

```typescript
// src/lib/env-generator.ts
export function generateEnvFile(keys: Partial<UserKeys>): string {
  const lines: string[] = [
    '# Generated environment variables',
    '# Add these to your .env.local or deployment platform',
    '',
  ];
  
  if (keys.databaseUrl) {
    lines.push('# Database (Turso)');
    lines.push(`DATABASE_URL=${keys.databaseUrl}`);
    if (keys.databaseToken) {
      lines.push(`DATABASE_AUTH_TOKEN=${keys.databaseToken}`);
    }
    lines.push('');
  }
  
  if (keys.resendApiKey) {
    lines.push('# Email (Resend)');
    lines.push(`RESEND_API_KEY=${keys.resendApiKey}`);
    lines.push('');
  }
  
  if (keys.uploadthingSecret) {
    lines.push('# File Uploads (UploadThing)');
    lines.push(`UPLOADTHING_SECRET=${keys.uploadthingSecret}`);
    lines.push(`UPLOADTHING_APP_ID=${keys.uploadthingAppId || ''}`);
    lines.push('');
  }
  
  if (keys.googleClientId) {
    lines.push('# OAuth - Google');
    lines.push(`GOOGLE_CLIENT_ID=${keys.googleClientId}`);
    lines.push(`GOOGLE_CLIENT_SECRET=${keys.googleClientSecret || ''}`);
    lines.push('');
  }
  
  if (keys.githubClientId) {
    lines.push('# OAuth - GitHub');
    lines.push(`GITHUB_CLIENT_ID=${keys.githubClientId}`);
    lines.push(`GITHUB_CLIENT_SECRET=${keys.githubClientSecret || ''}`);
    lines.push('');
  }
  
  return lines.join('\n');
}
```

---

## Environment Variables

```bash
# .env.example

# ============================================
# REQUIRED: None! Everything works without keys.
# ============================================

# ============================================
# OPTIONAL: Add these to enable full features
# ============================================

# Auth Providers (enables OAuth login)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# Email (enables real email sending)
# RESEND_API_KEY=

# File Uploads (enables cloud storage)
# UPLOADTHING_SECRET=
# UPLOADTHING_APP_ID=

# Database (upgrade from local SQLite)
# DATABASE_URL=           # Turso or PostgreSQL
# DATABASE_AUTH_TOKEN=    # Turso auth token

# ============================================
# GENERATED: Auto-generated, do not edit
# ============================================
AUTH_SECRET=             # Generated on first run
```

---

## Upgrade Paths

When users need more:

| Need | Zero-Config | Upgraded |
|------|-------------|----------|
| **Scale database** | SQLite (local) | Turso (edge replicas) |
| **OAuth login** | Credentials only | Add Google/GitHub keys |
| **Production email** | Console logging | Add Resend key |
| **Cloud uploads** | Local `/uploads` | Add UploadThing keys |
| **Payments** | None | Add Stripe keys |
| **Analytics** | None | Add Vercel Analytics or Plausible |

---

## Implementation Tasks

### Week 1: Graceful Degradation Utilities

- [ ] Create `lib/db/index.ts` with SQLite/Turso fallback
- [ ] Create `lib/email.ts` with console/Resend fallback  
- [ ] Create `lib/upload.ts` with local/UploadThing fallback
- [ ] Create `lib/auth.ts` with credentials/OAuth fallback
- [ ] Test all utilities work without keys

### Week 2: Template Integration

- [ ] Add graceful degradation utilities to template
- [ ] Create Feature Status component
- [ ] Create Environment Variable Generator
- [ ] Update template manifest with degradation info
- [ ] Test full build with zero keys

### Week 3: Verification System (Optional)

- [ ] Create system key injection for verification
- [ ] Add feature verification tests
- [ ] Document verification flow
- [ ] Test email/upload features with injected keys
- [ ] Ensure keys are removed after verification

---

## Security Considerations

1. **No Org Keys Required**
   - Apps work without any external keys
   - No shared infrastructure to secure
   - Users own all their data from day one

2. **System Key Injection (If Used)**
   - Keys injected only during verification
   - Automatically removed after tests
   - Never persisted in built app

3. **User Data Isolation**
   - Each build has its own SQLite file
   - No cross-build data access
   - Users can download their entire database

---

## Success Criteria

| Feature | Verified |
|---------|----------|
| App works immediately after build (no keys) | ⬜ |
| Auth works with credentials (no OAuth keys) | ⬜ |
| Database works with SQLite (no connection string) | ⬜ |
| Email logs to file (no Resend key) | ⬜ |
| File uploads save locally (no UploadThing key) | ⬜ |
| Feature Status component shows current state | ⬜ |
| User can add keys and features auto-upgrade | ⬜ |
| OAuth activates when Google/GitHub keys added | ⬜ |

---

## What's NOT Included (and Why)

| Omitted | Reason | Alternative |
|---------|--------|-------------|
| **Clerk** | Requires API keys, no zero-config option | Auth.js with credentials |
| **Prisma** | Binary engine bloats containers, slower cold start | Drizzle |
| **Redis** | Overkill for most apps, requires external service | SQLite for sessions/cache |
| **Supabase** | Requires project setup, not truly zero-config | SQLite + upgrade path to Turso |
| **tRPC** | Server Actions + Zod provide 90% of the value | Add if building multi-client monorepo |

---

## Next Phase

Once Phase 2 is complete, proceed to [Phase 3: Build Quality & Speed](./03-phase-build-quality.md).



