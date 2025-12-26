'use client';

import { FilePlus, FileEdit, FileX, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FileEvent {
  id: string;
  type: 'file_created' | 'file_modified' | 'file_deleted';
  timestamp: string;
  path: string;
  size?: number;
  language?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

interface FileCardProps {
  event: FileEvent;
  className?: string;
}

const iconMap = {
  file_created: FilePlus,
  file_modified: FileEdit,
  file_deleted: FileX,
};

const actionLabels = {
  file_created: 'Created',
  file_modified: 'Modified',
  file_deleted: 'Deleted',
};

const languageColors: Record<string, string> = {
  typescript: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  javascript: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  css: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
  scss: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
  html: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  json: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
  python: 'bg-green-500/20 text-green-700 dark:text-green-300',
  markdown: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  shell: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  yaml: 'bg-red-500/20 text-red-700 dark:text-red-300',
  sql: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
};

const borderColors = {
  file_created: 'border-l-green-500',
  file_modified: 'border-l-blue-500',
  file_deleted: 'border-l-red-500',
};

const iconBgColors = {
  file_created: 'bg-green-100 dark:bg-green-900/30',
  file_modified: 'bg-blue-100 dark:bg-blue-900/30',
  file_deleted: 'bg-red-100 dark:bg-red-900/30',
};

const iconColors = {
  file_created: 'text-green-600 dark:text-green-400',
  file_modified: 'text-blue-600 dark:text-blue-400',
  file_deleted: 'text-red-600 dark:text-red-400',
};

export function FileCard({ event, className }: FileCardProps) {
  const Icon = iconMap[event.type] || FileText;
  const fileName = event.path.split('/').pop() || event.path;
  const directory = event.path.includes('/')
    ? event.path.substring(0, event.path.lastIndexOf('/'))
    : '.';

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-200 hover:shadow-md',
        borderColors[event.type],
        className
      )}
    >
      <CardContent className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            iconBgColors[event.type]
          )}
        >
          <Icon className={cn('h-4 w-4', iconColors[event.type])} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{fileName}</span>
            {event.language && (
              <Badge
                variant="secondary"
                className={cn('text-xs', languageColors[event.language] || 'bg-zinc-500/20')}
              >
                {event.language}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{directory}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {event.linesAdded && event.linesAdded > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +{event.linesAdded}
            </span>
          )}
          {event.linesRemoved && event.linesRemoved > 0 && (
            <span className="text-red-600 dark:text-red-400">
              -{event.linesRemoved}
            </span>
          )}
          {formatSize(event.size) && (
            <span>{formatSize(event.size)}</span>
          )}
          <span className="text-xs">{formatTime(event.timestamp)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
