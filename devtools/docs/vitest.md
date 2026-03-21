# Vitest support

`getVitestConfig()` provides shared Vitest boilerplate for repos that want:
- a node project
- a browser project
- a headless browser project
- Playwright-backed browser execution
- `vite-tsconfig-paths` integration

Responsibilities:
- load optional repo overrides from `.ocularrc.js`
- apply shared browser provider wiring
- apply shared timeout and coverage defaults
- keep repo-specific include/exclude policy outside the reusable helper

Repo customization:
- `devtools.vitest.excludePatterns`
- `devtools.vitest.tsconfigProjects`
- `devtools.vitest.browserName`
- `devtools.vitest.testTimeout`
- `devtools.vitest.channel`
- `devtools.vitest.softwareGpu`
- `devtools.vitest.launchOptions`

Project assumptions:
- Vitest is available in the repo
- `tsconfig.json` exists
- browser tests are matched by `modules/**/*.spec.{ts,js}` and `test/**/*.spec.{ts,js}`
- node-only tests are matched by `*.node.spec.*`

Tape-style compatibility:
- the canonical helper now lives at `devtools/vitest/vitest-tape.ts`
- `test/utils/vitest-tape.ts` remains a compatibility shim that re-exports from `devtools`
