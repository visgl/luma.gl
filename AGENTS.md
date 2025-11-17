# AGENTS.md
 
## Setup commands
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarm test`
- Check website build `cd website; yarn; yarn build`

## Before committing
- Always `yarn lint fix` after making changes to ensure that prettier formatting is maintained.
 
## Code style
- TypeScript strict mode
- Single quotes, no semicolons
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.
