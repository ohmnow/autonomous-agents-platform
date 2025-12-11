/**
 * Wizard Configuration
 *
 * Defines all the options available in the step-by-step wizard
 */

export interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultStack: string;
  suggestedFeatures: string[];
}

export interface TechStackOption {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'database' | 'auth' | 'styling';
  icon?: string;
  tags: string[];
}

export interface FeatureTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  requiredStack?: string[];
}

export interface DesignPreference {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

// Project Types
export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Full-stack web app with frontend, backend, and database',
    icon: '🌐',
    defaultStack: 'nextjs',
    suggestedFeatures: ['auth', 'database', 'api', 'responsive'],
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Data visualization and management interface',
    icon: '📊',
    defaultStack: 'nextjs',
    suggestedFeatures: ['auth', 'database', 'charts', 'tables', 'dark-mode'],
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Marketing site or product showcase',
    icon: '🚀',
    defaultStack: 'nextjs',
    suggestedFeatures: ['responsive', 'animations', 'seo', 'contact-form'],
  },
  {
    id: 'api',
    name: 'API Service',
    description: 'Backend REST or GraphQL API',
    icon: '⚡',
    defaultStack: 'express',
    suggestedFeatures: ['database', 'auth', 'validation', 'rate-limiting'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online store with products and checkout',
    icon: '🛒',
    defaultStack: 'nextjs',
    suggestedFeatures: ['auth', 'database', 'payments', 'cart', 'search'],
  },
  {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Content management and publishing',
    icon: '📝',
    defaultStack: 'nextjs',
    suggestedFeatures: ['auth', 'database', 'markdown', 'comments', 'seo'],
  },
];

// Tech Stack Options
export const TECH_STACKS: TechStackOption[] = [
  // Fullstack Frameworks
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'React framework with SSR, API routes, and more',
    category: 'fullstack',
    tags: ['react', 'typescript', 'ssr', 'popular'],
  },
  {
    id: 'remix',
    name: 'Remix',
    description: 'Full-stack React framework focused on web standards',
    category: 'fullstack',
    tags: ['react', 'typescript', 'modern'],
  },
  {
    id: 'nuxt',
    name: 'Nuxt.js',
    description: 'Vue.js framework with SSR and static generation',
    category: 'fullstack',
    tags: ['vue', 'typescript', 'ssr'],
  },
  // Backend
  {
    id: 'express',
    name: 'Express.js',
    description: 'Minimal Node.js web framework',
    category: 'backend',
    tags: ['nodejs', 'javascript', 'flexible'],
  },
  {
    id: 'fastify',
    name: 'Fastify',
    description: 'Fast and low overhead Node.js framework',
    category: 'backend',
    tags: ['nodejs', 'typescript', 'performance'],
  },
  {
    id: 'hono',
    name: 'Hono',
    description: 'Ultrafast web framework for the edge',
    category: 'backend',
    tags: ['edge', 'typescript', 'modern'],
  },
  // Databases
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Powerful open-source relational database',
    category: 'database',
    tags: ['sql', 'relational', 'popular'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL document database',
    category: 'database',
    tags: ['nosql', 'document', 'flexible'],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Lightweight embedded database',
    category: 'database',
    tags: ['sql', 'embedded', 'simple'],
  },
  {
    id: 'prisma',
    name: 'Prisma',
    description: 'Type-safe ORM for Node.js and TypeScript',
    category: 'database',
    tags: ['orm', 'typescript', 'popular'],
  },
  // Auth
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Complete user management and authentication',
    category: 'auth',
    tags: ['managed', 'easy', 'popular'],
  },
  {
    id: 'nextauth',
    name: 'NextAuth.js',
    description: 'Authentication for Next.js applications',
    category: 'auth',
    tags: ['nextjs', 'oauth', 'flexible'],
  },
  {
    id: 'supabase-auth',
    name: 'Supabase Auth',
    description: 'Open-source authentication with Supabase',
    category: 'auth',
    tags: ['open-source', 'backend'],
  },
  // Styling
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    category: 'styling',
    tags: ['utility', 'popular', 'fast'],
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'Re-usable components built with Radix and Tailwind',
    category: 'styling',
    tags: ['components', 'accessible', 'popular'],
  },
  {
    id: 'chakra',
    name: 'Chakra UI',
    description: 'Simple, modular component library',
    category: 'styling',
    tags: ['components', 'accessible', 'react'],
  },
];

// Feature Templates
export const FEATURE_TEMPLATES: FeatureTemplate[] = [
  // Authentication & Users
  {
    id: 'auth',
    name: 'User Authentication',
    description: 'Sign up, sign in, and user sessions',
    category: 'Users',
    complexity: 'medium',
  },
  {
    id: 'user-profiles',
    name: 'User Profiles',
    description: 'Profile pages with editable information',
    category: 'Users',
    complexity: 'simple',
  },
  {
    id: 'roles',
    name: 'Role-Based Access',
    description: 'Admin, user, and custom roles',
    category: 'Users',
    complexity: 'medium',
  },
  // Data & Content
  {
    id: 'database',
    name: 'Database Integration',
    description: 'Persistent data storage',
    category: 'Data',
    complexity: 'medium',
  },
  {
    id: 'crud',
    name: 'CRUD Operations',
    description: 'Create, read, update, delete functionality',
    category: 'Data',
    complexity: 'simple',
  },
  {
    id: 'search',
    name: 'Search & Filter',
    description: 'Search functionality with filters',
    category: 'Data',
    complexity: 'medium',
  },
  {
    id: 'pagination',
    name: 'Pagination',
    description: 'Paginated data lists',
    category: 'Data',
    complexity: 'simple',
  },
  // UI Features
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Light/dark theme toggle',
    category: 'UI',
    complexity: 'simple',
  },
  {
    id: 'responsive',
    name: 'Mobile Responsive',
    description: 'Works on all screen sizes',
    category: 'UI',
    complexity: 'simple',
  },
  {
    id: 'animations',
    name: 'Animations',
    description: 'Smooth transitions and micro-interactions',
    category: 'UI',
    complexity: 'simple',
  },
  {
    id: 'charts',
    name: 'Charts & Graphs',
    description: 'Data visualization components',
    category: 'UI',
    complexity: 'medium',
  },
  {
    id: 'tables',
    name: 'Data Tables',
    description: 'Sortable, filterable tables',
    category: 'UI',
    complexity: 'medium',
  },
  // Advanced Features
  {
    id: 'realtime',
    name: 'Real-time Updates',
    description: 'Live data synchronization',
    category: 'Advanced',
    complexity: 'complex',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'In-app and push notifications',
    category: 'Advanced',
    complexity: 'medium',
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Upload and manage files',
    category: 'Advanced',
    complexity: 'medium',
  },
  {
    id: 'api',
    name: 'REST API',
    description: 'API endpoints for data access',
    category: 'Advanced',
    complexity: 'medium',
  },
  // E-commerce
  {
    id: 'cart',
    name: 'Shopping Cart',
    description: 'Add to cart functionality',
    category: 'E-commerce',
    complexity: 'medium',
  },
  {
    id: 'payments',
    name: 'Payment Processing',
    description: 'Stripe or similar integration',
    category: 'E-commerce',
    complexity: 'complex',
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Stock tracking and management',
    category: 'E-commerce',
    complexity: 'medium',
  },
  // Content
  {
    id: 'markdown',
    name: 'Markdown Support',
    description: 'Rich text with markdown',
    category: 'Content',
    complexity: 'simple',
  },
  {
    id: 'comments',
    name: 'Comments',
    description: 'User comments and replies',
    category: 'Content',
    complexity: 'medium',
  },
  {
    id: 'seo',
    name: 'SEO Optimization',
    description: 'Meta tags, sitemaps, etc.',
    category: 'Content',
    complexity: 'simple',
  },
];

// Design Preferences
export const DESIGN_PREFERENCES: DesignPreference[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple with lots of whitespace',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with subtle gradients',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong colors and prominent elements',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun colors and rounded shapes',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate and trustworthy appearance',
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Dark background with light text',
  },
];

// Color Schemes
export const COLOR_SCHEMES = [
  { id: 'blue', name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4' },
  { id: 'purple', name: 'Royal Purple', primary: '#8b5cf6', secondary: '#a855f7' },
  { id: 'green', name: 'Forest Green', primary: '#22c55e', secondary: '#10b981' },
  { id: 'orange', name: 'Sunset Orange', primary: '#f97316', secondary: '#fb923c' },
  { id: 'pink', name: 'Rose Pink', primary: '#ec4899', secondary: '#f472b6' },
  { id: 'neutral', name: 'Neutral Gray', primary: '#6b7280', secondary: '#9ca3af' },
];
