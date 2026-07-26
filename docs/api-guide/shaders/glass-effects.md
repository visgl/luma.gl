import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Glass Effects

<ShaderLevelDocsTabs active="glass-effects" />

Glass combines transmission, reflection, absorption, surface roughness, and translucent fragment
ordering. The experimental optical materials package these visual behaviors as reusable WGSL and
GLSL shader modules, while transparency renderers remain responsible for compositing.

## Optical Building Blocks

| Effect | Implementation | Visible result |
| --- | --- | --- |
| Fresnel reflection | Schlick-style view-angle approximation. | Stronger reflections around silhouettes. |
| Refraction | Samples an independently captured scene-color texture. | Background and packets bend behind the glass surface. |
| Chromatic dispersion | Offsets red, green, and blue scene-color samples. | Subtle colored separation around refracted features. |
| Beer-Lambert absorption | Attenuates transmitted light with material color and thickness. | Longer optical paths produce darker, more tinted transmission. |
| Glossy highlights | Roughness-dependent key and fill light highlights. | Adjustable apparent surface polish. |
| Localized point lights | Evaluates a bounded array of nearby colored light sources. | Moving emissive objects tint adjacent glass and reflective surfaces. |

[`glassMaterial`](/docs/api-reference/experimental/glass-material) provides the transmissive
surface model. [`reflectiveMaterial`](/docs/api-reference/experimental/reflective-material)
provides a lower-cost glossy treatment for links and other non-glass surfaces. Both depend on the
shared `opticalLighting` shader module.

`emissiveMaterial` provides self-illuminated geometry, while `opticalPointLights` supplies
portable, bounded local lighting. Emission makes an object bright; point lighting makes it
illuminate nearby surfaces; bloom spreads the brightest pixels in screen space. These effects can
be combined independently.

## Attach a Glass Material

```ts
import {Model, ShaderInputs} from '@luma.gl/engine';
import {glassMaterial, glassMaterialPlugin} from '@luma.gl/experimental';

const shaderInputs = new ShaderInputs({glassMaterial});

shaderInputs.setProps({
  glassMaterial: {
    viewportSize: [width, height],
    sceneColorTexture,
    indexOfRefraction: 1.5,
    roughness: 0.14,
    dispersion: 0.022,
    thickness: 1.05,
    reflectionStrength: 1
  }
});

const model = new Model(device, {
  source: glassShader,
  plugins: [glassMaterialPlugin],
  shaderInputs,
  geometry
});
```

Call the installed shader helper from the fragment entry point:

```wgsl
let color = glassMaterial_getColor(
  inputs.normal,
  inputs.worldPosition,
  inputs.color,
  cameraPosition,
  inputs.position
);
```

`inputs.position` must be the fragment's built-in framebuffer position. Keep `viewportSize` in
physical pixels and update it whenever the scene-color texture is resized.

## Separate Optical Shading From Transparency

A material computes the appearance of one fragment; a transparency strategy decides how many
fragments combine at one pixel. Compose `glassMaterialPlugin` with `aBufferPlugin` on supported
WebGPU devices, `wboitPlugin` where weighted blending is available, or camera-depth-sorted alpha
blending as the fallback.

Render the opaque scene and capture a separate sampleable scene-color texture before shading
glass. Do not sample the same WebGPU texture that is currently attached as a render target.

See [Transparency](/docs/api-guide/shaders/transparency) for render ordering, opaque-depth
handling, and backend selection.

## Emissive Light, HDR, and Bloom

Render emissive objects into an `rgba16float` scene attachment when the device supports rendering
and filtering that format. Preserve the same color format through transparency resolves so packet
cores and specular highlights can exceed display brightness until postprocessing.

Use `bloomShaderPassPipeline` after opaque and translucent composition, followed by filmic
`toneMapping`. Keep the bloom threshold above ordinary scene brightness to avoid glowing inactive
links or the entire glass silhouette. When floating-point scene color is unavailable, fall back to
the preferred display format and reduce the extraction threshold.

`glassMaterial_getIlluminatedColor(...)` and `reflectiveMaterial_getIlluminatedColor(...)` combine
their existing optical response with `opticalPointLights`. Existing `getColor(...)` helpers remain
appropriate when no dynamic local lights are needed.

## Current Quality Boundary

These materials are advanced raster approximations, not a complete physically based transmission
system. In particular, the current implementation does not provide:

- Depth-derived or backface-derived per-pixel thickness.
- GGX or other energy-conserving microfacet reflection and transmission.
- Roughness-dependent blurred transmission or filtered environment probes.
- Multiple refraction events, internal reflections, total internal reflection, or caustics.
- Off-screen background recovery or geometry-aware refracted-ray tracing.

Those capabilities require additional depth, normal, backface, environment, or ray-tracing data
and should be introduced as explicitly composable modules or render passes rather than hidden in
an individual showcase.

For a complete application, see
[Effects: Glass - Network Packet Spraying](/examples/showcase/packet-spraying), which combines glass switches,
reflective network links, exact or approximate transparency, and interactive camera controls.
