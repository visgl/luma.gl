# SpectralCausticsRenderer

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`SpectralCausticsRenderer` is an experimental WebGPU-only photon-caustics renderer. It captures the front and back surfaces of one closed convex refractor from a light view, traces six wavelength bands through those surfaces, and additively splats the resulting energy into an HDR D65 XYZ texture. The companion `spectralCaustics` shader module samples that map on one planar receiver and converts XYZ to linear sRGB at the receiver shading boundary.

The result is a reusable receiver-lighting contribution, not a replacement scene renderer. Add it to the receiver's ordinary direct, indirect, and emissive lighting, then keep the combined scene in an HDR target until bloom and tone mapping.

### Spectral Caustics: Prism Cathedral

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/spectral-caustics)Info

InfoSource

A rotating convex crystal is captured from the light, then **six CIE/D65 wavelength bands** refract through its real front and back surfaces into an HDR XYZ caustic map.

**Drag** to orbit · **Wheel** to zoom · **Space** for cinematic orbit · **R** to reset

WebGPU computeGeometry tracedHDR bloom

```
// Loading source…
```

## Usage[​](#usage "Direct link to Usage")

```
import {Model, ShaderInputs} from '@luma.gl/engine';

import {SpectralCausticsRenderer, spectralCaustics} from '@luma.gl/experimental';



const causticsRenderer = new SpectralCausticsRenderer(device, {

  captureSize: 128,

  mapSize: 512,

  splatRadius: 2

});



const receiverShaderInputs = new ShaderInputs({spectralCaustics});

const receiverModel = new Model(device, {

  source: receiverShader,

  modules: [spectralCaustics],

  shaderInputs: receiverShaderInputs,

  geometry: receiverGeometry

});



const commandEncoder = device.createCommandEncoder({id: 'spectral-caustics-frame'});

const causticsProps = causticsRenderer.encode(commandEncoder, {

  lightViewProjectionMatrix,

  inverseLightViewProjectionMatrix,

  receiverOrigin: [0, 0, 0],

  receiverTangent: [1, 0, 0],

  receiverBitangent: [0, 0, 1],

  receiverNormal: [0, 1, 0],

  receiverWidth: 12,

  receiverHeight: 12,

  refractiveIndex: 1.52,

  dispersion: 0.025,

  absorption: [0.02, 0.008, 0.003],

  intensity: 5,

  prepareRefractor: ({commandEncoder, captureParameters, lightViewProjectionMatrix}) => {

    refractorCaptureModel.shaderInputs.setProps({

      capture: {lightViewProjectionMatrix}

    });

    refractorCaptureModel.setParameters({

      ...refractorCaptureModel.parameters,

      ...captureParameters

    });

    refractorCaptureModel.predraw(commandEncoder);

  },

  drawRefractor: ({renderPass}) => refractorCaptureModel.draw(renderPass)

});



receiverShaderInputs.setProps({spectralCaustics: causticsProps});

receiverModel.predraw(commandEncoder);

const receiverPass = commandEncoder.beginRenderPass({framebuffer: sceneFramebuffer});

receiverModel.draw(receiverPass);

receiverPass.end();



device.submit(commandEncoder.finish());
```

The receiver fragment shader adds the traced result in linear HDR space:

```
let causticColor = spectralCaustics_getLinearSRGB(inputs.worldPosition);

return vec4f(baseLighting + causticColor, 1.0);
```

Use `spectralCaustics_getXYZ(worldPosition)` instead when the application performs its own working-space conversion. The built-in XYZ-to-linear-sRGB conversion clamps only negative final channels; values above `1.0` remain HDR.

## Refractor capture contract[​](#refractor-capture-contract "Direct link to Refractor capture contract")

`encode()` opens two application-populated render passes. The front pass uses back-face culling, `less` depth comparison, and a depth clear of `1`; the back pass uses front-face culling, `greater` depth comparison, and a depth clear of `0`.

The application must:

1. Draw the same closed, convex refractor in both callbacks.
2. Configure the capture model for an `rgba16float` color attachment and `depth32float` depth attachment, matching the renderer-owned capture framebuffers.
3. Apply every supplied `captureParameters` value to the capture model. These values select the required culling and depth behavior for the current `face`.
4. Update the capture shader with the supplied `lightViewProjectionMatrix` and call `Model.predraw(commandEncoder)` in `prepareRefractor`, before the renderer opens the pass.
5. Call `Model.draw(renderPass)` in `drawRefractor` without ending the application-owned pass.
6. Write encoded world-space normals to the first color attachment:

```
@fragment fn fragmentMain(input: FragmentInput) -> @location(0) vec4f {

  let encodedWorldNormal = normalize(input.worldNormal) * 0.5 + vec3f(0.5);

  return vec4f(encodedWorldNormal, 1.0);

}
```

The supplied light projection must use WebGPU's normalized clip-depth range of `0..1`. Projection helpers that produce the OpenGL `-1..1` depth convention need a depth-range conversion before they are multiplied by the light view matrix; otherwise the surface capture may be clipped or reconstruct incorrect world positions. Pass the exact inverse of that converted view-projection matrix as `inverseLightViewProjectionMatrix`.

Both callbacks receive `face`, `captureSize`, `lightViewProjectionMatrix`, and `captureParameters`. `prepareRefractor` additionally receives the command encoder; `drawRefractor` receives the active render pass.

## Rendering model[​](#rendering-model "Direct link to Rendering model")

One `encode()` call records this sequence:

1. Rasterize light-space front normals and nearest depth.
2. Rasterize light-space back normals and farthest depth.
3. Run a WebGPU compute pass that refracts six CIE/D65-weighted wavelength bands through the paired surfaces and intersects their outgoing rays with the receiver plane.
4. Rasterize the GPU-generated photon records as additive Gaussian splats into a filterable `rgba16float` XYZ map.

Additive XYZ accumulation stays non-negative while spectral bands overlap. Conversion to signed linear RGB happens once, when the receiver samples the completed map.

`encode()` records onto the supplied `CommandEncoder` and never submits it. This lets the application place caustics before receiver shading and within the same frame command buffer. The application owns final submission; record passes that sample `causticMap` after `encode()` in the same encoder, or submit the caustics work before recording a later sampling frame.

## Constructor[​](#constructor "Direct link to Constructor")

```
new SpectralCausticsRenderer(device, props?)
```

| Prop          | Default               | Meaning                                                |
| ------------- | --------------------- | ------------------------------------------------------ |
| `id`          | `'spectral-caustics'` | Prefix for owned GPU resource labels.                  |
| `captureSize` | `128`                 | Width and height of both light-space surface captures. |
| `mapSize`     | `512`                 | Width and height of the planar HDR XYZ map.            |
| `splatRadius` | `2`                   | Gaussian photon footprint radius in map pixels.        |

Increasing `captureSize` raises both tracing detail and photon-buffer cost. The renderer stores six 32-byte photon records per capture texel, in addition to the capture textures and caustic map.

## `encode(commandEncoder, options): SpectralCausticsProps`[​](#encodecommandencoder-options-spectralcausticsprops "Direct link to encodecommandencoder-options-spectralcausticsprops")

| Option                                 | Default     | Meaning                                                                 |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `lightViewProjectionMatrix`            | required    | Light clip-from-world transform using WebGPU's `0..1` clip-depth range. |
| `inverseLightViewProjectionMatrix`     | required    | Exact inverse used to reconstruct light rays and captured positions.    |
| `receiverOrigin`                       | required    | World-space center of the planar map.                                   |
| `receiverTangent`, `receiverBitangent` | required    | Orthogonal unit axes mapped to texture U and V.                         |
| `receiverNormal`                       | required    | Unit normal used for ray-plane intersection.                            |
| `receiverWidth`, `receiverHeight`      | required    | Positive world-space receiver spans.                                    |
| `refractiveIndex`                      | `1.5`       | Refractive index at 550nm; must be greater than one.                    |
| `dispersion`                           | `0.02`      | Non-negative Cauchy-style visible-spectrum dispersion strength.         |
| `absorption`                           | `[0, 0, 0]` | Non-negative RGB Beer-Lambert coefficients per world-space unit.        |
| `intensity`                            | `1`         | Non-negative HDR radiance multiplier.                                   |
| `prepareRefractor`                     | optional    | Updates and prepares capture models before each pass opens.             |
| `drawRefractor`                        | required    | Draws the refractor into each active capture pass.                      |

The returned `SpectralCausticsProps` contains the owned `causticMap` plus receiver mapping values and can be passed directly to `ShaderInputs.setProps({spectralCaustics: props})`.

## Support and limits[​](#support-and-limits "Direct link to Support and limits")

`getSpectralCausticsSupport(device)` reports support before construction. The current implementation requires WebGPU plus renderable, blendable, and filterable `rgba16float` textures and `depth32float` capture textures.

The trace deliberately has a narrow, predictable domain:

* one light-space view, one closed convex refractor, and one planar receiver per `encode()` call;
* paired front/back surface captures rather than general scene ray tracing;
* bounded 16-step screen-space exit search, so concave, open, nested, or strongly self-occluding refractors are unsupported;
* no automatic scene traversal, receiver draw, command submission, bloom, or tone mapping.

Create multiple renderer instances or encode separate results when a scene needs independent refractors or receiver planes.

## Properties and lifecycle[​](#properties-and-lifecycle "Direct link to Properties and lifecycle")

* `causticMap` exposes the owned filterable `rgba16float` XYZ texture.
* `destroy()` is idempotent and releases all owned textures, framebuffers, buffers, and pipelines.
* Accessing `causticMap` or calling `encode()` after destruction throws.
