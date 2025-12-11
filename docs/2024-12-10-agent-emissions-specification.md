# Agent Emissions Specification

**Date:** December 10, 2024  
**Version:** 1.0  
**Purpose:** Define structured events that the autonomous agent should emit to keep users informed of build progress

---

## Executive Summary

This document specifies the complete set of **structured emissions** that the autonomous coding agent should produce during a build. These emissions enable the frontend to display accurate, real-time progress information to users who check in on their builds.

The goal: **When a user opens their build page after hours away, they should immediately understand:**
1. What the agent has accomplished
2. What it's currently doing
3. How much work remains
4. When it's likely to finish

---

## Understanding the Autonomous Agent Architecture

### How the Agent Works

The autonomous coding agent is designed for **long-running builds** that may span hours or days. It operates through a **multi-session architecture**:

#### Session Types

1. **Initializer Session** (Session 1)
   - Reads `app_spec.txt` (user's requirements)
   - Creates `feature_list.json` with 200+ test cases
   - Creates `init.sh` (environment setup script)
   - Initializes git repository
   - Sets up project structure
   - May begin implementing first features

2. **Continuation Sessions** (Sessions 2+)
   - Fresh context window (no memory of previous sessions)
   - Reads `feature_list.json` to understand progress
   - Reads `claude-progress.txt` for context from previous sessions
   - Verifies existing work still functions
   - Implements one feature at a time
   - Tests via browser automation (Puppeteer)
   - Updates `feature_list.json` to mark features as passing
   - Commits progress to git
   - Updates `claude-progress.txt`

#### Key Files

| File | Purpose |
|------|---------|
| `app_spec.txt` | Complete application specification from user |
| `feature_list.json` | 200+ features with test steps and pass/fail status |
| `init.sh` | Environment setup script |
| `claude-progress.txt` | Human-readable progress notes between sessions |

#### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        SESSION START                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Orient: Read app_spec.txt, feature_list.json                 │
│ 2. Environment: Run init.sh, start servers                      │
│ 3. Verify: Run passing tests to confirm functionality           │
│ 4. Fix: Address any regressions discovered                      │
│ 5. Implement: Build next feature from feature_list.json         │
│ 6. Test: Verify with browser automation + screenshots           │
│ 7. Update: Mark feature as passing in feature_list.json         │
│ 8. Commit: git commit with detailed message                     │
│ 9. Document: Update claude-progress.txt                         │
│ 10. Clean Exit: Ensure no uncommitted changes                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Iteration Loop (Within Session)

The agent makes multiple Claude API calls per session:
1. Each call may use multiple tools (bash, write_file, read_file)
2. After tool execution, check progress via `feature_list.json`
3. Continue until max iterations or all features complete
4. Auto-continue with delay between iterations

---

## Current Emission State

### What Exists Today

The current implementation emits **simple log messages** via `onLog(level, message)`:

| Level | Example Messages |
|-------|------------------|
| `info` | "Starting build with e2b provider..." |
| `info` | "Feature 3/5 - Working on: User Authentication" |
| `tool` | "bash: npm install next react" |
| `error` | "Command exited with code 1" |

### Limitations of Current Approach

1. **Unstructured**: Frontend must regex-parse log messages
2. **Incomplete**: Many agent activities aren't logged
3. **No Timing**: No duration tracking for operations
4. **No Hierarchy**: Can't distinguish sessions, iterations, features
5. **No Recovery Info**: When errors occur, no indication if agent is recovering

---

## Proposed Emission Categories

### Category 1: Build Lifecycle Events

These mark major transitions in the build process.

```typescript
interface BuildLifecycleEvent {
  type: 'build_lifecycle';
  event: 
    | 'build_started'
    | 'build_completed'
    | 'build_failed'
    | 'build_cancelled'
    | 'build_paused'      // For future manual pause feature
    | 'build_resumed';
  timestamp: string;
  buildId: string;
  metadata?: {
    reason?: string;       // Why it ended (for failed/cancelled)
    totalDuration?: number; // Final duration in ms
    finalProgress?: {
      completed: number;
      total: number;
    };
  };
}
```

**Emission Points:**
- `build_started`: When sandbox is created and agent begins
- `build_completed`: When all features pass
- `build_failed`: When unrecoverable error occurs
- `build_cancelled`: When user stops build

---

### Category 2: Session Events

Track the multi-session architecture.

```typescript
interface SessionEvent {
  type: 'session';
  event:
    | 'session_started'
    | 'session_ended'
    | 'session_checkpoint';  // Mid-session progress save
  timestamp: string;
  buildId: string;
  sessionNumber: number;
  isInitializer: boolean;  // First session vs continuation
  metadata?: {
    contextTokensUsed?: number;
    toolCallCount?: number;
    filesModified?: string[];
    featuresCompleted?: string[];
    duration?: number;
    endReason?: 'context_full' | 'max_iterations' | 'complete' | 'error';
  };
}
```

**Emission Points:**
- `session_started`: When new Claude conversation begins
- `session_checkpoint`: Every N minutes or after significant progress
- `session_ended`: When session completes (success or context full)

---

### Category 3: Phase Events

High-level phases within a session.

```typescript
interface PhaseEvent {
  type: 'phase';
  phase:
    | 'orienting'        // Reading app_spec, feature_list, progress notes
    | 'environment'      // Running init.sh, starting servers
    | 'verifying'        // Testing existing functionality
    | 'fixing'           // Repairing broken features
    | 'implementing'     // Building new features
    | 'testing'          // Running feature tests
    | 'documenting'      // Updating progress notes
    | 'committing'       // Git operations
    | 'cleanup';         // End of session cleanup
  timestamp: string;
  buildId: string;
  sessionNumber: number;
  message?: string;
}
```

**Emission Points:**
- At each major phase transition within a session
- Include human-readable message for UI display

---

### Category 4: Iteration Events

Track the agent's API call loop.

```typescript
interface IterationEvent {
  type: 'iteration';
  event: 'iteration_started' | 'iteration_ended';
  timestamp: string;
  buildId: string;
  sessionNumber: number;
  iterationNumber: number;  // Within session
  maxIterations: number;
  metadata?: {
    duration?: number;
    toolCalls?: number;
    tokensUsed?: number;
    stopReason?: 'tool_use' | 'end_turn' | 'max_tokens';
  };
}
```

**Emission Points:**
- Start and end of each Claude API call iteration
- Useful for showing "Iteration 3/20" type progress

---

### Category 5: Feature Events

The core progress tracking unit.

```typescript
interface FeatureEvent {
  type: 'feature';
  event:
    | 'feature_started'
    | 'feature_progress'
    | 'feature_testing'
    | 'feature_passed'
    | 'feature_failed'
    | 'feature_skipped';
  timestamp: string;
  buildId: string;
  featureId: string;       // e.g., "feature-42"
  featureIndex: number;    // 42 of 200
  totalFeatures: number;   // 200
  feature: {
    category: 'functional' | 'style';
    description: string;
    steps: string[];       // Test steps from feature_list.json
  };
  metadata?: {
    duration?: number;
    stepIndex?: number;    // For progress updates
    stepDescription?: string;
    testOutput?: string;   // For passed/failed
    screenshotPath?: string;
    errorMessage?: string; // For failed
  };
}
```

**Emission Points:**
- `feature_started`: When agent begins working on a feature
- `feature_progress`: As agent completes implementation steps
- `feature_testing`: When browser automation testing begins
- `feature_passed`: When feature is verified and marked in JSON
- `feature_failed`: When feature fails (may retry or move on)
- `feature_skipped`: When feature is deferred for later

---

### Category 6: Tool Execution Events

Track individual tool calls.

```typescript
interface ToolEvent {
  type: 'tool';
  event: 'tool_started' | 'tool_completed' | 'tool_failed';
  timestamp: string;
  buildId: string;
  toolUseId: string;       // Claude's tool_use ID
  tool: 'bash' | 'write_file' | 'read_file' | 'str_replace_editor' | 'puppeteer_*';
  input: {
    // Tool-specific input (truncated for display)
    display: string;       // Human-readable summary
    full?: Record<string, unknown>;  // Full input if not too large
  };
  metadata?: {
    duration?: number;
    exitCode?: number;     // For bash
    filePath?: string;     // For file operations
    fileSize?: number;     // For write operations
    outputPreview?: string; // Truncated output
    isError?: boolean;
  };
}
```

**Emission Points:**
- Before each tool execution begins
- After each tool execution completes

**Tool Categories:**
| Tool | Description |
|------|-------------|
| `bash` | Shell command execution |
| `write_file` | Create or overwrite file |
| `read_file` | Read file contents |
| `str_replace_editor` | Edit file with search/replace |
| `puppeteer_navigate` | Browser navigation |
| `puppeteer_click` | Click element |
| `puppeteer_fill` | Fill form input |
| `puppeteer_screenshot` | Capture screenshot |

---

### Category 7: File Events

Track file system changes.

```typescript
interface FileEvent {
  type: 'file';
  event: 'file_created' | 'file_modified' | 'file_deleted' | 'file_read';
  timestamp: string;
  buildId: string;
  path: string;
  metadata?: {
    language?: string;     // Inferred from extension
    size?: number;         // File size in bytes
    linesAdded?: number;
    linesRemoved?: number;
    isTest?: boolean;      // Is this a test file?
    isConfig?: boolean;    // Is this a config file?
  };
}
```

**Emission Points:**
- After each file operation completes
- Deduplicate multiple writes to same file

---

### Category 8: Test Events

Track test execution results.

```typescript
interface TestEvent {
  type: 'test';
  event:
    | 'test_suite_started'
    | 'test_suite_completed'
    | 'browser_test_started'
    | 'browser_test_completed'
    | 'verification_started'
    | 'verification_completed';
  timestamp: string;
  buildId: string;
  testType: 'unit' | 'integration' | 'browser' | 'verification';
  metadata?: {
    command?: string;      // e.g., "npm run test"
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration?: number;
    screenshotPath?: string;  // For browser tests
    failureDetails?: string;
  };
}
```

**Emission Points:**
- When test commands are executed
- When browser automation tests run
- When verification tests (re-testing passing features) run

---

### Category 9: Progress Events

Aggregate progress snapshots.

```typescript
interface ProgressEvent {
  type: 'progress';
  timestamp: string;
  buildId: string;
  progress: {
    completed: number;
    total: number;
    percentComplete: number;
  };
  timing: {
    elapsed: number;                  // ms since build started
    estimatedRemaining?: number;      // ms estimated to complete
    averageFeatureDuration?: number;  // ms per feature
    currentPace?: 'slow' | 'normal' | 'fast';
  };
  currentWork?: {
    sessionNumber: number;
    iterationNumber: number;
    featureId?: string;
    featureDescription?: string;
    activity: string;               // Human-readable current activity
  };
}
```

**Emission Points:**
- After each feature completion
- Every 30 seconds during active work
- Whenever progress changes significantly

---

### Category 10: Error & Recovery Events

Track problems and how agent handles them.

```typescript
interface ErrorEvent {
  type: 'error';
  severity: 'warning' | 'error' | 'fatal';
  timestamp: string;
  buildId: string;
  error: {
    code?: string;         // Error code if available
    message: string;       // Human-readable message
    details?: string;      // Stack trace or additional info
    source?: 'agent' | 'tool' | 'sandbox' | 'api';
  };
  recovery?: {
    strategy: 'retry' | 'skip' | 'fix' | 'abort';
    attempt?: number;      // Which retry attempt
    maxAttempts?: number;
  };
}
```

**Emission Points:**
- When any error occurs
- When agent begins recovery
- When recovery succeeds or fails

---

### Category 11: Git Events

Track version control operations.

```typescript
interface GitEvent {
  type: 'git';
  event: 
    | 'git_init'
    | 'git_commit'
    | 'git_checkpoint';    // Auto-save point
  timestamp: string;
  buildId: string;
  metadata?: {
    commitHash?: string;
    message?: string;
    filesChanged?: number;
    insertions?: number;
    deletions?: number;
  };
}
```

**Emission Points:**
- When repository is initialized
- After each commit
- At periodic checkpoints

---

### Category 12: Agent Thinking Events

Provide visibility into agent's decision-making.

```typescript
interface ThinkingEvent {
  type: 'thinking';
  category:
    | 'planning'           // Deciding what to do next
    | 'analyzing'          // Understanding code/requirements
    | 'debugging'          // Figuring out why something failed
    | 'deciding';          // Making an architectural decision
  timestamp: string;
  buildId: string;
  summary: string;         // Brief human-readable summary
  detail?: string;         // Longer explanation if available
}
```

**Emission Points:**
- When agent produces significant text (not tool calls)
- When agent is between tool calls
- Useful for showing "Thinking about..." in UI

---

## Emission Timeline Example

Here's how emissions would flow during a typical build:

```
TIME      EVENT
────────────────────────────────────────────────────────────────
00:00     build_lifecycle: build_started
00:01     session: session_started (session=1, initializer=true)
00:02     phase: orienting
00:03     tool: read_file (app_spec.txt)
00:05     phase: implementing
00:06     thinking: planning (creating feature list)
00:10     tool: write_file (feature_list.json)
00:12     file: file_created (feature_list.json)
00:15     progress: 0/200 features
00:20     tool: write_file (init.sh)
00:25     git: git_init
00:30     git: git_commit ("Initial setup")
00:35     feature: feature_started (feature-1)
00:40     tool: write_file (src/App.tsx)
00:45     tool: bash (npm run test)
00:50     test: test_suite_completed (passed=5)
00:55     feature: feature_passed (feature-1)
01:00     progress: 1/200 features
01:05     feature: feature_started (feature-2)
...
02:00     session: session_ended (context_full)
02:01     session: session_started (session=2, initializer=false)
02:02     phase: orienting
02:05     phase: verifying
02:10     test: verification_completed (passed=1)
02:15     feature: feature_started (feature-3)
...
24:00     progress: 200/200 features
24:05     phase: cleanup
24:10     git: git_commit ("All features complete")
24:15     session: session_ended (complete)
24:20     build_lifecycle: build_completed
```

---

## UI Display Recommendations

### Primary Status Card

Show the most important information at a glance:

```
┌─────────────────────────────────────────────────────────┐
│  🔧 Building: MyApp                                     │
│                                                         │
│  ████████████████░░░░░░░░░░░░░░  75/200 features (37%) │
│                                                         │
│  Current: Feature 76 - User profile page                │
│  Activity: Running browser tests...                     │
│                                                         │
│  ⏱️ Elapsed: 4h 23m  │  📊 Est. remaining: 2h 15m      │
│                                                         │
│  Session 3  │  Iteration 8/20                          │
└─────────────────────────────────────────────────────────┘
```

### Activity Feed

Show recent emissions with appropriate icons:

```
14:32:05  ✓ Feature 75: Payment form passed
14:31:42  📸 Screenshot captured: checkout-page.png
14:31:30  🧪 Browser tests: 3 passed, 0 failed
14:31:15  📝 Modified: src/components/PaymentForm.tsx
14:30:45  ⚡ Started: Feature 76 - User profile page
14:30:30  💾 Git commit: "Implement payment form"
14:30:00  💭 Planning next feature...
```

### Feature Checklist

Group by category with status indicators:

```
Functional Features (58/150)
  ✓ User authentication
  ✓ Product listing
  ● User profile page (in progress)
  ○ Shopping cart
  ○ Checkout flow
  ...

Style Features (17/50)
  ✓ Responsive navigation
  ✓ Dark mode support
  ○ Loading animations
  ...
```

### Error Panel

When errors occur, show recovery status:

```
⚠️ Error at 14:28:15
   Test failed: Payment validation
   Strategy: Fixing and retrying (attempt 2/3)
   
   Agent is modifying PaymentForm.tsx to fix
   validation logic...
```

---

## Implementation Priority

### Phase 1: Core Progress (Essential)
1. `progress` events - Overall completion tracking
2. `feature` events - Feature-level granularity
3. `build_lifecycle` events - Start/end states

### Phase 2: Activity Visibility (High Value)
4. `phase` events - What stage the build is in
5. `tool` events - What the agent is doing now
6. `thinking` events - Agent's reasoning

### Phase 3: Detailed Tracking (Nice to Have)
7. `session` events - Multi-session tracking
8. `iteration` events - API call loop visibility
9. `test` events - Test result details
10. `file` events - File system changes

### Phase 4: Operations (Future)
11. `git` events - Version control tracking
12. `error` events - Detailed error/recovery

---

## Schema Summary

```typescript
type AgentEmission = 
  | BuildLifecycleEvent
  | SessionEvent
  | PhaseEvent
  | IterationEvent
  | FeatureEvent
  | ToolEvent
  | FileEvent
  | TestEvent
  | ProgressEvent
  | ErrorEvent
  | GitEvent
  | ThinkingEvent;

// All emissions share these fields:
interface BaseEmission {
  id: string;           // Unique event ID
  type: string;         // Discriminator
  timestamp: string;    // ISO 8601
  buildId: string;      // Which build this belongs to
}
```

---

## Next Steps

1. **Review this specification** with the team
2. **Prioritize** which emissions to implement first
3. **Update `sandbox-agent.ts`** to emit structured events
4. **Extend `events.ts`** with any new event types
5. **Update `use-event-stream.ts`** to consume new events
6. **Update UI components** to display rich information

---

*Last Updated: December 10, 2024*
