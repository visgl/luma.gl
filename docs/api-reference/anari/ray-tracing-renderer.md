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

The Morton-sorted TLAS accelerates object and instance selection, while intersected meshes traverse
GPU-built Morton-sorted triangle BLASes. Hardware ray tracing and SAH/Karras hierarchy topology are
not implemented. Skeletal skinning, morph-target displacement, alpha blending, and
other advanced PBR material extensions require raster rendering; deferred uses its forward fallback for unsupported materials.

Base-color, emissive, metallic/roughness, transmission and normal maps support UV sets 0/1 and UV transforms,
with explicit LOD and up to 14 distinct textures per frame. Primary triangle shading estimates
a mip level from the projected pixel footprint and transformed UVs. Secondary shading, analytic
spheres and alpha visibility still sample mip zero. `MASK` multiplies the
base-color factor alpha by the sampled base-color map alpha before comparing with `alphaCutoff`.
Cutouts apply to primary/secondary rays, shadows, explicit emitter samples, picking and primary-hit
channels. Rejected triangles do not hide deeper triangles in the same mesh, and analytic spheres
check both interfaces. `OPAQUE` ignores texture alpha.

Triangle mesh normal maps use linear RGB and a tangent frame derived from the
transformed UV chart. They affect lighting and opaque bounce shading. Analytic spheres and
degenerate UV charts use the surface normal, which also remains the normal for picking, hit
channels and smooth dielectric refraction. The tangent frame is derived from the triangle UVs
and does not use authored vertex tangents.
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
disables absorption. Rough transmission and nested media are not implemented. Misses contribute no indirect radiance: `background` is a display color, not an
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
MIS, transmissive transport, advanced temporal denoising and volumes remain planned.

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
