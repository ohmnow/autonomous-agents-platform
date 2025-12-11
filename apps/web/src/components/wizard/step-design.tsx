'use client';

import { DESIGN_PREFERENCES, COLOR_SCHEMES } from '@/lib/wizard/config';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepDesignProps {
  designPreference: string;
  colorScheme: string;
  additionalNotes: string;
  onUpdate: (updates: {
    designPreference?: string;
    colorScheme?: string;
    additionalNotes?: string;
  }) => void;
}

export function StepDesign({
  designPreference,
  colorScheme,
  additionalNotes,
  onUpdate,
}: StepDesignProps) {
  return (
    <div className="space-y-8">
      {/* Design Style */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">
            Design Style <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Choose the overall look and feel
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGN_PREFERENCES.map((design) => (
            <button
              key={design.id}
              type="button"
              onClick={() => onUpdate({ designPreference: design.id })}
              className={cn(
                'relative flex flex-col items-start rounded-lg border p-4 text-left transition-all',
                designPreference === design.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:border-primary/50 hover:bg-accent'
              )}
            >
              {designPreference === design.id && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <h4 className="font-medium">{design.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {design.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Color Scheme</h3>
          <p className="text-xs text-muted-foreground">
            Pick a primary color palette
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {COLOR_SCHEMES.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onUpdate({ colorScheme: color.id })}
              className={cn(
                'group relative flex items-center gap-2 rounded-full border px-4 py-2 transition-all',
                colorScheme === color.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:border-primary/50 hover:bg-accent'
              )}
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: color.primary }}
              />
              <span className="text-sm font-medium">{color.name}</span>
              {colorScheme === color.id && (
                <Check className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Color Preview */}
        {colorScheme && (
          <div className="mt-4 rounded-lg border p-4">
            <p className="mb-2 text-xs text-muted-foreground">Preview</p>
            <div className="flex items-center gap-4">
              {(() => {
                const colors = COLOR_SCHEMES.find((c) => c.id === colorScheme);
                return colors ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div>
                        <p className="text-xs font-medium">Primary</p>
                        <p className="text-xs text-muted-foreground">
                          {colors.primary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg"
                        style={{ backgroundColor: colors.secondary }}
                      />
                      <div>
                        <p className="text-xs font-medium">Secondary</p>
                        <p className="text-xs text-muted-foreground">
                          {colors.secondary}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-medium">Additional Notes (optional)</h3>
          <p className="text-xs text-muted-foreground">
            Any specific requirements or preferences
          </p>
        </div>
        <Textarea
          value={additionalNotes}
          onChange={(e) => onUpdate({ additionalNotes: e.target.value })}
          placeholder="E.g., &quot;Use a sidebar navigation&quot;, &quot;Include a hero section&quot;, &quot;Integrate with Stripe for payments&quot;..."
          rows={4}
        />
      </div>
    </div>
  );
}
