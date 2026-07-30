import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Glass Effects

<ShaderLevelDocsTabs active="glass-effects" />

Glass combines transmission, reflection, absorption, surface roughness, and translucent fragment
ordering. The experimental optical materials package these visual behaviors as reusable WGSL and
GLSL shader modules, while transparency renderers remain responsible for compositing.

## Optical Building Blocks

| Effect | Implementation | Visible result |
| --- | --- | --- |
| Fresnel reflection | Adjustable Schlick-style grazing-angle response. | Sculpted, luminous reflections around silhouettes. |
| Refraction | Projects Snell's refracted ray into camera-aligned screen space and samples an independently captured scene-color texture. | Background links and packets visibly bend and magnify behind polished or frosted glass. |
| Backface thickness | Rasterizes sphere backfaces into a normal-and-depth texture and linearizes the front-to-back depth difference. | Glass centers and silhouettes acquire different optical path lengths. |
| Two-surface transmission | Applies analytic entry and exit refraction while checking opaque scene depth. | Background bends convincingly without distorting geometry in front of the glass. |
| Studio environment | Samples a generated equirectangular environment along the reflected viewing direction. | Polished surfaces receive camera-responsive studio reflections. |
| Chromatic dispersion | Offsets red, green, and blue scene-color samples. | Subtle colored separation around refracted features. |
| Beer-Lambert absorption | Attenuates transmitted light with material color and thickness. | Longer optical paths produce darker, more tinted transmission. |
| GGX microfacets | Shared distribution and visibility helpers shade key and fill lights. | Roughness-dependent, camera-responsive polished highlights. |
| Clearcoat | Adds a second narrow microfacet lobe above the base surface. | Crisp, bright reflections that make the outer shell readable. |
| Internal reflection | Approximates a colored secondary environment bounce inside the shell. | A softer inner Fresnel band and greater visible depth. |
| Multiple internal bounces | Reflects the refracted ray against both measured shell surfaces before sampling the studio environment again. | A second curved highlight suggests the depth of polished solid glass. |
| Thin-film interference | Applies restrained wavelength-dependent color near grazing angles. | Subtle spectral variation without coloring the whole object. |
| Localized point lights | Evaluates a bounded array of nearby colored light sources. | Moving emissive objects tint adjacent glass and reflective surfaces. |
| Dynamic scene reflections | Samples captured opaque scene color along a curved screen-space reflection offset. | Moving packets and active links appear as localized reflections on glass switches. |
| Focused raster caustics | Projects bounded colored glass-lens contributions onto nearby reflective receivers. | Active switches concentrate moving red and green light onto adjacent links and servers. |
| Fault-driven distortion | Modulates refraction and narrow internal filaments only on warm fault-tinted glass. | Congested and failed switches acquire subtle animated optical instability. |

[`glassMaterial`](/docs/api-reference/experimental/glass-material) provides the transmissive
surface model. [`reflectiveMaterial`](/docs/api-reference/experimental/reflective-material)
provides a lower-cost glossy treatment for links and other non-glass surfaces. Both depend on the
shared `opticalLighting` shader module.

`emissiveMaterial` provides self-illuminated geometry, `opticalPointLights` supplies portable,
bounded local lighting, and `opticalCaustics` approximates focused light cast through nearby glass.
Emission makes an object bright; point lighting illuminates nearby surfaces; caustics concentrate
light around a focusing lens; bloom spreads the brightest pixels in screen space. These effects
can be combined independently.

For moving emitters, `emissiveMaterial_getTrailColor(...)` applies a smooth axial falloff to a
velocity-aligned mesh. A tapered cone behind each packet produces directional bloom without
blurring stationary glass, links, or neighboring packet colors. Narrow packet-aligned optical wakes
can remain inside reflective link geometry, while brief additive arrival flashes and expanding
state-transition waves share the same emissive material. Bounded point lights carry these local
color changes onto nearby glass without brightening the entire scene. Small, flattened emissive
endpoint pulses can mark packet transmission and delivery while reflecting their true conversation
color from adjacent metallic server surfaces.

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
    refractionStrength: 1,
    reflectionStrength: 1,
    fresnelStrength: 1.2,
    clearcoatStrength: 0.8,
    iridescenceStrength: 0.12,
    internalReflectionStrength: 0.5,
    transmissionStrength: 1
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

`refractionStrength` controls the lens displacement independently of material thickness. The
refracted ray is projected into the current camera basis, so links and other background geometry
remain correctly distorted as the camera orbits. Transmission coverage is kept high enough that
the displaced scene remains visible instead of being overwhelmed by the original background during
translucent compositing.

## Add Rasterized Volume Transmission

`glassTransmissionPlugin` extends `glassMaterialPlugin` without changing the existing glass helper
or adding iterative ray tracing. Render outward-facing sphere backfaces into an RGBA texture whose
RGB channels contain the encoded world normal and whose alpha channel contains framebuffer depth.
The opaque scene depth must remain available as a sampleable depth texture.

```ts
import {glassTransmission, glassTransmissionPlugin} from '@luma.gl/experimental';

const shaderInputs = new ShaderInputs({glassMaterial, glassTransmission});

shaderInputs.setProps({
  glassTransmission: {
    viewportSize: [width, height],
    depthRange: [0.1, 60],
    sceneDepthTexture,
    backfaceTexture,
    environmentTexture,
    environmentIntensity: 1.25,
    thicknessStrength: 1,
    dynamicReflectionStrength: 0.38,
    secondaryBounceStrength: 0.55,
    faultDistortionStrength: 0.42,
    time: animationTime
  }
});
```

Call `glassTransmission_getColor(...)`, or install `opticalPointLightsPlugin` and call
`glassTransmission_getIlluminatedColor(...)`. These helpers retain the base glass material while
adding depth-derived thickness, analytic entry/exit refraction, foreground-depth rejection,
total-internal-reflection handling, sampled equirectangular environment reflections, optional
screen-space scene reflections, secondary internal bounces, and fault-tinted optical distortion.
The additional controls default to zero so existing transmission consumers retain their appearance.

## Add Focused Raster Caustics

`opticalCausticsPlugin` installs an independent bounded lens array. Register the module alongside
the receiving material, update nearby lens colors from actual scene lights, and add the returned
RGB contribution to the receiver's fragment color.

```ts
import {
  MAX_OPTICAL_CAUSTIC_LENSES,
  opticalCaustics,
  opticalCausticsPlugin
} from '@luma.gl/experimental';

const shaderInputs = new ShaderInputs({reflectiveMaterial, opticalCaustics});

shaderInputs.setProps({
  opticalCaustics: {
    intensity: 0.48,
    focus: 1.15,
    lenses: nearbyGlassLenses.slice(0, MAX_OPTICAL_CAUSTIC_LENSES)
  }
});
```

Both WGSL and GLSL expose `opticalCaustics_getColor(normal, worldPosition, cameraPosition)`.
Caustics are receiver-local raster approximations; they do not require ray tracing, additional
framebuffers, or installation on unrelated scene geometry.

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

- Full energy-conserving multiple-scattering or microfacet transmission.
- Filtered environment probes and geometry-aware rough transmission.
- Physically traced multiple refraction events or caustics; the available focused-light module is
  an intentionally bounded raster approximation.
- Off-screen background recovery or geometry-aware refracted-ray tracing.

Those capabilities require additional depth, normal, backface, environment, or ray-tracing data
and should be introduced as explicitly composable modules or render passes rather than hidden in
an individual showcase.

For a complete application, see
[Effects: Glass - Network Packet Spraying](/examples/showcase/packet-spraying), which combines glass switches,
reflective network links, exact or approximate transparency, and interactive camera controls.
