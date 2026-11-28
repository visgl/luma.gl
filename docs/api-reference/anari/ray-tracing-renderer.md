# Ray-tracing renderer

This page describes the `raytrace` renderer selected by an `ANARIFrame`.
See [cameras, renderers, and frames](/docs/api-reference/anari/anari-rendering)
for shared parameters and frame lifecycle.

```ts
const renderer = anariDevice.newRenderer('raytrace', {
  background: [0.012, 0.016, 0.04, 1],
  samplesPerPixel: 1,
  maxBounces: 1,
  progressive: true,
  shadows: true,
  resolutionScale: 0.5,
  minimumResolutionScale: 0.25,
  adaptiveResolution: true,
  targetFrameTimeMilliseconds: 33.3,
  temporalReprojection: true,
  shadowSamplesPerFrame: 1
});

frame.setParameter('renderer', renderer).commitParameters();
```

`raytrace` requires WebGPU. The ANARI adapter translates committed scene objects into descriptors
for the shared `RayTracingSceneRenderer` in `@luma.gl/anari`. Its GPU compute graph derives
world-space object bounds, Morton-sorts active object/instance leaves into an explicit retained
permutation, builds and refits a graph-owned complete-binary TLAS, and traverses that hierarchy for
nearest-hit rays and early-exit hard shadows. Transform-only animation gathers updated bounds
through the retained permutation and refits without sorting; topology changes and periodic spatial
refreshes rebuild the Morton order. A topology-only graph Morton-sorts each mesh's triangles into
GPU-built BLASes, which transform-only updates reuse. It traces transformed analytic spheres and
triangle meshes, including tessellated quads, cylinders, and cones; evaluates ambient, directional,
point, and spot lights; and presents the result through a fullscreen pass. An `rgba16float` canvas
or caller-owned framebuffer preserves HDR radiance; ordinary targets use the same configurable
tone-mapping and exact sRGB transfer as forward rendering. Scalar metallic-roughness materials use
GGX distribution, Smith visibility, Schlick Fresnel, and energy-balanced diffuse lighting. The
trace pass uses exactly eight storage buffers, and every TLAS or BLAS construction pass remains
within the default WebGPU CORE limit of eight storage buffers.

The default half-resolution internal target traces one quarter as many pixels as the output canvas.
When adaptive quality is enabled, the renderer can reduce scale to `0.25`, spread interleaved pixel
coverage across frames, and rotate one shadowed direct light per frame. It approaches the configured
frame budget using smoothed animation-frame intervals; no GPU timestamp feature is required. The
fullscreen presentation pass upsamples the internal HDR result.

Progressive history is reprojected through previous camera matrices and stable ANARI instance/group/
surface identities. Depth and normal validation plus bounded neighborhood color clamping reject
incompatible history; camera cuts, changed topology/materials, changed light counts, and target
resizing invalidate it. GPU acceleration updates are encoded only for changed geometry or transforms,
while camera-only and lighting-only frames reuse the retained TLAS. Transform-only frames use the
retained-permutation gather/refit graph; topology changes and periodic refreshes use the full Morton
build graph.

Set `separateLobeHistories: true` with `transportMode: 'pbr'` to accumulate diffuse
and view-dependent radiance independently. Each path contribution is separated
at the first interaction. Specular reflection, sheen, clearcoat, and dielectric
transport use the specular history. Diffuse transport, primary emission, and the
background use the diffuse history. During camera or rigid instance motion, specular history starts fresh while
diffuse history still uses identity, depth, normal, and
neighborhood checks. The layers are summed in linear HDR for presentation and
readback. The composed history reports the lower confidence of the two layers.

The option adds 32 bytes per internal pixel for the two double-buffered lobe
layers. Sparse ray batches carry both layers forward, and resize or a scene
history reset invalidates both layers together. The default uses one combined
history.

The Morton-sorted TLAS accelerates object and instance selection, while intersected meshes traverse
GPU-built Morton-sorted triangle BLASes. Hardware ray tracing and SAH/Karras hierarchy topology are
not implemented. Retained triangle morph targets update positions and normals
through the shared morph evaluator and rebuild ray acceleration geometry when
weights change. Skeletal skinning applies the retained CPU joint palette to
`JOINTS_0` and `WEIGHTS_0` after morphing, including position, normal and
tangent deformation. Joint changes rebuild ray acceleration geometry. All
placements of a surface share its pose. GPU-only and per-instance joint palettes
require a compatible raster renderer.

## Material support

| Material feature | Ray-traced support |
| --- | --- |
| Metallic-roughness | Base color, emissive, metallic-roughness, and triangle normal maps |
| Unlit | glTF `KHR_materials_unlit` and retained unlit surfaces display base color without light response. They terminate camera and bounce rays and participate in silhouettes and shadows. |
| Vertex color | Interpolated glTF `COLOR_0` RGB multiplies the base color. RGBA vertex alpha participates in `MASK` visibility. |
| Visibility | Alpha masks and stochastic alpha blending for rendering and shadows |
| Diffuse transmission | Tint and strength for backlighting and diffuse bounces through thin surfaces in PBR mode |
| Smooth glass | Transmission map, IOR, and distance-based absorption for closed, properly nested meshes |
| Rough glass | Opt-in GGX dielectric reflection and refraction using scalar or textured roughness |
| Dispersion | glTF `KHR_materials_dispersion` uses channel-dependent IOR for PBR continuation |
| Face sidedness | Explicitly single-sided triangles cull back faces in rendering and visibility queries. Transmissive meshes keep both interfaces. |
| Dielectric specular | RGB color and alpha intensity maps |
| Clearcoat | Red strength, green roughness, and independent triangle normal maps |
| Ambient occlusion | Red channel and scalar strength applied to ambient lighting |
| Sheen | RGB color and alpha roughness maps |
| Thin-film iridescence | Red strength and green thickness maps, evaluated with an RGB approximation |
| Anisotropy | UV-aligned GGX for direct lighting and opaque bounces. Map RGB encodes direction in red and green and scales strength in blue. |

Base-color, emissive, metallic/roughness, transmission and normal maps support UV sets 0/1 and UV transforms,
with explicit LOD and up to 14 distinct textures per frame. Excess maps use material defaults,
with base-color maps prioritized for visibility. Primary triangle shading estimates
a mip level from the projected pixel footprint and transformed UVs. Secondary triangle shading
projects the carried camera footprint at each hit. For perspective cameras, the footprint grows
with travel distance. Analytic spheres and alpha visibility still sample mip zero. `MASK` multiplies the
base-color factor alpha by the sampled base-color map alpha before comparing with `alphaCutoff`.
Interpolated vertex alpha is an additional multiplier for triangle masks.
Cutouts apply to primary/secondary rays, shadows, explicit emitter samples, picking and primary-hit
channels. Rejected triangles do not hide deeper triangles in the same mesh, and analytic spheres
check both interfaces. `OPAQUE` ignores texture alpha.

`BLEND` uses the product of base-color factor alpha, texture alpha, and vertex
alpha as the probability of a surface hit. Primary and secondary rays can pass
through rejected layers, and progressive linear radiance converges to
source-over compositing for layered surfaces. Shadow rays sample the same
coverage, and explicit emitter samples weight radiance by coverage.
Picking, depth, and normal channels deterministically return the nearest
intersection with nonzero coverage. Low sample counts can show visible noise
in translucent layers and their shadows. The existing filtered-cutout option
also filters blend coverage for mipmapped triangle textures.

Set `roughDielectricTransmission: true` on the ray-tracing renderer with
`transportMode: 'pbr'` and a positive `maxBounces`. Glass roughness above
0.04 broadens reflection and refraction using GGX facet sampling. Smooth and
index-matched interfaces use the existing continuation. Rough dielectric events use path continuation. Directional, point, and spot
lights can also connect to nondispersive exterior rough interfaces using the
existing shadow controls. The implementation follows the microfacet transport
model described in [PBRT’s dielectric BSDF](https://pbr-book.org/4ed/Reflection_Models/Dielectric_BSDF).

Dispersion uses the glTF Abbe-number parameterization with three RGB bands.
A dispersive path samples one band and retains it through subsequent
interfaces. Progressive accumulation resolves the color spread.

Triangle mesh normal maps use linear RGB and the interpolated glTF `TANGENT`
frame when available, including its handedness and retained morph deltas. Meshes
without usable tangents derive the frame from the transformed UV chart. They affect lighting and opaque bounce shading. Analytic spheres and
triangles without a usable tangent frame use the surface normal. Picking, hit
channels and smooth dielectric refraction continue to use the unperturbed normal.
Dielectric specular color and intensity factors affect direct lighting and opaque PBR bounce
shading. The color map uses RGB with texture-format color decoding, and the intensity map uses
alpha. Both use the same UV selection and transforms as the other material maps. Smooth dielectric
refraction continues to use its IOR-based Fresnel model.

Clearcoat adds a dielectric glossy layer to direct lighting and opaque PBR paths. The strength
map uses red, and the roughness map uses green. Both support the shared UV sets and transforms.
Triangle clearcoat normal maps use their own UV chart and linear RGB. The coat uses the unperturbed
surface normal when the map is absent. Opaque bounce sampling still follows the
base shading distribution.

Ambient occlusion maps use the red channel and the material's `occlusionStrength` to
attenuate ambient light. Direct lights, emission, and ray visibility are unaffected.

Sheen adds a grazing reflection below clearcoat in direct lighting and opaque PBR paths.
The color map contributes RGB after texture-format color decoding, and the roughness map
uses alpha. The lobe uses a Charlie distribution with approximate visibility and base-layer
attenuation. Opaque bounce sampling uses the existing diffuse/GGX mixture.

Thin-film iridescence modifies the base Fresnel response for direct lighting and opaque PBR paths.
The strength map uses red and the thickness map uses green to interpolate the specified thickness
range in nanometers. Without a thickness map the renderer uses the maximum thickness. The film
model approximates spectral reflectance at three RGB wavelengths.

Anisotropy stretches opaque GGX reflections along a triangle's UV tangent frame. The rotation
is in radians. The map uses red and green for tangent-space direction and blue to scale strength.
Mapped surfaces use the selected UV chart and transform. Scalar anisotropy uses UV0. Analytic
primitives and triangles without a usable UV frame use isotropic reflection.

Diffuse transmission diverts part of the diffuse reflection lobe to the opposite side of a thin
surface. In PBR mode it receives direct and sampled emissive lighting, and a positive bounce
budget allows cosine-weighted transmission paths. The strength map uses alpha, and the tint map
uses RGB after color decoding. This lobe models surface scattering without entering a volume.

Replacing a map or changing its UV metadata or normal scale invalidates history. After an in-place texture upload,
increment the scene material version (or commit its retained ANARI material) before rendering.
Diffuse secondary transport is opt-in through `maxBounces` (0–8). Each bounce samples a
cosine-weighted hemisphere and gathers emission and existing direct lighting at the next hit,
so matte surfaces receive color bleeding and emissive illumination. The scalar diffuse
throughput in `transportMode: 'diffuse'` is base color × 0.96 × (1 − metallic).
`transportMode: 'pbr'` additionally samples GGX reflection and smooth dielectric transmission with IOR. For closed, non-nested dielectrics, `attenuationColor` specifies the fraction of linear RGB light
remaining after traveling `attenuationDistance` world units. The path applies Beer–Lambert
absorption along each segment inside the object, including segments after internal reflection.
The camera path must enter the medium through a refracted hit. Nonpositive or infinite distance
disables absorption. Nested dielectric continuation tracks the active medium at each interface.
Use closed, consistently wound, non-overlapping shells that enter and exit in
order. Each segment uses the innermost medium’s attenuation. Misses contribute no indirect radiance: `background` is a display color, not an
environment light. Ambient lights and fog retain the existing per-hit approximations.

`samplingSeed` controls primary and diffuse paths. Pixel, frame, sample, and bounce indices
separate samples; unchanged progressive frames converge through the existing bounded history.
Seed and bounce-budget changes invalidate accumulation. With diffuse bounces enabled,
geometry, placement, material and light changes reset history even when temporal reprojection
is enabled: primary-hit metadata cannot validate indirect illumination. Camera movement resets
history when temporal reprojection is disabled; otherwise it uses the existing primary-hit
reprojection and camera-cut rejection.
Use a stationary scene, full resolution, disabled adaptive resolution and temporal reprojection,
and multiple progressive frames for comparison. Small emitters can converge slowly under the default BSDF-only emission gathering.
Opt-in explicit emitter sampling, opaque GGX transport and spatial denoising are available;
Area and environment light sampling for rough dielectrics, advanced temporal denoising, and participating media remain open.

For the rationale behind the TLAS/BLAS split, Morton ordering, refit policy, megakernel execution,
and temporal reconstruction policy, see
[ray-tracing technique background and tradeoffs](/docs/api-guide/engine/anari-architecture#ray-tracing-technique-background-and-tradeoffs).

Applications can also
[register custom renderer runtimes](/docs/api-reference/anari/anari-device#registering-renderer-runtimes).

### Receiver-space irradiance samples

`RayTracingSceneRenderer.encodeIrradiance(frameId, positions, normals, output)`
encodes one cosine-weighted hemisphere sample for each covered receiver texel.
Call `render()` and submit first to prepare the retained scene and acceleration
structures. This method reuses that scene's diffuse transport, material textures,
lights, seed, sample-frame index, and bounce settings. The initial receiver ray
adds one bounce to `maxBounces`.

`positions` and `normals` are same-size floating-point textures in world space.
Position alpha contains a positive chart ID; zero marks uncovered texels.
Normals must be unit length. `output` is a same-size `rgba16float` storage texture
containing linear indirect irradiance and the receiver's chart ID in alpha.
Uncovered texels are cleared. Receiver albedo is not multiplied into irradiance;
the receiving PBR material applies it when displaying the bake.

This is the indirect term: rays that escape the scene contribute zero. Combine
it with direct-light and environment samples, then accumulate and dilate using
`LightmapBaker`. Advance `samplingFrameIndex` on the retained render to obtain
new samples; the same scene, seed, and frame index reproduce a sample. Do not use
a camera denoiser on atlas texels, which have unrelated neighbors across charts.

The caller owns all textures and command submission. The renderer caches the
computation and releases it with `destroyFrame()` or `destroy()`. Keep borrowed
textures alive through command completion. Changing receiver content requires
resetting the application's accumulation history.
