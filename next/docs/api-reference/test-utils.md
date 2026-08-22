# Overview

[Overview](https://luma.gl/next/docs/api-reference/test-utils.md)[SnapshotTestRunner](https://luma.gl/next/docs/api-reference/test-utils/snapshot-test-runner.md)[Testing guide](https://luma.gl/next/docs/developer-guide/testing.md)

`@luma.gl/test-utils` contains GPU-aware helpers for testing luma.gl applications and comparing rendered output. It is intended for test code, not application bundles.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use this package when a test needs a configured luma.gl device, deterministic animation-loop execution, framebuffer readback, or image snapshot comparison. Use ordinary Vitest assertions for CPU-only logic that does not require a device.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {SnapshotTestRunner} from '@luma.gl/test-utils';



const runner = new SnapshotTestRunner({

  width: 800,

  height: 600,

  onTest: async ({device, renderPass}) => {

    model.draw(renderPass);

  }

});



await runner.run();
```

See [`SnapshotTestRunner`](https://luma.gl/next/docs/api-reference/test-utils/snapshot-test-runner.md) for its complete configuration and lifecycle.

## Test environments[​](#test-environments "Direct link to Test environments")

| Environment      | Use it for                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Node             | Pure data, layout, shader assembly, and validation tests that do not create a browser GPU device. |
| Browser          | Interactive WebGPU or WebGL 2 behavior with a real canvas and browser diagnostics.                |
| Headless browser | Repeatable rendering and image comparison in automation.                                          |

The repository-level commands are documented in the [Testing guide](https://luma.gl/next/docs/developer-guide/testing.md).

## Snapshot workflow[​](#snapshot-workflow "Direct link to Snapshot workflow")

1. Render a deterministic frame at a fixed viewport and device-pixel ratio.
2. Read the requested attachment only after command submission completes.
3. Compare against a reviewed reference image with an explicit tolerance.
4. Record backend, feature level, and adapter details when results are backend-sensitive.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

Image snapshots can vary across GPU vendors and browser implementations. Prefer semantic assertions for algorithms and reserve pixel comparisons for stable presentation behavior. WebGPU-only tests must report that requirement rather than silently falling back to WebGL 2.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Testing luma.gl applications](https://luma.gl/next/docs/developer-guide/testing.md)
* [Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)
* [Browser automation support](https://luma.gl/next/docs/developer/dev-tools/playwright.md)
