# Incremental Output & Micro-Interactions Development Plan

**Date:** December 10, 2024  
**Version:** 1.0  
**Feature:** Real-time Build Activity Stream  
**Estimated Timeline:** 1-2 Weeks

---

## Overview

This plan outlines the implementation of a structured event system that captures incremental outputs from the autonomous coding agent running in sandbox containers, and surfaces them as rich, interactive UI elements (micro-interactions) in the frontend.

### Goals

1. **Structured Events**: Replace plain text logs with typed, structured events
2. **Rich UI Components**: Create micro-interaction components for different event types
3. **Real-time Updates**: Maintain responsive SSE streaming with the new event types
4. **Feature Tracking**: Enhanced progress visualization with granular status updates

---

## Current State Analysis

### ✅ Existing Infrastructure
- SSE streaming pipeline (`build-runner.ts` → `stream/route.ts` → `useBuildStream`)
- In-memory + database log persistence
- Basic `BuildMonitor` with log viewer and progress bar
- `ProgressState` and `FeatureStatus` types in `@repo/agent-core`

### ❌ Gaps Identified
- No structured event types beyond plain text logs
- No UI components for individual activities (file creation, tool execution)
- Progress is inferred from log messages via regex
- No separation between agent thinking, tool use, and results

---

## Phase 1: Event Schema Definition
**Duration:** 1 day  
**Goal:** Define comprehensive event types for all agent activities

### 1.1 Create Event Types Package

Create `packages/agent-core/src/events.ts`:

```typescript
// Base event type
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  buildId: string;
}

// Agent thinking/planning
export interface ThinkingEvent extends BaseEvent {
  type: 'thinking';
  content: string;
  phase: 'planning' | 'analyzing' | 'deciding';
}

// Tool execution events
export interface ToolStartEvent extends BaseEvent {
  type: 'tool_start';
  toolName: 'bash' | 'write_file' | 'read_file';
  input: Record<string, unknown>;
  truncatedInput?: string; // For display
}

export interface ToolEndEvent extends BaseEvent {
  type: 'tool_end';
  toolUseId: string; // Links to ToolStartEvent
  success: boolean;
  output?: string;
  truncatedOutput?: string;
  durationMs: number;
}

// File events
export interface FileEvent extends BaseEvent {
  type: 'file_created' | 'file_modified' | 'file_deleted';
  path: string;
  size?: number;
  language?: string; // Inferred from extension
  linesAdded?: number;
  linesRemoved?: number;
}

// Feature progress events
export interface FeatureStartEvent extends BaseEvent {
  type: 'feature_start';
  featureId: string;
  description: string;
}

export interface FeatureEndEvent extends BaseEvent {
  type: 'feature_end';
  featureId: string;
  success: boolean;
  summary?: string;
}

// Progress update
export interface ProgressEvent extends BaseEvent {
  type: 'progress';
  completed: number;
  total: number;
  currentFeature?: string;
}

// Iteration/phase markers
export interface PhaseEvent extends BaseEvent {
  type: 'phase';
  phase: 'initialization' | 'feature_extraction' | 'implementation' | 'testing' | 'completion';
  message?: string;
}

// Command execution (more detailed than tool for bash)
export interface CommandEvent extends BaseEvent {
  type: 'command';
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
}

// Error event
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  severity: 'warning' | 'error' | 'fatal';
  message: string;
  details?: string;
  recoverable: boolean;
}

// Union type for all events
export type AgentEvent =
  | ThinkingEvent
  | ToolStartEvent
  | ToolEndEvent
  | FileEvent
  | FeatureStartEvent
  | FeatureEndEvent
  | ProgressEvent
  | PhaseEvent
  | CommandEvent
  | ErrorEvent;

// Event categories for UI filtering
export type EventCategory = 
  | 'thought'    // ThinkingEvent
  | 'tool'       // ToolStartEvent, ToolEndEvent
  | 'file'       // FileEvent
  | 'feature'    // FeatureStartEvent, FeatureEndEvent
  | 'progress'   // ProgressEvent
  | 'phase'      // PhaseEvent
  | 'command'    // CommandEvent
  | 'error';     // ErrorEvent

export function getEventCategory(event: AgentEvent): EventCategory {
  switch (event.type) {
    case 'thinking':
      return 'thought';
    case 'tool_start':
    case 'tool_end':
      return 'tool';
    case 'file_created':
    case 'file_modified':
    case 'file_deleted':
      return 'file';
    case 'feature_start':
    case 'feature_end':
      return 'feature';
    case 'progress':
      return 'progress';
    case 'phase':
      return 'phase';
    case 'command':
      return 'command';
    case 'error':
      return 'error';
  }
}
```

### 1.2 Testing Checklist
- [ ] Event types compile without errors
- [ ] All event types have required fields
- [ ] Union type covers all cases
- [ ] Category function maps correctly

---

## Phase 2: Backend Event Emission
**Duration:** 2 days  
**Goal:** Update sandbox-agent to emit structured events

### 2.1 Update Sandbox Agent

Modify `apps/web/src/lib/sandbox/sandbox-agent.ts`:

```typescript
// Add event emission alongside existing logging

interface AgentEventCallback {
  (event: AgentEvent): void;
}

export interface SandboxAgentConfig {
  // ... existing fields
  onEvent?: AgentEventCallback;  // New callback for structured events
}

// In executeToolInSandbox function:
async function executeToolInSandbox(
  sandbox: Sandbox,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolUseId: string,
  onLog: AgentLogCallback,
  onEvent?: AgentEventCallback
): Promise<{ output: string; isError: boolean }> {
  const startTime = Date.now();
  
  // Emit tool start event
  onEvent?.({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'tool_start',
    timestamp: new Date().toISOString(),
    buildId: '', // Will be filled by caller
    toolName: toolName as 'bash' | 'write_file' | 'read_file',
    input: toolInput,
    truncatedInput: JSON.stringify(toolInput).slice(0, 200),
  });

  try {
    // ... existing tool execution logic

    // Emit file event for write_file
    if (toolName === 'write_file') {
      const path = toolInput.path as string;
      const content = toolInput.content as string;
      onEvent?.({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'file_created', // or 'file_modified' based on existence check
        timestamp: new Date().toISOString(),
        buildId: '',
        path,
        size: content.length,
        language: inferLanguage(path),
        linesAdded: content.split('\n').length,
      });
    }

    // Emit tool end event
    onEvent?.({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'tool_end',
      timestamp: new Date().toISOString(),
      buildId: '',
      toolUseId,
      success: !isError,
      output: output.slice(0, 500),
      truncatedOutput: output.length > 500 ? output.slice(0, 500) + '...' : undefined,
      durationMs: Date.now() - startTime,
    });

    return { output, isError };
  } catch (error) {
    // ... error handling with error event emission
  }
}
```

### 2.2 Update Build Runner

Modify `apps/web/src/lib/sandbox/build-runner.ts`:

```typescript
// Add event storage and streaming
const activeBuildEvents = new Map<string, AgentEvent[]>();

// Add event to the addLog pattern
const emitEvent = (event: Omit<AgentEvent, 'buildId'>) => {
  const fullEvent = { ...event, buildId } as AgentEvent;
  
  // Store in memory
  const events = activeBuildEvents.get(buildId) || [];
  events.push(fullEvent);
  activeBuildEvents.set(buildId, events);
  
  // Notify subscribers (reuse existing subscriber pattern)
  const subscribers = buildSubscribers.get(buildId);
  if (subscribers) {
    subscribers.forEach((callback) => callback({ 
      type: 'event', 
      event: fullEvent 
    }));
  }
  
  // Persist to database (batch like logs)
  // ... similar buffering pattern
};
```

### 2.3 Update SSE Stream

Modify `apps/web/src/app/api/builds/[id]/stream/route.ts`:

```typescript
// Update to handle both logs and events
const sendEvent = (data: unknown) => {
  // ... existing implementation
};

// Subscribe to both logs and events
const unsubscribe = subscribeToBuildLogs(buildId, (item) => {
  if ('event' in item) {
    sendEvent({ type: 'agent_event', ...item.event });
  } else {
    sendEvent({ type: 'log', ...item });
  }
});
```

### 2.4 Testing Checklist
- [ ] Tool start events emitted before execution
- [ ] Tool end events emitted after execution with duration
- [ ] File events emitted for write_file operations
- [ ] Events persisted to database
- [ ] SSE stream includes both logs and events
- [ ] Events load correctly on page refresh

---

## Phase 3: Frontend Event Hook
**Duration:** 1 day  
**Goal:** Create a hook that categorizes and manages events

### 3.1 Create Event Stream Hook

Create `apps/web/src/hooks/use-event-stream.ts`:

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { AgentEvent, EventCategory } from '@repo/agent-core';

interface UseEventStreamOptions {
  buildId: string;
  enabled?: boolean;
  categories?: EventCategory[]; // Filter by category
}

interface UseEventStreamReturn {
  // Raw events
  events: AgentEvent[];
  
  // Categorized events
  files: FileEvent[];
  tools: (ToolStartEvent | ToolEndEvent)[];
  features: (FeatureStartEvent | FeatureEndEvent)[];
  thoughts: ThinkingEvent[];
  errors: ErrorEvent[];
  
  // Derived state
  currentPhase: string | null;
  progress: { completed: number; total: number } | null;
  activeTools: Map<string, ToolStartEvent>; // Tools in progress
  
  // Connection state
  isConnected: boolean;
  isLive: boolean;
}

export function useEventStream({
  buildId,
  enabled = true,
  categories,
}: UseEventStreamOptions): UseEventStreamReturn {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!enabled || !buildId) return;

    const eventSource = new EventSource(`/api/builds/${buildId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'agent_event') {
        setEvents((prev) => {
          if (prev.some((e) => e.id === data.id)) return prev;
          return [...prev, data as AgentEvent];
        });
      }
      // ... handle other event types
    };

    return () => eventSource.close();
  }, [buildId, enabled]);

  // Memoized categorized events
  const files = useMemo(
    () => events.filter((e): e is FileEvent => 
      ['file_created', 'file_modified', 'file_deleted'].includes(e.type)
    ),
    [events]
  );

  const tools = useMemo(
    () => events.filter((e): e is ToolStartEvent | ToolEndEvent =>
      ['tool_start', 'tool_end'].includes(e.type)
    ),
    [events]
  );

  // ... more categorization

  // Active tools tracking
  const activeTools = useMemo(() => {
    const active = new Map<string, ToolStartEvent>();
    const completedIds = new Set<string>();
    
    for (const event of events) {
      if (event.type === 'tool_end') {
        completedIds.add((event as ToolEndEvent).toolUseId);
      }
    }
    
    for (const event of events) {
      if (event.type === 'tool_start' && !completedIds.has(event.id)) {
        active.set(event.id, event as ToolStartEvent);
      }
    }
    
    return active;
  }, [events]);

  return {
    events,
    files,
    tools,
    features,
    thoughts,
    errors,
    currentPhase,
    progress,
    activeTools,
    isConnected,
    isLive,
  };
}
```

### 3.2 Testing Checklist
- [ ] Hook connects to SSE stream
- [ ] Events are categorized correctly
- [ ] Active tools tracked (start without end)
- [ ] Duplicate events filtered
- [ ] Category filtering works

---

## Phase 4: Micro-Interaction UI Components
**Duration:** 3-4 days  
**Goal:** Create rich UI components for each event type

### 4.1 Component Structure

```
apps/web/src/components/build/
├── build-monitor.tsx        # Main container (update)
├── activity-feed.tsx        # New: scrolling activity feed
├── events/
│   ├── index.ts
│   ├── event-card.tsx       # Base card component
│   ├── file-card.tsx        # File created/modified
│   ├── tool-card.tsx        # Tool execution
│   ├── feature-card.tsx     # Feature progress
│   ├── thinking-bubble.tsx  # Agent thoughts
│   ├── command-card.tsx     # Bash command execution
│   ├── error-card.tsx       # Error display
│   └── phase-marker.tsx     # Phase transition marker
├── progress/
│   ├── feature-checklist.tsx # Enhanced feature list
│   ├── file-tree.tsx        # Files created visualization
│   └── timeline.tsx         # Build timeline
└── filters/
    └── category-filter.tsx  # Event category filter
```

### 4.2 File Card Component

```typescript
// apps/web/src/components/build/events/file-card.tsx
import { FileText, FilePlus, FileX, FileEdit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FileEvent } from '@repo/agent-core';

const iconMap = {
  file_created: FilePlus,
  file_modified: FileEdit,
  file_deleted: FileX,
};

const languageColors: Record<string, string> = {
  typescript: 'bg-blue-500',
  javascript: 'bg-yellow-500',
  css: 'bg-pink-500',
  json: 'bg-gray-500',
  // ...
};

export function FileCard({ event }: { event: FileEvent }) {
  const Icon = iconMap[event.type];
  const fileName = event.path.split('/').pop();
  const directory = event.path.replace(`/${fileName}`, '');
  
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{fileName}</span>
            {event.language && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${languageColors[event.language] || 'bg-gray-500'}`}
              >
                {event.language}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{directory}</p>
        </div>
        {event.linesAdded && (
          <span className="text-xs text-green-600">+{event.linesAdded} lines</span>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4.3 Tool Card Component

```typescript
// apps/web/src/components/build/events/tool-card.tsx
import { Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ToolStartEvent, ToolEndEvent } from '@repo/agent-core';

interface ToolCardProps {
  startEvent: ToolStartEvent;
  endEvent?: ToolEndEvent;
}

export function ToolCard({ startEvent, endEvent }: ToolCardProps) {
  const isRunning = !endEvent;
  const success = endEvent?.success ?? null;
  
  return (
    <Card className={`
      border-l-4 
      ${isRunning ? 'border-l-blue-500' : success ? 'border-l-green-500' : 'border-l-red-500'}
    `}>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 p-3">
            <div className="flex items-center gap-3">
              <div className={`
                flex h-8 w-8 items-center justify-center rounded 
                ${isRunning ? 'bg-blue-100' : success ? 'bg-green-100' : 'bg-red-100'}
              `}>
                {isRunning ? (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                ) : success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{startEvent.toolName}</div>
                <p className="text-xs text-muted-foreground">
                  {startEvent.truncatedInput}
                </p>
              </div>
              {endEvent?.durationMs && (
                <span className="text-xs text-muted-foreground">
                  {endEvent.durationMs}ms
                </span>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded bg-zinc-950 p-3 font-mono text-xs">
              <pre className="whitespace-pre-wrap text-zinc-300">
                {endEvent?.output || 'Running...'}
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
```

### 4.4 Activity Feed Component

```typescript
// apps/web/src/components/build/activity-feed.tsx
import { useEventStream } from '@/hooks/use-event-stream';
import { FileCard } from './events/file-card';
import { ToolCard } from './events/tool-card';
import { ThinkingBubble } from './events/thinking-bubble';
import { PhaseMarker } from './events/phase-marker';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityFeedProps {
  buildId: string;
  maxHeight?: string;
}

export function ActivityFeed({ buildId, maxHeight = '600px' }: ActivityFeedProps) {
  const { events, activeTools, isLive } = useEventStream({ buildId });

  // Group related events (tool_start with tool_end)
  const renderedToolIds = new Set<string>();

  return (
    <ScrollArea style={{ height: maxHeight }}>
      <div className="space-y-2 p-2">
        {events.map((event) => {
          switch (event.type) {
            case 'file_created':
            case 'file_modified':
            case 'file_deleted':
              return <FileCard key={event.id} event={event} />;

            case 'tool_start': {
              if (renderedToolIds.has(event.id)) return null;
              renderedToolIds.add(event.id);
              
              // Find matching end event
              const endEvent = events.find(
                (e) => e.type === 'tool_end' && e.toolUseId === event.id
              ) as ToolEndEvent | undefined;
              
              return (
                <ToolCard 
                  key={event.id} 
                  startEvent={event} 
                  endEvent={endEvent} 
                />
              );
            }

            case 'thinking':
              return <ThinkingBubble key={event.id} event={event} />;

            case 'phase':
              return <PhaseMarker key={event.id} event={event} />;

            case 'error':
              return <ErrorCard key={event.id} event={event} />;

            default:
              return null;
          }
        })}
      </div>
    </ScrollArea>
  );
}
```

### 4.5 Enhanced Build Monitor

Update `apps/web/src/components/build/build-monitor.tsx`:

```typescript
// Add new view modes and activity feed

type ViewMode = 'activity' | 'logs' | 'files';

export function BuildMonitor({ build }: BuildMonitorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('activity');
  
  // ... existing code
  
  return (
    <div className="space-y-6">
      {/* Header - unchanged */}
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Build Activity</CardTitle>
              <div className="flex items-center gap-2">
                {/* View mode tabs */}
                <div className="flex rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setViewMode('activity')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'activity' ? 'bg-background shadow' : ''
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setViewMode('logs')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'logs' ? 'bg-background shadow' : ''
                    }`}
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => setViewMode('files')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'files' ? 'bg-background shadow' : ''
                    }`}
                  >
                    Files
                  </button>
                </div>
                {/* Live badge - unchanged */}
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'activity' && (
                <ActivityFeed buildId={build.id} />
              )}
              {viewMode === 'logs' && (
                <LogViewer buildId={build.id} />
              )}
              {viewMode === 'files' && (
                <FileTree buildId={build.id} />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - enhanced with feature checklist */}
        <div className="space-y-4">
          <FeatureChecklist buildId={build.id} />
          {/* ... other sidebar components */}
        </div>
      </div>
    </div>
  );
}
```

### 4.6 Testing Checklist
- [ ] FileCard renders for file events
- [ ] ToolCard shows running state with spinner
- [ ] ToolCard shows success/failure states
- [ ] ToolCard output expandable
- [ ] ActivityFeed groups tool start/end
- [ ] View mode switching works
- [ ] Auto-scroll to new events
- [ ] Mobile responsive layout

---

## Phase 5: Feature Checklist Enhancement
**Duration:** 1 day  
**Goal:** Real-time feature progress with animations

### 5.1 Feature Checklist Component

```typescript
// apps/web/src/components/build/progress/feature-checklist.tsx
import { useState, useEffect } from 'react';
import { useEventStream } from '@/hooks/use-event-stream';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Feature {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
}

export function FeatureChecklist({ buildId }: { buildId: string }) {
  const { features, progress } = useEventStream({ buildId });
  const [featureList, setFeatureList] = useState<Feature[]>([]);

  // Update feature list from events
  useEffect(() => {
    // Build feature list from events
    const featuresMap = new Map<string, Feature>();
    
    for (const event of features) {
      if (event.type === 'feature_start') {
        featuresMap.set(event.featureId, {
          id: event.featureId,
          description: event.description,
          status: 'in_progress',
        });
      } else if (event.type === 'feature_end') {
        const existing = featuresMap.get(event.featureId);
        if (existing) {
          existing.status = event.success ? 'passed' : 'failed';
        }
      }
    }
    
    setFeatureList(Array.from(featuresMap.values()));
  }, [features]);

  const StatusIcon = ({ status }: { status: Feature['status'] }) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Features</span>
          <span className="text-sm font-normal text-muted-foreground">
            {progress?.completed ?? 0} / {progress?.total ?? '?'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {featureList.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-3 py-2 border-b last:border-0
                ${feature.status === 'in_progress' ? 'bg-blue-50 -mx-4 px-4' : ''}
              `}
            >
              <StatusIcon status={feature.status} />
              <span className={`
                flex-1 text-sm
                ${feature.status === 'passed' ? 'line-through text-muted-foreground' : ''}
              `}>
                {feature.description}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {featureList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Waiting for features to be extracted...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.2 Testing Checklist
- [ ] Features appear as they're extracted
- [ ] In-progress feature highlighted
- [ ] Completed features show checkmark
- [ ] Failed features show X
- [ ] Smooth animations on state changes
- [ ] Counter updates in real-time

---

## Phase 6: Database Schema Update
**Duration:** 1 day  
**Goal:** Persist events alongside logs

### 6.1 Update Prisma Schema

```prisma
// Add to packages/database/prisma/schema.prisma

model BuildEvent {
  id        String   @id @default(cuid())
  buildId   String
  createdAt DateTime @default(now())
  
  // Event type discriminator
  type      String   @db.VarChar(50)
  
  // Flexible event data stored as JSON
  data      Json
  
  // Relations
  build     Build    @relation(fields: [buildId], references: [id], onDelete: Cascade)
  
  @@index([buildId])
  @@index([buildId, type])
  @@index([createdAt])
  @@map("build_events")
}

// Update Build model
model Build {
  // ... existing fields
  events    BuildEvent[]
}
```

### 6.2 Database Helpers

```typescript
// packages/database/src/helpers/events.ts

export async function createBuildEvent(
  buildId: string,
  event: AgentEvent
): Promise<BuildEvent> {
  return prisma.buildEvent.create({
    data: {
      buildId,
      type: event.type,
      data: event as unknown as Prisma.JsonObject,
    },
  });
}

export async function createBuildEventsBatch(
  events: Array<{ buildId: string; event: AgentEvent }>
): Promise<number> {
  const result = await prisma.buildEvent.createMany({
    data: events.map(({ buildId, event }) => ({
      buildId,
      type: event.type,
      data: event as unknown as Prisma.JsonObject,
    })),
  });
  return result.count;
}

export async function getBuildEvents(
  buildId: string,
  options?: {
    types?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<BuildEvent[]> {
  return prisma.buildEvent.findMany({
    where: {
      buildId,
      ...(options?.types && { type: { in: options.types } }),
    },
    orderBy: { createdAt: 'asc' },
    take: options?.limit,
    skip: options?.offset,
  });
}
```

### 6.3 Testing Checklist
- [ ] Migration runs without errors
- [ ] Events can be created individually
- [ ] Batch creation works
- [ ] Events can be queried by type
- [ ] Events cascade delete with build

---

## Summary Timeline

| Phase | Name | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Event Schema Definition | 1 day | None |
| 2 | Backend Event Emission | 2 days | Phase 1 |
| 3 | Frontend Event Hook | 1 day | Phase 2 |
| 4 | Micro-Interaction Components | 3-4 days | Phase 3 |
| 5 | Feature Checklist Enhancement | 1 day | Phase 4 |
| 6 | Database Schema Update | 1 day | Phase 2 |

**Total Estimated Time:** 9-11 days (1-2 weeks)

---

## Success Criteria

1. ✅ Structured events emitted for all agent activities
2. ✅ Events persisted to database
3. ✅ Rich UI cards for files, tools, features
4. ✅ Real-time feature checklist with animations
5. ✅ Activity feed with categorized events
6. ✅ View mode switching (activity/logs/files)
7. ✅ Smooth animations and transitions
8. ✅ Mobile responsive design

---

## Future Enhancements (Out of Scope)

- Event filtering by category
- Event search
- Event timeline visualization
- Event export (JSON/CSV)
- Collaborative viewing (multiple users watching same build)
- Webhook notifications for events
- Custom event types for different agent harnesses

---

*Last Updated: December 10, 2024*
