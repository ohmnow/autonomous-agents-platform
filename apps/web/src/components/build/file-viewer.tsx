'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Code,
  Edit3,
  Save,
  X,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  buildId: string;
  filePath: string;
  fileName?: string;
  editable?: boolean;
  onSave?: (content: string) => Promise<void>;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface FileState {
  content: string | null;
  loading: boolean;
  error: string | null;
  language: string;
  exists: boolean;
}

export function FileViewer({
  buildId,
  filePath,
  fileName,
  editable = false,
  onSave,
  onClose,
  className,
  maxHeight = '500px',
  autoRefresh = false,
  refreshInterval = 5000,
}: FileViewerProps) {
  const [fileState, setFileState] = useState<FileState>({
    content: null,
    loading: true,
    error: null,
    language: 'text',
    exists: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const displayName = fileName || filePath.split('/').pop() || 'File';
  const isMarkdown = filePath.endsWith('.md');
  const isJson = filePath.endsWith('.json');

  const fetchFile = useCallback(async () => {
    try {
      setFileState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(
        `/api/builds/${buildId}/files?path=${encodeURIComponent(filePath)}`
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load file');
      }
      
      const data = await response.json();
      
      setFileState({
        content: data.content,
        loading: false,
        error: null,
        language: data.language || 'text',
        exists: data.exists,
      });
      
      if (!isEditing) {
        setEditedContent(data.content || '');
      }
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        exists: false,
      }));
    }
  }, [buildId, filePath, isEditing]);

  // Initial fetch
  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && !isEditing && fileState.exists) {
      const interval = setInterval(fetchFile, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchFile, isEditing, fileState.exists]);

  const handleEdit = () => {
    setEditedContent(fileState.content || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedContent(fileState.content || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedContent);
      setFileState(prev => ({ ...prev, content: editedContent }));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (fileState.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading file...</span>
        </div>
      );
    }

    if (fileState.error) {
      return (
        <div className="flex items-center justify-center py-12 text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{fileState.error}</span>
        </div>
      );
    }

    if (!fileState.exists) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-5 w-5 mr-2" />
          <span>File not found or not yet created</span>
        </div>
      );
    }

    if (isEditing) {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-zinc-950 text-zinc-100 border-0 resize-none focus:outline-none focus:ring-0"
          spellCheck={false}
        />
      );
    }

    // Render based on file type
    if (isMarkdown) {
      return (
        <div className="prose prose-invert prose-sm max-w-none p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fileState.content || ''}
          </ReactMarkdown>
        </div>
      );
    }

    if (isJson) {
      try {
        const formatted = JSON.stringify(JSON.parse(fileState.content || '{}'), null, 2);
        return (
          <pre className="p-4 font-mono text-sm text-zinc-100 overflow-auto">
            <code>{formatted}</code>
          </pre>
        );
      } catch {
        // If JSON parsing fails, show raw content
        return (
          <pre className="p-4 font-mono text-sm text-zinc-100 overflow-auto">
            <code>{fileState.content}</code>
          </pre>
        );
      }
    }

    // Default: plain text
    return (
      <pre className="p-4 font-mono text-sm text-zinc-100 overflow-auto whitespace-pre-wrap">
        {fileState.content}
      </pre>
    );
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center gap-2">
          {isMarkdown ? (
            <FileText className="h-4 w-4 text-blue-400" />
          ) : isJson ? (
            <Code className="h-4 w-4 text-green-400" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
          {fileState.exists && (
            <Badge variant="outline" className="text-xs">
              {Math.round((fileState.content?.length || 0) / 1024 * 10) / 10} KB
            </Badge>
          )}
          {saveSuccess && (
            <Badge variant="outline" className="text-xs text-green-500 border-green-500">
              <Check className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && !fileState.loading && fileState.exists && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFile}
              className="h-7 px-2"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {editable && !isEditing && fileState.exists && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-7 px-2"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
          
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 px-2"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save
              </Button>
            </>
          )}
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }} className="bg-zinc-950 rounded-b-lg">
          {renderContent()}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Compact file preview for inline display
 */
interface FilePreviewProps {
  buildId: string;
  filePath: string;
  fileName?: string;
  onClick?: () => void;
  className?: string;
}

export function FilePreview({
  buildId,
  filePath,
  fileName,
  onClick,
  className,
}: FilePreviewProps) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<string>('');
  
  const displayName = fileName || filePath.split('/').pop() || 'File';
  const isMarkdown = filePath.endsWith('.md');
  const isJson = filePath.endsWith('.json');

  useEffect(() => {
    async function checkFile() {
      try {
        const response = await fetch(
          `/api/builds/${buildId}/files?path=${encodeURIComponent(filePath)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setExists(data.exists);
          if (data.content) {
            // Get first 150 chars as preview
            setPreview(data.content.slice(0, 150) + (data.content.length > 150 ? '...' : ''));
          }
        } else {
          setExists(false);
        }
      } catch {
        setExists(false);
      }
    }
    
    checkFile();
  }, [buildId, filePath]);

  if (exists === null) {
    return (
      <div className={cn('flex items-center gap-2 p-3 rounded-lg bg-muted/50', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking {displayName}...</span>
      </div>
    );
  }

  if (!exists) {
    return (
      <div className={cn('flex items-center gap-2 p-3 rounded-lg bg-muted/30', className)}>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{displayName} not yet created</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left w-full',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isMarkdown ? (
          <FileText className="h-4 w-4 text-blue-400" />
        ) : isJson ? (
          <Code className="h-4 w-4 text-green-400" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{displayName}</span>
        <Badge variant="outline" className="text-xs">Click to view</Badge>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {preview}
        </p>
      )}
    </button>
  );
}

