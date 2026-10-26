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

Before creating or moving the release tag, add a release entry to [`CHANGELOG.md`](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md)
and commit it on the release source branch. The heading must include the exact version represented
by the tag, for example:

```md
### v9.4.2

- Describe the user-visible fixes and changes included in this release.
```

The publish workflow verifies this exact heading before creating the GitHub release or publishing to
npm. If the heading is missing or does not match the tag, the workflow stops before publication.

## Release steps

1. Update `CHANGELOG.md` on `master` or the appropriate `*-release` branch with the exact release heading.
2. Stage and commit the changelog with `git add CHANGELOG.md` before invoking release tooling. The working tree must be clean.
3. Run `nvm use`, `yarn install`, `yarn lint fix`, `yarn build`, and `yarn test`.
4. Run `yarn publish-prod` for a stable release or `yarn publish-beta` for a prerelease. These commands update package versions, create the release commit and tag, and push them.
5. Monitor the `release` GitHub Actions workflow.

The workflow runs the build and tests again. Once they pass, it creates the GitHub release from the
matching changelog entry and publishes the public packages to npm using the dist-tag selected from
the package version. Keep the stable `latest` tag unchanged for prereleases.

## npm trusted publishing

The `release` job in `.github/workflows/release.yml` runs on a GitHub-hosted runner,
requests `id-token: write`, and installs npm 11.15 or later. The repository's Lerna publisher
supports OIDC. Each public package must separately trust that workflow on npm; making a
package public in this repository does not create its npm-side trust relationship.

### Set up `@luma.gl/slang`

In the package's npm Settings, add a GitHub Actions trusted publisher with these values:

| Setting | Value |
| --- | --- |
| Organization or user | `visgl` |
| Repository | `luma.gl` |
| Workflow filename | `release.yml` |
| Environment name | Leave empty; the release job does not use a GitHub environment |
| Allowed actions | Enable direct publishing (`npm publish`) |

Enter only `release.yml`, not the full workflow path. The current release flow publishes
immediately, so a stage-only publisher does not match it.

Alternatively, a package maintainer with npm 2FA can configure and inspect the connection:

```sh
npx --yes npm@^11.15.0 trust github @luma.gl/slang --repo visgl/luma.gl --file release.yml --allow-publish
npx --yes npm@^11.15.0 trust list @luma.gl/slang
```

These commands configure npm account settings; they are not part of CI. They require an
authenticated maintainer and may prompt for 2FA. Do not replace an existing connection without
checking it first. See [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/)
and [`npm trust` reference](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

### First publication

npm requires the package to exist before adding its trusted publisher. For a new package such
as `@luma.gl/slang`, plan one authenticated initial publication from `master` or a `*-release`
branch after merging the public-package change, preparing the v10 release version and changelog,
and passing the release checks above. Use the real built package, not a placeholder package.

From the checked release source, a maintainer can publish only Slang with the prerelease tag:

```sh
(cd modules/slang && npm publish --access public --tag beta)
```

Use `beta` only for a v10 prerelease; stable releases use `latest`. Configure and verify the
trusted publisher immediately after the initial publication, before subsequent automated releases.
If the release workflow attempted publication before this setup, use the recovery steps below;
its `from-package` publisher skips versions already present on npm. No npm publishing token needs
to be added to the release workflow for subsequent trusted releases.

## Recovery after a failed publication

If the workflow fails before the GitHub release is created, fix the release branch, commit the
correction, move the tag to the corrected commit, and push the tag again so the workflow reruns. Do
not create a second version for the same release solely because the workflow stopped before
publishing.

If the workflow created the GitHub release but npm publication did not complete, remove the
incomplete GitHub release for that tag with `gh release delete v<version> --yes`, then rerun the
workflow after checking which packages, if any, reached npm. A retry cannot create a second GitHub
release with the same tag.
