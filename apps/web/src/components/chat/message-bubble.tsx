'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * File attachment for chat messages
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;        // MIME type
  size: number;
  url?: string;        // Signed URL for display/download
  storageKey?: string; // Storage key for retrieval
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  attachments?: Attachment[];
}

interface MessageBubbleProps {
  message: Message;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * Render a single attachment
 */
function AttachmentPreview({ attachment, isUser }: { attachment: Attachment; isUser: boolean }) {
  const isImage = isImageType(attachment.type);

  if (isImage && attachment.url) {
    // Image attachment - show preview
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-primary-foreground/20 hover:opacity-90 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-48 max-w-full object-contain"
        />
      </a>
    );
  }

  // Non-image attachment - show file chip
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
        isUser
          ? 'border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/20'
          : 'border-border bg-background/50 hover:bg-background'
      )}
    >
      <FileText className={cn(
        'h-4 w-4 shrink-0',
        isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )} />
      <div className="min-w-0 flex-1">
        <div className={cn(
          'truncate text-xs font-medium',
          isUser ? 'text-primary-foreground' : 'text-foreground'
        )}>
          {attachment.name}
        </div>
        <div className={cn(
          'text-xs',
          isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {formatFileSize(attachment.size)}
        </div>
      </div>
      <Download className={cn(
        'h-3 w-3 shrink-0',
        isUser ? 'text-primary-foreground/50' : 'text-muted-foreground'
      )} />
    </a>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const hasAttachments = message.attachments && message.attachments.length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="rounded-full bg-muted px-4 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 min-w-0',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'min-w-0 max-w-[85%] overflow-hidden rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {/* Attachments (shown first for user messages) */}
        {hasAttachments && (
          <div className={cn(
            'flex flex-wrap gap-2',
            message.content.trim() && 'mb-2'
          )}>
            {message.attachments!.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                isUser={isUser}
              />
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content.trim() && (
          isUser ? (
            // User messages - plain text
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </div>
          ) : (
            // Assistant messages - render markdown with proper spacing
            <div className="prose prose-sm dark:prose-invert max-w-none break-words text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-3 prose-pre:bg-background/50 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-xs prose-code:bg-background/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div
            className={cn(
              'mt-2 text-xs',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
