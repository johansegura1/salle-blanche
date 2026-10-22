import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    // Les tests de bout en bout (*.e2e-spec.ts) ET les tests unitaires (*.spec.ts).
    include: ['test/**/*.e2e-spec.ts', 'test/**/*.spec.ts'],
    // Une seule base SQLite pour tous les fichiers : ils passent l'un après l'autre.
    fileParallelism: false,
    setupFiles: ['dotenv/config'],
    env: { DATABASE_URL: 'file:./test.db', JWT_SECRET: 'test-secret' },
    globalSetup: ['test/global-setup.ts'],
  },
});
