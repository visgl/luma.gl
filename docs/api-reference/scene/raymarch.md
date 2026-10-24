# Structured volume ray marching

`StructuredVolumeRenderer` renders regularly sampled scalar and vector volumes. Import it from the focused scene renderer entry point:

```
import {StructuredVolumeRenderer} from '@luma.gl/scene/raymarch';
```

The API is experimental and currently requires WebGPU. The scene entry point is a stable facade; the implementation remains in `@luma.gl/experimental` while the scene renderer taxonomy evolves.

## Sources[​](#sources "Direct link to Sources")

All configured channels share construction-time `dimensions` and local `bounds`. Scalar channels use `float32` storage buffers or `r16float`/`r32float` 3D textures. Vector channels use WGSL-aligned `float32x4` storage rows or `rgba16float`/`rgba32float` 3D textures; xyz contains the vector and w is padding. Buffer offsets must be aligned to four bytes for scalars and 16 bytes for vectors.

```
const renderer = new StructuredVolumeRenderer(device, {

  dimensions: [40, 40, 40],

  bounds: {minimum: [-1, -1, -1], maximum: [1, 1, 1]},

  scalar: {type: 'buffer', format: 'float32', buffer: scalarBuffer},

  vector: {type: 'buffer', format: 'float32x4', buffer: vectorBuffer}

});
```

Compatible resources can be rebound with `setSources()`. Dimensions, backing type, and channel format are renderer invariants, so changing any of them requires a new renderer. Buffer and texture variants both use explicit eight-corner trilinear interpolation for matching sampling behavior.

## Rendering[​](#rendering "Direct link to Rendering")

`scalar`, `vector`, and `hybrid` modes combine typed transfer styles with optional solid 3D arrow glyphs. Scalar transfer functions can be sequential or signed negative/neutral/positive maps. Vectors can use direction colors or a constant color. Value, magnitude, density, and opacity scales are independent controls.

The caller owns command encoding, the render pass, and submission:

```
renderer.prepare(device.commandEncoder, {

  mode: 'hybrid',

  inverseViewProjectionMatrix,

  cameraPosition,

  viewport: [0, 0, width, height],

  sampleCount: 72,

  scalarStyle: {transferFunction: 'signed', valueScale: 0.5, densityScale: 0.2},

  vectorStyle: {colorMode: 'direction', magnitudeScale: 1, densityScale: 0.15},

  glyphs: {

    enabled: true,

    gridDimensions: [6, 6, 6],

    lengthRange: [0.05, 0.2],

    shaftRadius: 0.008,

    headRadius: 0.025

  }

});



const renderPass = device.beginRenderPass({framebuffer});

renderer.draw(renderPass);

renderPass.end();

device.submit();
```

`prepare()` updates uniforms and bindings but never submits. `draw()` applies the configured viewport and scissor before recording a premultiplied-transparent draw. Multiple renderers can therefore share one encoder and pass for linked views.

## Coordinates and compositing[​](#coordinates-and-compositing "Direct link to Coordinates and compositing")

The inverse view-projection matrix defines world-space camera rays. A model matrix places the local volume in the world; the shader transforms each ray into volume space before intersecting local bounds. Fixed, optionally jittered samples composite front-to-back and stop once opacity is nearly saturated. Bounds rendering is optional.

Sample count, volume resolution, transfer density, and glyph-grid dimensions are the primary performance controls. The renderer does not yet depth-integrate with opaque scene geometry, skip empty regions adaptively, or light the volume. Higher-order reconstruction, arbitrary caller WGSL, ANARI `SpatialField`/`Volume` objects, and adaptive ray marching are follow-ups.

## Support detection[​](#support-detection "Direct link to Support detection")

Use `getStructuredVolumeSupport(device)` before construction when an application can run on WebGL 2. It reports WebGPU support without allocating resources.
