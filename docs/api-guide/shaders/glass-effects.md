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
| Spectral volume absorption | Applies independent red, green, and blue extinction over measured shell thickness. | Deep glass acquires wavelength-dependent tint without recoloring thin silhouettes. |
| Rough transmission | Filters refracted scene samples over a thickness- and roughness-dependent footprint. | Frosted glass softly blurs background packets while polished switches remain clear. |
| GGX microfacets | Shared distribution and visibility helpers shade key and fill lights. | Roughness-dependent, camera-responsive polished highlights. |
| Clearcoat | Adds a second narrow microfacet lobe above the base surface. | Crisp, bright reflections that make the outer shell readable. |
| Internal reflection | Approximates a colored secondary environment bounce inside the shell. | A softer inner Fresnel band and greater visible depth. |
| Multiple internal bounces | Reflects the refracted ray against both measured shell surfaces before sampling the studio environment again. | A second curved highlight suggests the depth of polished solid glass. |
| Thin-film interference | Evaluates nanometer-scale coating thickness across representative red, green, and blue wavelengths. | Angle-dependent spectral bands follow grazing highlights without coloring the whole object. |
| Localized point lights | Evaluates a bounded array of nearby colored light sources. | Moving emissive objects tint adjacent glass and reflective surfaces. |
| Optical volume scattering | Couples nearby colored point lights into the measured glass interior. | Passing packets briefly illuminate the inside of a switch without washing out the network. |
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
    roughTransmissionStrength: 0.85,
    spectralAbsorptionStrength: 0.42,
    thinFilmThickness: 420,
    thinFilmStrength: 0.22,
    volumeScatteringStrength: 0.38,
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
Optional spectral-volume controls add bounded multisample rough transmission, wavelength-dependent
Beer-Lambert absorption, nanometer-scale thin-film interference, and colored in-volume scattering
from nearby point lights. These additional controls default to zero so existing transmission
consumers retain their appearance. Rough transmission requires four additional chromatic scene
samples and two additional environment samples; it remains a bounded raster approximation rather
than geometry-aware ray tracing.

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

Floating-point scene rendering and HDR display presentation are distinct capabilities. An
`rgba16float` intermediate attachment retains bright, saturated packet emission and narrow glass
highlights even when the final canvas is standard dynamic range. Extended HDR presentation also
requires a compatible WebGPU canvas, display, and extended tone-mapping configuration. Configure
the canvas with `colorFormat: 'rgba16float'`, `colorSpace: 'display-p3'`, and
`toneMapping: 'extended'`, then set the filmic pass's `maximumLuminance` above one so its final
output does not clamp the extended highlight range. Increase emission, local illumination, and
reflective highlights gradually within available scene headroom;
raise bloom extraction with them and finish with restrained filmic exposure. Multiplying a packet's
existing red or green emission preserves its color without introducing pastel white halos.
The packet-spraying showcase exposes a compact HDR-range slider next to its visual-style control;
its default deliberately keeps display highlights below twice SDR white, while higher settings can
reveal the full extended-range presentation. HDR range and packet-core emission remain independent
of visual style, so a minimal diagram can retain extended highlights without enabling refraction,
bloom, or secondary glass lighting.

Interactive path highlighting should remain optically subordinate to the material: emphasize the
actual links and packet motion instead of filling switches with artificial light, changing their
material color, or increasing transmission opacity.

`glassMaterial_getIlluminatedColor(...)` and `reflectiveMaterial_getIlluminatedColor(...)` combine
their existing optical response with `opticalPointLights`. Existing `getColor(...)` helpers remain
appropriate when no dynamic local lights are needed.

## Current Quality Boundary

These materials are advanced raster approximations, not a complete physically based transmission
system. In particular, the current implementation does not provide:

- Full energy-conserving multiple-scattering or microfacet transmission.
- Prefiltered environment probes, off-screen reflection recovery, or geometry-aware rough
  transmission beyond the bounded screen-space footprint.
- Physically traced multiple refraction events or caustics; the available focused-light module is
  an intentionally bounded raster approximation.
- Off-screen background recovery or geometry-aware refracted-ray tracing.

Those capabilities require additional depth, normal, backface, environment, or ray-tracing data
and should be introduced as explicitly composable modules or render passes rather than hidden in
an individual showcase.

## Optical Roadmap

### Available Now: Portable Raster Optics

- Camera-responsive Fresnel, GGX microfacet highlights, clearcoat, chromatic dispersion, and
  analytic entry/exit refraction work across WebGL and WebGPU.
- Backface-derived thickness, foreground rejection, wavelength-dependent volume absorption,
  thickness-aware rough transmission, and nanometer-scale thin-film interference give glass
  measurable optical depth without per-pixel ray tracing.
- Bounded colored point lights, in-volume scattering, screen-space scene reflections, secondary
  environment bounces, and focused raster caustics connect moving emitters to nearby glass.
- Linked switch-plane telemetry gradually emphasizes all eight switches across both tiers of each
  physical plane, while four independently inspectable backbone paths reveal both conversations'
  complete server-to-server routes with smoothly isolated switches, links, and packet wakes.
- A single guided-story visual-style control progressively introduces surface highlights,
  refraction, packet lighting, motion accents, spectral glass, caustics, and bloom while keeping
  advanced material settings independently adjustable.
- A duration-weighted, directly navigable chapter timeline ties cinematic camera transitions to
  congestion, packet loss, rerouting, and probe-confirmed path recovery. Colored event markers
  choreograph path isolation, compact upstream packet queues, loss scattering, and the complete
  outbound-probe / returning-confirmation handshake without enlarging the storytelling panel.
- Exact A-buffer transparency, weighted-blended transparency, and depth-sorted alpha blending
  preserve the strongest supported compositing strategy on each backend.

### Next: Richer Raster Light Transport

- Add temporally accumulated rough transmission and history rejection to reduce multisample cost
  while preserving animated packet detail.
- Introduce filtered environment probes and roughness-selected reflection levels with explicit
  capability-aware fallbacks.
- Improve geometry-aware screen-space reflections and thickness-guided indirect packet lighting
  without reading from active render attachments.
- Add adaptive local scattering and neighborhood-aware translucent contact shadows while keeping
  light counts bounded and diagrams legible.

### Future: Opt-In Physically Traced Effects

- Investigate energy-conserving microfacet transmission, multiple internal scattering events, and
  ray-traced refraction only behind explicit backend and performance capability checks.
- Treat physically traced caustics, off-screen background recovery, and hardware-ray-tracing
  integration as separately composable render passes rather than hidden showcase requirements.

For a complete application, see
[Effects: Glass - Network Packet Spraying](/examples/showcase/packet-spraying), which combines glass switches,
reflective network links, exact or approximate transparency, and interactive camera controls.
