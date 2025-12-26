# Design Skill Integration for Autonomous Agent

> **Status: ✅ IMPLEMENTED** (December 13, 2025)

## Overview

This document outlines how the `domain-adaptive-design` skill is integrated into the autonomous coding agent so that built applications have distinctive, domain-appropriate designs rather than generic "AI slop" aesthetics.

## The Skill

Located at: `.claude/skills/domain-adaptive-design.md`

The skill provides:
1. **Domain detection** - Analyze app_spec to identify industry vertical
2. **Design research** - Web search for reference designs and Framer templates
3. **Convention awareness** - Apply established design patterns for the domain
4. **Creative differentiation** - Add unique elements that make the design memorable
5. **Implementation guidelines** - Production-quality code standards

## Implementation (Completed)

We implemented **Option 2 (Conditional Injection) + Option 4 (Two-Phase Design) + Design Research** combined:

### How It Works

#### 0. Design Research (NEW)

Before creating DESIGN.md, the planning phase now runs **automated design research** using web search:

```typescript
async function runDesignResearch(
  anthropic: Anthropic,
  appSpec: string,
  domain: string,
  onLog: (level: string, message: string) => void
): Promise<DesignResearch>
```

**What it does:**
1. **Detects domain** from the app spec (FinTech, Healthcare, SaaS, E-Commerce, etc.)
2. **Searches the web** for:
   - "best [domain] website design examples 2024"
   - "framer template [domain]" - for modern, polished design patterns
3. **Extracts reference designs** with URLs and descriptions
4. **Provides design insights** about common patterns, colors, typography, and layouts

**Console output:**
```
🔍 Detected domain: SaaS
🔍 Researching design references for SaaS...
✅ Found 3 reference sites and 2 Framer templates
```

**How it's used:**
- The research results are included in the planning prompt
- Claude uses these as *inspiration* (not copying) when creating DESIGN.md
- The agent creates designs that feel native to the domain while having their own identity

**Cost:** ~$0.20 per build (web search + analysis)

#### 1. UI Project Detection

The `hasUIComponents()` function in `sandbox-agent.ts` detects projects with frontend/UI:

```typescript
function hasUIComponents(appSpec: string): boolean {
  const uiIndicators = [
    // Frameworks
    /\breact\b/i, /\bvue\b/i, /\bangular\b/i, /\bsvelte\b/i,
    /\bnext\.?js\b/i, /\bnuxt\b/i, /\bremix\b/i, /\bastro\b/i,
    /\bflutter\b/i, /\breact.native\b/i, /\bswift\s?ui\b/i,
    // UI terms
    /\bfrontend\b/i, /\bfront-end\b/i, /\bui\b/i, /\bux\b/i,
    /\bdashboard\b/i, /\bwebsite\b/i, /\bweb\s?app\b/i,
    /\blanding\s?page\b/i, /\binterface\b/i, /\bportal\b/i,
    /\bmobile\s?app\b/i, /\bios\s?app\b/i, /\bandroid\s?app\b/i,
    // Styling
    /\btailwind\b/i, /\bcss\b/i, /\bstyled/i, /\bsass\b/i, /\bscss\b/i,
    // Components
    /\bbutton\b/i, /\bform\b/i, /\bmodal\b/i, /\bnavigation\b/i,
    /\bsidebar\b/i, /\bheader\b/i, /\bfooter\b/i, /\bcard\b/i,
  ];
  
  const matchCount = uiIndicators.filter(pattern => pattern.test(appSpec)).length;
  return matchCount >= 2;
}
```

#### 2. Two-Pass Design System

**Pass 1: Design Foundation (Planning Phase - Sonnet 4.5):**
- Detects UI project → logs `🎨 UI project detected - will create DESIGN.md with design system`
- Creates `DESIGN.md` BEFORE `feature_list.json`
- DESIGN.md includes:
  - Detected domain (FinTech, Healthcare, SaaS, etc.)
  - Target user demographics
  - Color palette as CSS variables
  - Typography choices (distinctive fonts)
  - One "signature element" concept for memorability

**Pass 2: Design Polish Feature (In Feature List):**
- A "Design polish and consistency review" feature is automatically added near the END of the feature list (~90-95% through)
- This feature includes steps to:
  - Review all UI components for consistency
  - Ensure color palette is applied uniformly
  - Verify typography hierarchy
  - Implement/refine the signature design element
  - Add micro-interactions
  - Check responsive behavior
  - Verify accessibility

**Building Phase (Haiku 4.5):**
- References `DESIGN.md` when implementing UI features
- Logs `🎨 UI project - will reference DESIGN.md for styling decisions`
- Applies design system consistently across all components
- At the end, executes the "Design polish" feature to tighten everything up

#### 3. Embedded Design Skill

The design skill is embedded directly in `sandbox-agent.ts` as `DESIGN_SKILL` constant to avoid file system access issues in serverless environments.

### Console Output

When starting a UI project build:

```
🧠 PLANNING PHASE: Using claude-sonnet-4-5-20250929 for feature list generation
🎨 UI project detected - will create DESIGN.md with design system
🔍 Detected domain: SaaS
🔍 Researching design references for SaaS...
✅ Found 3 reference sites and 2 Framer templates
...
🔨 BUILDING PHASE: Using claude-haiku-4-5-20251001 for feature implementation
🎨 UI project - will reference DESIGN.md for styling decisions
```

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/lib/sandbox/sandbox-agent.ts` | Added `hasUIComponents()`, `detectDomain()`, `runDesignResearch()`, `formatDesignResearchForPrompt()`, `DESIGN_SKILL`, `getDesignPlanningAddition()`, `getDesignBuildingAddition()`, updated planning and building phases |
| `.claude/skills/domain-adaptive-design.md` | Created skill file with design research phase documentation |

## Future Enhancements

### Phase 3: Design Review Feature (Future)
- Add explicit design review step as a feature
- Allow user customization of design preferences
- A/B test design approaches

### Phase 4: Design Quality Metrics
- Track build completion rate with design skill
- User feedback on design quality
- "Restart for design changes" frequency
- Time spent on style vs functional features

## Completion Status

| Task | Status |
|------|--------|
| Create the skill file (`.claude/skills/domain-adaptive-design.md`) | ✅ Complete |
| Add UI detection to sandbox-agent.ts | ✅ Complete |
| Add domain detection (FinTech, SaaS, Healthcare, etc.) | ✅ Complete |
| Implement design research with web search | ✅ Complete |
| Include Framer templates in research | ✅ Complete |
| Update planning phase to create DESIGN.md | ✅ Complete |
| Update building phase to reference DESIGN.md | ✅ Complete |
| Conditional injection (only for UI projects) | ✅ Complete |
| Two-pass design (foundation + polish feature) | ✅ Complete |
| Test with a sample build | ⬜ Pending |
| Iterate based on results | ⬜ Pending |

