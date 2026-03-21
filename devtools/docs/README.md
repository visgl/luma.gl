# devtools

`devtools` holds repo-owned reusable development helpers that can be upstreamed into `@vis.gl/dev-tools`.

Current support:
- Vitest config boilerplate via `getVitestConfig()`
- Tape-style Vitest assertions via `vitest-tape`
- Playwright launch option helpers
- Website example routing and execution helpers
- Browser debug support for launching or attaching to Chromium-family browsers

Boundary:
- Reusable defaults and helper code live in `devtools`
- Repo-specific policy stays in `.ocularrc.js`

Examples of repo-specific policy:
- example aliases such as `persistence`
- default example routes
- Vitest exclude patterns
- any repo-specific CLI defaults

See:
- `devtools/docs/llm-friendly-test-setup.md`
- `devtools/docs/configuration.md`
- `devtools/docs/vitest.md`
- `devtools/docs/playwright.md`
- `devtools/docs/browser-debug.md`
