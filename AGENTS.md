# AGENTS.md
 
## Setup commands
- Select Node version: `nvm use`
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarn test`
- Check website build `yarn website:build`

## LLM-friendly test setup
- Use the repo root scripts as the stable interface:
  - `yarn test-node`
  - `yarn test-browser`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn website-debug`
- Those commands delegate into the local `@luma.gl/devtools-extensions` workspace.
- Reusable Vitest and Playwright wiring lives under [`dev-modules/devtools-extensions`](/Users/ibgreen/code/luma.gl/dev-modules/devtools-extensions).
- Repo-specific overrides for that tooling live in [`\.ocularrc.js`](/Users/ibgreen/code/luma.gl/.ocularrc.js).
- For details, see [dev-modules/devtools-extensions/docs/llm-friendly-test-setup.md](/Users/ibgreen/code/luma.gl/dev-modules/devtools-extensions/docs/llm-friendly-test-setup.md).

## Before committing
- Format code: `yarn lint fix`
- Always `yarn lint fix` after making changes to ensure that Biome formatting is maintained.

## Merge preparation
- When asked to "get ready for merge", create a copyable Markdown description of the changes versus `master`.
- Start that Markdown description with `Goals` and `Changes` sections, then include verification, risks, follow-up notes, or other merge-relevant sections when useful.
 
## Code style
- TypeScript strict mode
- We end lines with semicolons
- Single quotes
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.
- Always import individual symbols from `'apache-arrow'` in `modules/*/src`.
- It is preferred to use `import * as arrow from 'apache-arrow'` in tests, examples, and docs.

## Documentation
- `docs/upgrade-guide.md` should focus on breaking changes and deprecations only.
- Do not add new-feature bullets to the upgrade guide; put those in release notes such as `docs/whats-new.md`.
