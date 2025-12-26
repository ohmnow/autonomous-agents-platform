'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Terminal, FileEdit, FileText, CheckCircle, XCircle, AlertCircle, Lightbulb, Copy, Check } from 'lucide-react';
import {
  FileCard,
  ToolCard,
  ThinkingBubble,
  PhaseMarker,
  ErrorCard,
  CommandCard,
} from './events';
import type { AgentEvent } from '@/hooks/use-event-stream';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  events: AgentEvent[];
  isLive?: boolean;
  maxHeight?: string;
  className?: string;
  autoScroll?: boolean;
  showEmpty?: boolean;
  emptyMessage?: string;
}

// Type guards for structured events
function isFileEvent(event: AgentEvent): boolean {
  return ['file_created', 'file_modified', 'file_deleted'].includes(event.type);
}

function isToolStartEvent(event: AgentEvent): boolean {
  return event.type === 'tool_start';
}

function isToolEndEvent(event: AgentEvent): boolean {
  return event.type === 'tool_end';
}

function isThinkingEvent(event: AgentEvent): boolean {
  return event.type === 'thinking';
}

function isPhaseEvent(event: AgentEvent): boolean {
  return event.type === 'phase';
}

function isErrorEvent(event: AgentEvent): boolean {
  return event.type === 'error';
}

function isCommandEvent(event: AgentEvent): boolean {
  return event.type === 'command';
}

function isLogEvent(event: AgentEvent): boolean {
  return event.type === 'log';
}

// Check if we have any structured events (not just logs)
function hasStructuredEvents(events: AgentEvent[]): boolean {
  return events.some(e => 
    isFileEvent(e) || 
    isToolStartEvent(e) || 
    isThinkingEvent(e) || 
    isPhaseEvent(e) || 
    isCommandEvent(e) ||
    isErrorEvent(e)
  );
}

/**
 * Simple log line component for displaying log events when no structured events exist
 */
function LogActivityLine({ event }: { event: AgentEvent }) {
  const level = (event.level as string) || 'info';
  const message = (event.message as string) || '';
  const timestamp = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Parse the message to determine icon and styling
  const getLogConfig = () => {
    // Tool operations (bash, write_file, read_file)
    if (level === 'tool' || message.startsWith('bash:') || message.includes('text_editor:')) {
      if (message.includes('bash:')) {
        return {
          icon: Terminal,
          iconColor: 'text-cyan-500',
          bgColor: 'bg-cyan-500/10',
          label: 'Command',
        };
      }
      if (message.includes('write_file:') || message.includes('Created') || message.includes('Wrote')) {
        return {
          icon: FileEdit,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          label: 'File',
        };
      }
      if (message.includes('read_file:') || message.includes('Read')) {
        return {
          icon: FileText,
          iconColor: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          label: 'Read',
        };
      }
      return {
        icon: Terminal,
        iconColor: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        label: 'Tool',
      };
    }

    // Success/completion messages
    if (message.includes('Passed') || message.includes('successfully') || message.includes('[Done]')) {
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Done',
      };
    }

    // Error messages
    if (level === 'error' || message.includes('Failed') || message.includes('error')) {
      return {
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Error',
      };
    }

    // Warning messages
    if (level === 'warn') {
      return {
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Warning',
      };
    }

    // Agent thinking/planning
    if (message.includes('Planning') || message.includes('Analyzing') || message.includes('I\'ll') || message.includes('I will')) {
      return {
        icon: Lightbulb,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        label: 'Thinking',
      };
    }

    // Default info
    return {
      icon: null,
      iconColor: 'text-muted-foreground',
      bgColor: '',
      label: '',
    };
  };

  const config = getLogConfig();
  const Icon = config.icon;

  // Skip iteration markers and progress messages for cleaner display
  if (message.startsWith('---') || message.startsWith('Progress:')) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-start gap-3 py-2 px-2 rounded-md transition-colors',
      config.bgColor
    )}>
      {Icon && (
        <div className="flex h-6 w-6 items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          level === 'error' ? 'text-red-400' : 'text-foreground'
        )}>
          {message}
        </p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {timestamp}
      </span>
    </div>
  );
}

export function ActivityFeed({
  events,
  isLive = false,
  maxHeight = '600px',
  className,
  autoScroll = true,
  showEmpty = true,
  emptyMessage = 'Waiting for activity...',
}: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activityCopied, setActivityCopied] = useState(false);

  // Check if we have structured events or just logs
  const useStructuredView = useMemo(() => hasStructuredEvents(events), [events]);

  // Format events for copying
  const handleCopyActivity = async () => {
    const formattedActivity = events.map((event) => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      const type = event.type.toUpperCase();
      const message = (event.message as string) || '';
      const content = (event.content as string) || '';
      const path = (event.path as string) || '';
      const toolName = (event.toolName as string) || '';
      
      // Build a readable line based on event type
      if (event.type === 'file_created' || event.type === 'file_modified' || event.type === 'file_deleted') {
        return `[${timestamp}] [${type}] ${path}`;
      } else if (event.type === 'tool_start' || event.type === 'tool_end') {
        return `[${timestamp}] [${type}] ${toolName}`;
      } else if (event.type === 'thinking') {
        return `[${timestamp}] [THINKING] ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`;
      } else if (event.type === 'phase') {
        return `[${timestamp}] [PHASE] ${(event.phase as string) || ''} - ${(event.description as string) || ''}`;
      } else if (event.type === 'command') {
        return `[${timestamp}] [COMMAND] ${(event.command as string) || ''}`;
      } else if (event.type === 'error') {
        return `[${timestamp}] [ERROR] ${message}`;
      } else {
        return `[${timestamp}] [${type}] ${message || content}`;
      }
    }).filter(Boolean).join('\n');
    
    try {
      await navigator.clipboard.writeText(formattedActivity || 'No activity available');
      setActivityCopied(true);
      setTimeout(() => setActivityCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy activity:', error);
    }
  };

  // Build a map of tool start/end pairs for ToolCard rendering
  const toolEndMap = useMemo(() => {
    const map = new Map<string, AgentEvent>();
    for (const event of events) {
      if (isToolEndEvent(event)) {
        const toolUseId = event.toolUseId as string;
        map.set(toolUseId, event);
      }
    }
    return map;
  }, [events]);

  // Track which tool_start events we've already rendered
  const renderedToolIds = useMemo(() => new Set<string>(), [events]);

  // With newest-first ordering, scroll to top when new events arrive
  // This keeps the user seeing the latest activity
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length, autoScroll]);

  // Filter events based on whether we're showing structured or log view
  // Reverse order so newest events appear at top
  const displayEvents = useMemo(() => {
    renderedToolIds.clear();
    
    let filtered: AgentEvent[];
    if (useStructuredView) {
      // Structured view: filter out tool_end events (they're merged with tool_start)
      filtered = events.filter((event) => {
        if (isToolEndEvent(event)) return false;
        if (isLogEvent(event)) return false; // Skip logs in structured view
        return true;
      });
    } else {
      // Log-based view: only show log events with meaningful messages
      filtered = events.filter((event) => {
        if (!isLogEvent(event)) return false;
        const message = (event.message as string) || '';
        // Skip empty messages
        if (!message.trim()) return false;
        return true;
      });
    }
    
    // Reverse to show newest first
    return [...filtered].reverse();
  }, [events, renderedToolIds, useStructuredView]);

  if (events.length === 0 && showEmpty) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {isLive && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        <span>{emptyMessage}</span>
      </div>
    );
  }

  // If no displayable events after filtering, show empty state
  if (displayEvents.length === 0 && showEmpty) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {isLive && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopyActivity}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Copy all activity"
      >
        {activityCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      <ScrollArea style={{ height: maxHeight }} className={className}>
        <div ref={scrollRef} className="space-y-1 p-2">
          {/* Live indicator at top (since newest events are first) */}
          {isLive && events.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 border-b border-border/50 mb-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live - newest first</span>
            </div>
          )}

        {displayEvents.map((event) => {
          // Log-based activity view (fallback when no structured events)
          if (!useStructuredView && isLogEvent(event)) {
            return <LogActivityLine key={event.id} event={event} />;
          }

          // Structured event views below:
          
          // Phase events
          if (isPhaseEvent(event)) {
            return (
              <PhaseMarker
                key={event.id}
                event={event as unknown as Parameters<typeof PhaseMarker>[0]['event']}
              />
            );
          }

          // File events
          if (isFileEvent(event)) {
            return (
              <FileCard
                key={event.id}
                event={event as unknown as Parameters<typeof FileCard>[0]['event']}
              />
            );
          }

          // Tool start events (merged with their end events)
          if (isToolStartEvent(event)) {
            const toolUseId = event.toolUseId as string;
            if (renderedToolIds.has(event.id)) return null;
            renderedToolIds.add(event.id);

            // Find matching end event
            const endEvent = toolEndMap.get(toolUseId);

            return (
              <ToolCard
                key={event.id}
                startEvent={event as unknown as Parameters<typeof ToolCard>[0]['startEvent']}
                endEvent={endEvent as unknown as Parameters<typeof ToolCard>[0]['endEvent']}
              />
            );
          }

          // Thinking events
          if (isThinkingEvent(event)) {
            return (
              <ThinkingBubble
                key={event.id}
                event={event as unknown as Parameters<typeof ThinkingBubble>[0]['event']}
              />
            );
          }

          // Command events
          if (isCommandEvent(event)) {
            return (
              <CommandCard
                key={event.id}
                event={event as unknown as Parameters<typeof CommandCard>[0]['event']}
              />
            );
          }

          // Error events
          if (isErrorEvent(event)) {
            return (
              <ErrorCard
                key={event.id}
                event={event as unknown as Parameters<typeof ErrorCard>[0]['event']}
              />
            );
          }

          // Default: skip unknown event types
          return null;
        })}

          {/* Bottom marker (oldest events are now at bottom) */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
