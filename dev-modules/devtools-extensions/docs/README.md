# devtools-extensions

`devtools-extensions` holds repo-owned reusable development helpers that can be upstreamed into `@vis.gl/dev-tools`.

Current support:
- Vitest config boilerplate via `getVitestConfig()`
- Tape-style Vitest assertions via `vitest-tape`
- Playwright launch option helpers
- Website example routing and execution helpers
- Browser debug support for launching or attaching to Chromium-family browsers

Boundary:
- Reusable defaults and helper code live in `dev-modules/devtools-extensions`
- Repo-specific policy stays in `.ocularrc.js`

Examples of repo-specific policy:
- example aliases such as `persistence`
- default example routes
- Vitest exclude patterns
- any repo-specific CLI defaults

See:
- `dev-modules/devtools-extensions/docs/llm-friendly-test-setup.md`
- `dev-modules/devtools-extensions/docs/configuration.md`
- `dev-modules/devtools-extensions/docs/vitest.md`
- `dev-modules/devtools-extensions/docs/playwright.md`
- `dev-modules/devtools-extensions/docs/browser-debug.md`
