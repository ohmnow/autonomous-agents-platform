import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/interface.ts', 'src/e2b.ts', 'src/daytona.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
