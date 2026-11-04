# Contributing

[Overview](https://luma.gl/docs/developer-guide.md)[Setup](https://luma.gl/docs/developer-guide/installing.md)[Contributing](https://luma.gl/docs/developer-guide/contributing.md)

Contributions of all sizes are welcome. Learn more about the [luma.gl community](https://luma.gl/docs/community.md), then use this guide to get started.

## Get started[​](#get-started "Direct link to Get started")

For a bug or a larger change, start by checking the [issue tracker](https://github.com/visgl/luma.gl/issues) for an existing discussion. A clear description and a small reproducible example help others understand a bug. For an enhancement, describe the problem and your proposed approach so the community can discuss it with you.

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

## Prepare a pull request[​](#prepare-a-pull-request "Direct link to Prepare a pull request")

Create a branch for your work and open a pull request when it is ready for review. Explain the problem, what you changed, and how you verified it. Link any related issues and include screenshots or examples when they help reviewers understand the result. Review is a collaborative process; questions and follow-up changes are a normal part of it.

## Verify a change[​](#verify-a-change "Direct link to Verify a change")

Follow the repository’s `AGENTS.md` and CI requirements. Depending on your change, the main checks include:

```
yarn lint fix

yarn build

yarn test

yarn website:build
```

[Test commands and runtime conventions](https://luma.gl/docs/developer-guide/testing.md) explain Node and browser verification. Add focused tests beside the affected module's tests. Use Vitest for new coverage, and remove temporary `test.only` calls before committing.

## Writing luma.gl documentation[​](#writing-lumagl-documentation "Direct link to Writing luma.gl documentation")

Documentation should help readers choose a layer, complete a workflow, and then look up an exact contract without repeating the same explanation on every page.

### Page contracts[​](#page-contracts "Direct link to Page contracts")

| Page type       | Required progression                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Module overview | Overview → when to use → quick start or live example → concepts → capabilities → workflows → API index → limits → related modules |
| Guide           | Outcome and prerequisites → mental model → workflow → example → tradeoffs → mistakes → next steps                                 |
| API reference   | Role/import → usage → contract → ownership → failures → compatibility → cost → related APIs                                       |
| Tutorial        | Outcome → prerequisites → live result → incremental implementation → explanation → extension → next lesson                        |

Omit an irrelevant section instead of adding empty boilerplate, but preserve the relative order of the remaining sections.

### Navigation[​](#navigation "Direct link to Navigation")

* The sidebar is the complete hierarchy.
* Page tabs contain only three to seven immediate peers.
* Preserve existing routes when splitting a page; turn the old route into an index.
* Every curated page belongs in `docs/table-of-contents.json` unless it is intentionally internal.

### Examples[​](#examples "Direct link to Examples")

* Prefer short snippets that focus on one decision.
* Reuse actual example source for longer runnable programs.
* Activate embedded GPU examples explicitly; do not capture page scrolling before activation.
* State backend requirements and resource ownership.

### Style and maintenance[​](#style-and-maintenance "Direct link to Style and maintenance")

* Use sentence-case headings and factual language.
* Link the first unfamiliar term to the [glossary](https://luma.gl/docs/glossary.md).
* Use local status badges instead of remote images.
* Put implementation roadmaps in `dev-docs`, not public API pages.
* Run documentation contract tests and the website build before merging.
