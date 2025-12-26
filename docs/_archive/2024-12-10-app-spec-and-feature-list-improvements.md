# App Spec & Feature List Improvements Plan

**Date:** December 10, 2024  
**Version:** 1.1  
**Status:** Proposed  
**Reference:** [Anthropic - Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

---

## Executive Summary

This document outlines changes needed to align our autonomous agents platform with Anthropic's recommended approach for long-running agents. The key changes are:

1. **Two-stage spec generation**: Discovery (collect app description) → Expansion (generate full XML spec)
2. **Infer complexity from conversation** instead of explicit user selection
3. **Switch from Markdown to XML format** for app specifications
4. **Update the initializer prompt** to use dynamic feature counts

---

## Problem Statement

### Current Issues

| Issue | Impact |
|-------|--------|
| **Hardcoded 200 features** | Overkill for simple apps, wastes time/tokens |
| **Markdown format** doesn't match Anthropic's tested XML format | Less structured, missing key sections |
| **No complexity awareness** | System treats all apps the same regardless of scope |
| **Variable spec quality** | Chat-generated specs often lack database schema, API endpoints, UI details |

### Root Cause

The original Python implementation used a **static, hand-crafted XML spec** (`prompts/app_spec.txt`) for a specific complex app (Claude.ai clone). When we made the platform dynamic, we:
- Changed the format to Markdown (easier for Claude to generate in chat)
- Kept the 200-feature requirement hardcoded
- Lost the structured completeness of XML

---

## Proposed Solution

### Overview: Two-Stage Spec Generation

The key insight is that spec generation should happen in **two stages**:

1. **Stage 1: Discovery** - Chat/wizard collects requirements and outputs a human-readable **App Description**
2. **Stage 2: Expansion** - System expands the description into a full **XML App Spec** with inferred complexity

```
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 1: DISCOVERY                             │
│                 (Chat or Wizard)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User: "I want to build a task manager for my team"             │
│                        │                                        │
│                        ▼                                        │
│  Claude asks clarifying questions:                              │
│  • Who are the users? (personal vs team vs enterprise)          │
│  • What's the main use case?                                    │
│  • Any must-have features?                                      │
│  • Tech preferences?                                            │
│                        │                                        │
│                        ▼                                        │
│  OUTPUT: App Description (human-readable summary)               │
│  + Inferred Complexity Tier                                     │
│                                                                 │
│  Example: "A collaborative task management app for small        │
│  teams with real-time updates, assignments, due dates..."       │
│  [Inferred: Standard - team use, moderate complexity]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 2: EXPANSION                             │
│             (Automated or Semi-Automated)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: App Description + Inferred Complexity                   │
│                        │                                        │
│                        ▼                                        │
│  Claude expands into full XML app_spec:                         │
│  • Generates database schema                                    │
│  • Defines API endpoints                                        │
│  • Describes UI layouts                                         │
│  • Lists all features with appropriate depth                    │
│                        │                                        │
│                        ▼                                        │
│  OUTPUT: Full app_spec.xml                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER REVIEW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Based on your requirements, I've planned this as a            │
│   Standard-grade application with ~80 features.                 │
│   This includes authentication, responsive design,              │
│   and comprehensive testing."                                   │
│                                                                 │
│  [Adjust complexity ↓]  [View full spec]  [Start Build]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BUILD                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Initializer agent creates feature_list.json                    │
│  with ~N features based on inferred complexity                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Stages?

| Benefit | Explanation |
|---------|-------------|
| **Better UX** | Users describe what they want naturally, not in technical terms |
| **Consistent quality** | Expansion phase ensures all specs have required sections |
| **Appropriate scope** | Complexity is inferred, not guessed by users |
| **Transparency** | Users see what was inferred and can adjust if needed |

---

## Part 1: Complexity Tiers (Inferred, Not Selected)

### Key Principle: Infer, Don't Ask

Users often don't know the difference between "simple", "standard", and "production" grade apps. Instead of asking them to choose, **Claude infers the appropriate tier** from the conversation context.

### Tier Definitions

| Tier | Feature Range | Use Cases | Build Time Estimate |
|------|---------------|-----------|---------------------|
| **Simple** | 20-40 | Landing pages, prototypes, demos, single-feature apps | 1-4 hours |
| **Standard** | 60-120 | Dashboards, blogs, small SaaS, CRUD apps | 4-12 hours |
| **Production** | 150-250+ | Full SaaS, complex apps, Claude.ai clones | 12-48+ hours |

### Complexity Inference Signals

Claude determines complexity based on conversational cues:

| User Says | Claude Infers | Reasoning |
|-----------|---------------|-----------|
| "just for me", "personal project", "quick prototype" | **Simple** | Limited scope, single user |
| "side project", "learning", "experiment" | **Simple** | Low stakes, minimal requirements |
| "for my team", "small business", "internal tool" | **Standard** | Multi-user, business requirements |
| "dashboard", "admin panel", "10-50 users" | **Standard** | Moderate complexity |
| "for customers", "SaaS", "enterprise" | **Production** | Public-facing, high stakes |
| "commercial product", "sell to users", "scale" | **Production** | Production requirements |
| "security", "billing", "multi-tenant" | **Production** | Enterprise features |

### Inference Examples

**Example 1: Simple**
> User: "I want to build a personal recipe organizer just for myself"
> 
> Inferred: **Simple** (20-40 features)
> - Personal use only
> - Single user
> - No auth/billing complexity

**Example 2: Standard**  
> User: "I need a task manager for my team of 8 people"
>
> Inferred: **Standard** (60-120 features)
> - Team use (multi-user)
> - Business context
> - Needs collaboration features

**Example 3: Production**
> User: "I'm building a SaaS product to sell to small businesses"
>
> Inferred: **Production** (150-250+ features)
> - Commercial product
> - Needs billing, security, onboarding
> - Must be polished and scalable

### UI: Review & Adjust (Optional Override)

After inference, the user sees what was determined and can adjust if needed:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ App Specification Generated                                 │
│                                                                 │
│  "TaskFlow - Team Task Manager"                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Based on your requirements, I've planned this as a             │
│  STANDARD-grade application with approximately 80 features.     │
│                                                                 │
│  This includes:                                                 │
│  • User authentication and team management                      │
│  • Full CRUD for tasks with assignments                         │
│  • Responsive design for mobile and desktop                     │
│  • Real-time updates                                            │
│  • Comprehensive error handling                                 │
│                                                                 │
│  Estimated build time: 6-12 hours                               │
│                                                                 │
│  [Adjust complexity ↓]  [View full spec]  [Start Build]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Clicking "Adjust complexity" reveals the tier selector for power users who want to override.

### Data Model Changes

```typescript
// Add to Build creation
interface CreateBuildInput {
  userId: string;
  projectId?: string;
  appSpec: string;
  appSpecId?: string;
  harnessId?: string;
  sandboxProvider?: string;
  // NEW FIELDS
  complexityTier: 'simple' | 'standard' | 'production';
  targetFeatureCount: number;  // Specific number within tier range
  complexityInferred: boolean; // Was this inferred or manually selected?
}
```

---

## Part 2: App Description (Intermediate Format)

### Purpose

The App Description is the **output of Stage 1** (Discovery) and the **input to Stage 2** (Expansion). It captures:

1. What the user wants to build (in their words)
2. Who will use it
3. Key features
4. Technical preferences
5. **Inferred complexity** with reasoning

### App Description Format

```markdown
```app_description
# [App Name]

## Overview
[2-3 paragraph description of what the app does, who it's for, and the 
problem it solves. Written in the user's language, not technical jargon.]

## Target Users
[Clear description of who will use this app]
- Primary user type and their needs
- Usage context (personal, team, public)
- Scale expectations (1 user, 10-50, thousands)

## Key Features
[Bullet list of must-have features from the conversation]
- Feature 1: Brief description
- Feature 2: Brief description
- Feature 3: Brief description
...

## Technical Preferences
[Any preferences expressed, or "no preference" for defaults]
- Frontend: [preference or "no preference - use sensible defaults"]
- Backend: [preference or "no preference"]
- Database: [preference or "no preference"]
- Authentication: [preference or "no preference"]

## Inferred Complexity
Tier: [simple|standard|production]
Estimated Features: [20-40 | 60-120 | 150-250]
Reasoning: [1-2 sentences explaining WHY this tier was chosen based on 
           the conversation - e.g., "Personal use with single user suggests 
           a simple app" or "SaaS with billing requires production-grade"]
```
```

### Example: Simple App

```markdown
```app_description
# RecipeBox

## Overview
A personal recipe organizer for collecting and managing favorite recipes.
The app allows saving recipes with ingredients, instructions, and photos,
organizing them into categories, and quickly searching through the collection.

## Target Users
- Single user (personal use)
- Home cook who wants to digitize family recipes
- No sharing or collaboration needed

## Key Features
- Add/edit/delete recipes with title, ingredients, instructions, photo
- Organize recipes into categories (Breakfast, Dinner, Desserts, etc.)
- Search recipes by name or ingredient
- Mark favorites for quick access
- Mobile-friendly for kitchen use

## Technical Preferences
- Frontend: no preference
- Backend: no preference  
- Database: no preference
- Authentication: Simple - just protect my recipes

## Inferred Complexity
Tier: simple
Estimated Features: 30
Reasoning: Personal single-user app with straightforward CRUD operations. 
No collaboration, billing, or complex business logic needed.
```
```

### Example: Production App

```markdown
```app_description
# TeamSync

## Overview
A SaaS project management platform for agencies and consulting firms. 
Enables teams to track projects, assign tasks, manage client relationships,
and generate reports for billing. Supports multiple workspaces for different
clients with role-based access control.

## Target Users
- Agencies with 10-200 employees
- Multiple teams per organization
- Clients who need read-only access to project status
- Admins who manage billing and user access

## Key Features
- Multi-tenant workspaces (one per client)
- Project and task management with assignments
- Time tracking for billing
- Role-based access (Admin, Manager, Member, Client)
- Real-time collaboration and notifications
- Reporting and analytics dashboard
- Billing integration (Stripe)
- SSO/SAML for enterprise clients

## Technical Preferences
- Frontend: React/Next.js preferred
- Backend: Node.js
- Database: PostgreSQL
- Authentication: Enterprise SSO support needed

## Inferred Complexity
Tier: production
Estimated Features: 200
Reasoning: Multi-tenant SaaS with billing, enterprise auth, and complex 
role-based permissions requires production-grade architecture.
```
```

---

## Part 3: XML App Spec Format

### Why XML?

1. **Matches Anthropic's tested approach** - Their 200-feature demo used XML
2. **Enforces structure** - Required sections are clear
3. **Reduces ambiguity** - Nested tags make hierarchy explicit
4. **Better for parsing** - Agent can reliably extract sections
5. **Completeness** - XML naturally encourages filling all sections

### XML Schema

```xml
<project_specification>
  <project_name>App Name</project_name>
  
  <overview>
    Brief description of the application, its purpose, and target users.
  </overview>
  
  <complexity_tier>standard</complexity_tier>
  <target_features>80</target_features>
  
  <technology_stack>
    <frontend>
      <framework>Next.js 14 with App Router</framework>
      <styling>Tailwind CSS</styling>
      <state_management>React hooks and Zustand</state_management>
      <ui_components>shadcn/ui</ui_components>
    </frontend>
    <backend>
      <runtime>Node.js with Next.js API routes</runtime>
      <database>PostgreSQL with Prisma ORM</database>
      <authentication>Clerk</authentication>
    </backend>
    <deployment>
      <platform>Vercel</platform>
      <database_host>Neon or Supabase</database_host>
    </deployment>
  </technology_stack>
  
  <core_features>
    <feature_group name="Authentication">
      <feature>User registration with email/password</feature>
      <feature>Social login (Google, GitHub)</feature>
      <feature>Password reset flow</feature>
      <feature>Session management</feature>
    </feature_group>
    
    <feature_group name="Dashboard">
      <feature>Overview statistics cards</feature>
      <feature>Recent activity feed</feature>
      <feature>Quick action buttons</feature>
    </feature_group>
    
    <!-- More feature groups... -->
  </core_features>
  
  <database_schema>
    <table name="users">
      <column>id: UUID, primary key</column>
      <column>email: string, unique, not null</column>
      <column>name: string</column>
      <column>avatar_url: string, nullable</column>
      <column>created_at: timestamp</column>
      <column>updated_at: timestamp</column>
    </table>
    
    <table name="tasks">
      <column>id: UUID, primary key</column>
      <column>user_id: UUID, foreign key to users</column>
      <column>title: string, not null</column>
      <column>description: text, nullable</column>
      <column>status: enum (pending, in_progress, completed)</column>
      <column>due_date: timestamp, nullable</column>
      <column>created_at: timestamp</column>
    </table>
    
    <!-- More tables... -->
  </database_schema>
  
  <api_endpoints>
    <endpoint_group name="Authentication">
      <endpoint method="POST" path="/api/auth/register">Register new user</endpoint>
      <endpoint method="POST" path="/api/auth/login">User login</endpoint>
      <endpoint method="POST" path="/api/auth/logout">User logout</endpoint>
      <endpoint method="GET" path="/api/auth/me">Get current user</endpoint>
    </endpoint_group>
    
    <endpoint_group name="Tasks">
      <endpoint method="GET" path="/api/tasks">List user's tasks</endpoint>
      <endpoint method="POST" path="/api/tasks">Create new task</endpoint>
      <endpoint method="GET" path="/api/tasks/:id">Get task by ID</endpoint>
      <endpoint method="PUT" path="/api/tasks/:id">Update task</endpoint>
      <endpoint method="DELETE" path="/api/tasks/:id">Delete task</endpoint>
    </endpoint_group>
    
    <!-- More endpoint groups... -->
  </api_endpoints>
  
  <ui_layout>
    <page name="Landing">
      <section>Hero with headline and CTA</section>
      <section>Features grid</section>
      <section>Testimonials</section>
      <section>Pricing cards</section>
      <section>Footer</section>
    </page>
    
    <page name="Dashboard">
      <section>Sidebar navigation</section>
      <section>Header with user menu</section>
      <section>Stats cards row</section>
      <section>Main content area</section>
    </page>
    
    <!-- More pages... -->
  </ui_layout>
  
  <design_system>
    <colors>
      <primary>#3B82F6 (blue-500)</primary>
      <secondary>#10B981 (emerald-500)</secondary>
      <background>#FFFFFF light, #0F172A dark</background>
      <text>#1E293B light, #F1F5F9 dark</text>
    </colors>
    <typography>
      <font_family>Inter, system-ui, sans-serif</font_family>
      <heading_weight>font-semibold</heading_weight>
    </typography>
    <components>
      <buttons>Rounded, with hover states</buttons>
      <cards>Subtle shadow, rounded-lg</cards>
      <inputs>Border with focus ring</inputs>
    </components>
  </design_system>
  
  <implementation_priorities>
    <priority level="1">Authentication and user management</priority>
    <priority level="2">Core CRUD functionality</priority>
    <priority level="3">Dashboard and analytics</priority>
    <priority level="4">Polish, responsive design, dark mode</priority>
  </implementation_priorities>
  
  <success_criteria>
    <criterion category="functionality">All CRUD operations work correctly</criterion>
    <criterion category="functionality">Authentication flow is complete</criterion>
    <criterion category="ux">Responsive on mobile and desktop</criterion>
    <criterion category="ux">Loading states and error handling</criterion>
    <criterion category="quality">No console errors</criterion>
    <criterion category="quality">Clean, maintainable code</criterion>
  </success_criteria>
</project_specification>
```

### Mapping Complexity to Spec Detail

| Tier | Database Tables | API Endpoints | UI Pages | Feature Groups |
|------|-----------------|---------------|----------|----------------|
| Simple | 1-3 | 5-15 | 2-4 | 3-5 |
| Standard | 4-8 | 15-40 | 5-10 | 6-12 |
| Production | 8-15+ | 40-100+ | 10-20+ | 12-25+ |

---

## Part 4: Two-Stage Prompts

### Stage 1: Discovery Prompt (Chat/Wizard)

This prompt collects requirements and outputs a structured **App Description** with inferred complexity.

```typescript
const DISCOVERY_SYSTEM_PROMPT = `You are an expert software architect helping users design applications. Your goal is to understand their requirements through natural conversation and produce a clear App Description.

## Your Role
1. Ask clarifying questions to understand what they want to build
2. Help them think through aspects they might not have considered
3. Infer the appropriate complexity tier from context (don't ask directly)
4. Produce a structured App Description

## Conversation Flow
1. Understand the core purpose: "What problem does this solve?"
2. Identify target users: "Who will use this?" (personal, team, customers)
3. Discuss key features: "What are the must-have features?"
4. Clarify scope: "Any specific requirements or constraints?"
5. Tech preferences (if any): "Do you have preferences for tech stack?"

## Complexity Inference (Internal - Don't Ask User)
Infer the tier from conversational cues:

**Simple (20-40 features)** - Look for signals like:
- "just for me", "personal", "prototype", "quick", "simple"
- "learning project", "side project", "experiment"
- Single user, no auth complexity needed

**Standard (60-120 features)** - Look for signals like:
- "for my team", "small business", "internal tool"
- "dashboard", "admin panel", "10-50 users"
- Multi-user but not public-facing

**Production (150-250+ features)** - Look for signals like:
- "customers", "SaaS", "commercial", "sell to"
- "enterprise", "scale", "thousands of users"
- "billing", "security", "multi-tenant"

## Output Format
When you have enough information, output an App Description block:

\`\`\`app_description
# [App Name]

## Overview
[2-3 paragraph description of what the app does, who it's for, and the problem it solves]

## Target Users
[Who will use this app and in what context]

## Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]
...

## Technical Preferences
- Frontend: [preference or "no preference"]
- Backend: [preference or "no preference"]
- Database: [preference or "no preference"]
- Authentication: [preference or "no preference"]

## Inferred Complexity
Tier: [simple|standard|production]
Estimated Features: [number]
Reasoning: [1-2 sentences explaining why this tier was chosen]
\`\`\`

## Guidelines
- Be conversational and helpful, not interrogative
- Don't overwhelm with too many questions at once
- Suggest sensible defaults when user is unsure
- NEVER ask "do you want simple, standard, or production?"
- Infer complexity naturally from what they describe
- After the description, ask if they want to proceed to full spec generation`;
```

### Stage 2: Expansion Prompt (Automated)

This prompt takes the App Description and expands it into a full XML spec.

```typescript
const EXPANSION_SYSTEM_PROMPT = `You are an expert software architect. Given an App Description, generate a comprehensive XML app specification.

## Input
You will receive an App Description containing:
- Overview and purpose
- Target users
- Key features
- Technical preferences
- Inferred complexity tier and feature count

## Your Task
Expand this into a complete XML specification with:
- Full database schema with all tables and columns
- Complete API endpoint definitions
- Detailed UI layout for all pages
- Design system specifications
- Implementation priorities

## Complexity-Based Detail Levels

**Simple (20-40 features)**:
- 3-5 feature groups
- 1-3 database tables
- 5-15 API endpoints
- 2-4 pages

**Standard (60-120 features)**:
- 6-12 feature groups
- 4-8 database tables
- 15-40 API endpoints
- 5-10 pages

**Production (150-250+ features)**:
- 12-25+ feature groups
- 8-15+ database tables
- 40-100+ API endpoints
- 10-20+ pages

## XML Output Format

\`\`\`app_spec
<project_specification>
  <project_name>App Name</project_name>
  
  <overview>
    Comprehensive description from the App Description, expanded with
    additional context about the problem being solved.
  </overview>
  
  <complexity_tier>simple|standard|production</complexity_tier>
  <target_features>N</target_features>
  
  <technology_stack>
    <frontend>
      <framework>Framework choice with version</framework>
      <styling>CSS approach</styling>
      <state_management>State management approach</state_management>
      <ui_components>Component library if any</ui_components>
    </frontend>
    <backend>
      <runtime>Backend runtime</runtime>
      <database>Database choice</database>
      <authentication>Auth provider</authentication>
    </backend>
  </technology_stack>
  
  <core_features>
    <feature_group name="Group Name">
      <feature>Specific feature description</feature>
    </feature_group>
  </core_features>
  
  <database_schema>
    <table name="table_name">
      <column>column_name: type, constraints</column>
    </table>
  </database_schema>
  
  <api_endpoints>
    <endpoint_group name="Group Name">
      <endpoint method="METHOD" path="/path">Description</endpoint>
    </endpoint_group>
  </api_endpoints>
  
  <ui_layout>
    <page name="Page Name">
      <section>Section description</section>
    </page>
  </ui_layout>
  
  <design_system>
    <colors>
      <primary>Color value</primary>
      <secondary>Color value</secondary>
      <background>Color values for light/dark</background>
    </colors>
    <typography>
      <font_family>Font stack</font_family>
    </typography>
    <components>
      <buttons>Style description</buttons>
      <cards>Style description</cards>
      <inputs>Style description</inputs>
    </components>
  </design_system>
  
  <implementation_priorities>
    <priority level="1">Most critical features</priority>
    <priority level="2">Important features</priority>
    <priority level="3">Nice-to-have features</priority>
  </implementation_priorities>
  
  <success_criteria>
    <criterion category="functionality">Criterion description</criterion>
    <criterion category="ux">Criterion description</criterion>
    <criterion category="quality">Criterion description</criterion>
  </success_criteria>
</project_specification>
\`\`\`

## Output Requirements (CRITICAL)
- **ALWAYS generate the COMPLETE XML specification**
- **NEVER truncate or use placeholders** like "<!-- more features -->"
- **Match detail level to the specified complexity tier**
- Every feature group should have 3-10 specific features
- Database schema must include all tables with complete column definitions
- API endpoints must cover all CRUD operations for all resources
- UI layout must describe all pages and their sections
- The spec must be detailed enough for an autonomous agent to build the app`;
```

---

## Part 5: Updated Initializer Prompt

### Dynamic Prompt Generation

```typescript
// packages/agent-core/src/prompts.ts

export function getInitializerPrompt(targetFeatures: number): string {
  return `## YOUR ROLE - INITIALIZER AGENT (Session 1 of Many)

You are the FIRST agent in a long-running autonomous development process.
Your job is to set up the foundation for all future coding agents.

### FIRST: Read the Project Specification

Start by reading \`app_spec.txt\` in your working directory. This file contains
the complete XML specification for what you need to build. Read it carefully
before proceeding.

### CRITICAL FIRST TASK: Create feature_list.json

Based on \`app_spec.txt\`, create a file called \`feature_list.json\` with 
approximately **${targetFeatures} detailed end-to-end test cases**.

This number should comprehensively cover all functionality specified in the 
app_spec without padding with trivial tests or omitting important features.

**Format:**
\`\`\`json
[
  {
    "category": "functional",
    "description": "Brief description of the feature and what this test verifies",
    "steps": [
      "Step 1: Navigate to relevant page",
      "Step 2: Perform action",
      "Step 3: Verify expected result"
    ],
    "passes": false
  },
  {
    "category": "style",
    "description": "Brief description of UI/UX requirement",
    "steps": [
      "Step 1: Navigate to page",
      "Step 2: Take screenshot",
      "Step 3: Verify visual requirements"
    ],
    "passes": false
  }
]
\`\`\`

**Requirements for feature_list.json:**
- Target approximately ${targetFeatures} features (±10% is acceptable)
- Both "functional" and "style" categories
- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)
- At least ${Math.floor(targetFeatures * 0.15)} tests MUST have 10+ steps each
- Order features by priority: fundamental features first
- ALL tests start with "passes": false
- Cover every feature in the spec proportionally

**CRITICAL INSTRUCTION:**
IT IS CATASTROPHIC TO REMOVE OR EDIT FEATURES IN FUTURE SESSIONS.
Features can ONLY be marked as passing (change "passes": false to "passes": true).
Never remove features, never edit descriptions, never modify testing steps.
This ensures no functionality is missed.

### SECOND TASK: Create init.sh

Create a script called \`init.sh\` that future agents can use to quickly
set up and run the development environment. The script should:

1. Install any required dependencies
2. Start any necessary servers or services
3. Print helpful information about how to access the running application

Base the script on the technology stack specified in \`app_spec.txt\`.

### THIRD TASK: Initialize Git

Create a git repository and make your first commit with:
- feature_list.json (complete with all ~${targetFeatures} features)
- init.sh (environment setup script)
- README.md (project overview and setup instructions)

Commit message: "Initial setup: feature_list.json (${targetFeatures} features), init.sh, and project structure"

### FOURTH TASK: Create Project Structure

Set up the basic project structure based on what's specified in \`app_spec.txt\`.
This typically includes directories for frontend, backend, and any other
components mentioned in the spec.

### OPTIONAL: Start Implementation

If you have time remaining in this session, you may begin implementing
the highest-priority features from feature_list.json. Remember:
- Work on ONE feature at a time
- Test thoroughly before marking "passes": true
- Commit your progress before session ends

### ENDING THIS SESSION

Before your context fills up:
1. Commit all work with descriptive messages
2. Create \`claude-progress.txt\` with a summary of what you accomplished
3. Ensure feature_list.json is complete and saved
4. Leave the environment in a clean, working state

The next agent will continue from here with a fresh context window.

---

**Remember:** You have unlimited time across many sessions. Focus on
quality over speed. Production-ready is the goal.`;
}
```

---

## Part 6: Implementation Plan

### Phase 1: Data Model & API Updates (Day 1)

#### 1.1 Database Schema Changes

```prisma
// packages/database/prisma/schema.prisma

model AppSpec {
  id        String   @id @default(cuid())
  userId    String
  projectId String?
  name      String
  content   String   @db.Text
  format    String   @default("xml")  // NEW: "xml" or "markdown"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  builds  Build[]
  
  @@index([userId])
  @@index([projectId])
  @@map("app_specs")
}

model Build {
  id              String   @id @default(cuid())
  // ... existing fields ...
  
  // NEW FIELDS
  complexityTier    String   @default("standard")  // simple, standard, production
  targetFeatureCount Int     @default(80)
  
  // ... rest of model ...
}
```

#### 1.2 API Route Updates

**`/api/builds/route.ts`**:
```typescript
// Add to POST handler
const { 
  appSpec, 
  projectId, 
  appSpecId, 
  sandboxProvider = 'e2b', 
  harnessId = 'coding',
  complexityTier = 'standard',  // NEW
  targetFeatureCount,            // NEW (optional, uses tier default)
} = body;

// Determine feature count
const featureCount = targetFeatureCount ?? getDefaultFeatureCount(complexityTier);

function getDefaultFeatureCount(tier: string): number {
  switch (tier) {
    case 'simple': return 30;
    case 'standard': return 80;
    case 'production': return 200;
    default: return 80;
  }
}
```

#### 1.3 Build Runner Updates

**`build-runner.ts`**:
```typescript
export async function startBuildInBackground(
  buildId: string,
  appSpec: string,
  sandboxProvider: string,
  harnessId: string,
  targetFeatureCount: number  // NEW parameter
): Promise<void> {
  // Pass to sandbox agent
  await runSandboxAgent({
    buildId,
    sandbox,
    appSpec,
    targetFeatureCount,  // NEW
    maxIterations: 20,
    onLog,
    onProgress,
  });
}
```

### Phase 2: Agent Core Updates (Day 1-2)

#### 2.1 Update Prompts Module

**`packages/agent-core/src/prompts.ts`**:
- Replace static `INITIALIZER_PROMPT` with `getInitializerPrompt(targetFeatures: number)`
- Keep `CODING_PROMPT` unchanged (it reads feature_list.json dynamically)

#### 2.2 Update Sandbox Agent

**`sandbox-agent.ts`**:
```typescript
export interface SandboxAgentConfig {
  buildId: string;
  sandbox: Sandbox;
  appSpec: string;
  targetFeatureCount: number;  // NEW
  maxIterations?: number;
  onLog: AgentLogCallback;
  onProgress: AgentProgressCallback;
}

// Use dynamic prompt
const systemPrompt = getInitializerPrompt(targetFeatureCount);
```

### Phase 3: Two-Stage Chat System (Day 2)

#### 3.1 Update Chat Route for Discovery Stage

**`/api/chat/route.ts`**:
- Replace `SPEC_BUILDER_SYSTEM_PROMPT` with `DISCOVERY_SYSTEM_PROMPT`
- Chat now outputs `app_description` blocks instead of full specs

#### 3.2 Add Expansion API Route

**`/api/expand-spec/route.ts`** (NEW):
```typescript
// Takes an app_description and returns a full app_spec
export async function POST(request: Request) {
  const { appDescription } = await request.json();
  
  // Call Claude with EXPANSION_SYSTEM_PROMPT
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32768,
    system: EXPANSION_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Expand this App Description into a full XML specification:\n\n${appDescription}` }
    ],
  });
  
  // Extract and return the XML spec
  const spec = extractAppSpec(response.content[0].text);
  return NextResponse.json({ spec });
}
```

#### 3.3 Update Extract Utilities

**`extract-spec.ts`**:
```typescript
// Extract App Description from Stage 1
export function extractAppDescription(content: string): {
  description: string;
  complexity: 'simple' | 'standard' | 'production';
  targetFeatures: number;
} | null {
  const start = content.indexOf('```app_description\n');
  if (start === -1) return null;
  
  // Extract content and parse complexity info
  // ...
}

// Extract full XML spec from Stage 2
export function extractAppSpec(content: string): { 
  spec: string; 
  format: 'xml' | 'markdown';
  complexity?: string;
  targetFeatures?: number;
} | null {
  // Try XML format first
  const xmlStart = content.indexOf('```app_spec\n<project_specification>');
  if (xmlStart !== -1) {
    // Extract XML spec and parse complexity_tier/target_features
    return { spec: extractedXml, format: 'xml', complexity, targetFeatures };
  }
  
  // Fall back to markdown format (backwards compatibility)
  const mdStart = content.indexOf('```app_spec\n#');
  if (mdStart !== -1) {
    return { spec: extractedMd, format: 'markdown' };
  }
  
  return null;
}
```

### Phase 4: UI Updates (Day 2-3)

#### 4.1 Two-Stage Chat Flow

Update the chat page to handle the two-stage flow:

```typescript
// Simplified flow in chat page
const [stage, setStage] = useState<'discovery' | 'expansion' | 'review'>('discovery');
const [appDescription, setAppDescription] = useState<string | null>(null);
const [appSpec, setAppSpec] = useState<string | null>(null);
const [inferredComplexity, setInferredComplexity] = useState<{
  tier: 'simple' | 'standard' | 'production';
  features: number;
  reasoning: string;
} | null>(null);

// When discovery outputs an app_description:
const handleDescriptionGenerated = async (description: string, complexity: InferredComplexity) => {
  setAppDescription(description);
  setInferredComplexity(complexity);
  setStage('expansion');
  
  // Automatically expand to full spec
  const response = await fetch('/api/expand-spec', {
    method: 'POST',
    body: JSON.stringify({ appDescription: description }),
  });
  const { spec } = await response.json();
  setAppSpec(spec);
  setStage('review');
};
```

#### 4.2 Review Panel Component

```typescript
// components/build/spec-review-panel.tsx

interface SpecReviewPanelProps {
  appDescription: string;
  appSpec: string;
  inferredComplexity: {
    tier: 'simple' | 'standard' | 'production';
    features: number;
    reasoning: string;
  };
  onAdjustComplexity: () => void;
  onStartBuild: () => void;
}

// Shows:
// - Summary of what was inferred
// - "Based on your requirements, I've planned this as a [TIER] application..."
// - Feature count and build time estimate
// - [Adjust complexity] button (for power users)
// - [View full spec] button
// - [Start Build] button
```

#### 4.3 Complexity Adjuster (Optional Override)

```typescript
// components/build/complexity-adjuster.tsx

// Hidden by default, shown when user clicks "Adjust complexity"
// Allows power users to override the inferred tier

interface ComplexityAdjusterProps {
  currentTier: 'simple' | 'standard' | 'production';
  inferredTier: 'simple' | 'standard' | 'production';
  onSelect: (tier: 'simple' | 'standard' | 'production') => void;
}

const TIERS = [
  {
    id: 'simple',
    name: 'Simple',
    features: '20-40',
    time: '1-4 hours',
    description: 'Landing pages, prototypes, demos',
  },
  {
    id: 'standard',
    name: 'Standard', 
    features: '60-120',
    time: '4-12 hours',
    description: 'Dashboards, blogs, small SaaS',
  },
  {
    id: 'production',
    name: 'Production',
    features: '150-250+',
    time: '12-48+ hours',
    description: 'Full SaaS, complex applications',
  },
];
```

#### 4.4 Update Wizard

The wizard can either:
- Use the same two-stage approach (generate description from wizard inputs, then expand)
- Or directly generate the XML spec since wizard inputs are structured

#### 4.5 Update Spec Detail Page

Show complexity tier (inferred or adjusted) and allow re-expansion with different tier before build.

### Phase 5: Testing & Validation (Day 3)

#### 5.1 Test Cases

1. **Simple tier**: Generate spec for "Hello World landing page"
   - Verify ~30 features in feature_list.json
   - Verify build completes in reasonable time

2. **Standard tier**: Generate spec for "Task management dashboard"
   - Verify ~80 features
   - Verify comprehensive coverage

3. **Production tier**: Generate spec for "Claude.ai clone" (existing)
   - Verify ~200 features
   - Matches original behavior

#### 5.2 Backwards Compatibility

- Existing markdown specs should still work
- Existing builds with hardcoded 200 features continue

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/database/prisma/schema.prisma` | Modify | Add `complexityTier`, `targetFeatureCount`, `complexityInferred` to Build |
| `packages/database/src/helpers/builds.ts` | Modify | Update CreateBuildInput interface |
| `apps/web/src/app/api/builds/route.ts` | Modify | Accept complexity params, pass to runner |
| `apps/web/src/app/api/expand-spec/route.ts` | **Create** | New API for Stage 2 expansion |
| `apps/web/src/lib/sandbox/build-runner.ts` | Modify | Accept targetFeatureCount, pass to agent |
| `apps/web/src/lib/sandbox/sandbox-agent.ts` | Modify | Use dynamic initializer prompt |
| `packages/agent-core/src/prompts.ts` | Modify | Make INITIALIZER_PROMPT dynamic |
| `apps/web/src/app/api/chat/route.ts` | Modify | Use DISCOVERY_SYSTEM_PROMPT (Stage 1) |
| `apps/web/src/lib/utils/extract-spec.ts` | Modify | Add `extractAppDescription`, update `extractAppSpec` |
| `apps/web/src/components/build/spec-review-panel.tsx` | **Create** | Review panel with inferred complexity |
| `apps/web/src/components/build/complexity-adjuster.tsx` | **Create** | Optional override for power users |
| `apps/web/src/app/(dashboard)/chat/page.tsx` | Modify | Two-stage flow (discovery → expansion → review) |
| `apps/web/src/hooks/use-wizard.ts` | Modify | Add complexity inference |
| `apps/web/src/app/(dashboard)/wizard/page.tsx` | Modify | Add review step with inferred complexity |
| `apps/web/src/app/(dashboard)/specs/[id]/page.tsx` | Modify | Show complexity tier, allow re-expansion |

---

## Migration Strategy

### For Existing Data

1. **Existing AppSpecs**: Keep as-is (markdown format)
2. **Existing Builds**: Default to `complexityTier: 'production'`, `targetFeatureCount: 200`
3. **New Builds**: Use selected tier and count

### Database Migration

```sql
-- Add new columns with defaults
ALTER TABLE builds ADD COLUMN complexity_tier VARCHAR(20) DEFAULT 'standard';
ALTER TABLE builds ADD COLUMN target_feature_count INTEGER DEFAULT 80;

-- Update existing builds to match original behavior
UPDATE builds SET complexity_tier = 'production', target_feature_count = 200;
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Simple tier builds complete in | < 4 hours |
| Feature count accuracy | ±10% of target |
| User satisfaction with tier selection | > 80% find it helpful |
| Build failure rate | No increase from current |

---

## Timeline

| Day | Tasks |
|-----|-------|
| **Day 1** | Database schema, API routes, build runner updates |
| **Day 2** | Agent prompts, chat system prompt, extract utilities |
| **Day 3** | UI components, integration testing |
| **Day 4** | Polish, documentation, deployment |

**Total Estimated Time:** 4 days

---

## Appendix A: Example Specs by Tier

### Simple Tier Example (Hello World)

```xml
<project_specification>
  <project_name>Hello World Landing Page</project_name>
  <overview>A simple, beautiful landing page with Node.js backend.</overview>
  <complexity_tier>simple</complexity_tier>
  <target_features>25</target_features>
  
  <technology_stack>
    <frontend>
      <framework>Vanilla HTML/CSS/JS</framework>
      <styling>Tailwind CSS via CDN</styling>
    </frontend>
    <backend>
      <runtime>Node.js with Express</runtime>
    </backend>
  </technology_stack>
  
  <core_features>
    <feature_group name="Landing Page">
      <feature>Hero section with gradient background</feature>
      <feature>Centered "Hello World" heading</feature>
      <feature>Subtitle text</feature>
      <feature>Fade-in animation</feature>
      <feature>Responsive design</feature>
    </feature_group>
    <feature_group name="Server">
      <feature>Express static file serving</feature>
      <feature>Health check endpoint</feature>
      <feature>Request logging</feature>
    </feature_group>
  </core_features>
  
  <database_schema>
    <!-- No database for simple landing page -->
  </database_schema>
  
  <api_endpoints>
    <endpoint_group name="Health">
      <endpoint method="GET" path="/api/health">Health check</endpoint>
    </endpoint_group>
  </api_endpoints>
  
  <ui_layout>
    <page name="Home">
      <section>Full-viewport hero</section>
    </page>
  </ui_layout>
</project_specification>
```

### Standard Tier Example (Task Dashboard)

See full XML schema example in Part 2.

### Production Tier Example

Use existing `prompts/app_spec.txt` as reference.

---

*Last Updated: December 10, 2024*
