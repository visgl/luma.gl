# Maintaining attribution

Credit the people and projects whose work makes luma.gl possible. Update the
[references and credits guide](../docs/references-and-credits.md) when adding a
new foundation, algorithm, example, dataset, or asset.

For adapted source, retain actual upstream copyright holders, license expressions,
and complete license texts. Record the source URL, version or commit, affected
files, and material modifications in the package's `THIRD-PARTY-NOTICES.md`.
If a historical revision cannot be established, say so explicitly. Never assign
vis.gl ownership to upstream material or replace historical terms with today's
upstream license. Moving code or removing a dependency does not erase provenance.

Distinguish copied/adapted source, independently implemented published algorithms,
inspiration, compatible APIs, and separately installed dependencies. Name authors
and explain their contribution; a paper citation does not replace a source license.
For data and assets, record creator, source revision, license, modifications, and
checksums where practical. Keep required credits visible in example distributions.

Every public package includes a notice index and the full notices it references.
Keep `files` manifests synchronized. Run `yarn check:attributions` and inspect
`npm pack --dry-run --json` for affected packages. Source notices must survive
bundling through accompanying distribution notices even when comments are removed.
Refresh the website's standalone distribution notice file with
`yarn check:attributions --write-distribution` after changing package notices or
example asset terms. The ordinary check rejects stale generated notices.

The inventory is evidence-based, not a claim that every historical influence is
known. Investigate uncertain origins using Git history and upstream sources;
record unresolved questions rather than guessing a license or author. Automated
checks verify the recorded inventory, links, and packaging, but cannot discover
uncredited copies or determine legal provenance.
