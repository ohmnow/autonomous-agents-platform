'use client';

import { Brain, Lightbulb, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingEvent {
  id: string;
  type: 'thinking';
  timestamp: string;
  content: string;
  phase: 'planning' | 'analyzing' | 'deciding';
}

interface ThinkingBubbleProps {
  event: ThinkingEvent;
  className?: string;
}

const phaseConfig = {
  planning: {
    icon: Compass,
    label: 'Planning',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500',
  },
  analyzing: {
    icon: Brain,
    label: 'Analyzing',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
  deciding: {
    icon: Lightbulb,
    label: 'Deciding',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
};

export function ThinkingBubble({ event, className }: ThinkingBubbleProps) {
  const config = phaseConfig[event.phase] || phaseConfig.planning;
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Truncate content if too long (with null safety)
  const content = event.content || '';
  const displayContent = content.length > 500
    ? content.slice(0, 500) + '...'
    : content;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('mt-0.5', config.iconColor)}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium', config.iconColor)}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(event.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">
            {displayContent}
          </p>
        </div>
      </div>
    </div>
  );
}
