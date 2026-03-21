# Configuration

`devtools` reads repo-specific customization from `.ocularrc.js`.

Supported shape:

```js
export default {
  devtools: {
    vitest: {
      excludePatterns: [],
      tsconfigProjects: ['./tsconfig.json'],
      browserName: 'chromium',
      testTimeout: 60000,
      channel: 'chromium',
      softwareGpu: false,
      launchOptions: {}
    },
    playwright: {
      defaultExamplePath: '/examples/showcase/persistence',
      exampleBasePath: '/examples',
      examples: {
        persistence: '/examples/showcase/persistence'
      },
      channel: 'chromium',
      softwareGpu: false,
      args: [],
      launchOptions: {}
    }
  }
};
```

Intended ownership:
- `devtools` provides reusable logic and defaults
- `.ocularrc.js` provides repo policy and shortcuts

Good repo-owned values:
- example alias maps
- default example route
- excluded test files
- browser channel overrides for a specific repo

Values that should stay in reusable code:
- generic URL resolution behavior
- generic Playwright launch merging
- backend tab selection
- browser attach and launch helpers
