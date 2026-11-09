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

## Merge queue

The `test` workflow runs on `merge_group: checks_requested` so GitHub can validate
queued changes against the current `master` and earlier queue entries. Its concurrency
key uses the queue ref, keeping independent merge groups separate from PR runs.

Queue runs include the three general browser shards, compute tests, Node tests, package
builds, GPU presentation, lint, examples, and the website build. The physics browser shard
runs on PRs and master pushes but is excluded from the queue. The separate physics
reference and endurance workflows retain their existing triggers. Queue coverage is not
published to Coveralls because it omits physics.

After merging the workflow preparation, a repository administrator can enable the queue
for `master` in Settings → Branches (the existing protection rule), or in a branch ruleset:

1. Require `Aggregate test coverage` and `Build, lint, Node tests, examples, and website`.
   The aggregate check fails if a scheduled browser shard, Node coverage, presentation,
   or package build fails. Do not require individual physics checks for queue commits.
2. Enable **Require merge queue**. Start with build concurrency 1, minimum and maximum
   merge group size 1, a 60-minute status-check timeout, and **Only merge non-failing
   pull requests** enabled.
3. Use squash or rebase merging to preserve the branch's required linear history.
4. Retain one required approval, with `ibgreen` as the sole user allowed to bypass
   required PR reviews. Apply protection to administrators as well. Keep this exception
   scoped to PR review requirements; do not add a bypass for CI or the merge queue.
5. Queue a small PR and confirm that the two required checks run on its merge-group
   commit before relying on the queue for subsequent changes.

A bypass applies to the person merging or queuing a PR, not its author. Other contributors
still need an approval when merging their own PRs; `ibgreen` can bypass reviews for any PR.

See [GitHub's merge queue documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
for configuration details. Repository settings are separate from workflow files; merging
this preparation does not itself enable the queue.

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
