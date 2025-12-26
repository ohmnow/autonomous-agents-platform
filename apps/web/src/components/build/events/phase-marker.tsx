'use client';

import {
  PlayCircle,
  Search,
  Compass,
  Code,
  TestTube,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BuildPhase =
  | 'initializing'
  | 'analyzing'
  | 'planning'
  | 'implementing'
  | 'testing'
  | 'finalizing'
  | 'completed'
  | 'failed';

interface PhaseEvent {
  id: string;
  type: 'phase';
  timestamp: string;
  phase: BuildPhase;
  message?: string;
}

interface PhaseMarkerProps {
  event: PhaseEvent;
  className?: string;
}

const phaseConfig: Record<BuildPhase, {
  icon: typeof PlayCircle;
  label: string;
  color: string;
  bgColor: string;
}> = {
  initializing: {
    icon: PlayCircle,
    label: 'Initializing',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  analyzing: {
    icon: Search,
    label: 'Analyzing',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  planning: {
    icon: Compass,
    label: 'Planning',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  implementing: {
    icon: Code,
    label: 'Implementing',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  testing: {
    icon: TestTube,
    label: 'Testing',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  finalizing: {
    icon: Package,
    label: 'Finalizing',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
};

export function PhaseMarker({ event, className }: PhaseMarkerProps) {
  const config = phaseConfig[event.phase] || phaseConfig.initializing;
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={cn('relative py-2', className)}>
      {/* Line connector */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      {/* Phase indicator */}
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            'z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background',
            config.bgColor
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(event.timestamp)}
            </span>
          </div>
          {event.message && (
            <p className="text-sm text-muted-foreground">{event.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
