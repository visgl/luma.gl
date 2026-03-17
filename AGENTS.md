# AGENTS.md
 
## Setup commands
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarm test`
- Check website build `cd website; yarn; yarn build`

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
