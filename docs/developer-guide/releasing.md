# Releasing luma.gl

This guide describes the repository release path for publishing luma.gl packages to npm.

## Release source

Releases may be published only from `master` or from a release branch whose name ends in
`-release`, such as `9.4-release`. The release workflow checks that the commit referenced by the
tag is contained in one of those branches. Do not publish from a feature branch or a temporary
checkout.

For a patch release, start from the appropriate release branch. For a new major or minor release,
use `master` unless the release plan explicitly calls for a release branch.

## Changelog requirement

Before creating or moving the release tag, add a release entry to [`CHANGELOG.md`](../../CHANGELOG.md)
and commit it on the release source branch. The heading must include the exact version represented
by the tag, for example:

```md
### v9.4.2

- Describe the user-visible fixes and changes included in this release.
```

The publish workflow parses this heading to create the GitHub release. If the heading is missing or
does not match the tag, the workflow stops before publishing to npm.

## Release steps

1. Update `CHANGELOG.md` on `master` or the appropriate `*-release` branch, then stage it with `git add CHANGELOG.md`.
2. Update package versions and internal package ranges with the repository release tooling.
3. Run `nvm use`, `yarn install`, `yarn lint fix`, `yarn build`, and `yarn test`.
4. Commit the release changes and push the release branch.
5. Create an annotated tag named `v<version>` on the release commit and push the tag.
6. Monitor the `release` GitHub Actions workflow.

The workflow runs the build and tests again. Once they pass, it creates the GitHub release from the
matching changelog entry and publishes the public packages to npm using the dist-tag selected from
the package version. Keep the stable `latest` tag unchanged for prereleases.

## Recovery after a failed publication

If the workflow fails before npm publication, fix the release branch, commit the correction, move the
tag to the corrected commit, and push the tag again so the workflow reruns. Do not create a second
version for the same release solely because the workflow stopped before publishing.
