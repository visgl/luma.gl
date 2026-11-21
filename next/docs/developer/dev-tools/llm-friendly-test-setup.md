# LLM-friendly test setup

This guidance is now in the [Testing guide](https://luma.gl/next/docs/developer-guide/testing.md#how-the-test-infrastructure-fits-together).

## Browser CI cadence and shard timing[​](#browser-ci-cadence-and-shard-timing "Direct link to Browser CI cadence and shard timing")

Ordinary PR coverage runs three general shards, one compute shard, and two native physics shards. The sequencer uses measured file durations; refresh Linux and native physics weights separately with `scripts/ci/browser-timings.mjs`. Compare actual job durations after changing weights, not only predicted bucket totals.

The four extended ray-material matrices (maps, normals, dielectrics, and diffuse transmission) run in **Render conformance** nightly, on manual dispatch, and on PRs changing their tests, renderer dependencies, or scheduling. Their assertions are unchanged. Every PR retains a deterministic material smoke test, other ray material regressions, and the aggregate coverage gate with its existing source file denominator. The workflow checks GPU availability and requires all four cases to execute without skips.

Run the extended matrix locally with:

```
LUMA_TEST_BROWSER_GROUP=render-conformance yarn test-headless --no-coverage
```

Unfiltered local `yarn test` and release shards still include the full material matrix. Only the `general` PR group excludes it; selecting conformance must not inherit that exclusion. Existing physics endurance scheduling remains separate. Avoid overlapping local suites: after normal commit hooks run the node tests, run the headless phase once rather than repeating the node phase in `yarn test`.
