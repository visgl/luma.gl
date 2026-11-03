import {DeveloperDocsTabs} from '@site/src/components/docs/developer-docs-tabs';

# Contributing

<DeveloperDocsTabs active="contributing" />

Contributions of all sizes are welcome. Learn more about the
[luma.gl community](/docs/community), then use this guide to get started.

## Get started

For a bug or a larger change, start by checking the
[issue tracker](https://github.com/visgl/luma.gl/issues) for an existing discussion.
A clear description and a small reproducible example help others understand a bug.
For an enhancement, describe the problem and your proposed approach so the community
can discuss it with you.

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

## Prepare a pull request

Create a branch for your work and open a pull request when it is ready for review.
Explain the problem, what you changed, and how you verified it. Link any related
issues and include screenshots or examples when they help reviewers understand the
result. Review is a collaborative process; questions and follow-up changes are a
normal part of it.

## Verify a change

Follow the repository’s `AGENTS.md` and CI requirements. Depending on your change,
the main checks include:

```bash
yarn lint fix
yarn build
yarn test
yarn website:build
```

[Test commands and runtime conventions](/docs/developer-guide/testing) explain
Node and browser verification. Add focused tests beside the affected module's tests.
Use Vitest for new coverage, and remove temporary `test.only` calls before committing.

## Writing luma.gl documentation

Documentation should help readers choose a layer, complete a workflow, and then look up an exact
contract without repeating the same explanation on every page.

### Page contracts

| Page type | Required progression |
| --- | --- |
| Module overview | Overview → when to use → quick start or live example → concepts → capabilities → workflows → API index → limits → related modules |
| Guide | Outcome and prerequisites → mental model → workflow → example → tradeoffs → mistakes → next steps |
| API reference | Role/import → usage → contract → ownership → failures → compatibility → cost → related APIs |
| Tutorial | Outcome → prerequisites → live result → incremental implementation → explanation → extension → next lesson |

Omit an irrelevant section instead of adding empty boilerplate, but preserve the relative order of
the remaining sections.

### Navigation

- The sidebar is the complete hierarchy.
- Page tabs contain only three to seven immediate peers.
- Preserve existing routes when splitting a page; turn the old route into an index.
- Every curated page belongs in `docs/table-of-contents.json` unless it is intentionally internal.

### Examples

- Prefer short snippets that focus on one decision.
- Reuse actual example source for longer runnable programs.
- Activate embedded GPU examples explicitly; do not capture page scrolling before activation.
- State backend requirements and resource ownership.

### Style and maintenance

- Use sentence-case headings and factual language.
- Link the first unfamiliar term to the [glossary](/docs/glossary).
- Use local status badges instead of remote images.
- Put implementation roadmaps in `dev-docs`, not public API pages.
- Run documentation contract tests and the website build before merging.
