'use client';

import { useState } from 'react';
import {
  PROJECT_TYPES,
  TECH_STACKS,
  FEATURE_TEMPLATES,
  DESIGN_PREFERENCES,
  COLOR_SCHEMES,
} from '@/lib/wizard/config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Check,
  Copy,
  Download,
  Edit3,
  FileText,
  Layers,
  Palette,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardState } from '@/hooks/use-wizard';

interface StepReviewProps {
  state: WizardState;
  appSpec: string;
  onSpecChange: (spec: string) => void;
  onGoToStep: (step: number) => void;
}

function SummarySection({
  icon: Icon,
  title,
  step,
  onEdit,
  children,
}: {
  icon: React.ElementType;
  title: string;
  step: number;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Edit3 className="h-3 w-3" />
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

export function StepReview({
  state,
  appSpec,
  onSpecChange,
  onGoToStep,
}: StepReviewProps) {
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  const [editedSpec, setEditedSpec] = useState(appSpec);
  const [copied, setCopied] = useState(false);

  const project = PROJECT_TYPES.find((t) => t.id === state.projectType);
  const framework = TECH_STACKS.find((s) => s.id === state.framework);
  const database = TECH_STACKS.find((s) => s.id === state.database);
  const auth = TECH_STACKS.find((s) => s.id === state.auth);
  const styling = TECH_STACKS.find((s) => s.id === state.styling);
  const design = DESIGN_PREFERENCES.find((d) => d.id === state.designPreference);
  const colors = COLOR_SCHEMES.find((c) => c.id === state.colorScheme);
  const features = state.selectedFeatures
    .map((id) => FEATURE_TEMPLATES.find((f) => f.id === id))
    .filter(Boolean);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(appSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([appSpec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName.toLowerCase().replace(/\s+/g, '-')}_spec.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveSpec = () => {
    onSpecChange(editedSpec);
    setIsEditingSpec(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Project Info */}
        <SummarySection
          icon={FileText}
          title="Project"
          step={1}
          onEdit={() => onGoToStep(1)}
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">{project?.icon}</span>
              <span className="font-medium">{state.projectName}</span>
            </div>
            <p className="text-muted-foreground">{project?.name}</p>
            {state.projectDescription && (
              <p className="text-muted-foreground line-clamp-2">
                {state.projectDescription}
              </p>
            )}
          </div>
        </SummarySection>

        {/* Tech Stack */}
        <SummarySection
          icon={Layers}
          title="Tech Stack"
          step={2}
          onEdit={() => onGoToStep(2)}
        >
          <div className="flex flex-wrap gap-2">
            {framework && (
              <Badge variant="secondary">{framework.name}</Badge>
            )}
            {database && (
              <Badge variant="secondary">{database.name}</Badge>
            )}
            {auth && <Badge variant="secondary">{auth.name}</Badge>}
            {styling && (
              <Badge variant="secondary">{styling.name}</Badge>
            )}
          </div>
        </SummarySection>

        {/* Features */}
        <SummarySection
          icon={Settings}
          title={`Features (${features.length})`}
          step={3}
          onEdit={() => onGoToStep(3)}
        >
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 6).map((feature) => (
              <Badge key={feature?.id} variant="outline" className="text-xs">
                {feature?.name}
              </Badge>
            ))}
            {features.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{features.length - 6} more
              </Badge>
            )}
          </div>
        </SummarySection>

        {/* Design */}
        <SummarySection
          icon={Palette}
          title="Design"
          step={4}
          onEdit={() => onGoToStep(4)}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">{design?.name}</span>
            {colors && (
              <div className="flex items-center gap-1">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: colors.secondary }}
                />
              </div>
            )}
          </div>
        </SummarySection>
      </div>

      {/* Generated Spec */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Generated App Specification</CardTitle>
            </div>
            <div className="flex gap-2">
              {!isEditingSpec && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedSpec(appSpec);
                      setIsEditingSpec(true);
                    }}
                    className="gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
          <CardDescription>
            Review and optionally edit your app specification before building
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingSpec ? (
            <div className="space-y-4">
              <Textarea
                value={editedSpec}
                onChange={(e) => setEditedSpec(e.target.value)}
                className="min-h-[400px] font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleSaveSpec}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingSpec(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="scrollbar-thin max-h-[400px] overflow-auto rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {appSpec}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
