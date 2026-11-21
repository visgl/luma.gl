import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Using GPU parameters

<GpuGuideDocsTabs group="rendering" active="parameters" />

GPU parameters control culling, depth and stencil tests, blending, and rasterization.
Choose the owner from when the value needs to change:

| State | Where to set it | When it can change |
| --- | --- | --- |
| Culling, depth tests, blending, multisampling | `RenderPipelineProps.parameters` | Create a different pipeline; Engine `Model.setParameters()` manages this for you. |
| Clear values and read-only attachments | `RenderPassProps` | Begin a new pass. |
| Viewport, scissor rectangle, blend constant, stencil reference | `renderPass.setParameters()` | Between draws in the same pass. |

## Configure a model

```ts
model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal',
  cullMode: 'back'
});

const renderPass = device.beginRenderPass({
  clearColor: [0, 0, 0, 1],
  clearDepth: 1
});
model.draw(renderPass);
renderPass.end();
device.submit();
```

The target must have a depth attachment compatible with the pipeline's `depthFormat`.
Inside `AnimationLoop.onRender`, the loop handles submission.

## Change a viewport between draws

```ts
renderPass.setParameters({viewport: [0, 0, 800, 600]});
model.draw(renderPass);
renderPass.setParameters({viewport: [600, 0, 200, 150]});
model.draw(renderPass);
```

Viewport and scissor coordinates use drawing-buffer pixels, not CSS pixels.
Use `scissorRect` to restrict writes; changing a viewport alone does not clip to its rectangle.

## Reverse-Z depth

Scenes with very large depth ranges, such as planets and space scenes, lose depth precision
with a standard projection. Objects far from the camera then z-fight.
Reverse-Z with a 32-bit float depth buffer and an infinite far plane keeps the precision.
It maps the near plane to depth 1 and infinity to depth 0, so the float32 exponent holds the range.

Reverse-Z needs four settings:

| Setting | Value | Where |
| --- | --- | --- |
| Depth format | `'depth32float'` | Depth attachment and `parameters.depthFormat` |
| Depth compare | `'greater'` or `'greater-equal'` | `RenderPipelineProps.parameters.depthCompare` |
| Depth clear value | `0` | `RenderPassProps.clearDepth` |
| Clip depth range | `'zero-to-one'` | `RenderPassProps.clipDepthMode` |

WebGPU always uses the zero-to-one clip depth range. WebGL2 uses the -1 to 1 range by default.
That range maps clip depth to `0.5 + 0.5 * z` and removes the precision that reverse-Z adds.
On WebGL2, `clipDepthMode: 'zero-to-one'` calls `EXT_clip_control`.
Check the `'clip-control-webgl'` feature first. The render pass throws if the feature is not present.

```ts
const reverseZ = device.type === 'webgpu' || device.features.has('clip-control-webgl');

model.setParameters({
  depthWriteEnabled: true,
  depthCompare: reverseZ ? 'greater' : 'less-equal'
});

const renderPass = device.beginRenderPass({
  framebuffer, // with a 'depth32float' depth attachment
  clearDepth: reverseZ ? 0 : 1,
  clipDepthMode: reverseZ ? 'zero-to-one' : undefined
});
```

The projection matrix must match. math.gl `Matrix4.perspective()` has no reverse-Z or
infinite-far option at this time. Use this matrix (column-major, right-handed, camera looks along -z):

```ts
import {Matrix4} from '@math.gl/core';

/** Reverse-Z perspective with an infinite far plane, for a zero-to-one clip depth range. */
function getReverseInfinitePerspective(fovy: number, aspect: number, near: number): Matrix4 {
  const focalLength = 1 / Math.tan(fovy / 2);
  // prettier-ignore
  return new Matrix4([
    focalLength / aspect, 0, 0, 0,
    0, focalLength, 0, 0,
    0, 0, 0, -1,
    0, 0, near, 0
  ]);
}
```

A point at distance `d` in front of the camera gets clip `z = near` and `w = d`, so its depth is `near / d`.
The near plane has depth 1. Points at infinity have depth 0 and are not clipped.

Browser support for `EXT_clip_control` (caniuse and web3dsurvey.com, November 2026):

- Chrome and Edge 122 and later, Opera 108 and later.
- Safari 17.4 and later, on macOS and iOS.
- Firefox 159 and later.
- The extension also depends on the GPU driver. web3dsurvey.com reports it on about 93% of
  WebGL2 browsers, with less coverage on Linux and Android.
  Chrome's SwiftShader (ANGLE on Vulkan) exposes it.

## Next steps

- [GPU parameter reference](/docs/api-reference/core/parameters) lists accepted values.
- [Rendering](/docs/api-guide/gpu/gpu-rendering) explains targets, passes, and submission.
- [Antialiasing](/docs/api-guide/gpu/gpu-antialiasing) explains sampling choices.
