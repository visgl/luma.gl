# AGENTS.md
 
## Setup commands
- Select Node version: `nvm use`
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarm test`
- Check website build `cd website; yarn; yarn build`

## LLM-friendly test setup
- Use the repo root scripts as the stable interface:
  - `yarn test-node`
  - `yarn test-browser`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn website-debug`
- Those commands delegate into the local `@luma.gl/devtools` workspace.
- Reusable Vitest and Playwright wiring lives under [`devtools`](/Users/ibgreen/code/luma.gl/devtools).
- Repo-specific overrides for that tooling live in [`\.ocularrc.js`](/Users/ibgreen/code/luma.gl/.ocularrc.js).
- For details, see [devtools/docs/llm-friendly-test-setup.md](/Users/ibgreen/code/luma.gl/devtools/docs/llm-friendly-test-setup.md).

## Before committing
- Format code: `yarn lint fix`
- Always `yarn lint fix` after making changes to ensure that prettier formatting is maintained.
 
## Code style
- TypeScript strict mode
- We end lines with semicolons
- Single quotes
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.

## Documentation
- `docs/upgrade-guide.md` should focus on breaking changes and deprecations only.
- Do not add new-feature bullets to the upgrade guide; put those in release notes such as `docs/whats-new.md`.
