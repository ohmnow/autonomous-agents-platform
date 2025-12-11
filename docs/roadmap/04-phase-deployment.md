# Phase 4: Deployment Pipeline

**Status:** Planning  
**Priority:** Medium  
**Estimated Duration:** 2-3 weeks  
**Dependencies:** Phase 2 (Zero-Config Services)

---

## Objective

Enable one-click deployment of built applications to production hosting platforms.

---

## Target Platforms

### Primary: Cloudflare Pages
- Free tier generous
- Edge-native (fast globally)
- Integrated with R2, D1, Workers
- Custom domains included

### Alternative: Vercel
- Best-in-class Next.js support
- Familiar to most developers
- Easy environment variable management

---

## Deployment Flow

```
Build Complete
      ↓
Download Artifact (tar/zip)
      ↓
User clicks "Deploy"
      ↓
Select Platform (Cloudflare/Vercel)
      ↓
Connect Account (OAuth)
      ↓
Configure (domain, env vars)
      ↓
Deploy & Monitor
      ↓
Live URL Provided
```

---

## Key Features

### 1. Platform Integration

```typescript
// Cloudflare Pages API
async function deployToCloudflare(
  artifact: Buffer,
  config: DeployConfig
): Promise<DeploymentResult> {
  // Upload to Cloudflare Pages
  // Set environment variables
  // Configure custom domain
  // Return deployment URL
}
```

### 2. Environment Variable Management

- Extract required env vars from built app
- Map org keys to user keys
- Validate before deployment
- Secure storage

### 3. Custom Domain Setup

- DNS configuration guidance
- SSL certificate auto-provisioning
- Subdomain support

### 4. Post-Deployment Monitoring

- Health checks
- Error tracking integration
- Performance metrics

---

## Implementation Tasks

- [ ] Cloudflare Pages API integration
- [ ] Vercel API integration
- [ ] OAuth flow for platform connection
- [ ] Environment variable UI
- [ ] Domain configuration wizard
- [ ] Deployment status tracking
- [ ] Post-deploy health checks

---

## Success Criteria

| Feature | Verified |
|---------|----------|
| One-click deploy to Cloudflare | ⬜ |
| One-click deploy to Vercel | ⬜ |
| Custom domain configuration | ⬜ |
| Environment variables set correctly | ⬜ |
| Live URL accessible | ⬜ |

---

## Next Phase

[Phase 5: Non-Code Workflows](./05-phase-non-code-workflows.md)
