'use client';

import { Terminal, CheckCircle, XCircle, Loader2, FileEdit, FileText, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ToolStartEvent {
  id: string;
  type: 'tool_start';
  timestamp: string;
  toolName: 'bash' | 'write_file' | 'read_file' | 'str_replace_editor';
  toolUseId: string;
  input: Record<string, unknown>;
  displayInput?: string;
}

interface ToolEndEvent {
  id: string;
  type: 'tool_end';
  timestamp: string;
  toolUseId: string;
  success: boolean;
  output?: string;
  displayOutput?: string;
  durationMs: number;
  error?: string;
}

interface ToolCardProps {
  startEvent: ToolStartEvent;
  endEvent?: ToolEndEvent;
  className?: string;
}

const toolIcons = {
  bash: Terminal,
  write_file: FileEdit,
  read_file: FileText,
  str_replace_editor: FileEdit,
};

const toolLabels = {
  bash: 'Command',
  write_file: 'Write File',
  read_file: 'Read File',
  str_replace_editor: 'Edit File',
};

export function ToolCard({ startEvent, endEvent, className }: ToolCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isRunning = !endEvent;
  const success = endEvent?.success ?? null;

  const Icon = toolIcons[startEvent.toolName] || Terminal;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get display text for the tool
  const getDisplayText = () => {
    if (startEvent.toolName === 'bash') {
      const cmd = startEvent.input.command as string;
      return cmd?.slice(0, 60) + (cmd?.length > 60 ? '...' : '');
    }
    if (startEvent.toolName === 'write_file' || startEvent.toolName === 'read_file') {
      return startEvent.input.path as string;
    }
    return startEvent.displayInput?.slice(0, 60) || 'Tool execution';
  };

  const getBorderColor = () => {
    if (isRunning) return 'border-l-blue-500';
    return success ? 'border-l-green-500' : 'border-l-red-500';
  };

  const getIconBg = () => {
    if (isRunning) return 'bg-blue-100 dark:bg-blue-900/30';
    return success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
  };

  const getIconColor = () => {
    if (isRunning) return 'text-blue-600 dark:text-blue-400';
    return success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className={cn('border-l-4 transition-all duration-200', getBorderColor(), className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 p-3 transition-colors">
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', getIconBg())}>
                {isRunning ? (
                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Tool info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', getIconColor())} />
                  <span className="font-medium">{toolLabels[startEvent.toolName]}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {getDisplayText()}
                </p>
              </div>

              {/* Duration and expand */}
              <div className="flex items-center gap-2">
                {endEvent?.durationMs && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(endEvent.durationMs)}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            {/* Input details */}
            {startEvent.toolName === 'bash' && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Command:</p>
                <div className="rounded bg-zinc-950 p-2 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-cyan-400 overflow-x-auto">
                    {startEvent.input.command as string}
                  </pre>
                </div>
              </div>
            )}

            {/* Output */}
            {(endEvent?.output || endEvent?.displayOutput || isRunning) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isRunning ? 'Status:' : 'Output:'}
                </p>
                <div className="rounded bg-zinc-950 p-2 font-mono text-xs max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-zinc-300">
                    {isRunning 
                      ? 'Running...' 
                      : (endEvent?.displayOutput || endEvent?.output || 'No output')}
                  </pre>
                </div>
              </div>
            )}

            {/* Error message */}
            {endEvent?.error && (
              <div className="mt-2">
                <p className="text-xs text-red-500 mb-1">Error:</p>
                <div className="rounded bg-red-950/50 border border-red-500/20 p-2 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-red-400">
                    {endEvent.error}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-2 text-xs text-muted-foreground">
              Started: {formatTime(startEvent.timestamp)}
              {endEvent && ` • Completed: ${formatTime(endEvent.timestamp)}`}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
