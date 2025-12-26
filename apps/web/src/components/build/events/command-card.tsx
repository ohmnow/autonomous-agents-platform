'use client';

import { Terminal, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CommandEvent {
  id: string;
  type: 'command';
  timestamp: string;
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
}

interface CommandCardProps {
  event: CommandEvent;
  className?: string;
}

export function CommandCard({ event, className }: CommandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = event.exitCode === 0;

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

  const hasOutput = event.stdout || event.stderr;
  const truncatedCommand = event.command.length > 80
    ? event.command.slice(0, 80) + '...'
    : event.command;

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-200',
        isSuccess ? 'border-l-green-500' : 'border-l-red-500',
        className
      )}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-3 cursor-pointer',
            hasOutput && 'cursor-pointer'
          )}
          onClick={() => hasOutput && setExpanded(!expanded)}
        >
          {/* Icon */}
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isSuccess
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {isSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Command */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm truncate">{truncatedCommand}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <Badge
              variant={isSuccess ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              Exit: {event.exitCode}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDuration(event.durationMs)}
            </span>
          </div>
        </div>

        {/* Expanded output */}
        {expanded && hasOutput && (
          <div className="mt-3 space-y-2">
            {event.command !== truncatedCommand && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Command:</p>
                <div className="rounded bg-zinc-950 p-2 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-cyan-400">
                    {event.command}
                  </pre>
                </div>
              </div>
            )}

            {event.stdout && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Output:</p>
                <div className="rounded bg-zinc-950 p-2 font-mono text-xs max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-zinc-300">
                    {event.stdout}
                  </pre>
                </div>
              </div>
            )}

            {event.stderr && (
              <div>
                <p className="text-xs text-red-500 mb-1">Stderr:</p>
                <div className="rounded bg-red-950/30 border border-red-500/20 p-2 font-mono text-xs max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-red-400">
                    {event.stderr}
                  </pre>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {formatTime(event.timestamp)}
            </div>
          </div>
        )}

        {/* Hint to expand */}
        {!expanded && hasOutput && (
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Click to expand output
          </p>
        )}
      </CardContent>
    </Card>
  );
}
