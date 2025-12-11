'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Rocket,
  Copy,
  Download,
  Loader2,
  Check,
  Calendar,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { NotFoundError, PageError } from '@/components/error-boundary';

interface AppSpec {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  chatId?: string;
}

export default function SpecDetailPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.id as string;

  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/specs/${specId}`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch spec');
      }

      const data = await response.json();
      setSpec(data.spec);
      setEditName(data.spec.name);
      setEditContent(data.spec.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpec();
  }, [specId]);

  const handleSave = async () => {
    if (!spec) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/specs/${specId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          content: editContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save spec');
      }

      const data = await response.json();
      setSpec(data.spec);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving spec:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuild = async () => {
    if (!spec) return;

    setIsBuilding(true);
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appSpec: editContent || spec.content,
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
      setIsBuilding(false);
    }
  };

  const handleCopy = async () => {
    const content = isEditing ? editContent : spec?.content || '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = isEditing ? editContent : spec?.content || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec?.name || 'app-spec'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCancel = () => {
    if (spec) {
      setEditName(spec.name);
      setEditContent(spec.content);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <NotFoundError
        resourceName="Specification"
        backLink="/specs"
        backLabel="Back to Specs"
      />
    );
  }

  if (error || !spec) {
    return <PageError message={error || 'Failed to load spec'} onRetry={fetchSpec} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/specs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold">{spec.name}</h1>
            )}
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(spec.createdAt).toLocaleDateString()}</span>
              {spec.updatedAt !== spec.createdAt && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(spec.updatedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button onClick={handleBuild} disabled={isBuilding}>
                {isBuilding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Build This App
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Spec Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Specification Content
              </CardTitle>
              {!isEditing && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Enter your app specification..."
                />
              ) : (
                <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                  {spec.content}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={handleBuild}
                disabled={isBuilding}
              >
                {isBuilding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Build This App
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download as File
              </Button>
            </CardContent>
          </Card>

          {/* Spec Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{spec.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{Math.round(spec.content.length / 1024).toLocaleString()} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Characters</span>
                <span>{spec.content.length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lines</span>
                <span>{spec.content.split('\n').length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sections</span>
                <span>{(spec.content.match(/^##\s/gm) || []).length}</span>
              </div>
              {spec.chatId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Chat</span>
                  <Badge variant="secondary">Yes</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
