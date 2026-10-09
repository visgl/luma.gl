import {DeveloperDocsTabs} from '@site/src/components/docs/developer-docs-tabs';

# Contributing

<DeveloperDocsTabs active="contributing" />

Contributions can improve code, examples, tests, or documentation. Work from a branch
and open a pull request with the problem, changes, and verification results.

## Set up the repository

```bash
git clone git@github.com:visgl/luma.gl.git
cd luma.gl
nvm use
yarn install
```

Source lives in `modules/`. Run a standalone example while editing:

```bash
cd examples/showcase/instancing
yarn start
```

Vite reloads changes to source and example code. From the repository root,
`yarn website:start` runs the complete documentation and example website.

## Verify a change

Follow the repository's `AGENTS.md` and CI requirements. The main checks are:

```bash
yarn lint fix
yarn build
yarn test
yarn website:build
```

[Test commands and runtime conventions](/docs/developer-guide/testing) explain
Node and browser verification. Add focused tests beside the affected module's tests.
Use Vitest for new coverage, and remove temporary `test.only` calls before committing.

For documentation changes, follow [Writing documentation](/docs/developer-guide/documentation).
