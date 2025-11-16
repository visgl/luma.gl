# AGENTS.md
 
## Setup commands
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarm test`
- Check website build `cd website; yarn; yarn build`

## Before committing
- Format code: `yarn lint fix`
- Always run `yarn lint fix` before committing to avoid prettier formatting errors in CI
 
## Code style
- TypeScript strict mode
- Single quotes, no semicolons
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.
