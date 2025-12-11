import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/client.ts',
    'src/helpers/users.ts',
    'src/helpers/projects.ts',
    'src/helpers/builds.ts',
    'src/helpers/chats.ts',
    'src/helpers/appspecs.ts',
    'src/helpers/events.ts',
  ],
  format: ['esm'],
  // Note: DTS generation disabled due to Prisma type incompatibilities.
  // Types are inferred from source files.
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['@prisma/client'],
});
