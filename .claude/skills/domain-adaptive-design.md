---
name: domain-adaptive-design
description: Create distinctive, production-grade frontend interfaces adapted to the specific domain and target audience. Analyzes the app specification to infer industry vertical, user demographics, and established design conventions, then creates something unique within that context.
---

# Domain-Adaptive Design Skill

This skill guides creation of distinctive, production-grade frontend interfaces that are **tailored to the specific domain** while avoiding generic "AI slop" aesthetics. The design should feel native to the industry vertical while standing out as exceptional.

## Phase 1: Domain Analysis

Before designing, analyze the app_spec.txt to understand:

### 1. Industry Vertical Detection
Identify the domain from contextual clues:
- **FinTech/Finance**: Trading platforms, banking apps, investment tools, payment systems
- **Healthcare/MedTech**: Patient portals, telehealth, medical records, wellness apps
- **E-Commerce/Retail**: Storefronts, marketplaces, inventory management
- **SaaS/B2B**: Dashboards, admin panels, productivity tools, CRM/ERP
- **Social/Community**: Social networks, forums, messaging, collaboration
- **Education/EdTech**: Learning platforms, course management, student portals
- **Media/Entertainment**: Streaming, content platforms, news, gaming
- **Real Estate/PropTech**: Listings, property management, virtual tours
- **Travel/Hospitality**: Booking systems, travel planning, hospitality management
- **Food/Restaurant**: Ordering, reservations, delivery, POS systems
- **Legal/Compliance**: Document management, contract systems, compliance tools
- **Creative/Design**: Portfolio sites, design tools, creative marketplaces

### 2. Target User Demographics
Infer from the app spec:
- **Age range**: Gen Z, Millennials, Gen X, Baby Boomers, All ages
- **Technical sophistication**: Power users, casual users, non-technical
- **Use context**: Mobile-first, desktop-focused, both
- **Frequency**: Daily tool, occasional use, one-time interactions
- **Emotional state**: Urgent/stressed, relaxed/browsing, focused/professional

### 3. Brand Personality
Determine the appropriate tone:
- **Trust-focused**: Banks, healthcare, legal (calm colors, clear hierarchy, credentials)
- **Energy-focused**: Fitness, gaming, social (bold colors, dynamic motion)
- **Luxury-focused**: High-end retail, exclusive services (refined typography, negative space)
- **Efficiency-focused**: B2B tools, productivity (clean, minimal, functional)
- **Friendly-focused**: Consumer apps, community (rounded shapes, warm colors)
- **Innovation-focused**: Tech startups, cutting-edge tools (modern, experimental)

## Phase 2: Design Research (Automated)

Before creating DESIGN.md, the planning system automatically:

1. **Detects the domain** from your app specification
2. **Searches for reference designs** in that vertical:
   - Top-rated websites known for excellent UI/UX in the domain
   - Framer templates for modern, polished design patterns
3. **Analyzes the results** for common patterns, colors, typography, and layouts
4. **Provides research summary** to inform your design decisions

### Research Sources
- **Web Search**: "best [domain] website design 2024"
- **Framer Templates**: Modern, production-quality templates in the vertical
- **Design Inspiration**: Awwwards, Dribbble collections for the industry

This research is used as INSPIRATION, not for copying. The goal is to understand what excellent design looks like in this space, then create something unique that draws from those patterns.

## Phase 3: Design Convention Foundations

Reference established patterns for the detected vertical:

### Domain Design Languages

**FinTech/Banking**
- Color palette: Deep blues, greens (trust), gold/amber accents
- Typography: Professional serifs for headers, clean sans for body
- Patterns: Data visualizations, number prominence, security indicators
- Motion: Subtle, purposeful transitions (not playful)
- Examples: Stripe, Robinhood, Coinbase

**Healthcare/Wellness**
- Color palette: Soft blues, greens, whites (clean, calming)
- Typography: Friendly but professional, high readability
- Patterns: Clear hierarchy, accessible contrast, medical iconography
- Motion: Gentle, reassuring transitions
- Examples: One Medical, Calm, Headspace

**E-Commerce**
- Color palette: Brand-driven with high-contrast CTAs
- Typography: Product-focused, clear pricing hierarchy
- Patterns: Grid layouts, filters, image prominence
- Motion: Product reveals, cart feedback, hover states
- Examples: Shopify stores, SSENSE, Glossier

**SaaS/Dashboards**
- Color palette: Neutral base with accent colors for actions/status
- Typography: System fonts for performance, clear labels
- Patterns: Sidebar navigation, data tables, cards
- Motion: Loading states, drawer transitions
- Examples: Linear, Notion, Figma

**Social/Community**
- Color palette: Vibrant, personality-driven
- Typography: Modern sans-serif, emoji-friendly
- Patterns: Feeds, avatars, reactions, threads
- Motion: Micro-interactions, infinite scroll, live updates
- Examples: Discord, Twitter/X, Reddit

## Phase 4: The "Je Ne Sais Quoi" Layer

After establishing domain-appropriate foundations, add ONE distinctive element that makes it memorable:

### Signature Element Options

1. **Unique Motion Signature**
   - A distinctive page transition or loading animation
   - Hover states that feel specifically designed for this app
   - Scroll-triggered reveals with a unique rhythm

2. **Typography Twist**
   - An unexpected display font that still fits the tone
   - Creative text treatments (gradients, masks, variable fonts)
   - Distinctive heading hierarchy

3. **Color Innovation**
   - Unexpected accent color that works within the palette
   - Gradient interpretation of traditional colors
   - Dark/light mode with personality

4. **Spatial Creativity**
   - Asymmetric layouts that feel intentional
   - Creative use of negative space
   - Overlapping elements or broken grids

5. **Interactive Delight**
   - Easter egg interactions
   - Satisfying feedback on key actions
   - Personality in error states or empty states

6. **Visual Texture**
   - Subtle patterns or grain that add depth
   - Custom illustrations or iconography
   - Photography treatment or image masks

## Phase 5: Implementation Guidelines

### Code Quality
- Production-ready, functional code
- Responsive design (mobile-first)
- Accessible (WCAG AA minimum)
- Performance-conscious

### Technology Choices
- Match the project's stack (React, Vue, vanilla, etc.)
- Use CSS variables for theming
- Leverage existing component libraries when appropriate
- Add motion with CSS or Motion library (not jQuery)

### What to AVOID
- Generic AI aesthetics (purple gradients, Inter font, card-heavy layouts)
- Inconsistent design language
- Over-animation that slows perceived performance
- Ignoring the domain conventions entirely
- Being so "unique" that usability suffers

## Integration with Autonomous Agent

When the sandbox agent reads app_spec.txt:

1. **Extract domain signals** from the specification
2. **Apply this skill** when implementing UI features
3. **Maintain consistency** across all frontend components
4. **Document design decisions** in comments or a DESIGN.md file

### Example Usage in Feature Implementation

When implementing a feature like "User Dashboard":

```
1. Read app_spec.txt → Detect: "SaaS project management tool for creative agencies"
2. Domain: SaaS/B2B + Creative
3. Convention: Clean dashboard layout, data visualization, project cards
4. Twist: Creative agency = more visual flair allowed → Use a bold accent color and custom illustrations for empty states
5. Implement: Professional but with creative personality
```

## Output

The implemented frontend should:
- Feel **native to the domain** (users recognize the patterns)
- Look **professionally designed** (not template-based)
- Have **one memorable element** (the je ne sais quoi)
- Be **fully functional** (not just pretty)
- Scale **consistently** (design system thinking)

