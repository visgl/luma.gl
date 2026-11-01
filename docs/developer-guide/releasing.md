# Releasing luma.gl

This guide describes publishing luma.gl packages to npm through the `release` GitHub Actions workflow.

## Routine releases do not need npm setup

As of `v10.0.0-alpha.6` (October 30, 2026), trusted publishing has been validated for all eight
public packages: `@luma.gl/anari`, `@luma.gl/core`, `@luma.gl/engine`, `@luma.gl/gpgpu`,
`@luma.gl/graph`, `@luma.gl/shaders`, `@luma.gl/slang`, and `@luma.gl/three`.

The next alpha can use those existing connections. It does not require `npm login`, a publishing
token, manual `npm publish`, or recreating trusted publishers. Determine the current package set
from `modules/*/package.json` and each package's `private` flag; packages can move or be renamed.
Since alpha.6, `@luma.gl/gpgpu` has been consolidated into `@luma.gl/graph`; alpha.7 publishes
the seven remaining public packages. A new npm package name needs the one-time setup described below, even when it replaces an existing
package in this repository.

## Release source

Publish only from `master` or a release branch whose name ends in `-release`, such as `9.4-release`.
The workflow checks that the tagged commit is contained in one of those remote branches. Use the
appropriate release branch for patch releases and `master` for a new major or minor release unless
the release plan says otherwise.

Use a clean checkout of the release branch. If the development checkout contains unrelated changes,
use a separate clean checkout rather than stashing, committing, or publishing those changes. Do not
publish from a feature branch or a detached commit outside the permitted release branches.

## Prepare the changelog and version

Check `lerna.json`, remote Git tags, and npm before choosing a version:

```sh
git ls-remote origin refs/heads/master 'refs/tags/v10.0.0-alpha.*'
npm view @luma.gl/core dist-tags --json
```

If the intended version already has a failed or partial release, follow recovery below instead of
incrementing merely to escape the failure. Alpha packages use npm's `beta` dist-tag. Preserve the
existing `latest` tags for prereleases.

Add a user-visible release entry to `CHANGELOG.md`. Its heading must exactly match the intended
tag, for example `### v10.0.0-alpha.7`. Stage and commit the changelog on the release branch
**before invoking version tooling**. The workflow verifies the exact heading before publication.

The following controlled sequence allows version references to be checked before anything is
pushed. Replace the example versions throughout this guide with the intended release versions.

```sh
nvm use
yarn install
git add CHANGELOG.md
git commit -m 'docs: prepare v10.0.0-alpha.7 release notes'
npx lerna version 10.0.0-alpha.7 --force-publish --exact --no-commit-hooks --no-git-tag-version --no-push --yes
```

Review the resulting manifests. Lerna has left old references in the website workspace and in
`anari` and `graph` peer dependencies during previous releases. Find remaining references to the
previous luma.gl version and align dependencies that should follow this release:

```sh
rg '10\.0\.0-alpha\.6' --glob package.json --glob '!node_modules/**'
```

Review compatibility ranges deliberately; do not replace unrelated dependency versions. Run
`yarn install` again after correcting manifests so the lockfile agrees with them.

`yarn publish-beta` and `yarn publish-prod` remain convenience alternatives: they version, commit,
tag, and immediately push. Use them only when no intermediate manifest corrections are needed.
Do not run them after the controlled versioning sequence, which would bump the version again.

## Validate before tagging

After the final manifest and formatting changes, run:

```sh
yarn install
yarn lint fix
yarn build
yarn test
```

A successful `yarn build` does not exercise every `prepublishOnly` hook. Before pushing, also check
every public package's repository metadata and run its actual prepublish hook:

```sh
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

for (const directory of readdirSync('modules')) {
  const packageDirectory = join('modules', directory);
  const manifestPath = join(packageDirectory, 'package.json');
  if (!existsSync(manifestPath)) continue;
  const packageInfo = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (packageInfo.private) continue;
  assert.equal(packageInfo.repository?.url, 'https://github.com/visgl/luma.gl', packageInfo.name);
  console.log(packageInfo.name);
  if (packageInfo.scripts?.prepublishOnly) {
    execFileSync('npm', ['run', 'prepublishOnly'], {cwd: packageDirectory, stdio: 'inherit'});
  }
}
JS
```

The repository URL must match the repository identified by the workflow's provenance. A missing
`repository.url` caused npm to reject `@luma.gl/three` with `E422` even though build and tests passed.
Bundle hooks also catch workspace alias problems that TypeScript builds can miss.

A local `VITEST_BROWSER_CONNECTION_CLOSED` is a failed infrastructure run, not a passing test run.
Record it and investigate; require the full Linux test gates on the same release source to pass
before publication. Do not skip assertions or weaken release gates to work around a browser crash.

Immediately before pushing, fetch the release branch and check that its remote head has not
advanced. Incorporate new source changes and repeat the relevant checks if necessary. In the clean
release checkout, review the diff, commit the version changes, and push only the intended tag:

```sh
git diff --stat
git diff
git add --all
git commit -m 'v10.0.0-alpha.7'
git tag -a v10.0.0-alpha.7 -m v10.0.0-alpha.7
git push origin master
git push origin refs/tags/v10.0.0-alpha.7
```

Substitute the release branch for `master` when appropriate. The workflow runs node tests and all
six headless shards, then builds packages, checks the changelog, creates the GitHub release, and
publishes missing package versions through OIDC. Monitor the whole workflow through completion.

## Verify the registry, not just the workflow

For **every public package**, verify the exact version, expected dist-tag, and provenance:

```sh
npm view @luma.gl/core@10.0.0-alpha.7 version dist.attestations --json --prefer-online
npm view @luma.gl/core dist-tags --json --prefer-online
```

Repeat for the package set printed by the preflight above. Confirm `beta` points to the new alpha,
`latest` remains unchanged, the GitHub release is a prerelease, and each OIDC publication has a
provenance attestation. Initial authenticated bootstrap versions may lack OIDC provenance; the
subsequent workflow-published version must have it.

Registry metadata can lag a successful publish, including returning `E404` or the previous
`beta` tag. Allow propagation time and recheck before deciding publication failed. Retain the
successful publish log and verify each package independently. A green workflow alone is not proof
that every version is publicly installable.

## One-time setup for a new package name

### Bootstrap before the target release

Merge the public-package change, declare its repository URL, and pass build, tests, and prepublish
checks on `master` or a permitted release branch. Use the real built package for one authenticated
initial publication so that its npm settings can be configured.

Do this **before bumping to the target release version**. For example, bootstrap a new package at
the current `alpha.6` version, configure its publisher, then let the next `alpha.7` workflow publish
it through OIDC. If it is manually published at the target version, `from-package` skips that
version and the new trust connection will still need a later OIDC publication to validate.

From the checked source, replace `modules/new-module` with the new package's directory:

```sh
npm login
npx --yes npm@^11.15.0 publish ./modules/new-module --access public --tag beta --auth-type=web
```

Complete any browser authentication or authenticator-code prompts directly with npm. Terminal
login and browser settings authentication are separate; npm may request another code for each
settings change. Never add a maintainer token to the release workflow for this bootstrap.

### Configure and validate the publisher

In the new package's npm Settings, create a GitHub Actions trusted publisher:

| Setting | Value |
| --- | --- |
| Organization or user | `visgl` |
| Repository | `luma.gl` |
| Workflow filename | `release.yml` |
| Environment name | Leave empty; the release job does not use a GitHub environment |
| Allowed actions | Enable direct publishing (`npm publish`) |

Use the filename alone, not `.github/workflows/release.yml`. A stage-only connection does not
match this repository's immediate publishing flow. Inspect an existing connection before making
changes; do not recreate an already valid publisher for each release.

A maintainer with npm 2FA can also inspect and configure a connection through the CLI:

```sh
npx --yes npm@^11.15.0 trust list @luma.gl/new-module
npx --yes npm@^11.15.0 trust github @luma.gl/new-module --repo visgl/luma.gl --file release.yml --allow-publish
```

These commands manage npm account settings and may require 2FA, including for inspection. After
the workflow publishes a new version, check that npm Settings shows **Valid**, rather than
**Pending validation**, and verify its registry provenance.

A new connection must complete its first successful publication within two days or it expires.
Plan the bootstrap and next OIDC publication together; saving the connection is not the final
step. See [npm's configuration expiry documentation](https://docs.npmjs.com/trusted-publishers/#trusted-publisher-configuration-expiry)
and the [`npm trust` reference](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

## Recovery after a failed publication

Keep the same version while completing a failed or partial release. First inspect the failed job
and query npm for every public package to establish which versions actually reached the registry.
Do not unpublish or attempt to overwrite successful versions.

### Retry unchanged source

For a transient publishing failure, retain successful test jobs and rerun only the publishing job.
If the workflow already created its GitHub release, delete that incomplete release entry first;
this does not delete the Git tag or npm packages. The current publisher creates the GitHub release
before npm publication, so leaving the entry in place prevents a clean retry.

Replace `VERSION`, `RUN_ID`, and `JOB_ID` below with values from the failed release.
The API query returns the publishing job's numeric ID.

```sh
gh release delete vVERSION --repo visgl/luma.gl --yes
gh api repos/visgl/luma.gl/actions/runs/RUN_ID/jobs --jq '.jobs[] | {id, name, conclusion}'
gh run rerun RUN_ID --repo visgl/luma.gl --job JOB_ID
```

Delete the GitHub release only if it exists. The `from-package` publisher skips versions already
on npm. After a retry, repeat the complete registry verification, including dist-tags and
provenance. Use bounded retries for transient failures, not an endless rerun loop.

### Correct the release source

Put source or workflow fixes through a PR and merge them with the required reviews and checks.
Do not assume a release request authorizes bypassing branch protections. From a clean permitted
release branch at the corrected, validated commit, move the existing tag with a lease:

```sh
releaseTag=v10.0.0-alpha.7
previousTagObject=$(git ls-remote origin "refs/tags/$releaseTag" | cut -f1)
git tag -f -a "$releaseTag" -m "$releaseTag" HEAD
git push origin "refs/tags/$releaseTag" "--force-with-lease=refs/tags/$releaseTag:$previousTagObject"
```

Remove an incomplete GitHub release entry before pushing the tag. A moved tag triggers a fresh
workflow; do not rerun an old job expecting it to check out the corrected commit. The commit must
remain contained in remote `master` or a `*-release` branch, with the exact changelog heading.

Already published packages remain immutable and keep their original provenance. If a published
package itself requires a code fix, release a new version rather than trying to replace it. Do
not claim skipped packages were rebuilt from a later recovery commit.

### Known failure signatures

| Failure | Action |
| --- | --- |
| npm `E422` says `repository.url` does not match provenance | Correct the package manifest to identify `https://github.com/visgl/luma.gl`, verify the packed manifest, and merge before retrying. |
| A prepublish bundle cannot resolve an internal workspace path | Check the bundle alias against the package export map. Run actual prepublish hooks; a TypeScript build alone does not cover this. |
| `TLOG_CREATE_ENTRY_ERROR` / HTTP 409 says an equivalent transparency-log entry exists | Inspect which packages published, allow a short backoff, and retry the publishing job. Keep OIDC and provenance enabled. |
| `ERR_INVALID_ARG_TYPE` says the timeout is a string | Remove `npm_config_timeout`. Lerna forwards that untyped environment value as a string, while its HTTP client requires a number. Do not use this variable as a Sigstore workaround. Test any future override through the actual HTTP client, not just a configuration snapshot. |
| A newly published version returns `E404` or an old dist-tag | Allow registry propagation, compare with publish logs, and recheck exact versions and tags before retrying. |
