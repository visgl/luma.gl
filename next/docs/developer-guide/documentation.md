# Writing luma.gl documentation

[Overview](https://luma.gl/next/docs/developer-guide.md)[Installing](https://luma.gl/next/docs/developer-guide/installing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Documentation](https://luma.gl/next/docs/developer-guide/documentation.md)

Documentation should help readers choose a layer, complete a workflow, and then look up an exact contract without repeating the same explanation on every page.

## Page contracts[​](#page-contracts "Direct link to Page contracts")

| Page type       | Required progression                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Module overview | Overview → when to use → quick start or live example → concepts → capabilities → workflows → API index → limits → related modules |
| Guide           | Outcome and prerequisites → mental model → workflow → example → tradeoffs → mistakes → next steps                                 |
| API reference   | Role/import → usage → contract → ownership → failures → compatibility → cost → related APIs                                       |
| Tutorial        | Outcome → prerequisites → live result → incremental implementation → explanation → extension → next lesson                        |

Omit an irrelevant section instead of adding empty boilerplate, but preserve the relative order of the remaining sections.

## Navigation[​](#navigation "Direct link to Navigation")

* The sidebar is the complete hierarchy.
* Page tabs contain only three to seven immediate peers.
* Preserve existing routes when splitting a page; turn the old route into an index.
* Every curated page belongs in `docs/table-of-contents.json` unless it is intentionally internal.

## Examples[​](#examples "Direct link to Examples")

* Prefer short snippets that focus on one decision.
* Reuse actual example source for longer runnable programs.
* Activate embedded GPU examples explicitly; do not capture page scrolling before activation.
* State backend requirements and resource ownership.

## Style and maintenance[​](#style-and-maintenance "Direct link to Style and maintenance")

* Use sentence-case headings and factual language.
* Link the first unfamiliar term to the [glossary](https://luma.gl/next/docs/glossary.md).
* Use local status badges instead of remote images.
* Put implementation roadmaps in `dev-docs`, not public API pages.
* Run documentation contract tests and the website build before merging.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)
* [Testing](https://luma.gl/next/docs/developer-guide/testing.md)
* [Working with AI coding agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)
