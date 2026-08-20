---
title: Writing luma.gl documentation
description: Page contracts, navigation rules, examples, and verification requirements for luma.gl documentation contributors.
---

import {DeveloperDocsTabs} from '@site/src/components/docs/developer-docs-tabs';

# Writing luma.gl documentation

<DeveloperDocsTabs active="documentation" />

Documentation should help readers choose a layer, complete a workflow, and then look up an exact
contract without repeating the same explanation on every page.

## Page contracts

| Page type | Required progression |
| --- | --- |
| Module overview | Overview → when to use → quick start or live example → concepts → capabilities → workflows → API index → limits → related modules |
| Guide | Outcome and prerequisites → mental model → workflow → example → tradeoffs → mistakes → next steps |
| API reference | Role/import → usage → contract → ownership → failures → compatibility → cost → related APIs |
| Tutorial | Outcome → prerequisites → live result → incremental implementation → explanation → extension → next lesson |

Omit an irrelevant section instead of adding empty boilerplate, but preserve the relative order of
the remaining sections.

## Navigation

- The sidebar is the complete hierarchy.
- Page tabs contain only three to seven immediate peers.
- Preserve existing routes when splitting a page; turn the old route into an index.
- Every curated page belongs in `docs/table-of-contents.json` unless it is intentionally internal.

## Examples

- Prefer short snippets that focus on one decision.
- Reuse actual example source for longer runnable programs.
- Activate embedded GPU examples explicitly; do not capture page scrolling before activation.
- State backend requirements and resource ownership.

## Style and maintenance

- Use sentence-case headings and factual language.
- Link the first unfamiliar term to the [glossary](/docs/glossary).
- Use local status badges instead of remote images.
- Put implementation roadmaps in `dev-docs`, not public API pages.
- Run documentation contract tests and the website build before merging.

## Related pages

- [Contributing](/docs/developer-guide/contributing)
- [Testing](/docs/developer-guide/testing)
- [Working with AI coding agents](/docs/developer-guide/working-with-ai)
