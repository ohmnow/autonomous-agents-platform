# Autonomous Agents Platform - Testing Plan

**Document Version:** 1.0  
**Last Updated:** December 9, 2024  
**Status:** Ready for Execution

---

## Overview

This document outlines a comprehensive testing plan for the Autonomous Agents Platform. It covers manual testing procedures, integration tests, and end-to-end scenarios to verify all features work correctly together.

---

## Prerequisites

### Environment Setup

1. **Start PostgreSQL**
   ```bash
   cd /Users/chris/claude-autonomous-quickstarts/autonomous-coding/autonomous-agents-platform
   docker compose up -d
   ```

2. **Verify Database**
   ```bash
   docker exec agents-platform-db pg_isready -U agents -d agents_platform
   # Should output: accepting connections
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

4. **Open Application**
   - Navigate to: http://localhost:3001

### Required Environment Variables

Verify these are set in `apps/web/.env`:

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (frontend) | ✅ |
| `CLERK_SECRET_KEY` | Clerk auth (backend) | ✅ |
| `ANTHROPIC_API_KEY` | Claude AI for chat | ✅ |
| `E2B_API_KEY` | Real sandbox execution | ✅ |
| `DATABASE_URL` | PostgreSQL connection | ✅ |

---

## Test Scenarios

### 1. Authentication Flow

#### Test 1.1: New User Registration
1. Go to http://localhost:3001
2. Click "Get Started"
3. Register with email/password or OAuth
4. **Expected:** Redirected to `/dashboard`
5. **Verify:** User appears in Clerk dashboard

#### Test 1.2: Existing User Login
1. Go to http://localhost:3001/sign-in
2. Enter credentials
3. **Expected:** Redirected to `/dashboard`

#### Test 1.3: Protected Route Access
1. Sign out
2. Try to access http://localhost:3001/dashboard directly
3. **Expected:** Redirected to sign-in page

#### Test 1.4: Session Persistence
1. Sign in
2. Close browser tab
3. Reopen http://localhost:3001/dashboard
4. **Expected:** Still logged in

---

### 2. Dashboard

#### Test 2.1: Dashboard Loads
1. Navigate to `/dashboard`
2. **Expected:** 
   - Stats cards display
   - Recent builds section visible
   - Quick action cards present

#### Test 2.2: Navigation
1. Click each sidebar item
2. **Expected:** Correct page loads for each:
   - Dashboard → `/dashboard`
   - Builds → `/builds`
   - Projects → `/projects`

---

### 3. Projects Management

#### Test 3.1: Create Project
1. Go to `/projects`
2. Click "New Project"
3. Enter: Name = "Test Project", Description = "Testing"
4. Click "Create Project"
5. **Expected:** Project card appears in list

#### Test 3.2: Edit Project
1. Hover over project card
2. Click edit (pencil) icon
3. Change name to "Updated Project"
4. Click "Save"
5. **Expected:** Name updates in list

#### Test 3.3: Delete Project
1. Hover over project card
2. Click delete (trash) icon
3. Confirm deletion
4. **Expected:** Project removed from list

#### Test 3.4: Database Persistence
1. Create a project
2. Restart the dev server (`Ctrl+C`, then `pnpm dev`)
3. Go to `/projects`
4. **Expected:** Project still exists (fetched from DB)

---

### 4. Chat Builder

#### Test 4.1: Start Conversation
1. Go to `/chat`
2. Type: "I want to build a todo app"
3. Press Enter or click Send
4. **Expected:** 
   - Message appears in chat
   - Typing indicator shows
   - AI response streams in

#### Test 4.2: Multi-turn Conversation
1. Continue from 4.1
2. Answer AI's clarifying questions
3. **Expected:** Context maintained across messages

#### Test 4.3: Spec Generation
1. Continue conversation until AI generates spec
2. **Expected:** 
   - Code block with `app_spec` appears
   - Spec preview panel shows parsed content

#### Test 4.4: Edit Spec
1. After spec is generated
2. Click "Edit" in spec preview
3. Modify content
4. Click "Save"
5. **Expected:** Changes reflected in preview

#### Test 4.5: Copy/Download Spec
1. After spec is generated
2. Click "Copy" button
3. **Expected:** Spec copied to clipboard
4. Click "Download" button
5. **Expected:** `.txt` file downloads

#### Test 4.6: Build from Chat
1. After spec is confirmed
2. Click "Build App"
3. **Expected:** Redirected to build monitor page

---

### 5. Step-by-Step Wizard

#### Test 5.1: Complete Wizard Flow
1. Go to `/wizard`
2. **Step 1 (Project):**
   - Enter project name
   - Select "Web Application"
   - Click "Next"
3. **Step 2 (Tech Stack):**
   - Select Next.js
   - Select PostgreSQL
   - Select Clerk
   - Click "Next"
4. **Step 3 (Features):**
   - Click "Suggest for Web Application"
   - Toggle additional features
   - Click "Next"
5. **Step 4 (Design):**
   - Select "Modern" style
   - Select color scheme
   - Add optional notes
   - Click "Next"
6. **Step 5 (Review):**
   - Verify summary is correct
   - Review generated spec
7. **Expected:** All steps complete, spec generated

#### Test 5.2: Edit Summary Sections
1. In Review step
2. Click "Edit" on any section
3. **Expected:** Navigate back to that step

#### Test 5.3: Edit Generated Spec
1. In Review step
2. Click "Edit" on spec card
3. Modify content
4. Click "Save Changes"
5. **Expected:** Spec updates

#### Test 5.4: Build from Wizard
1. Complete wizard to Review step
2. Click "Build App"
3. **Expected:** Redirected to build monitor

---

### 6. Build Execution

#### Test 6.1: Build Creation (Simulation Mode)
*If E2B_API_KEY is not set or invalid*

1. Create a build from chat or wizard
2. **Expected:**
   - Build appears in `/builds`
   - Status shows "RUNNING"
   - Logs stream in simulation mode

#### Test 6.2: Build Creation (Real Sandbox)
*If E2B_API_KEY is valid*

1. Create a build from chat or wizard
2. **Expected:**
   - Log shows "Creating E2B sandbox..."
   - Sandbox ID appears in logs
   - Real agent execution begins

#### Test 6.3: Real-time Log Streaming
1. Open build monitor for a running build
2. **Expected:**
   - "Live" badge appears
   - Logs update in real-time
   - Auto-scroll follows new logs

#### Test 6.4: Feature Progress Tracking
1. Monitor a running build
2. **Expected:**
   - Features extracted from logs
   - Status updates (pending → in_progress → passed)
   - Progress bar updates

#### Test 6.5: Stop Build
1. With a running build
2. Click "Stop Build"
3. Confirm
4. **Expected:**
   - Status changes to "CANCELLED"
   - "Build stopped by user" in logs
   - Sandbox destroyed

#### Test 6.6: Build Completion
1. Let a build run to completion
2. **Expected:**
   - Status changes to "COMPLETED"
   - Progress shows 100%
   - Download button appears

---

### 7. Builds List

#### Test 7.1: View All Builds
1. Go to `/builds`
2. **Expected:** All user's builds listed

#### Test 7.2: Build Status Display
1. View builds list
2. **Expected:** Correct status badges:
   - COMPLETED → Green checkmark
   - RUNNING → Blue spinner
   - FAILED → Red X
   - PENDING → Gray clock

#### Test 7.3: Navigate to Build Detail
1. Click on any build card
2. **Expected:** Build monitor page opens

#### Test 7.4: New Build Button
1. Click "New Build"
2. **Expected:** Navigate to `/chat`

---

### 8. API Endpoints

#### Test 8.1: Builds API
```bash
# List builds (requires auth cookie)
curl http://localhost:3001/api/builds

# Expected: { "builds": [...] }
```

#### Test 8.2: Projects API
```bash
# List projects
curl http://localhost:3001/api/projects

# Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "API Test", "description": "Testing"}'
```

#### Test 8.3: SSE Log Stream
```bash
# Connect to log stream
curl http://localhost:3001/api/builds/{buildId}/stream

# Expected: Server-sent events with log data
```

---

### 9. Database Integration

#### Test 9.1: Build Persistence
1. Create a build
2. Check database:
   ```bash
   docker exec -it agents-platform-db psql -U agents -d agents_platform -c "SELECT id, status FROM builds;"
   ```
3. **Expected:** Build row exists

#### Test 9.2: Build Logs Storage
1. Run a build
2. Check database:
   ```bash
   docker exec -it agents-platform-db psql -U agents -d agents_platform -c "SELECT COUNT(*) FROM build_logs WHERE build_id = '{buildId}';"
   ```
3. **Expected:** Logs stored in database

#### Test 9.3: Fallback to Memory
1. Stop PostgreSQL: `docker compose stop`
2. Create a build
3. **Expected:** Build works using in-memory storage
4. Restart PostgreSQL: `docker compose start`

---

### 10. Error Handling

#### Test 10.1: Invalid API Key
1. Set invalid `ANTHROPIC_API_KEY`
2. Try to chat
3. **Expected:** Error message displayed

#### Test 10.2: Network Disconnection
1. Start a build
2. Disconnect network
3. Reconnect
4. **Expected:** SSE reconnects, logs resume

#### Test 10.3: 404 Handling
1. Go to `/builds/invalid-id`
2. **Expected:** "Build not found" message

---

## Integration Test Checklist

| # | Test | Status |
|---|------|--------|
| 1 | Auth → Dashboard redirect | ⬜ |
| 2 | Chat → Spec generation → Build | ⬜ |
| 3 | Wizard → Spec generation → Build | ⬜ |
| 4 | Build → Real-time logs → Completion | ⬜ |
| 5 | Project CRUD persists to DB | ⬜ |
| 6 | Build CRUD persists to DB | ⬜ |
| 7 | Stop build destroys sandbox | ⬜ |
| 8 | Feature tracking from logs | ⬜ |

---

## End-to-End Test Scenarios

### E2E Scenario 1: Full Build Cycle

1. Sign up as new user
2. Create a project "My Todo App"
3. Use wizard to configure:
   - Web Application
   - Next.js + PostgreSQL
   - Auth, CRUD, Dark Mode features
4. Review and edit spec
5. Click "Build App"
6. Watch build progress
7. Verify completion
8. Check build in `/builds` list

**Success Criteria:**
- ✅ User created in Clerk
- ✅ Project created in database
- ✅ Build created in database
- ✅ Logs streamed in real-time
- ✅ Build status updated correctly

### E2E Scenario 2: Chat-Based Development

1. Sign in
2. Go to `/chat`
3. Describe: "Build a personal finance tracker"
4. Answer 3-4 clarifying questions
5. Confirm generated spec
6. Start build
7. Monitor to completion

**Success Criteria:**
- ✅ Chat context maintained
- ✅ Spec extracted correctly
- ✅ Build executes with correct spec

---

## Performance Benchmarks

| Metric | Target | How to Test |
|--------|--------|-------------|
| Page load time | < 1s | Chrome DevTools |
| Chat response start | < 2s | Stopwatch from send |
| Log stream latency | < 100ms | Compare timestamps |
| Build creation | < 500ms | API response time |

---

## Known Limitations

1. **Artifact Download** - Not yet implemented (sandboxes destroyed after build)
2. **Build Logs** - Stored in memory, lost on server restart (until full DB integration)
3. **Real Agent Execution** - Requires valid E2B API key; falls back to simulation
4. **Concurrent Builds** - Not load-tested for multiple simultaneous builds

---

## Post-Testing Cleanup

```bash
# Stop all services
docker compose down

# Clear test data (optional)
docker compose down -v  # Removes database volume

# Remove test users from Clerk dashboard manually
```

---

## Test Results Template

| Date | Tester | Tests Passed | Tests Failed | Notes |
|------|--------|--------------|--------------|-------|
| YYYY-MM-DD | Name | X/Y | N | Notes |

---

*This testing plan should be executed after any major changes to ensure functionality remains intact.*
