# Bundle-size fixtures

Run `yarn bundle-size` from the repository root to bundle the public package entrypoints and the
representative application imports in this directory. The command reports minified, gzip-9, and
Brotli-11 byte counts and fails when any tracked ceiling is exceeded.

The ceilings in `bundle-size.config.mjs` are present-day regression limits. The separate gzip goals
come from issue #2852; reduction PRs should lower a ceiling whenever they establish a smaller
baseline.

Use `yarn bundle-size --output .bundle-size` to also write `report.json` and `report.md`. CI publishes
both files as the `bundle-size-report` artifact and adds the Markdown table to the job summary.
