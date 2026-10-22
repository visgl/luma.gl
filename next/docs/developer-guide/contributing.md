# Contributing

[Overview](https://luma.gl/next/docs/developer-guide.md)[Installing](https://luma.gl/next/docs/developer-guide/installing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Documentation](https://luma.gl/next/docs/developer-guide/documentation.md)

Contributions can improve code, examples, tests, or documentation. Work from a branch and open a pull request with the problem, changes, and verification results.

## Set up the repository[​](#set-up-the-repository "Direct link to Set up the repository")

```
git clone git@github.com:visgl/luma.gl.git

cd luma.gl

nvm use

yarn install
```

Source lives in `modules/`. Run a standalone example while editing:

```
cd examples/showcase/instancing

yarn start
```

Vite reloads changes to source and example code. From the repository root, `yarn website:start` runs the complete documentation and example website.

## Verify a change[​](#verify-a-change "Direct link to Verify a change")

Follow the repository's `AGENTS.md` and CI requirements. The main checks are:

```
yarn lint fix

yarn build

yarn test

yarn website:build
```

[Test commands and runtime conventions](https://luma.gl/next/docs/developer-guide/testing.md) explain Node and browser verification. Add focused tests beside the affected module's tests. Use Vitest for new coverage, and remove temporary `test.only` calls before committing.

For documentation changes, follow [Writing documentation](https://luma.gl/next/docs/developer-guide/documentation.md).
