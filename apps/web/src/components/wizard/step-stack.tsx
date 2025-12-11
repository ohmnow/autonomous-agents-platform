'use client';

import { TECH_STACKS, PROJECT_TYPES } from '@/lib/wizard/config';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface StepStackProps {
  projectType: string;
  framework: string;
  database: string;
  auth: string;
  styling: string;
  onUpdate: (updates: {
    framework?: string;
    database?: string;
    auth?: string;
    styling?: string;
  }) => void;
}

function StackSection({
  title,
  description,
  category,
  selectedId,
  onSelect,
  recommended,
  optional = false,
}: {
  title: string;
  description: string;
  category: string;
  selectedId: string;
  onSelect: (id: string) => void;
  recommended?: string;
  optional?: boolean;
}) {
  const options = TECH_STACKS.filter((s) => s.category === category);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            {title} {!optional && <span className="text-destructive">*</span>}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {recommended && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Recommended: {options.find((o) => o.id === recommended)?.name}
          </Badge>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {optional && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className={cn(
              'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
              selectedId === ''
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-primary/50 hover:bg-accent'
            )}
          >
            <h4 className="font-medium">None</h4>
            <p className="text-xs text-muted-foreground">Skip this option</p>
          </button>
        )}
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
              selectedId === option.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-primary/50 hover:bg-accent',
              recommended === option.id && selectedId !== option.id && 'border-primary/30'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <h4 className="font-medium">{option.name}</h4>
              {recommended === option.id && (
                <Sparkles className="h-3 w-3 text-primary" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {option.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {option.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepStack({
  projectType,
  framework,
  database,
  auth,
  styling,
  onUpdate,
}: StepStackProps) {
  const project = PROJECT_TYPES.find((t) => t.id === projectType);
  const recommendedFramework = project?.defaultStack || 'nextjs';

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Select the technologies for your{' '}
          <strong className="text-foreground">{project?.name || 'project'}</strong>.
          We&apos;ve highlighted recommended options based on your project type.
        </p>
      </div>

      <StackSection
        title="Framework"
        description="The main framework for your application"
        category="fullstack"
        selectedId={framework}
        onSelect={(id) => onUpdate({ framework: id })}
        recommended={recommendedFramework}
      />

      <StackSection
        title="Database"
        description="How your data will be stored"
        category="database"
        selectedId={database}
        onSelect={(id) => onUpdate({ database: id })}
        recommended="postgresql"
        optional
      />

      <StackSection
        title="Authentication"
        description="User sign-in and session management"
        category="auth"
        selectedId={auth}
        onSelect={(id) => onUpdate({ auth: id })}
        recommended="clerk"
        optional
      />

      <StackSection
        title="Styling"
        description="CSS framework and UI components"
        category="styling"
        selectedId={styling}
        onSelect={(id) => onUpdate({ styling: id })}
        recommended="tailwind"
      />
    </div>
  );
}
