# Production SaaS Features Analysis: Autonomous Agents Platform

**Date:** December 11, 2024  
**Version:** 1.0  
**Status:** Planning  
**Purpose:** Define production features for app preview, hosting, notifications, and deployment

---

## Executive Summary

This document analyzes the features needed to make the Autonomous Agents Platform a production-ready SaaS, focusing on:

1. **Client Communication & Notifications** - Alerting users when builds complete
2. **App Preview & Viewing** - Allowing users to see their completed app in a browser
3. **Hosting Options** - Subdomain hosting, custom domains, and deployment to external providers
4. **Mobile Companion App** - Push notifications and quick status checks

---

## Part 1: How Platforms Like Lovable Work

### The Pattern We Want to Copy

**Lovable's Architecture:**

1. **Development Sandbox** - Uses WebContainers (browser-based Node.js runtime) or server-side sandboxes for building
2. **Preview Subdomain** - Apps are published to `[project-slug].lovable.app` 
3. **Custom Domains** - Users can point their own domain via DNS (A + TXT records)
4. **SSL/TLS** - Automatic certificate provisioning for all domains

**How It Works:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUILD PHASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. User creates spec → Agent builds in sandbox (E2B)           │
│  2. Build artifacts stored (source code, compiled assets)       │
│  3. Build marked "complete"                                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PUBLISH PHASE                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Build artifacts deployed to preview environment             │
│  2. Assigned subdomain: project-abc123.youragents.app           │
│  3. SSL certificate provisioned                                  │
│  4. App is LIVE and accessible                                   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOM DOMAIN (Optional)                     │
├─────────────────────────────────────────────────────────────────┤
│  1. User adds custom domain: myapp.example.com                   │
│  2. User configures DNS: A record → Platform IP                 │
│  3. Platform verifies ownership (TXT record)                     │
│  4. SSL certificate issued (Let's Encrypt)                       │
│  5. Traffic routes: myapp.example.com → same app                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Technical Options for App Preview & Hosting

### Option A: Static Site Hosting (Simplest - For Frontend-Only Apps)

**How it works:**
- After build, extract static assets (HTML/CSS/JS)
- Upload to CDN/edge storage (Cloudflare R2, AWS S3, Vercel)
- Serve via wildcard subdomain

**Architecture:**
```
*.youragents.app → Cloudflare Workers/Vercel Edge
                 → Route to correct storage bucket
                 → Serve static files
```

**Pros:**
- Very cheap ($0.01/GB bandwidth)
- Fast (CDN edge locations)
- Simple to implement

**Cons:**
- No backend/database support
- Only works for static React/Vue/HTML apps

**Best for:** Landing pages, simple prototypes, SPAs with external APIs

---

### Option B: Container-Based Hosting (Full Stack Apps)

**How it works:**
- Package completed app as Docker container
- Deploy to container platform (Fly.io, Railway, Render)
- Dynamic subdomain routing

**Architecture (Fly.io Pattern):**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Router App                                    │
│            *.youragents.app → Wildcard DNS                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive request to: myapp-123.youragents.app                │
│  2. Extract subdomain → lookup in database                       │
│  3. Find target: app-id=myapp-123, machine-id=abc                │
│  4. fly-replay header → internal redirect                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User App (Container)                          │
│                    Fly Machine / Railway Service                 │
├─────────────────────────────────────────────────────────────────┤
│  - Node.js server running                                        │
│  - Database (SQLite file or managed Postgres)                    │
│  - Full backend functionality                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Full stack support (backend, database, APIs)
- True isolation between apps
- Can run any technology

**Cons:**
- More expensive (per-container pricing)
- Requires container orchestration
- Cold starts for hibernated containers

**Best for:** Production SaaS apps, apps with databases, full-stack applications

---

### Option C: WebContainers (Browser-Based Preview)

**How it works:**
- WebContainers API runs Node.js in the browser
- User's browser executes the code directly
- No server-side hosting needed for preview

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Dashboard                                │
├─────────────────────────────────────────────────────────────────┤
│  1. User clicks "Preview App"                                    │
│  2. Load WebContainer in iframe                                  │
│  3. Mount project files into container                           │
│  4. npm install && npm run dev                                   │
│  5. Display running app in preview pane                          │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- No hosting costs for preview
- Instant preview (no deployment step)
- Great for development iteration

**Cons:**
- Only works in modern browsers
- Limited to Node.js/browser-compatible stacks
- Not suitable for production hosting

**Best for:** Development preview, iteration, testing before deployment

---

### Option D: Hybrid Approach (Recommended)

Combine multiple strategies based on the app type:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Build Completion                              │
├─────────────────────────────────────────────────────────────────┤
│  Agent finishes → Artifacts stored in cloud storage              │
└─────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │   Preview    │ │   Publish    │ │   Export     │
   │ WebContainer │ │  Container   │ │   Deploy     │
   ├──────────────┤ ├──────────────┤ ├──────────────┤
   │ Browser-only │ │ Full hosting │ │ Vercel/      │
   │ Free preview │ │ yourapp.     │ │ Netlify/     │
   │ No URL       │ │ agents.app   │ │ External     │
   └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Part 3: How Custom Domains Work

### The Technical Pattern

**1. Wildcard DNS Setup:**
```
*.youragents.app  →  A record  →  Your Load Balancer IP
```

**2. Request Flow:**
```
User visits: myapp.youragents.app
           ↓
DNS resolves: 203.0.113.10 (your server)
           ↓
Your Server: Extract subdomain "myapp"
           ↓
Database lookup: myapp → project_id=abc123
           ↓
Route to correct container/storage
           ↓
Serve response
```

**3. Custom Domain Flow:**
```
User adds: mycoolapp.com to project
           ↓
System provides DNS instructions:
  - A record: 203.0.113.10
  - TXT record: verify-abc123 (ownership proof)
           ↓
User configures at registrar (GoDaddy, Namecheap, etc.)
           ↓
Platform polls for verification
           ↓
Issue SSL certificate (Let's Encrypt/Cloudflare)
           ↓
mycoolapp.com now serves the app
```

### Implementation with Cloudflare (Recommended)

**Why Cloudflare:**
- Free wildcard SSL
- Edge caching
- DDoS protection
- Easy API for certificate management

**Setup:**
1. Register `youragents.app` 
2. Configure Cloudflare as DNS provider
3. Enable Cloudflare for SaaS (wildcard + custom domains)
4. Use Cloudflare Workers for routing

```typescript
// Cloudflare Worker for routing
export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Extract subdomain or lookup custom domain
    let projectId: string;
    
    if (hostname.endsWith('.youragents.app')) {
      // Subdomain: myapp.youragents.app
      const subdomain = hostname.replace('.youragents.app', '');
      projectId = await lookupBySubdomain(subdomain);
    } else {
      // Custom domain: mycoolapp.com
      projectId = await lookupByCustomDomain(hostname);
    }
    
    // Route to correct origin
    return fetch(`https://origin.youragents.internal/${projectId}${url.pathname}`);
  }
}
```

---

## Part 4: Client Notifications

### Options for Alerting Users

**1. Email Notifications (Essential)**
```typescript
// When build completes
await sendEmail({
  to: user.email,
  subject: "🎉 Your app is ready!",
  template: 'build-complete',
  data: {
    appName: build.name,
    previewUrl: `https://${build.subdomain}.youragents.app`,
    buildDuration: formatDuration(build.duration),
  }
});
```

**2. Push Notifications (Mobile App)**
```typescript
// Using Expo/React Native push
await sendPushNotification({
  userId: build.userId,
  title: "Build Complete",
  body: `${build.name} is ready to view`,
  data: {
    type: 'build_complete',
    buildId: build.id,
    previewUrl: `https://${build.subdomain}.youragents.app`
  }
});
```

**3. SMS Notifications (Optional)**
```typescript
// Using Twilio
await twilio.messages.create({
  to: user.phone,
  body: `Your app "${build.name}" is ready! View it at: ${previewUrl}`
});
```

**4. Webhook Notifications**
```typescript
// For power users/integrations
if (user.webhookUrl) {
  await fetch(user.webhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      event: 'build.completed',
      buildId: build.id,
      previewUrl: previewUrl,
    })
  });
}
```

---

## Part 5: Mobile Companion App

### Features for the Mobile App

1. **Build Status Dashboard**
   - View active builds
   - Progress indicators
   - ETA for completion

2. **Push Notifications**
   - Build started
   - Build completed
   - Build failed (with error summary)
   - Progress milestones (50%, 75%, etc.)

3. **Quick Preview**
   - Open preview URL in in-app browser
   - Share preview link

4. **Approve/Reject Flow**
   - View completed app
   - Approve for production
   - Request changes (triggers new build)

### Tech Stack Recommendation

```
React Native with Expo
├── Authentication: Clerk (matches web)
├── Push Notifications: Expo Push / Firebase
├── State Management: React Query
└── API: Same backend as web app
```

---

## Part 6: Deployment Options for Users

### Option 1: Host on Your Platform (Recurring Revenue)

```
┌─────────────────────────────────────────────────────────────────┐
│  "Keep it hosted on our platform"                               │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Subdomain included: myapp.youragents.app                     │
│  ✓ Custom domain support: $10/month or included in Pro          │
│  ✓ Auto-scaling (usage-based pricing)                           │
│  ✓ Automatic updates when you rebuild                           │
│  ✓ Analytics & monitoring included                              │
└─────────────────────────────────────────────────────────────────┘
```

### Option 2: Export to External Provider

```
┌─────────────────────────────────────────────────────────────────┐
│  "Deploy to your own hosting"                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Vercel]  [Netlify]  [Railway]  [Fly.io]  [Download]          │
│                                                                 │
│  One-click deployment to popular platforms                      │
│  Uses their GitHub integration or direct API                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation for Vercel:**
```typescript
async function deployToVercel(buildId: string, vercelToken: string) {
  // 1. Get build artifacts
  const artifacts = await downloadBuildArtifacts(buildId);
  
  // 2. Create deployment via Vercel API
  const deployment = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
    },
    body: JSON.stringify({
      name: build.name,
      files: artifacts.map(f => ({
        file: f.path,
        data: f.content
      })),
      projectSettings: {
        framework: detectFramework(artifacts),
      }
    })
  });
  
  return deployment.url; // Returns vercel.app URL
}
```

### Option 3: Download & Self-Host

```
┌─────────────────────────────────────────────────────────────────┐
│  "Download project files"                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Download ZIP]  [Clone from Git]  [Docker Image]              │
│                                                                 │
│  Full source code ownership                                     │
│  Deploy anywhere you want                                       │
│  Includes README with deployment instructions                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Recommended Implementation Plan

### Phase 1: Core Preview System (Week 1-2)

**Goal:** Users can view completed apps in browser

1. **Add Container Hosting Provider**
   - Integrate Fly.io or Railway
   - Create `packages/hosting-providers` package
   - Interface: `deploy(buildId) → { url, status }`

2. **Subdomain System**
   - Database: Add `subdomain` field to builds
   - Auto-generate: `project-abc123.youragents.app`
   - Cloudflare: Wildcard DNS + Workers for routing

3. **WebContainer Preview (Quick Win)**
   - Add preview button on build detail page
   - Load WebContainer with build artifacts
   - Display in iframe for instant preview

### Phase 2: Notifications (Week 2-3)

**Goal:** Users know when builds complete

1. **Email Notifications**
   - Integrate Resend or SendGrid
   - Templates: build_started, build_progress, build_complete, build_failed

2. **In-App Notifications**
   - WebSocket or polling for real-time updates
   - Notification bell in dashboard

3. **Push Notifications (Mobile)**
   - Expo Push Notification service
   - FCM/APNs integration

### Phase 3: Custom Domains (Week 3-4)

**Goal:** Users can use their own domain

1. **Domain Management UI**
   - Add/remove domains
   - Display DNS instructions
   - Show verification status

2. **Domain Verification**
   - TXT record checking
   - Background job to poll DNS

3. **SSL Provisioning**
   - Cloudflare for SaaS or Let's Encrypt
   - Automatic certificate issuance

### Phase 4: Export Options (Week 4-5)

**Goal:** Deploy to external providers

1. **Vercel Integration**
   - OAuth connection
   - One-click deployment

2. **Netlify Integration**
   - OAuth connection
   - One-click deployment

3. **Download Options**
   - ZIP download (already exists)
   - Docker image generation
   - GitHub repository push

### Phase 5: Mobile App (Week 5-8)

**Goal:** Companion mobile app

1. **React Native Shell**
   - Authentication (Clerk)
   - Build list & status

2. **Push Notifications**
   - Build status updates
   - Completion alerts

3. **Preview & Actions**
   - In-app browser for preview
   - Approve/reject actions

---

## Part 8: Database Schema Additions

### New Tables/Fields Required

```prisma
// Add to Build model
model Build {
  // ... existing fields ...
  
  // Hosting fields
  subdomain       String?   @unique  // e.g., "myapp-abc123"
  publishedAt     DateTime?          // When first published
  publishedUrl    String?            // Full URL
  
  // Custom domains
  domains         Domain[]
}

model Domain {
  id              String   @id @default(cuid())
  buildId         String
  domain          String   @unique  // e.g., "myapp.example.com"
  status          String   @default("pending") // pending, verifying, active, failed
  verificationTxt String?            // TXT record value for verification
  sslStatus       String?            // pending, issued, failed
  isPrimary       Boolean  @default(false)
  createdAt       DateTime @default(now())
  verifiedAt      DateTime?
  
  build           Build    @relation(fields: [buildId], references: [id])
  
  @@index([buildId])
  @@map("domains")
}

model Notification {
  id              String   @id @default(cuid())
  userId          String
  type            String   // build_started, build_complete, build_failed
  title           String
  body            String
  data            Json?    // Additional data (buildId, previewUrl, etc.)
  read            Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@map("notifications")
}

model UserPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  emailNotifications    Boolean  @default(true)
  pushNotifications     Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  webhookUrl            String?
  
  user                  User     @relation(fields: [userId], references: [id])
  
  @@map("user_preferences")
}
```

---

## Part 9: Pricing Model Implications

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICING TIERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FREE                                                           │
│  ├── 1 build/month                                              │
│  ├── Download only (no hosting)                                 │
│  └── Email notifications                                        │
│                                                                 │
│  PRO ($29/month)                                                │
│  ├── 10 builds/month                                            │
│  ├── Hosted preview: project.youragents.app                     │
│  ├── Push notifications                                         │
│  └── Export to Vercel/Netlify                                   │
│                                                                 │
│  TEAM ($99/month)                                               │
│  ├── Unlimited builds                                           │
│  ├── Custom domains (5 included)                                │
│  ├── Priority builds                                            │
│  ├── Team collaboration                                         │
│  └── Webhook integrations                                       │
│                                                                 │
│  ENTERPRISE (Custom)                                            │
│  ├── Self-hosted option                                         │
│  ├── SLA guarantees                                             │
│  ├── SSO/SAML                                                   │
│  └── Dedicated support                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 10: Technology Decisions Summary

| Component | Recommended Technology | Rationale |
|-----------|----------------------|-----------|
| **Container Hosting** | Fly.io | Fast cold starts, per-user isolation, fly-replay routing |
| **Static Hosting** | Cloudflare R2 + Workers | Cheap, fast, integrated with domain routing |
| **Domain Management** | Cloudflare for SaaS | Wildcard SSL, easy custom domains, DDoS protection |
| **Email** | Resend | Developer-friendly, React email templates |
| **Push Notifications** | Expo Push + FCM | Works with React Native, cross-platform |
| **WebContainers** | StackBlitz WebContainer API | Browser-based preview, no hosting costs |
| **Mobile App** | React Native + Expo | Matches web tech stack, fast development |

---

## Questions Answered Summary

| Question | Answer |
|----------|--------|
| **How do users view completed apps?** | Three options: (1) WebContainer preview (instant, browser-only), (2) Container hosting with subdomain, (3) Export to external provider |
| **How does subdomain hosting work?** | Wildcard DNS (*.youragents.app) + routing layer that maps subdomain → container/storage |
| **How do custom domains work?** | User adds A record pointing to your IP, TXT record for verification, then you provision SSL and route traffic |
| **How to alert users when done?** | Email (essential), push notifications (mobile app), webhooks (power users), in-app notifications (dashboard) |
| **Mobile app purpose?** | Status monitoring, push notifications, quick preview, approve/reject workflow |

---

## Next Steps

1. **Domain Registration** - Register production domain (e.g., `youragents.app`)
2. **Cloudflare Setup** - Configure for SaaS with wildcard domains
3. **Database Migration** - Add new tables for domains and notifications
4. **WebContainer POC** - Prototype browser-based preview
5. **Fly.io Integration** - Build hosting provider package

---

*Last Updated: December 11, 2024*
