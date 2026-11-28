# Antialiasing and Multisampling

[Overview](https://luma.gl/next/docs/api-guide/gpu.md)[Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md)[Depth buffers](https://luma.gl/next/docs/api-guide/gpu/depth-buffers.md)[Stencil buffers](https://luma.gl/next/docs/api-guide/gpu/stencil-buffers.md)[Bindings](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)

Aliasing is not one problem with one switch. A jagged triangle edge, a shimmering checkerboard, an alpha-cutout leaf, a noisy shadow boundary, and a depth-aware postprocess halo come from different sampling problems and need different fixes.

Start by identifying which artifact is aliasing:

| Artifact                                 | First technique to try                                     | Why                                                                                |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Geometry edges on a WebGL canvas         | Request `webgl.antialias`                                  | The browser can antialias the default drawing buffer.                              |
| Geometry edges in an offscreen pass      | MSAA or supersampling                                      | Offscreen color and depth attachments need their own sampling strategy.            |
| A final image with isolated jagged edges | FXAA                                                       | A single postprocess pass smooths contrast edges without changing scene rendering. |
| Motion shimmer or subpixel geometry      | TAA                                                        | Jitter, history, velocity, and depth accumulate information across frames.         |
| Minified or oblique textures             | Mipmaps and anisotropy                                     | Texture filters address texel-frequency aliasing, not polygon coverage.            |
| Alpha-cutout edges                       | Alpha-to-coverage or analytic coverage                     | A binary `discard` creates hard coverage edges.                                    |
| Depth and shadow edges                   | Matching multisampled depth, depth-aware filtering, or PCF | Visibility and shadow maps alias independently from final color.                   |

## Where Antialiasing Fits[​](#where-antialiasing-fits "Direct link to Where Antialiasing Fits")

Geometry, alpha cutouts, textures

→

Raster coverage<br />`MSAA` or supersampling

→

Resolved color texture

→

Postprocess<br />`FXAA` or `TAA`

→

Canvas presentation

←

Sampleable depth, normals, velocity, shadows

←

Depth participates in scene visibility during rasterization, then often becomes a separate sampled input for later effects.

The best result is often a combination: correct device-pixel resolution, mipmapped textures, coverage antialiasing for geometry, then a postprocess pass only where it adds value.

## Try Common Techniques[​](#try-common-techniques "Direct link to Try Common Techniques")

The comparison below keeps the before side as the single-sample baseline and applies the selected technique on the after side. Drag the divider to inspect the transition. It intentionally uses techniques available through the portable luma.gl API. Canvas antialiasing, offscreen MSAA, and TAA are explained in later sections.

### Antialiasing Techniques

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/antialiasing)Info

InfoSource

Mobile quality

```
// Loading source…
```

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

## Resolution and Supersampling[​](#resolution-and-supersampling "Direct link to Resolution and Supersampling")

Before adding an AA algorithm, make sure the drawing buffer matches the intended display resolution. A canvas rendered at CSS-pixel resolution on a high-DPI display will look soft or jagged even when other settings are correct. Use [`CanvasContext`](https://luma.gl/next/docs/api-reference/core/canvas-context.md) sizing controls to choose device pixels or an explicit render scale.

Supersampling renders the scene into a larger texture and downsamples it with a filter. It is portable and handles geometry, shader, and texture detail together, but it scales color, depth, and fragment-shader cost with the number of rendered pixels. Use it as a quality fallback or for small targets rather than as the default for a large scene.

## WebGL Canvas Antialiasing[​](#webgl-canvas-antialiasing "Direct link to WebGL Canvas Antialiasing")

WebGL exposes `antialias` as a context-creation attribute:

```
const device = await luma.createDevice({

  type: 'webgl2',

  createCanvasContext: true,

  webgl: {antialias: true}

});
```

This is a request for the default drawing buffer only. The browser chooses the technique and quality, and the actual value may differ from the requested one. Inspect the created context when the distinction matters:

```
const gl = device.gl as WebGL2RenderingContext;

const antialias = gl.getContextAttributes()?.antialias;
```

The request does not antialias textures attached to application-created framebuffers. The WebGL specification describes `antialias` as a best-effort drawing-buffer request, not a requirement. See the [WebGL context attributes specification](https://registry.khronos.org/webgl/specs/latest/1.0/).

## Explicit Multisampling[​](#explicit-multisampling "Direct link to Explicit Multisampling")

Multisample antialiasing stores more than one coverage/depth/color sample per pixel during rasterization, then resolves those samples into a normal single-sample image. It usually improves polygon and alpha-to-coverage edges without running the fragment shader once for every supersampled pixel.

### Render an antialiased offscreen image[​](#render-an-antialiased-offscreen-image "Direct link to Render an antialiased offscreen image")

Set `samples: 4` on the framebuffer and `sampleCount: 4` on each pipeline that draws into it. This example assumes backend-appropriate vertex and fragment shaders. It uses ordinary depth testing for opaque geometry.

```
const colorTexture = device.createTexture({

  width,

  height,

  format: 'rgba8unorm',

  usage: Texture.RENDER | Texture.SAMPLE

});



const framebuffer = device.createFramebuffer({

  width,

  height,

  samples: 4,

  colorAttachments: [colorTexture],

  depthStencilAttachment: 'depth24plus'

});



const pipeline = device.createRenderPipeline({

  vs,

  fs,

  colorAttachmentFormats: ['rgba8unorm'],

  depthStencilAttachmentFormat: 'depth24plus',

  parameters: {

    sampleCount: 4,

    depthCompare: 'less',

    depthWriteEnabled: true

  }

});



const pass = device.beginRenderPass({framebuffer, clearDepth: 1});

pass.setPipeline(pipeline);

pass.draw({vertexCount});

pass.end();

device.submit();



const resolvedColor = framebuffer.colorAttachments[0];
```

Bind `resolvedColor` in a later pass to composite the antialiased image or apply an effect. The pass resolves color when it ends. The underlying texture remains single-sampled. Reuse the framebuffer across frames and destroy it and the supplied color texture when finished.

### Attachment rules[​](#attachment-rules "Direct link to Attachment rules")

| Setting                  | Requirement                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Framebuffer sample count | Use `1` for ordinary rendering or `4` for managed offscreen MSAA.                                                                |
| Pipeline sample count    | Match the framebuffer on every draw.                                                                                             |
| Color attachments        | Use format strings for render-only color, or supply matching single-sample textures with the usage flags needed by later passes. |
| Depth/stencil            | Supply a format string to allocate matching multisampled storage. Omit it for color-only rendering.                              |
| Later passes             | Use the same framebuffer and load the aspects you want to preserve. Only color is resolved.                                      |

WebGL2 uses private renderbuffers and resolves color with a framebuffer blit. It requires four-sample renderbuffer support for each attachment format. WebGPU uses multisampled textures and native color resolve targets. Its explicit texture-sample and render-pass `resolveTargets` API is also available when the application manages the attachments.

Canvas antialiasing is separate. `webgl.antialias` applies to the default drawing buffer. Both backends can present the resolved offscreen color texture in a later canvas pass.

## Depth, Stencil, and Shadows[​](#depth-stencil-and-shadows "Direct link to Depth, Stencil, and Shadows")

Depth is part of antialiasing in two different ways:

* During scene rendering, depth and stencil tests determine which covered samples survive. A multisampled color attachment needs depth/stencil attachments with the same sample count to keep visibility correct at polygon boundaries.
* After scene rendering, many effects sample a depth texture. DOF, SSAO, SSR, outlines, motion blur, and TAA generally expect an ordinary single-sample depth texture. A multisampled depth attachment cannot silently replace that input; the application needs a resolve, per-sample shader access, or a separate single-sample depth path.

The current luma.gl effects use sampleable depth textures for these later passes. For example, [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) accepts application-owned depth bindings for scene-aware effects, while the [Depth of Field example](https://luma.gl/next/examples/showcase/dof) renders a texture-backed depth attachment before sampling it.

Shadow maps are another depth image and have their own aliasing. Increasing shadow-map resolution, filtering comparisons such as PCF, stabilizing cascades, and temporal filtering can reduce shadow-edge shimmer; scene MSAA alone does not fix a low-resolution or unstable shadow map.

## Alpha Cutouts and Transparency[​](#alpha-cutouts-and-transparency "Direct link to Alpha Cutouts and Transparency")

Alpha testing with `discard` creates a hard coverage edge. With multisampling enabled, `sampleAlphaToCoverageEnabled` can convert fragment alpha into a sample coverage mask, which is often useful for foliage, fences, and similar cutouts. It is not a replacement for correct transparency ordering or blending, and it does little without multiple samples.

For analytic shapes such as circles, lines, and signed-distance-field text, shader-computed coverage with a smooth transition can be more precise than postprocessing. Prefer geometry or shader-level coverage when the primitive has a known mathematical boundary.

## Postprocess and Temporal Antialiasing[​](#postprocess-and-temporal-antialiasing "Direct link to Postprocess and Temporal Antialiasing")

FXAA is a single-frame screen-space pass. It is cheap, works after a resolved color image, and helps high-contrast jagged edges, but it can soften details and cannot recover information that was never rasterized.

TAA accumulates samples over time. It is better at subpixel motion and shimmer, but it requires a jittered projection, history buffers, velocity, and depth rejection to avoid ghosting. luma.gl exports [`fxaa`](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) for WebGL and WebGPU shader-pass chains and `taa` for the WebGPU-oriented advanced-effects path. See the [Advanced Effects example](https://luma.gl/next/examples/experimental/advanced-effects) for TAA combined with depth, velocity, SSAO, SSR, and motion blur.

When combining techniques, resolve MSAA before a normal texture-sampling postprocess. Apply FXAA near the end of the color chain. Apply TAA where its history, depth, and velocity represent the same jittered scene.

## Texture Aliasing[​](#texture-aliasing "Direct link to Texture Aliasing")

Texture minification is not fixed by canvas antialiasing or MSAA. Use linear filtering for magnification, generate mipmaps for distant texture sampling, choose trilinear mipmap filtering when transitions between mip levels are visible, and raise anisotropy for oblique surfaces.

See [GPU Textures](https://luma.gl/next/docs/api-guide/gpu/gpu-textures.md#mipmaps) and [`Sampler`](https://luma.gl/next/docs/api-reference/core/resources/sampler.md) for the concrete luma.gl texture and sampler settings.

## Practical Recipes[​](#practical-recipes "Direct link to Practical Recipes")

| Situation                       | Recommended stack                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Simple WebGL canvas scene       | Device pixels + `webgl.antialias` + mipmapped textures.                                                               |
| Portable offscreen effect today | Single-sample render target + appropriate texture filtering + FXAA or carefully chosen supersampling.                 |
| WebGPU scene with explicit MSAA | Matching multisampled color/depth attachments and pipeline sample count, then resolve before ordinary postprocessing. |
| Thin moving geometry            | Stable device-pixel sizing, then TAA or supersampling; FXAA alone may still shimmer.                                  |
| Alpha-cutout foliage            | MSAA + alpha-to-coverage where available, with texture mipmaps and correct blending.                                  |
| Depth-aware postprocessing      | Keep a deliberate sampleable depth path and treat depth discontinuities as effect inputs, not just color edges.       |
| Shadow shimmer                  | Improve shadow-map sampling/resolution/stability; combine with TAA only after the shadow path is stable.              |
