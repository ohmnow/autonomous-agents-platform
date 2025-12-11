'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  FileText,
  Layers,
  Settings,
  Palette,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useWizard } from '@/hooks/use-wizard';
import {
  StepProject,
  StepStack,
  StepFeatures,
  StepDesign,
  StepReview,
} from '@/components/wizard';

const STEPS = [
  { id: 1, name: 'Project', icon: FileText },
  { id: 2, name: 'Tech Stack', icon: Layers },
  { id: 3, name: 'Features', icon: Settings },
  { id: 4, name: 'Design', icon: Palette },
  { id: 5, name: 'Review', icon: ClipboardCheck },
];

export default function WizardPage() {
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState('');

  const {
    state,
    currentStep,
    totalSteps,
    updateState,
    nextStep,
    prevStep,
    goToStep,
    toggleFeature,
    suggestFeatures,
    generateAppSpec,
    canProceed,
    isFirstStep,
    isLastStep,
    progress,
  } = useWizard();

  // Generate spec when reaching review step
  useEffect(() => {
    if (currentStep === 5) {
      const spec = generateAppSpec();
      setGeneratedSpec(spec);
    }
  }, [currentStep, generateAppSpec]);

  const handleSpecChange = (spec: string) => {
    setGeneratedSpec(spec);
  };

  const handleBuild = async () => {
    if (!generatedSpec) return;

    setIsBuilding(true);

    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appSpec: generatedSpec,
          harnessId: 'coding',
          sandboxProvider: 'e2b',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create build');
      }

      const data = await response.json();
      router.push(`/builds/${data.build.id}`);
    } catch (err) {
      console.error('Build error:', err);
      setIsBuilding(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleBuild();
    } else {
      nextStep();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Wizard</h1>
        <p className="text-muted-foreground">
          Configure your app step by step
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isCompleted && goToStep(step.id)}
                disabled={!isCompleted}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'cursor-pointer text-primary hover:bg-primary/10',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full',
                    isActive && 'bg-primary-foreground/20',
                    isCompleted && 'bg-primary/20',
                    !isActive && !isCompleted && 'bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <StepIcon className="h-3 w-3" />
                  )}
                </div>
                <span className="hidden lg:inline">{step.name}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-px w-8 lg:w-12',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Project Info */}
          {currentStep === 1 && (
            <StepProject
              projectName={state.projectName}
              projectDescription={state.projectDescription}
              projectType={state.projectType}
              onUpdate={updateState}
            />
          )}

          {/* Step 2: Tech Stack */}
          {currentStep === 2 && (
            <StepStack
              projectType={state.projectType}
              framework={state.framework}
              database={state.database}
              auth={state.auth}
              styling={state.styling}
              onUpdate={updateState}
            />
          )}

          {/* Step 3: Features */}
          {currentStep === 3 && (
            <StepFeatures
              projectType={state.projectType}
              selectedFeatures={state.selectedFeatures}
              onToggleFeature={toggleFeature}
              onSuggestFeatures={suggestFeatures}
            />
          )}

          {/* Step 4: Design */}
          {currentStep === 4 && (
            <StepDesign
              designPreference={state.designPreference}
              colorScheme={state.colorScheme}
              additionalNotes={state.additionalNotes}
              onUpdate={updateState}
            />
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <StepReview
              state={state}
              appSpec={generatedSpec}
              onSpecChange={handleSpecChange}
              onGoToStep={goToStep}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isBuilding}
          className={cn(
            'gap-2',
            isLastStep && 'bg-green-600 hover:bg-green-700'
          )}
        >
          {isBuilding ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Building...
            </>
          ) : isLastStep ? (
            <>
              <Rocket className="h-4 w-4" />
              Build App
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
