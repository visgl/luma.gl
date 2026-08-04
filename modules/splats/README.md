# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl. This package owns prepared GPU splat
data, anisotropic Gaussian rendering, and backend-specific render models without depending on
Apache Arrow, loaders.gl, or deck.gl.

The package is a private luma.gl workspace and is not published to npm. Install dependencies from
the repository root and reference it from another workspace with `"@luma.gl/splats": "workspace:*"`.

## Usage

```ts
import {makeGPUSplatData, SplatRenderer} from '@luma.gl/splats';

const splatData = makeGPUSplatData(device, {
  positions: new Float32Array([0, 0, -2]),
  scales: new Float32Array([0.25, 0.12, 0.08]),
  rotations: new Float32Array([1, 0, 0, 0]),
  colors: new Uint8Array([235, 150, 80, 255]),
  opacities: new Float32Array([0.8])
});

const renderer = new SplatRenderer(device, {data: splatData});

renderer.draw(renderPass);
renderer.appendData(nextSplatBatch);

// Destroy borrowing renderers before destroying caller-owned prepared data.
renderer.destroy();
splatData.destroy();
nextSplatBatch.destroy();
```

`GPUSplatData` is caller-owned prepared data. Renderers borrow source buffers and release only their
own models and temporary resources. Streaming retains source batch boundaries instead of
concatenating or reuploading previously prepared batches.

Source colors can use normalized `Uint8Array` RGBA or linear `Float32Array` RGBA. Floating-point
colors preserve high-dynamic-range radiance without premature clamping or quantization. The
renderer automatically applies Reinhard highlight compression on standard dynamic range targets,
preserves extended WebGPU presentation output, and supports explicit `exposure` and `toneMapping`
controls.

Keep format parsing in `@loaders.gl/splats`, Apache Arrow conversion and GPU upload in
`@luma.gl/arrow`, and deck.gl-specific layers in downstream adapters. The luma.gl splat renderer
consumes framework-neutral GPU data.
