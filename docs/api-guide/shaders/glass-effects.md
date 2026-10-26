# Glass Effects

[Techniques](https://luma.gl/docs/api-guide/shaders/rendering-techniques.md)[Transparency](https://luma.gl/docs/api-guide/shaders/transparency.md)[Glass](https://luma.gl/docs/api-guide/shaders/glass-effects.md)

Glass combines transmission, reflection, absorption, surface roughness, and translucent fragment ordering. The experimental optical materials package these visual behaviors as reusable WGSL and GLSL shader modules, while transparency renderers remain responsible for compositing.

## Optical Building Blocks[​](#optical-building-blocks "Direct link to Optical Building Blocks")

| Effect                     | Implementation                                                                                                             | Visible result                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Fresnel reflection         | IOR-derived, energy-conserving Schlick response shared by reflected and transmitted light.                                 | Sculpted grazing reflections without whitening the glass interior.                             |
| Refraction                 | Projects Snell's refracted ray into camera-aligned screen space and samples an independently captured scene-color texture. | Background links and packets visibly bend and magnify behind polished or frosted glass.        |
| Backface thickness         | Rasterizes sphere backfaces into a normal-and-depth texture and linearizes the front-to-back depth difference.             | Glass centers and silhouettes acquire different optical path lengths.                          |
| Two-surface transmission   | Applies analytic entry and exit refraction while checking opaque scene depth.                                              | Background bends convincingly without distorting geometry in front of the glass.               |
| Studio environment         | Samples a generated equirectangular environment along the reflected viewing direction.                                     | Polished surfaces receive camera-responsive studio reflections.                                |
| Prefiltered environment    | Selects initialized reflection-probe mip levels from surface roughness, including broader internal-bounce lobes.           | Polished clearcoat remains sharp while rough and internal reflections become naturally softer. |
| Chromatic dispersion       | Refracts red and blue rays separately using glTF's `20 / Abbe number` IOR model.                                           | Physically ordered, thickness-dependent spectral separation around refracted features.         |
| Beer-Lambert absorption    | Attenuates transmitted light with material color and thickness.                                                            | Longer optical paths produce darker, more tinted transmission.                                 |
| Spectral volume absorption | Applies independent red, green, and blue extinction over measured shell thickness.                                         | Deep glass acquires wavelength-dependent tint without recoloring thin silhouettes.             |
| Rough transmission         | Filters refracted scene samples over a thickness- and roughness-dependent footprint.                                       | Frosted glass softly blurs background packets while polished switches remain clear.            |
| GGX microfacets            | Shared distribution and visibility helpers filter roughness using screen-space normal derivatives.                         | Stable, camera-responsive highlights without subpixel white sparkle.                           |
| Clearcoat                  | Layers a narrow dielectric microfacet lobe while attenuating the underlying optical response.                              | Crisp outer-shell reflections that preserve the material's energy budget.                      |
| Internal reflection        | Approximates a colored secondary environment bounce inside the shell.                                                      | A softer inner Fresnel band and greater visible depth.                                         |
| Multiple internal bounces  | Reflects the refracted ray against both measured shell surfaces before sampling the studio environment again.              | A second curved highlight suggests the depth of polished solid glass.                          |
| Thin-film interference     | Evaluates nanometer-scale coating thickness across representative red, green, and blue wavelengths.                        | Angle-dependent spectral bands follow grazing highlights without coloring the whole object.    |
| Localized point lights     | Evaluates a bounded array of nearby colored light sources.                                                                 | Moving emissive objects tint adjacent glass and reflective surfaces.                           |
| Optical volume scattering  | Couples nearby colored point lights into the measured glass interior.                                                      | Passing packets briefly illuminate the inside of a switch without washing out the network.     |
| Glass contact shadows      | Compares captured opaque depth against measured front and back glass surfaces.                                             | Adjacent links and server hardware subtly anchor to transparent switch shells.                 |
| Dynamic scene reflections  | Samples captured opaque scene color along a curved screen-space reflection offset.                                         | Moving packets and active links appear as localized reflections on glass switches.             |
| Focused raster caustics    | Projects bounded colored glass-lens contributions onto nearby reflective receivers.                                        | Active switches concentrate moving red and green light onto adjacent links and servers.        |
| Fault-driven distortion    | Modulates refraction and narrow internal filaments only on warm fault-tinted glass.                                        | Congested and failed switches acquire subtle animated optical instability.                     |

[`glassMaterial`](https://luma.gl/docs/api-reference/experimental/glass-material.md) provides the transmissive surface model. [`reflectiveMaterial`](https://luma.gl/docs/api-reference/experimental/reflective-material.md) provides a lower-cost glossy treatment for links and other non-glass surfaces. Both depend on the shared `opticalLighting` shader module.

`emissiveMaterial` provides self-illuminated geometry, `opticalPointLights` supplies portable, bounded local lighting, and `opticalCaustics` approximates focused light cast through nearby glass. Emission makes an object bright; point lighting illuminates nearby surfaces; caustics concentrate light around a focusing lens; bloom spreads the brightest pixels in screen space. These effects can be combined independently.

For moving emitters, `emissiveMaterial_getTrailColor(...)` applies a smooth axial falloff to a velocity-aligned mesh. A tapered cone behind each packet produces directional bloom without blurring stationary glass, links, or neighboring packet colors. Narrow packet-aligned optical wakes can remain inside reflective link geometry, while brief additive arrival flashes and expanding state-transition waves share the same emissive material. Bounded point lights carry these local color changes onto nearby glass without brightening the entire scene. Small, flattened emissive endpoint pulses can mark packet transmission and delivery while reflecting their true conversation color from adjacent metallic server surfaces.

## Attach a Glass Material[​](#attach-a-glass-material "Direct link to Attach a Glass Material")

```
import {Model, ShaderInputs} from '@luma.gl/engine';

import {glassMaterial, glassMaterialPlugin} from '@luma.gl/experimental';



const shaderInputs = new ShaderInputs({glassMaterial});



shaderInputs.setProps({

  glassMaterial: {

    viewportSize: [width, height],

    sceneColorTexture,

    indexOfRefraction: 1.5,

    roughness: 0.14,

    dispersion: 0.33,

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

```
let color = glassMaterial_getColor(

  inputs.normal,

  inputs.worldPosition,

  inputs.color,

  cameraPosition,

  inputs.position

);
```

`inputs.position` must be the fragment's built-in framebuffer position. Keep `viewportSize` in physical pixels and update it whenever the scene-color texture is resized.

`refractionStrength` controls the lens displacement independently of material thickness. The refracted ray is projected into the current camera basis, so links and other background geometry remain correctly distorted as the camera orbits. Transmission coverage is kept high enough that the displaced scene remains visible instead of being overwhelmed by the original background during translucent compositing.

The `dispersion` value follows `KHR_materials_dispersion`: it represents `20 / Abbe number`, not an arbitrary pixel offset. Crown glass is approximately `0.33`; larger values increase the wavelength-dependent index spread. The red channel receives the lowest index of refraction, the green channel retains the authored material index, and the blue channel receives the highest. The volume extension refracts each channel at both the entry and exit surfaces.

## Relationship to Physically Based Materials[​](#relationship-to-physically-based-materials "Direct link to Relationship to Physically Based Materials")

The canonical PBR material additionally covers glTF anisotropy, specular controls, sheen, clearcoat, iridescence, specular transmission, volume absorption, dispersion, diffuse transmission, and experimental directional volume scattering. Use that material when rendering authored glTF assets or evaluating extension-specific textures and parameters.

The optical shader modules are a specialized raster-glass pipeline rather than a second glTF material loader. They intentionally share the canonical PBR model's IOR-derived Fresnel response, reflection/transmission energy partition, clearcoat attenuation, Abbe-number dispersion, and geometric specular antialiasing while adding backface-derived optical thickness, layered screen-space refraction, localized packet reflections, optical wakes, and focused caustics. Dense diffuse transmission is intentionally excluded from clear glass because it would turn the switch interiors cloudy and obscure network traffic.

### Building a Glass Showcase on Canonical PBR[​](#building-a-glass-showcase-on-canonical-pbr "Direct link to Building a Glass Showcase on Canonical PBR")

`createPBRMaterial`, `createPBRModel`, and `SceneRenderer` can provide the physically based foundation for the packet-spraying showcase. The existing PBR fragment shader can be composed with `glassTransmission`, `opticalPointLights`, and an A-buffer or weighted-blended capture helper in the same WGSL or GLSL shader.

| Showcase component         | Canonical PBR behavior                                                                                  | Application-specific extension                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Glass switches             | Dielectric IOR, transmission, thickness, attenuation, dispersion, clearcoat, and thin-film iridescence. | Captured backface normals/depth, two-surface refraction, fault distortion, and transparency capture. |
| Network links and servers  | Metallic/roughness shading, normal response, specular color, and image-based lighting.                  | Packet-driven illumination, focused caustics, and active-link emphasis.                              |
| Packets and control probes | Emissive color and HDR emissive strength.                                                               | Conversation-specific per-instance colors, velocity trails, and bounded local lights.                |
| Environment                | Prefiltered diffuse/specular probes, BRDF integration, exposure, and tone mapping.                      | Showcase-authored studio lighting and selective packet bloom.                                        |

A full migration should first extend the retained scene renderer with per-instance color attributes, optional glass-backface capture, and pluggable A-buffer/weighted-blended translucent passes. Until those orchestration features exist, replacing the showcase's renderer outright would lose visible behavior despite the canonical material shaders already being compatible.

## Add Rasterized Volume Transmission[​](#add-rasterized-volume-transmission "Direct link to Add Rasterized Volume Transmission")

`glassTransmissionPlugin` extends `glassMaterialPlugin` without changing the existing glass helper or adding iterative ray tracing. Render outward-facing sphere backfaces into an RGBA texture whose RGB channels contain the encoded world normal and whose alpha channel contains framebuffer depth. The opaque scene depth must remain available as a sampleable depth texture.

```
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

    environmentMipLevels: environmentTexture.mipLevels,

    environmentPrefilterStrength: 1,

    thicknessStrength: 1,

    roughTransmissionStrength: 0.85,

    spectralAbsorptionStrength: 0.42,

    thinFilmThickness: 420,

    thinFilmStrength: 0.22,

    volumeScatteringStrength: 0.38,

    contactShadowStrength: 0.35,

    dynamicReflectionStrength: 0.38,

    secondaryBounceStrength: 0.55,

    faultDistortionStrength: 0.42,

    time: animationTime

  }

});
```

Call `glassTransmission_getColor(...)`, or install `opticalPointLightsPlugin` and call `glassTransmission_getIlluminatedColor(...)`. These helpers retain the base glass material while adding depth-derived thickness, analytic entry/exit refraction, foreground-depth rejection, total-internal-reflection handling, sampled equirectangular environment reflections, optional screen-space scene reflections, secondary internal bounces, and fault-tinted optical distortion. Optional spectral-volume controls add bounded multisample rough transmission, wavelength-dependent Beer-Lambert absorption, nanometer-scale thin-film interference, and colored in-volume scattering from nearby point lights. A fully initialized environment mip pyramid enables roughness-selected reflection probes and broader internal reflection lobes without repeated per-fragment neighborhood filtering. Optional contact shadows compare the existing opaque depth attachment against the measured front and back glass surfaces; they affect transmitted scene light without clouding unoccupied glass. These additional controls default to zero so existing transmission consumers retain their appearance. All modes remain bounded raster approximations rather than geometry-aware ray tracing.

## Add Focused Raster Caustics[​](#add-focused-raster-caustics "Direct link to Add Focused Raster Caustics")

`opticalCausticsPlugin` installs an independent bounded lens array. Register the module alongside the receiving material, update nearby lens colors from actual scene lights, and add the returned RGB contribution to the receiver's fragment color.

```
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

Both WGSL and GLSL expose `opticalCaustics_getColor(normal, worldPosition, cameraPosition)`. Caustics are receiver-local raster approximations; they do not require ray tracing, additional framebuffers, or installation on unrelated scene geometry.

## Separate Optical Shading From Transparency[​](#separate-optical-shading-from-transparency "Direct link to Separate Optical Shading From Transparency")

A material computes the appearance of one fragment; a transparency strategy decides how many fragments combine at one pixel. Compose `glassMaterialPlugin` with `aBufferPlugin` on supported WebGPU devices, `wboitPlugin` where weighted blending is available, or camera-depth-sorted alpha blending as the fallback.

Render the opaque scene and capture a separate sampleable scene-color texture before shading glass. Do not sample the same WebGPU texture that is currently attached as a render target.

See [Transparency](https://luma.gl/docs/api-guide/shaders/transparency.md) for render ordering, opaque-depth handling, and backend selection.

## Emissive Light, HDR, and Bloom[​](#emissive-light-hdr-and-bloom "Direct link to Emissive Light, HDR, and Bloom")

Render emissive objects into an `rgba16float` scene attachment when the device supports rendering and filtering that format. Preserve the same color format through transparency resolves so packet cores and specular highlights can exceed display brightness until postprocessing.

Use `bloomShaderPassPipeline` after opaque and translucent composition, followed by filmic `toneMapping`. Keep the bloom threshold above ordinary scene brightness to avoid glowing inactive links or the entire glass silhouette. When floating-point scene color is unavailable, fall back to the preferred display format and reduce the extraction threshold.

Floating-point scene rendering and HDR display presentation are distinct capabilities. An `rgba16float` intermediate attachment retains bright, saturated packet emission and narrow glass highlights even when the final canvas is standard dynamic range. Extended HDR presentation also requires a compatible WebGPU canvas, display, and extended tone-mapping configuration. Configure the canvas with `colorFormat: 'rgba16float'`, `colorSpace: 'display-p3'`, and `toneMapping: 'extended'`, then set the filmic pass's `maximumLuminance` above one so its final output does not clamp the extended highlight range. Increase emission, local illumination, and reflective highlights gradually within available scene headroom; raise bloom extraction with them and finish with restrained filmic exposure. Multiplying a packet's existing red or green emission preserves its color without introducing pastel white halos. The packet-spraying showcase exposes a compact HDR-range slider next to its visual-style control; its default deliberately keeps display highlights below twice SDR white, while higher settings can reveal the full extended-range presentation. HDR range and packet-core emission remain independent of visual style, so a minimal diagram can retain extended highlights without enabling refraction, bloom, or secondary glass lighting.

Interactive path highlighting should remain optically subordinate to the material: emphasize the actual links and packet motion instead of filling switches with artificial light, changing their material color, or increasing transmission opacity.

`glassMaterial_getIlluminatedColor(...)` and `reflectiveMaterial_getIlluminatedColor(...)` combine their existing optical response with `opticalPointLights`. Existing `getColor(...)` helpers remain appropriate when no dynamic local lights are needed.

## Current Quality Boundary[​](#current-quality-boundary "Direct link to Current Quality Boundary")

These materials are advanced raster approximations, not a complete physically based transmission system. In particular, the current implementation does not provide:

* Full energy-conserving multiple-scattering or microfacet transmission.
* Authored HDR environment probes, importance-sampled GGX probe convolution, off-screen reflection recovery, or geometry-aware rough transmission beyond the bounded screen-space footprint.
* Physically traced multiple refraction events or caustics; the available focused-light module is an intentionally bounded raster approximation.
* Off-screen background recovery or geometry-aware refracted-ray tracing.

Those capabilities require additional depth, normal, backface, environment, or ray-tracing data and should be introduced as explicitly composable modules or render passes rather than hidden in an individual showcase.

## Research Directions[​](#research-directions "Direct link to Research Directions")

The most relevant next-generation techniques have different requirements and should not be treated as interchangeable:

* [Newton-refined screen-space refraction and caustics](https://jcgt.org/published/0015/01/03/) intersect refracted view or light rays with captured depth using a small bounded number of tangent-plane refinements. This is the strongest near-term extension for browser-friendly glass because it builds on existing depth, backface, and scene-color captures.
* [Adaptive voxel-based order-independent transparency](https://advances.realtimerendering.com/s2025/) improves deep transparent layering beyond ordinary weighted blending. A WebGPU implementation would require explicit visibility storage, memory budgets, and a documented WebGL fallback.
* [OpenPBR material layering](https://academysoftwarefoundation.github.io/OpenPBR/) formalizes energy-preserving coat, dielectric, conductor, thin-film, and participating-volume interfaces. Additional work should align reusable optical modules with these compositional rules instead of stacking unrestricted additive highlights.
* [Bidirectional ReSTIR caustics](https://research.nvidia.com/labs/rtr/publication/hedstrom2025restir/) generate physically based multi-bounce focused light using ray-traced light paths and spatiotemporal reservoirs. Their current hardware and runtime costs place them beyond the cross-backend raster showcase.
* [Spatiotemporal neural transparency](https://arxiv.org/abs/2606.16747) combines adaptive transparent-layer rendering, temporal reprojection, and neural tail reconstruction. It is an interesting research direction, but neural inference and persistent history are substantially more complex than the current exact and weighted OIT modes.

### Licensing and Patent Review[​](#licensing-and-patent-review "Direct link to Licensing and Patent Review")

Research references identify possible directions; they do not authorize copying article text, figures, shader code, or implementations, and they do not establish patent clearance. Before adopting a technique:

* Prefer independently implemented conventional optics and established, ratified glTF material behavior already supported by luma.gl.
* Verify the exact license of every source file, asset, reference implementation, and dependency. Preserve required copyright, license, modification, and attribution notices.
* Prefer well-scoped permissive implementations with explicit contributor patent terms, such as [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0), while recognizing that those terms do not cover unrelated third-party patents.
* Treat research papers, accompanying source archives, and presentation slides as separately licensed. In particular, the Newton-refraction paper is distributed under CC BY-ND 4.0, so its publication is not permission to incorporate its text, figures, or source code into luma.gl.
* Do not assume that a published specification grants rights to every possible implementation. Review the [Khronos File Format Adopter Program](https://www.khronos.org/conformance/adopters/file-format-adopter-program) and applicable reciprocal patent terms separately when adopting ratified glTF behavior.
* Keep novel techniques with unclear provenance or possible patent exposure experimental until project maintainers and, when appropriate, qualified legal counsel complete review.

For a complete application, see [Effects: Glass - Network Packet Spraying](https://luma.gl/examples/showcase/packet-spraying), which combines glass switches, reflective network links, exact or approximate transparency, and interactive camera controls.
