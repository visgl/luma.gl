---
title: Test utilities
description: GPU test devices, null resources, and test helpers from core/test-utils.
---

# Test utilities

Import test devices and resource helpers from `@luma.gl/core/test-utils`. This optional entry
registers the WebGL and WebGPU adapters without importing engine or graph, or creating a device eagerly.
It is intended for tests, and is not exported by the core package root.

```ts
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/core/test-utils';

const device = await getWebGPUTestDevice();
if (device) {
  // Encode, submit, and read back GPU work using the normal Device API.
}

const nullDevice = new NullDevice({});
// Use the null backend for CPU-side validation without a browser GPU.
nullDevice.destroy();
```

## Exports

- `getTestDevices`, `getTestDevice`, `getWebGLTestDevice`, `getPresentationWebGLTestDevice`,
  `getWebGPUTestDevice`, `getWebGPUTestDevices`, and `getNullTestDevice` provide cached test devices.
- `NullDevice`, `NullAdapter`, and `nullAdapter` provide the null backend.
- `checkType`, `deepCopy`, `getResourceCounts`, and `getLeakedResources` support test assertions.

Use Vitest and the repository Playwright utilities for browser execution and image comparisons.
See [Testing](/docs/developer-guide/testing) and
[browser automation](/docs/developer/dev-tools/playwright).

## Compatibility

The `@luma.gl/test-utils` package has been removed. Replace both its root and `/device` imports
with `@luma.gl/core/test-utils`.
The deprecated synchronous `createTestDevice` and `webglDevice` exports remain available from
`@luma.gl/core/test-utils-legacy`. Prefer asynchronous device helpers.

The legacy `SnapshotTestRunner` and `PerformanceTestRunner` are no longer public APIs.
There is no `@luma.gl/engine/test-utils` entry: device helpers need only core, and the historical
animation-loop runners are retained solely for the repository's old render/performance harness.
