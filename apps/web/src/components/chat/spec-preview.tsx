'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SpecPreviewProps {
  spec: string;
  onSpecChange?: (spec: string) => void;
  onBuild?: () => void;
  isBuilding?: boolean;
  isComplete?: boolean;
}

export function SpecPreview({
  spec,
  onSpecChange,
  onBuild,
  isBuilding,
  isComplete,
}: SpecPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedSpec, setEditedSpec] = useState(spec);
  const [copied, setCopied] = useState(false);

  // Sync editedSpec when spec prop changes
  useEffect(() => {
    setEditedSpec(spec);
  }, [spec]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(spec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEdit = () => {
    setEditedSpec(spec); // Ensure we have the latest spec
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    onSpecChange?.(editedSpec);
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setEditedSpec(spec);
    setIsEditModalOpen(false);
  };

  const handleDownload = () => {
    const blob = new Blob([spec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app_spec.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Count features/sections in the spec
  const featureCount = (spec.match(/^##\s/gm) || []).length;
  
  // Calculate spec size
  const specSizeKB = Math.round(spec.length / 1024);
  const lineCount = spec.split('\n').length;

  return (
    <>
      <Card className="flex max-h-full flex-col overflow-hidden">
        <CardHeader className="shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">App Specification</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {spec ? (
              <>
                <Badge variant="secondary" className="text-xs">
                  {featureCount} sections
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {lineCount} lines
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {specSizeKB} KB
                </Badge>
                {isComplete && (
                  <Badge variant="success" className="text-xs">
                    Ready to build
                  </Badge>
                )}
              </>
            ) : (
              'Your app specification will appear here'
            )}
          </CardDescription>
        </CardHeader>

        {isExpanded && (
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            {spec ? (
              <>
                {/* Spec Content - scrollable area */}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto rounded-lg bg-muted p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                      {spec}
                    </pre>
                  </div>
                </div>

                {/* Actions - fixed at bottom */}
                <div className="shrink-0">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenEdit}
                      className="gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="gap-1"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownload}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>

                  {/* Build Button */}
                  {onBuild && (
                    <Button
                      onClick={onBuild}
                      disabled={isBuilding || !isComplete}
                      className={cn(
                        'mt-3 w-full',
                        isComplete && 'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      {isBuilding ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Starting Build...
                        </>
                      ) : isComplete ? (
                        'Build App'
                      ) : (
                        'Complete the conversation to build'
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Describe your app and I&apos;ll generate the specification
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit App Specification</DialogTitle>
            <DialogDescription>
              Make changes to your app specification. This will be used to generate your application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden p-6 pt-0">
            <Textarea
              value={editedSpec}
              onChange={(e) => setEditedSpec(e.target.value)}
              className="h-[60vh] min-h-[400px] resize-none font-mono text-sm"
              placeholder="Your app specification..."
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
