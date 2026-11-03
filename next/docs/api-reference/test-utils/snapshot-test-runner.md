# Legacy snapshot runner

`SnapshotTestRunner` and `PerformanceTestRunner` are no longer exported by luma.gl packages. Use Vitest with the [browser automation utilities](https://luma.gl/next/docs/developer/dev-tools/playwright.md) for new rendering and screenshot tests.

The historical luma.gl render/performance harness retains repository-only implementations under `test/utils/legacy-test-runners`; these are not a supported package API. Device creation is available from [`@luma.gl/core/test-utils`](https://luma.gl/next/docs/api-reference/test-utils.md).
