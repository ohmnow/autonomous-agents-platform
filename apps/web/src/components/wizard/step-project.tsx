'use client';

import { PROJECT_TYPES } from '@/lib/wizard/config';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StepProjectProps {
  projectName: string;
  projectDescription: string;
  projectType: string;
  onUpdate: (updates: {
    projectName?: string;
    projectDescription?: string;
    projectType?: string;
  }) => void;
}

export function StepProject({
  projectName,
  projectDescription,
  projectType,
  onUpdate,
}: StepProjectProps) {
  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Project Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={projectName}
          onChange={(e) => onUpdate({ projectName: e.target.value })}
          placeholder="My Awesome App"
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Choose a memorable name for your project
        </p>
      </div>

      {/* Project Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea
          value={projectDescription}
          onChange={(e) => onUpdate({ projectDescription: e.target.value })}
          placeholder="Describe what your app does..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          A brief description helps the AI understand your vision
        </p>
      </div>

      {/* Project Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Project Type <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onUpdate({ projectType: type.id })}
              className={cn(
                'flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary/50',
                projectType === type.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-accent'
              )}
            >
              <div className="mb-2 text-2xl">{type.icon}</div>
              <h3 className="font-medium">{type.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
