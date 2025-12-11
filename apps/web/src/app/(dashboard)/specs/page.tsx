'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Rocket,
  Pencil,
  Trash2,
  MoreVertical,
  Calendar,
  Loader2,
  Copy,
  MessageSquare,
  Wand2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageError } from '@/components/error-boundary';

interface AppSpec {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  chatId?: string;
}

export default function SpecsPage() {
  const router = useRouter();
  const [specs, setSpecs] = useState<AppSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Create state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecContent, setNewSpecContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Duplicate state
  const [duplicateSpec, setDuplicateSpec] = useState<AppSpec | null>(null);

  const fetchSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/specs?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch specs');
      }
      const data = await response.json();
      setSpecs(data.specs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/specs/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete spec');
      }

      setSpecs(specs.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting spec:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBuildFromSpec = async (spec: AppSpec) => {
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appSpec: spec.content,
          appSpecId: spec.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create build');
      }

      const data = await response.json();
      router.push(`/builds/${data.build.id}`);
    } catch (err) {
      console.error('Error creating build:', err);
    }
  };

  // CREATE: Create a new spec
  const handleCreate = async () => {
    if (!newSpecContent.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSpecName.trim() || 'Untitled Specification',
          content: newSpecContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create spec');
      }

      const data = await response.json();
      setSpecs([data.spec, ...specs]);
      setShowCreateDialog(false);
      setNewSpecName('');
      setNewSpecContent('');
      
      // Navigate to the new spec
      router.push(`/specs/${data.spec.id}`);
    } catch (err) {
      console.error('Error creating spec:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // DUPLICATE: Duplicate an existing spec
  const handleDuplicate = async () => {
    if (!duplicateSpec) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${duplicateSpec.name} (Copy)`,
          content: duplicateSpec.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate spec');
      }

      const data = await response.json();
      setSpecs([data.spec, ...specs]);
      setDuplicateSpec(null);
    } catch (err) {
      console.error('Error duplicating spec:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Extract preview from content (first 150 chars after removing markdown)
  const getPreview = (content: string) => {
    const cleaned = content
      .replace(/^#.*$/gm, '') // Remove headers
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    return cleaned.length > 150 ? cleaned.slice(0, 150) + '...' : cleaned;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <PageError message={error} onRetry={fetchSpecs} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Specifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage your saved app specifications
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Spec
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Create Manually
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Generate via Chat
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wizard">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate via Wizard
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Empty State */}
      {specs.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No specifications yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first app specification using the Chat Builder or Wizard.
          </p>
          <div className="mt-6 flex gap-2">
            <Button asChild>
              <Link href="/chat">Chat Builder</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/wizard">Wizard</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Specs Grid */}
      {specs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <Card key={spec.id} className="group relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="line-clamp-1 text-base">
                      {spec.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/specs/${spec.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          View / Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBuildFromSpec(spec)}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Build This App
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDuplicateSpec(spec)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(spec.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {getPreview(spec.content)}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(spec.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <Link
                href={`/specs/${spec.id}`}
                className="absolute inset-0"
                aria-label={`View ${spec.name}`}
              />
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Specification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this specification? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Spec Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Specification</DialogTitle>
            <DialogDescription>
              Create a new app specification manually. You can also generate
              specs using the Chat Builder or Wizard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="spec-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="spec-name"
                placeholder="My App Specification"
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="spec-content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="spec-content"
                placeholder="# My App&#10;&#10;## Overview&#10;Describe your app here...&#10;&#10;## Features&#10;- Feature 1&#10;- Feature 2"
                value={newSpecContent}
                onChange={(e) => setNewSpecContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewSpecName('');
                setNewSpecContent('');
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newSpecContent.trim()}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Specification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Spec Dialog */}
      <Dialog open={!!duplicateSpec} onOpenChange={() => setDuplicateSpec(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Specification</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{duplicateSpec?.name}&quot;? The copy will be named
              &quot;{duplicateSpec?.name} (Copy)&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateSpec(null)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
