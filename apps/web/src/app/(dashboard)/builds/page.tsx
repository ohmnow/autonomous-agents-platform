'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, Plus, Clock, CheckCircle2, XCircle, Loader2, Filter, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface Build {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  progress: { completed: number; total: number };
  harnessId: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'RUNNING':
      return (
        <Badge variant="info" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuilds() {
      try {
        const response = await fetch('/api/builds');
        if (response.ok) {
          const data = await response.json();
          setBuilds(data.builds || []);
        }
      } catch (error) {
        console.error('Failed to fetch builds:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBuilds();
  }, []);

  const handleDelete = async (e: React.MouseEvent, buildId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this build?')) return;
    
    setDeleting(buildId);
    try {
      const response = await fetch(`/api/builds/${buildId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBuilds(builds.filter((b) => b.id !== buildId));
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Builds</h1>
          <p className="text-muted-foreground">
            Manage and monitor your autonomous agent builds
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Build
            </Button>
          </Link>
        </div>
      </div>

      {/* Builds List */}
      {builds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No builds yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first build using the Chat Builder or Wizard
            </p>
            <Link href="/chat">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Build
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {builds.map((build) => {
            const progressPercent =
              build.progress.total > 0
                ? (build.progress.completed / build.progress.total) * 100
                : 0;
            return (
              <Link key={build.id} href={`/builds/${build.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Rocket className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{build.name}</h3>
                            {getStatusBadge(build.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(build.createdAt)}
                            {build.completedAt &&
                              ` • Completed ${formatDate(build.completedAt)}`}
                          </p>
                          <div className="flex items-center gap-4 pt-2">
                            <div className="w-48">
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {build.progress.completed} / {build.progress.total}{' '}
                              features
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {build.harnessId || 'coding'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, build.id)}
                          disabled={deleting === build.id}
                        >
                          {deleting === build.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
