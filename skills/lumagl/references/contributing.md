# Contributing in visgl/luma.gl

## Read repository instructions

Read the root `AGENTS.md` before editing, then check for more specific instructions in
the affected tree. Repository instructions are authoritative for setup, style,
ownership boundaries, validation, and merge preparation.

Preserve unrelated working-tree changes. Follow established TypeScript and
documentation conventions, and keep new agent support on the existing contributor
command surface.

## Stable root commands

Use root scripts rather than reaching into test-runner internals:

```bash
yarn test-node
yarn test-browser
yarn test-headless
yarn test-coverage
yarn website-debug
```

`yarn test-node` is a focused check. It does not replace the repository-wide build or
combined test gate. Follow the final command sequence in `AGENTS.md`, including
formatting after changes and the required `yarn build` and `yarn test`.

Reusable Vitest wiring lives in `@vis.gl/dev-tools`. Repository-specific Vitest configuration
lives in `vitest.config.ts`, Playwright utilities live in `scripts/playwright/`, and Playwright
defaults live in `.ocularrc.js`.

## Browser diagnosis

Run an example with an explicit backend:

```bash
yarn website-debug --example hello-triangle --backend webgpu-core
yarn website-debug --example hello-triangle --backend webgl2
```

The runner writes:

- `.playwright-artifacts/website-playwright.png`;
- `.playwright-artifacts/webgpu-probe.json`;
- `.playwright-artifacts/page-diagnostics.json`;
- `.playwright-artifacts/last-url.txt`.

Inspect the artifact contents. A zero exit code is not evidence that the expected
pixels rendered or that the intended backend was selected.

## Scope and policy

Use the same contribution standards for human- and agent-authored changes. This skill
does not create disclosure requirements or other contribution policy. It only makes
the existing instructions, verification loops, and architecture boundaries easier for
an agent to follow.

## Repository sources

- `AGENTS.md`
- `docs/developer/dev-tools/llm-friendly-test-setup.md`
- `docs/developer/dev-tools/playwright.md`
- `vitest.config.ts`
- `.ocularrc.js`
