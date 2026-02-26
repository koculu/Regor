import { configDefaults, defineConfig, UserConfig } from 'vitest/config'
export default defineConfig({
  define: {},
  test: {
    setupFiles: 'tests/setup.ts',
    sequence: {
      hooks: 'list',
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude!,
        'src/directives/teleport.ts',
      ],
    },
  },
}) as UserConfig
