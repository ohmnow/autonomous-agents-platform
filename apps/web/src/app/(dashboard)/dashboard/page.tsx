import Link from 'next/link';
import { Rocket, Plus, Clock, CheckCircle2, XCircle, Loader2, FolderOpen, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ensureUser } from '@/lib/auth';
import { listBuilds, countBuilds, listAppSpecs } from '@repo/database';

// Extract app name from spec
function extractAppName(spec: string): string {
  const match = spec.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  return 'Untitled Build';
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
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}

export default async function DashboardPage() {
  // Get user and their builds
  const { userId } = await ensureUser();
  
  // Fetch build data and recent specs
  const [recentBuilds, totalCount, completedCount, runningCount, recentSpecs] = await Promise.all([
    listBuilds({ userId, limit: 5 }),
    countBuilds({ userId }),
    countBuilds({ userId, status: 'COMPLETED' }),
    countBuilds({ userId, status: 'RUNNING' }),
    listAppSpecs({ userId, limit: 3 }),
  ]);

  // Calculate "this week" count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekBuilds = recentBuilds.filter(
    (b) => new Date(b.createdAt) > oneWeekAgo
  ).length;

  const stats = [
    { label: 'Total Builds', value: totalCount },
    { label: 'Completed', value: completedCount },
    { label: 'Running', value: runningCount },
    { label: 'This Week', value: thisWeekBuilds },
  ];

  // Transform builds for display
  const displayBuilds = recentBuilds.map((build) => ({
    id: build.id,
    name: extractAppName(build.appSpec),
    status: build.status,
    createdAt: new Date(build.createdAt),
    progress: (build.progress as { completed: number; total: number }) || { completed: 0, total: 0 },
  }));

  // Get most recent spec for quick action
  const latestSpec = recentSpecs[0] || null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Build applications with autonomous AI agents
          </p>
        </div>
        <Link href="/chat">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Build
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Builds */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Builds</CardTitle>
              <CardDescription>
                Your most recent autonomous agent builds
              </CardDescription>
            </div>
            <Link href="/builds">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {displayBuilds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
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
            </div>
          ) : (
            <div className="space-y-4">
              {displayBuilds.map((build) => (
                <Link
                  key={build.id}
                  href={`/builds/${build.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{build.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {build.progress.completed} / {build.progress.total} features
                        • {formatRelativeTime(build.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(build.status)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Specs */}
      {recentSpecs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Specifications</CardTitle>
                <CardDescription>
                  Your saved app specifications
                </CardDescription>
              </div>
              <Link href="/specs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSpecs.map((spec) => (
                <Link
                  key={spec.id}
                  href={`/specs/${spec.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{spec.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(spec.createdAt))}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {latestSpec && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Build Last Spec</CardTitle>
              <CardDescription>
                Build &quot;{latestSpec.name}&quot; again
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={`/api/builds`} method="POST">
                <input type="hidden" name="appSpec" value={latestSpec.content} />
                <input type="hidden" name="appSpecId" value={latestSpec.id} />
                <Link href={`/specs/${latestSpec.id}`}>
                  <Button className="w-full gap-2">
                    <Rocket className="h-4 w-4" />
                    View & Build
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chat Builder</CardTitle>
            <CardDescription>
              Describe your app in natural language and let AI build it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button variant="outline" className="w-full">
                Start Chatting
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step-by-Step Wizard</CardTitle>
            <CardDescription>
              Configure your app through a guided wizard interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/wizard">
              <Button variant="outline" className="w-full">
                Start Wizard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
