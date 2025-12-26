'use client';

import { AlertTriangle, XCircle, AlertOctagon, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorEvent {
  id: string;
  type: 'error';
  timestamp: string;
  severity: 'warning' | 'error' | 'fatal';
  message: string;
  details?: string;
  recoverable: boolean;
  recovering?: boolean;
}

interface ErrorCardProps {
  event: ErrorEvent;
  className?: string;
}

const severityConfig = {
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-700 dark:text-yellow-300',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-300',
  },
  fatal: {
    icon: AlertOctagon,
    label: 'Fatal',
    borderColor: 'border-l-red-700',
    bgColor: 'bg-red-100 dark:bg-red-950/40',
    iconBg: 'bg-red-200 dark:bg-red-900/50',
    iconColor: 'text-red-700 dark:text-red-300',
    textColor: 'text-red-800 dark:text-red-200',
  },
};

export function ErrorCard({ event, className }: ErrorCardProps) {
  const config = severityConfig[event.severity] || severityConfig.error;
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card
      className={cn(
        'border-l-4 transition-all',
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
              config.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm font-semibold', config.textColor)}>
                {config.label}
              </span>
              {event.recovering && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Recovering...
                </span>
              )}
              {event.recoverable && !event.recovering && (
                <span className="text-xs text-muted-foreground">(recoverable)</span>
              )}
            </div>
            
            <p className={cn('text-sm', config.textColor)}>
              {event.message}
            </p>

            {event.details && (
              <div className="mt-2 rounded bg-zinc-950/50 p-2 font-mono text-xs">
                <pre className="whitespace-pre-wrap text-zinc-400 overflow-x-auto">
                  {event.details}
                </pre>
              </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
