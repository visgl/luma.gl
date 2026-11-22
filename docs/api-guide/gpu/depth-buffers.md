import {BufferAtlas} from '@site/src/components/docs/buffer-atlas';
import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Depth buffers

<GpuGuideDocsTabs group="rendering" active="depth-buffers" />

A depth attachment stores a depth value per framebuffer sample. For overlapping opaque draws, the depth comparison decides which surface is visible. The projection, render pass and pipeline must agree on which end of the depth range is closer.

For masks and per-sample tags, see [Stencil buffers](/docs/api-guide/gpu/stencil-buffers).

## Canyon Echo

Pull the relief angle slider to one side. Each point comes from a visible sample in one captured color and depth image. Look through the gaps behind the bridge to see which surfaces the camera never recorded.

<BufferAtlas kind="canyon" />

## Configure opaque rendering

This example creates an offscreen target. Supply the model with a conventional projection for the backend and color output compatible with the target.

```ts
const framebuffer = device.createFramebuffer({
  width: 1024,
  height: 768,
  colorAttachments: ['rgba8unorm'],
  depthStencilAttachment: 'depth24plus'
});

model.setParameters({
  depthFormat: 'depth24plus',
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});

const pass = device.beginRenderPass({framebuffer, clearDepth: 1});
model.draw(pass);
pass.end();
device.submit();
```

Clearing to 1 starts each sample at the far end of the range. A closer fragment passes the comparison and replaces the stored value. The pipeline defaults (`depthWriteEnabled: false`, `depthCompare: 'always'`) require explicit configuration for opaque occlusion. Reuse the framebuffer across frames and destroy it when finished.

## From projection to stored depth

1. The vertex shader outputs homogeneous clip coordinates. WebGL normally clips Z between `-w` and `w`. WebGPU clips between zero and `w`. WebGL with `clipDepthMode: 'zero-to-one'` uses the latter convention.
2. Perspective division gives `z / w`. With the default viewport depth range, WebGL's conventional mode maps this value from −1…1 to 0…1. Zero-to-one mode already spans 0…1. A six-component pass viewport sets the minimum and maximum window depth with its last two entries.
3. The pipeline compares the incoming window depth against the stored sample. A successful comparison permits the color write and, when enabled, the depth write. A fragment shader that outputs its own depth must follow the same convention as the other draws.

| Decision | API | Effect |
| --- | --- | --- |
| Allocate storage | `FramebufferProps.depthStencilAttachment` | Choose `depth24plus` for ordinary rendering, `depth24plus-stencil8` when also using stencil, or `depth32float` for floating-point precision. Match attachment dimensions and sample counts. |
| Declare attachment format | `parameters.depthFormat` | Use the same format as the pass attachment. Changing the pipeline format does not allocate storage. |
| Initialize or preserve depth | `RenderPassProps.clearDepth` | A number clears at pass start. `false` loads the existing attachment contents. |
| Choose projection convention | `RenderPassProps.clipDepthMode` | Use the backend default or explicitly request a supported clip-space Z range. This setting does not change the projection matrix. |
| Select visible samples | `parameters.depthCompare` | `less` and `greater` exclude ties. The corresponding `-equal` comparisons accept ties, including geometry at the clear value. |
| Preserve stored depth while testing | `parameters.depthWriteEnabled` | Set to `false` for draws that should respect earlier occluders while leaving depth available to later draws. |
| Declare pass-wide read-only access | `RenderPassProps.depthReadOnly` | Pair with `clearDepth: false` and pipelines with depth writes disabled. |
| Control near/far clipping | `parameters.unclippedDepth` | Requests depth clamping on supporting devices (`depth-clip-control`). Conventional rendering and reverse-Z both work with clipping enabled. |
| Offset polygon depth | `parameters.depthBias`, `depthBiasSlopeScale`, `depthBiasClamp` | Offset rasterized triangle depth by constant and slope-dependent terms. A positive clamp sets an upper bound and a negative clamp sets a lower bound. Zero leaves the offset unbounded. WebGPU supports the clamp in core. |

## Backend mappings

| luma.gl parameter | WebGPU | WebGL 2 |
| --- | --- | --- |
| `clipDepthMode` on a pass | The clip volume always uses zero-to-one depth. Selecting it requires no native command or optional feature. Requesting negative-one-to-one throws. | The default is negative-one-to-one. For zero-to-one, check `clip-control-webgl`. The backend calls `EXT_clip_control.clipControlEXT(origin, depthMode)` and restores tracked state when the pass ends. |
| `unclippedDepth` on a pipeline | Sets `GPUPrimitiveState.unclippedDepth`. Request `optionalFeatures: ['depth-clip-control']` at device creation and check the created device before enabling it. | The same luma.gl feature detects `EXT_depth_clamp`. Enabling `DEPTH_CLAMP_EXT` keeps primitives crossing the near or far clipping planes and clamps fragment depth. Side clipping planes still apply. |
| `depthBias`, `depthBiasSlopeScale`, `depthBiasClamp` on a pipeline | Map to the fields of the same names on `GPUDepthStencilState`. No optional feature is needed. | Constant bias maps to `units` and slope bias to `factor` in `gl.polygonOffset(factor, units)`. A nonzero clamp requires `polygon-offset-clamp-webgl`, which enables `EXT_polygon_offset_clamp.polygonOffsetClampEXT(factor, units, clamp)`. |

Shader-defined clip planes are another capability. WebGPU exposes `clip-distances` and WebGL exposes `shader-clip-cull-distance-webgl` through `WEBGL_clip_cull_distance`. Use these when geometry must be clipped against application-defined planes.

### Check which operations are available

The two `-webgl` flags below identify luma.gl capabilities named for their WebGL extensions. Both are true on WebGPU because WebGPU provides the corresponding operations in core. Use them directly in `device.features.has(...)`. WebGPU's fixed clip convention supports zero-to-one depth; it cannot switch to negative-one-to-one or change the clip origin through these flags.

| Operation | Check on the created device |
| --- | --- |
| Zero-to-one clip depth | `device.features.has('clip-control-webgl')` |
| Disable near/far clipping | `device.features.has('depth-clip-control')` |
| Clamp polygon bias | `device.features.has('polygon-offset-clamp-webgl')` |
| Write fragment depth with a conservative bound | On WebGPU, `device.wgslLanguageFeatures.has('fragment_depth')`. On WebGL, `device.features.has('shader-conservative-depth-webgl')`. Select the matching shader variant. |

## Depth formats and sampling

WebGPU defines four core depth attachment formats. `depth16unorm` stores 16-bit fixed-point depth. `depth24plus` allows an implementation-selected representation with at least 24 bits of precision, and `depth24plus-stencil8` adds an 8-bit stencil aspect. Use `depth32float` to guarantee floating-point depth for reverse-Z. If both 32-bit float depth and stencil are needed on WebGPU, request `'depth32float-stencil8'` when creating the device and check that it was enabled. The format table shows luma.gl's per-device capabilities. [Texture formats](/docs/api-reference/core/texture-formats) · [WebGPU depth/stencil formats](https://gpuweb.github.io/gpuweb/#depth-formats)

For a shadow map, render depth from the light's projection. In the lighting pass, sample the depth aspect with a comparison sampler (WGSL `textureSampleCompare`, GLSL ES `sampler2DShadow`). Set the sampler comparison for the convention used to render the shadow map. For numeric depth, use a depth texture load or ordinary depth sample. A multisampled depth attachment stores separate samples. WebGPU's color resolve target does not resolve depth. Choose the sample or reduction your later pass needs. The depth representation of `depth24plus` is opaque on WebGPU, so direct depth-aspect buffer copies are unavailable. [WebGPU depth texture access](https://gpuweb.github.io/gpuweb/#depth-formats)

WebGL 2 includes depth textures and fragment-depth output in core. Older WebGL 1 examples may request `WEBGL_depth_texture` or `EXT_frag_depth`. A separate WebGL 2 extension, `WEBGL_stencil_texturing`, selects the stencil aspect for shader sampling from a packed depth/stencil texture. luma.gl currently has no device-feature string for that extension. [WebGL depth textures](https://registry.khronos.org/webgl/extensions/WEBGL_depth_texture/) · [Fragment depth](https://registry.khronos.org/webgl/extensions/EXT_frag_depth/) · [Stencil texturing](https://registry.khronos.org/webgl/extensions/WEBGL_stencil_texturing/)

## Fragment shaders that write depth

WGSL `@builtin(frag_depth)` and GLSL ES 3.00 `gl_FragDepth` override the rasterized fragment depth. Use them when the shader computes the visible surface, for example when ray marching. For ordinary meshes, fixed-function interpolation supplies depth.

When the shader can guarantee the final depth only increases or only decreases relative to rasterized depth, a conservative declaration can preserve early depth-test optimizations. The optional WGSL language feature `fragment_depth` permits `@builtin(frag_depth, greater)` and `@builtin(frag_depth, less)`. The WebGL equivalent is `EXT_conservative_depth` with the shader directive `#extension GL_EXT_conservative_depth : require` and the `depth_greater` or `depth_less` output qualifier. WebGL excludes the desktop `depth_unchanged` qualifier. Select the bound from the shader's numeric output, including when using reverse-Z. [WGSL fragment depth](https://gpuweb.github.io/gpuweb/wgsl/#builtin-values-frag_depth) · [Khronos conservative depth](https://registry.khronos.org/webgl/extensions/EXT_conservative_depth/)

## Reuse depth between passes

For an opaque pass followed by transparent geometry, draw opaque surfaces with depth writes enabled. Begin the second pass on the same framebuffer with `clearColor: false`, `clearDepth: false` and `depthReadOnly: true`. Use the same projection convention and depth comparison, turn off depth writes, and configure blending for the transparent draws. When using conventional alpha blending, sort those draws back to front. Clearing depth again would let transparent fragments behind opaque surfaces pass.

## Reverse-Z

Perspective depth concentrates precision near the camera. Two distant surfaces can round to the same stored value and flicker as the camera moves. Moving the near plane farther from the eye improves conventional precision. For large depth ranges, a reversed projection paired with floating-point storage places distant depths close to zero, where representable floats are closer together.

| Setting | Conventional | Reverse-Z |
| --- | --- | --- |
| Projection maps near → far | 0 → 1 in window depth | 1 → 0 in window depth |
| Attachment and pipeline format | e.g. `depth24plus` | `depth32float` |
| Clear value | 1 | 0 |
| Opaque comparison | `less` or `less-equal` | `greater` or `greater-equal` |
| Clip depth convention | Match the backend projection | `zero-to-one` |

Use `device.features.has('clip-control-webgl')` to select this reverse-Z recipe on either backend. WebGPU always reports true because its clip depth range is fixed at zero-to-one. WebGL reports true when its clip-control extension is available. On a device without support, use the conventional projection, comparison and clear value together. The optional WebGPU feature `depth-clip-control` controls near/far clipping and is unnecessary for this recipe.

For a right-handed camera looking along negative Z, this column-major matrix gives an infinite far plane.

```ts
import {Matrix4} from '@math.gl/core/matrix';

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
The near plane has depth 1. Depth approaches zero with increasing distance.

Create the framebuffer with a `depth32float` attachment, upload the returned matrix through the model's projection uniform, and draw with the matching settings.

```ts
model.setParameters({
  depthFormat: 'depth32float',
  depthWriteEnabled: true,
  depthCompare: 'greater'
});
const pass = device.beginRenderPass({framebuffer, clearDepth: 0, clipDepthMode: 'zero-to-one'});
model.draw(pass);
pass.end();
device.submit();
```

## Diagnose depth artifacts

| Symptom | Check |
| --- | --- |
| The last draw always wins | Verify a depth attachment exists, opaque draws enable writes, and the comparison selects the nearer depth. |
| Geometry vanishes after switching to reverse-Z | Check the projection delivered to the shader, pass clip range, clear value and comparison together. |
| Coplanar decals flicker | Use a small polygon depth bias. With conventional depth a negative offset moves a decal toward the camera; reverse-Z reverses that sign. Excessive bias can make decals show through unrelated geometry. |
| An overlay appears through the scene | Reuse the opaque pass's depth attachment and load its contents in the overlay pass. |
| A sampled depth texture looks almost uniformly bright or dark | Perspective depth is nonlinear. Reconstruct view-space distance with the projection used to write the texture. For the infinite reverse-Z matrix above, distance is `near / depth` for positive depth. |

See the [framebuffer reference](/docs/api-reference/core/resources/framebuffer), [render pass reference](/docs/api-reference/core/resources/render-pass), and [pipeline parameter reference](/docs/api-reference/core/parameters) for the full property definitions.
