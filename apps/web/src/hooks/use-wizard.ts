'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  PROJECT_TYPES,
  TECH_STACKS,
  FEATURE_TEMPLATES,
  DESIGN_PREFERENCES,
  COLOR_SCHEMES,
} from '@/lib/wizard/config';

export interface WizardState {
  // Step 1: Project Info
  projectName: string;
  projectDescription: string;
  projectType: string;

  // Step 2: Tech Stack
  framework: string;
  database: string;
  auth: string;
  styling: string;

  // Step 3: Features
  selectedFeatures: string[];

  // Step 4: Design
  designPreference: string;
  colorScheme: string;

  // Step 5: Additional
  additionalNotes: string;
}

const INITIAL_STATE: WizardState = {
  projectName: '',
  projectDescription: '',
  projectType: '',
  framework: '',
  database: '',
  auth: '',
  styling: 'tailwind',
  selectedFeatures: [],
  designPreference: 'modern',
  colorScheme: 'blue',
  additionalNotes: '',
};

const TOTAL_STEPS = 5;

export function useWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // Update state
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setCurrentStep(1);
  }, []);

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return state.projectName.trim().length > 0 && state.projectType !== '';
      case 2:
        return state.framework !== '';
      case 3:
        return state.selectedFeatures.length > 0;
      case 4:
        return state.designPreference !== '';
      case 5:
        return true; // Review step
      default:
        return false;
    }
  }, [currentStep, state]);

  // Toggle feature
  const toggleFeature = useCallback((featureId: string) => {
    setState((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((f) => f !== featureId)
        : [...prev.selectedFeatures, featureId],
    }));
  }, []);

  // Auto-suggest features based on project type
  const suggestFeatures = useCallback(() => {
    const projectType = PROJECT_TYPES.find((t) => t.id === state.projectType);
    if (projectType) {
      setState((prev) => ({
        ...prev,
        selectedFeatures: [...new Set([...prev.selectedFeatures, ...projectType.suggestedFeatures])],
      }));
    }
  }, [state.projectType]);

  // Generate app spec from wizard state
  const generateAppSpec = useCallback((): string => {
    const projectType = PROJECT_TYPES.find((t) => t.id === state.projectType);
    const framework = TECH_STACKS.find((s) => s.id === state.framework);
    const database = TECH_STACKS.find((s) => s.id === state.database);
    const auth = TECH_STACKS.find((s) => s.id === state.auth);
    const styling = TECH_STACKS.find((s) => s.id === state.styling);
    const design = DESIGN_PREFERENCES.find((d) => d.id === state.designPreference);
    const colors = COLOR_SCHEMES.find((c) => c.id === state.colorScheme);
    const features = state.selectedFeatures
      .map((id) => FEATURE_TEMPLATES.find((f) => f.id === id))
      .filter(Boolean);

    let spec = `# ${state.projectName}\n\n`;

    // Overview
    spec += `## Overview\n`;
    spec += state.projectDescription
      ? `${state.projectDescription}\n\n`
      : `A ${projectType?.name.toLowerCase() || 'web application'} built with modern technologies.\n\n`;

    // Tech Stack
    spec += `## Tech Stack\n`;
    spec += `- **Framework**: ${framework?.name || 'Next.js'} - ${framework?.description || 'React framework with SSR'}\n`;
    if (database) {
      spec += `- **Database**: ${database.name} - ${database.description}\n`;
    }
    if (auth) {
      spec += `- **Authentication**: ${auth.name} - ${auth.description}\n`;
    }
    spec += `- **Styling**: ${styling?.name || 'Tailwind CSS'} - ${styling?.description || 'Utility-first CSS framework'}\n`;
    spec += `- **Language**: TypeScript\n\n`;

    // Design
    spec += `## Design Requirements\n`;
    spec += `- **Style**: ${design?.name || 'Modern'} - ${design?.description || 'Contemporary design'}\n`;
    if (colors) {
      spec += `- **Primary Color**: ${colors.primary}\n`;
      spec += `- **Secondary Color**: ${colors.secondary}\n`;
    }
    spec += `- **Responsiveness**: Mobile-first, works on all screen sizes\n\n`;

    // Features
    spec += `## Features\n\n`;

    // Group features by category
    const featuresByCategory = features.reduce(
      (acc, feature) => {
        if (!feature) return acc;
        if (!acc[feature.category]) {
          acc[feature.category] = [];
        }
        acc[feature.category].push(feature);
        return acc;
      },
      {} as Record<string, typeof features>
    );

    let featureNum = 1;
    for (const [category, categoryFeatures] of Object.entries(featuresByCategory)) {
      spec += `### ${category}\n\n`;
      for (const feature of categoryFeatures) {
        if (!feature) continue;
        spec += `#### Feature ${featureNum}: ${feature.name}\n`;
        spec += `${feature.description}\n`;
        spec += `- Complexity: ${feature.complexity}\n\n`;
        featureNum++;
      }
    }

    // Data Models (if database selected)
    if (database) {
      spec += `## Data Models\n\n`;
      spec += `Define the following models based on the features:\n\n`;

      if (state.selectedFeatures.includes('auth') || state.selectedFeatures.includes('user-profiles')) {
        spec += `### User\n`;
        spec += `- id: unique identifier\n`;
        spec += `- email: user email address\n`;
        spec += `- name: display name\n`;
        spec += `- createdAt: timestamp\n`;
        spec += `- updatedAt: timestamp\n\n`;
      }

      // Add more models based on project type
      if (state.projectType === 'ecommerce') {
        spec += `### Product\n`;
        spec += `- id: unique identifier\n`;
        spec += `- name: product name\n`;
        spec += `- description: product description\n`;
        spec += `- price: decimal value\n`;
        spec += `- imageUrl: product image\n`;
        spec += `- stock: inventory count\n\n`;
      }

      if (state.projectType === 'blog') {
        spec += `### Post\n`;
        spec += `- id: unique identifier\n`;
        spec += `- title: post title\n`;
        spec += `- content: markdown content\n`;
        spec += `- slug: URL-friendly identifier\n`;
        spec += `- published: boolean\n`;
        spec += `- authorId: reference to User\n\n`;
      }
    }

    // Additional Notes
    if (state.additionalNotes.trim()) {
      spec += `## Additional Requirements\n\n`;
      spec += `${state.additionalNotes}\n\n`;
    }

    // Implementation Notes
    spec += `## Implementation Notes\n\n`;
    spec += `- Use TypeScript for type safety\n`;
    spec += `- Follow best practices for ${framework?.name || 'the chosen framework'}\n`;
    spec += `- Implement proper error handling\n`;
    spec += `- Add loading states for async operations\n`;
    spec += `- Write clean, maintainable code\n`;

    return spec;
  }, [state]);

  return {
    // State
    state,
    currentStep,
    totalSteps: TOTAL_STEPS,

    // Actions
    updateState,
    nextStep,
    prevStep,
    goToStep,
    reset,
    toggleFeature,
    suggestFeatures,
    generateAppSpec,

    // Computed
    canProceed,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === TOTAL_STEPS,
    progress: (currentStep / TOTAL_STEPS) * 100,
  };
}
