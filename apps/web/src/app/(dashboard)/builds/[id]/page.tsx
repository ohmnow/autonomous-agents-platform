'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BuildMonitor } from '@/components/build/build-monitor';
import { Skeleton } from '@/components/ui/skeleton';

interface Build {
  id: string;
  name: string;
  status: string;
  appSpec: string;
  createdAt: string;
  artifactKey?: string;
  sandboxId?: string;
  outputUrl?: string;
  progress: {
    completed: number;
    total: number;
  };
}

export default function BuildDetailPage() {
  const params = useParams();
  const buildId = params.id as string;
  
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuild() {
      try {
        const response = await fetch(`/api/builds/${buildId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Build not found');
          } else {
            setError('Failed to load build');
          }
          return;
        }

        const data = await response.json();
        setBuild(data.build);
      } catch (err) {
        console.error('Error fetching build:', err);
        setError('Failed to load build');
      } finally {
        setLoading(false);
      }
    }

    fetchBuild();
  }, [buildId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-xl font-semibold">{error || 'Build not found'}</h2>
        <p className="text-muted-foreground">
          The build you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <a
          href="/builds"
          className="text-primary underline-offset-4 hover:underline"
        >
          View all builds
        </a>
      </div>
    );
  }

  // Convert API build format to BuildMonitor format
  const buildForMonitor = {
    id: build.id,
    name: build.name,
    status: build.status,
    appSpec: build.appSpec,
    createdAt: new Date(build.createdAt),
    artifactKey: build.artifactKey,
    sandboxId: build.sandboxId,
    outputUrl: build.outputUrl,
    progress: {
      completed: build.progress.completed,
      total: build.progress.total,
      features: [], // Features will be derived from logs in BuildMonitor
    },
  };

  return <BuildMonitor build={buildForMonitor} />;
}
