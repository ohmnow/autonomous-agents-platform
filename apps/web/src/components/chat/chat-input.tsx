'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Loader2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Pending file before upload
 */
export interface PendingFile {
  id: string;
  file: File;
  preview?: string; // Data URL for image preview
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

// Allowed file types matching the upload API
const ALLOWED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.txt', '.md', '.csv', '.json', '.pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Describe your app...',
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
    };
  }, [pendingFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError(null);
    const newPendingFiles: PendingFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`File type not allowed: ${ext}. Allowed: images, text, markdown, CSV, JSON, PDF`);
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${file.name}. Maximum size is 10MB`);
        continue;
      }

      const pendingFile: PendingFile = {
        id: `pending-${Date.now()}-${i}`,
        file,
      };

      // Create preview for images
      if (isImageFile(file)) {
        pendingFile.preview = URL.createObjectURL(file);
      }

      newPendingFiles.push(pendingFile);
    }

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((pf) => pf.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((pf) => pf.id !== id);
    });
  }, []);

  const handleSubmit = () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading || disabled) return;
    
    const files = pendingFiles.map((pf) => pf.file);
    onSend(input.trim(), files.length > 0 ? files : undefined);
    
    // Clean up
    setInput('');
    pendingFiles.forEach((pf) => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPendingFiles([]);
    setFileError(null);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = (input.trim() || pendingFiles.length > 0) && !isLoading && !disabled;

  return (
    <div className="space-y-2">
      {/* File previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {pendingFiles.map((pf) => (
            <div
              key={pf.id}
              className="group relative flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"
            >
              {pf.preview ? (
                // Image preview
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pf.preview}
                    alt={pf.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                // File icon
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="max-w-[150px] truncate text-xs font-medium">
                  {pf.file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(pf.file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(pf.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove ${pf.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {fileError && (
        <div className="px-2 text-xs text-destructive">
          {fileError}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 rounded-lg border bg-background p-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handlePaperclipClick}
          disabled={isLoading || disabled}
          title="Attach files (images, documents)"
        >
          <Paperclip className={cn(
            'h-4 w-4',
            pendingFiles.length > 0 ? 'text-primary' : 'text-muted-foreground'
          )} />
        </Button>

        {/* Input */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          className={cn(
            'min-h-[40px] flex-1 resize-none border-0 bg-transparent p-2 focus-visible:ring-0',
            isLoading && 'opacity-50'
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
