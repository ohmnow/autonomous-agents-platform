import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/agent.ts',
    'src/security.ts',
    'src/progress.ts',
    'src/prompts.ts',
    'src/types.ts',
    'src/events.ts',
    'src/harnesses/index.ts',
    'src/harnesses/coding.ts',
    'src/harnesses/custom.ts',
  ],
  format: ['esm'],
  // Note: DTS disabled due to Claude Agent SDK type compatibility issues
  // The SDK is new and types are evolving. We define our own types in types.ts
  dts: {
    entry: [
      'src/index.ts',
      'src/types.ts',
      'src/events.ts',
      'src/security.ts',
      'src/progress.ts',
      'src/prompts.ts',
      'src/harnesses/index.ts',
      'src/harnesses/coding.ts',
      'src/harnesses/custom.ts',
    ],
  },
  clean: true,
  sourcemap: true,
});
