import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# SceneRenderer

<ExperimentalDocsTabs active="scene-renderer" />

`SceneRenderer` renders retained, physically based surface descriptions on WebGPU and WebGL. It
combines the canonical `@luma.gl/shaders` PBR modules with experimental scene orchestration,
instanced drawing, transparent ordering, material specialization, roughness-aware image-based
lighting, opaque-scene transmission, and existing shaders-owned skinning and engine-owned
morph-target primitives.

The renderer is intentionally format-independent. glTF loaders, ANARI retained objects, and
application adapters can translate their data into `SceneSurface` descriptors.
The built-in scenegraph adapter also accepts `SceneMeshNode` trees directly. `@luma.gl/engine` continues to own generic geometry, model, material, and animation
primitives rather than an opinionated scene renderer.

## Scenegraph input

For a scene built from shared geometry and PBR descriptions, pass the root directly:

```ts
import {CubeGeometry, GroupNode} from '@luma.gl/engine';
import {SceneMeshNode, SceneRenderer} from '@luma.gl/anari';

const scene = new GroupNode({children: [new SceneMeshNode({
  id: 'box', geometry: new CubeGeometry(),
  material: {id: 'paint', uniforms: {baseColorFactor: [0.2, 0.4, 0.8, 1]}}
})]});
const renderer = new SceneRenderer(device);
renderer.render({scene, camera, lights});
device.submit();
```

`camera`, `lights` and `device` are application inputs. The
[physics walkthrough](/docs/api-guide/physics/getting-started) supplies complete camera,
controller and frame-loop code. `ScenegraphRenderOptions` uses `scene` instead of the
low-level `id` and `surfaces` fields. Caches are scoped by root **object identity**; duplicate
node IDs do not alias compiled resources or picking identities. Shared geometry/material/
producer combinations are instanced for opaque/masked meshes, and inherited visibility is
respected. CPU-transformed blended leaves stay in separate surfaces so they can be sorted
back to front against other transparent objects.

`SceneMeshNode` extends engine `GeometryNode` and adds a `SceneMaterial`, an optional
`environment` reflection probe, and an advanced `connection` descriptor. The renderer owns
compiled models; CPU geometry, descriptor textures and transform buffers remain borrowed.
`ModelNode` is an already compiled model with its own rendering contract and is rejected
by this traversal rather than silently reinterpreted. Other metadata-only leaves are skipped.

### GPU transform sources

`GroupNode.transformSource` accepts the engine's generic `ScenegraphTransformSource`.
`getFrame()` returns `null` for authored placement, or:

| Field | Contract |
| --- | --- |
| `matrices` | Borrowed STORAGE buffer of column-major float32 world `mat4` values. |
| `matrixCount` | Number of valid matrices; the buffer must contain at least `matrixCount * 64` bytes. |
| `revision` | Producer revision after replacing buffers or index mappings. |
| `bindings` | Map keyed by node objects; each binding has `matrixIndex`, `localMatrix`, and optional `visible`. |

A bound mesh is evaluated as `matrices[matrixIndex] * localMatrix`. Bindings describe the
mesh's complete relation to its producer frame; they are not added to the authored world
matrix a second time. The nearest group's source applies to its subtree. A nested source
returning `null` selects authored placement in that subtree. Unbound meshes retain authored
world placement. Authored visibility is evaluated live on every traversal; the optional
binding flag is an additional producer mask. The physics source does not snapshot authored
visibility into that mask, so hide/show works while simulation is paused. Producers must include bindings for visual descendants they control;
`PhysicsController` does this during publication updates.

Each render obtains the accepted publication and refreshes bindings, including replacement
buffers after reset/rebuild. GPU poses are never read back or written into CPU node matrices.
No CPU frustum culling is applied using stale authored bounds. Normals use the inverse
transpose of the combined evaluated matrix.

GPU-transformed surfaces require WebGPU and reject `BLEND` materials: authored CPU matrices
cannot provide correct transparent depth ordering. Static CPU-matrix scenes keep their
existing WebGL/WebGPU path. Deferred rendering forwards GPU-transform scenes to the shared
forward renderer. The ray-tracing renderer does not consume this transform-source contract.

Advanced low-level `SceneSurface.gpuTransforms` supplies `matrices`, `matrixCount`, `revision`
and an `indices` array aligned with `transforms`; those transforms become mesh-to-producer
matrices. `nodes` optionally supplies the retained identity for each instance.

### Spot shadows, depth and picking

On WebGPU, `spotShadows: {spotLights, mapSize?}` enables the shared `ShadowMapRenderer`.
Shadow slots correspond to the order of spot lights in `lights`; each shadow declaration
supplies position, direction, range and outer cone angle, plus optional bias and source-radius
settings. Up to four spot slots are supported. Camera `near`, `far` and `clipDepth` describe
its projection; `clipDepth` defaults to math.gl's negative-one-to-one convention. Specify
`zero-to-one` for an already converted WebGPU projection. Directional and point shadow
orchestration remain explicit lower-level paths.

The caster pipeline uses the same geometry, instance metadata, skin/morph inputs and GPU
matrix lookup as the visible pass. Depth and identity fragments apply the material's alpha
cutoff, including base-color texture UV transforms. `rasterPass: 'depth'` renders to a
caller-owned depth framebuffer with no color attachments. `rasterPass: 'picking'` writes
24-bit instance identities to an `rgba8unorm` target; normal applications should use `pick()`:

```ts
const node = await renderer.pick({scene, camera, width, height}, {x, y});
```

Coordinates are integer target pixels from the top left. The method renders an identity
target, explicitly reads one pixel and returns the corresponding node or `undefined`.
It does not read simulated poses. Convert CSS pointer coordinates to target pixels and await
pending picks before disposing scene resources. Low-level surfaces without `nodes` have no
node result. Identity picking currently covers at most 16,777,215 placements per call.

`SceneMeshNode.connection` is an advanced box-between-matrix-origins descriptor:
`{first, second, radius}`. Indices address the current source's GPU matrix array, and geometry
must be a unit cube spanning `[-1, 1]`. It is useful for visual pendulum tethers; it is not a
physics joint or a deformable rope. Both endpoints must be valid and distinct in position.

### Scene lifetime

`destroyScene(root)` releases that root's cached models, instance buffers, shadow maps and
adapter identities. It does not destroy the root, its CPU geometry, textures or producer.
Submit already encoded work before disposal. `destroy()` releases all retained frames and
scenegraph caches. Stop rendering before destroying a physics controller or another transform
producer; the controller detaches its source when destroyed.

## Surface descriptor input


```ts
import {Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
    NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
    TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
  },
  indices: new Uint16Array([0, 1, 2])
});

const surface: SceneSurface = {
  id: 'shared-triangle',
  geometry,
  material: {
    id: 'blue-metal',
    uniforms: {
      baseColorFactor: [0.2, 0.45, 0.9, 1],
      metallicRoughnessValues: [0.7, 0.3]
    }
  },
  transforms: [new Matrix4().translate([-1, 0, 0]), new Matrix4().translate([1, 0, 0])]
};

const options: SceneRenderOptions = {
  id: 'main-scene',
  surfaces: [surface],
  camera: {
    viewMatrix: new Matrix4().lookAt({eye: [0, 0, 6], center: [0, 0, 0], up: [0, 1, 0]}),
    projectionMatrix: new Matrix4().perspective({
      fovy: Math.PI / 3,
      aspect: 1,
      near: 0.1,
      far: 100
    }),
    position: [0, 0, 6]
  },
  lights: [{type: 'ambient', color: [1, 1, 1], intensity: 0.2}],
  background: [0.02, 0.03, 0.05, 1],
  exposure: 1
};

const renderer = new SceneRenderer(device);
const statistics = renderer.render(options);
device.submit();

// {surfaceCount: 1, instanceCount: 2, drawCount: 1, triangleCount: 2}
console.log(statistics);

renderer.destroy();
```

Every matrix in `transforms` places the same geometry/material pair in world space. The renderer
uploads the matrices to instanced vertex attributes and keeps all placements for one surface in
one draw. A surface with no transforms is not drawn.

`render()` records its render pass but does not submit the device's command queue. Call
`device.submit()` after encoding the frame, and always before destroying the renderer or any
borrowed resources. Applications combining multiple passes may submit once after the final pass.

## Scene descriptors

### `SceneSurface`

| Property | Meaning |
| --- | --- |
| `id` | Stable surface identifier within one frame. |
| `geometry` | Engine `Geometry` using source attributes such as `POSITION`, `NORMAL`, `TANGENT`, `TEXCOORD_0`, `TEXCOORD_1`, `COLOR_0`, `JOINTS_0`, and `WEIGHTS_0`. |
| `geometryVersion` | Optional structural version; increment it when geometry must be rebuilt. |
| `material` | A format-independent `SceneMaterial` descriptor. |
| `transforms` | Readonly column-major world matrices for all instances in this draw. |
| `skin` | Optional caller-supplied shaders skin inputs, including `jointMatrices`, for geometry containing both `JOINTS_0` and `WEIGHTS_0`. |
| `morphTargets` | Optional immutable glTF-style displacement attributes. |
| `morphWeights` | Current morph-target weights; changing weights updates shared geometry buffers without recreating the model. |

Geometry preserves its original source attribute names. Conversion to shader-facing attributes
happens at the model boundary; applications must not add duplicate CPU aliases.

### Skinning and morph targets

Supply an explicit mesh-local joint palette when animating geometry that already carries both
joint and weight attributes:

```ts
const deformingSurface: SceneSurface = {
  id: 'animated-character',
  geometry: geometryWithJointsAndWeights,
  material: {id: 'character-material'},
  transforms: [new Matrix4()],
  skin: {jointMatrices: currentJointMatrices},
  morphTargets: [{POSITION: smilePositionDisplacements}],
  morphWeights: [0.35]
};

renderer.render({...options, surfaces: [deformingSurface]});
device.submit();

deformingSurface.skin = {jointMatrices: nextJointMatrices};
deformingSurface.morphWeights = [0.7];

renderer.render({...options, surfaces: [deformingSurface]});
device.submit();
```

The existing shaders `skin` module uploads the supplied joint palette, and the existing
engine morph helper updates the retained model's vertex buffers without mutating the source CPU
geometry. Scene adapters remain responsible for extracting skeleton hierarchy, evaluating animated
joints, and supplying the current palette; preserving `JOINTS_0`/`WEIGHTS_0` alone does not
automatically calculate or bind joint matrices.

### `SceneMaterial`

| Property | Meaning |
| --- | --- |
| `id` | Stable material identifier. |
| `version` | Optional adapter-owned material version. Uniform changes remain nonstructural. |
| `uniforms` | Canonical `PBRMaterialUniforms` from `@luma.gl/shaders`. |
| `bindings` | Present canonical PBR texture bindings, such as `pbr_baseColorSampler`. |
| `alphaMode` | Explicit `OPAQUE`, `MASK`, or `BLEND` behavior. |
| `doubleSided` | Disables back-face culling when `true`. |
| `defines` | Additional structural shader-feature definitions. |

Supported uniform families include base color, metallic/roughness, normal and occlusion maps,
emission and emissive strength, specular color/intensity, index of refraction, transmission and
volume factors, chromatic dispersion, clearcoat, sheen, iridescence, anisotropy, alpha cutoff,
per-map UV selection, and per-map UV transforms. Transmissive surfaces sample automatically
captured linear opaque-scene radiance; the shared shader combines refraction with IOR, thickness,
attenuation, wavelength-dependent dispersion, Fresnel response, and roughness-aware filtering.

Bind only maps that actually exist:

```ts
const physicalSurface: SceneSurface = {
  ...surface,
  material: {
    id: 'coated-leaf',
    alphaMode: 'MASK',
    doubleSided: true,
    uniforms: {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0.1, 0.65],
      alphaCutoff: 0.45,
      clearcoatFactor: 0.5,
      clearcoatRoughnessFactor: 0.2,
      baseColorUVSet: 1,
      baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0.1, 0.2, 1]
    },
    bindings: {
      pbr_baseColorSampler: baseColorTexture,
      pbr_normalSampler: normalTexture,
      pbr_clearcoatSampler: clearcoatTexture
    }
  }
};
```

Base-color and emissive image data should use the appropriate sRGB texture format; normal,
metallic/roughness, occlusion, clearcoat, and other numeric maps remain linear. `baseColorUVSet: 1`
requires geometry with a `TEXCOORD_1` attribute. Tangent-space normal maps can use an authored
`TANGENT` attribute.

When `alphaMode` is absent, `getSceneAlphaMode(material)` infers `BLEND` only when the base-color
alpha is below one; otherwise it returns `OPAQUE`. Masked surfaces remain depth-writing and use
`alphaCutoff`. Blended surfaces disable depth writes, render after opaque/masked surfaces, and are
ordered back-to-front at the surface level.

### `SceneRenderOptions`

| Property | Meaning |
| --- | --- |
| `id` | Stable frame identifier used to retain compiled models between renders. |
| `surfaces` | Retained surface batches. |
| `camera` | `viewMatrix`, `projectionMatrix`, and world-space `position`. |
| `lights` | Existing shaders light descriptors using normalized color values; directional vectors describe incoming light propagation. |
| `background` | Linear RGBA clear color; defaults to `[0, 0, 0, 1]`. |
| `framebuffer` | Optional caller-owned forward-rendering or ray-tracing target; its attachment dimensions and formats determine presentation. |
| `width`, `height` | Explicit target dimensions when a framebuffer is not supplied. |
| `environment` | Optional complete `SceneEnvironment` image-based-lighting resource set. |
| `transmission` | Enables automatic opaque-scene capture for transmissive materials; set `false` to disable it. |
| `exposure` | Exposure multiplier; defaults to `1`. |
| `toneMapMode` | `0` disables tone mapping, `1` selects Reinhard, `2` selects Khronos PBR Neutral, and `3` selects ACES. SDR targets default to `2`; floating-point targets default to `0`. |
| `outputColorSpace` | Optional `linear` or `srgb` output encoding. Floating-point and hardware-sRGB attachments default to linear output; ordinary SDR attachments default to exact sRGB encoding. |
| `fogColor`, `fogDensity` | Optional exponential-fog inputs consumed by deferred lighting. |
| `renderMode` | `default`, `debugNormals`, or `debugDepth`. |

### Color management and HDR output

The canonical shaders accumulate lighting, environment radiance, emission, and transmission in
linear color space. Exposure is applied before tone mapping. Import the named selectors when
configuring an output transform:

```ts
import {PBR_TONE_MAP_MODE} from '@luma.gl/shaders';

renderer.render({
  ...options,
  exposure: 1.5,
  toneMapMode: PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL,
  outputColorSpace: 'srgb'
});
device.submit();
```

An `rgba16float` framebuffer defaults to linear, untonemapped output, preserving radiance above
one for subsequent HDR processing. A framebuffer with a hardware-sRGB attachment also receives
linear shader output so the hardware performs the transfer exactly once. Explicit
`outputColorSpace` overrides the automatic selection when the caller intentionally manages the
target differently. `RayTracingSceneRenderer` follows the same framebuffer, tone-mapping, and
output-encoding contract while keeping its retained radiance history in linear HDR storage.

## Image-based lighting

`SceneEnvironment` accepts caller-owned, already-prepared environment resources:

```ts
import type {SceneEnvironment} from '@luma.gl/anari';

const environment: SceneEnvironment = {
  diffuseTexture: diffuseIrradianceCubemap,
  specularTexture: prefilteredSpecularCubemap,
  brdfLUTTexture: integratedBRDFLookupTexture,
  intensity: 1.2,
  rotation: Math.PI / 4
};

renderer.render({...options, environment});
device.submit();
```

All three textures must be present before IBL is enabled. An incomplete environment leaves IBL
disabled without creating substitute maps. The renderer does not own or destroy these textures.
When the specular cubemap has multiple mip levels, canonical WGSL and GLSL shading selects the
roughness-dependent reflection level using the texture's actual mip count.

Generate all three textures from an equirectangular source with the shared experimental
environment pipeline:

```ts
import {PBREnvironmentGenerator} from '@luma.gl/anari';

const generator = new PBREnvironmentGenerator(device);
const generatedEnvironment = generator.prepare({
  source: equirectangularTexture,
  size: 64,
  sampleCount: 64,
  intensity: 1
});

renderer.render({...options, environment: generatedEnvironment});
device.submit();
```

[`PBREnvironmentGenerator`](/docs/api-reference/anari/pbr-environment) integrates all six
GGX-prefiltered specular faces at every roughness mip, cosine-weighted diffuse irradiance, and a
split-sum BRDF lookup texture on WebGL or WebGPU.

Applications that already use the glTF environment loader can await its `DynamicTexture`
resources and adapt their underlying textures without introducing an experimental dependency into
`@luma.gl/engine/gltf`:

```ts
import {loadPBREnvironment} from '@luma.gl/engine/gltf';
import {loadImageTexture} from '@loaders.gl/images/load-image';

const loadedEnvironment = loadPBREnvironment(device, {
  loadImage: loadImageTexture,
  brdfLutUrl: '/environments/studio/brdf-lut.png',
  getTexUrl: (name, face, level) => `/environments/studio/${name}-${face}-${level}.png`,
  specularMipLevels: 5
});

await Promise.all([
  loadedEnvironment.diffuseEnvSampler.ready,
  loadedEnvironment.specularEnvSampler.ready,
  loadedEnvironment.brdfLutTexture.ready
]);

const sceneEnvironment: SceneEnvironment = {
  diffuseTexture: loadedEnvironment.diffuseEnvSampler.texture,
  specularTexture: loadedEnvironment.specularEnvSampler.texture,
  brdfLUTTexture: loadedEnvironment.brdfLutTexture.texture
};
```

## Physical transmission and refraction

The forward renderer captures opaque scene color automatically whenever at least one surface has
`transmissionFactor > 0`. The canonical PBR shaders then sample that captured texture while
evaluating transmissive materials:

```ts
const glassSurface: SceneSurface = {
  id: 'glass',
  geometry,
  material: {
    id: 'clear-glass',
    alphaMode: 'OPAQUE',
    uniforms: {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 0.12],
      transmissionFactor: 1,
      thicknessFactor: 0.35,
      attenuationDistance: 2,
      attenuationColor: [0.85, 0.95, 1],
      ior: 1.5,
      dispersion: 0.35
    }
  },
  transforms: [new Matrix4()]
};

renderer.render({
  ...options,
  surfaces: [opaqueBackgroundSurface, glassSurface],
  transmission: true
});
device.submit();
```

Physical transmission is distinct from alpha blending. Keep a genuinely opaque glTF transmission
material in `alphaMode: 'OPAQUE'`; it can refract background geometry while retaining an opaque
output alpha and participating in depth writes. Set `alphaMode: 'BLEND'` only when the material's
authored alpha actually requires blending.

The capture pass renders opaque or masked **nontransmissive** surfaces into a separate retained,
linear color/depth target. It uses `rgba16float` when that format can be rendered and filtered,
falling back to `rgba8unorm` otherwise. Capture is not exposed, tone-mapped, or sRGB-encoded before
the transmission shader samples it. Transmissive and blended surfaces are excluded, so a target is
never sampled while also being rendered. The final pass draws ordinary opaque surfaces before transmissive
opaque surfaces, then draws blended surfaces back-to-front. `drawCount` reports only final-pass
draws; the internal capture draw is intentionally excluded.

Capture targets are created only when needed, resized with the frame, reused for the same frame
identifier, and destroyed when capture is disabled or the frame is destroyed. Set
`transmission: false` to suppress the capture pass and retain the shader's ordinary fallback
behavior. Debug-normal/depth modes also disable capture.

This is screen-space, single-opaque-capture transmission rather than ray tracing or layered
multi-bounce refraction. Overlapping transmissive objects do not refract one another, and blended
background surfaces do not appear in the opaque capture. A positive `dispersion` applies the
ratified `KHR_materials_dispersion` wavelength-dependent IOR model; zero keeps the ordinary
single-refraction path.

## Retention and structural updates

Reuse `SceneRenderOptions.id`, each `SceneSurface.id`, and material identifiers across frames.
Camera state, lights, material factors, instance matrix values, joint palettes, and morph weights
update without rebuilding the retained model. Texture binding identity, geometry identity or
`geometryVersion`, instance count, alpha mode, sidedness, shader defines, IBL availability,
whether the specular environment has multiple mip levels, transmission-capture
availability/dimensions, render-target color format, and debug mode are structural changes and
recreate the affected pipeline/resources. Changing the exact mip count within an already mipmapped
environment updates
the scene uniform without recompiling that shader variant.

Changing only `material.version` does not force a structural rebuild. Increment `geometryVersion`
when the adapter changes the geometry in a way that requires new GPU geometry.

## Reusable PBR factories

The same canonical shaders can also be composed below the scene-descriptor layer:

```ts
import {createPBRMaterial, createPBRMaterialFactory, createPBRModel, getPBRGeometryDefines, getPBRMaterialMapUniforms, getPBRTextureDefines} from '@luma.gl/anari';

const materialFactory = createPBRMaterialFactory(device);
const material = createPBRMaterial(device, {
  id: 'custom-pbr-material',
  factory: materialFactory,
  uniforms: {baseColorFactor: [0.8, 0.4, 0.2, 1]},
  bindings: {pbr_baseColorSampler: baseColorTexture}
});

const model = createPBRModel(device, {
  id: 'custom-pbr-model',
  geometry,
  material
});

console.log(getPBRGeometryDefines(geometry));
console.log(getPBRTextureDefines(material.getResourceBindings()));
console.log(getPBRMaterialMapUniforms(material.getResourceBindings()));

model.destroy();
material.destroy();
```

`createPBRModel` assembles portable WGSL/GLSL entry points with the canonical `pbrScene` and
`pbrMaterial` shader modules, specializes present textures and geometry attributes, and adds the
existing `skin` module when matching joint/weight attributes are present.

## Methods

### `new SceneRenderer(device: Device)`

Creates a renderer for an existing WebGL or WebGPU device.

### `render(options: SceneRenderOptions): SceneRenderStatistics`

Updates retained scene resources, draws opaque surfaces before back-to-front blended surfaces,
and returns `surfaceCount`, `instanceCount`, `drawCount`, and `triangleCount`.

The WebGPU `RayTracingSceneRenderer` consumes the same scene contract and additionally returns
`rayTracing.graph`: logical node counts, physical compute-pass counts, coalesced compute nodes,
and synchronous CPU encoding time for the stages recorded during that frame. Its `trace` stage is
always present; `topology`, `acceleration`, and `refit` appear only when the corresponding work
runs. Collecting these diagnostics never submits commands or waits for GPU results.

### `destroyFrame(frameIdentifier: string): void`

Destroys retained models, materials, and instance buffers associated with one frame identifier.
Caller-owned geometry and textures are not destroyed.

### `destroy(): void`

Releases all renderer-owned frame resources.

## Related pages

- [`DeferredSceneRenderer`](/docs/api-reference/anari/deferred-scene-renderer) renders
  compatible opaque/masked metallic-roughness scenes on WebGPU and falls back to this renderer.
- [`PBREnvironmentGenerator`](/docs/api-reference/anari/pbr-environment) generates
  roughness-prefiltered cubemaps, diffuse irradiance, and BRDF lookup textures.
- [`pbrMaterial`](/docs/api-reference/shaders/shader-modules/pbr-material) documents canonical
  physically based shader uniforms and bindings.
- [`GBuffer`](/docs/api-reference/anari/g-buffer) documents the deferred attachment model.
- [`@luma.gl/engine/gltf`](/docs/api-reference/gltf) owns glTF parsing, material interpretation,
  environment-image loading, and animation decoding.

## Tiled ray image export

`exportRayTracingImage(device, scene, options)` is an async iterator over tightly
packed RGBA8 tiles. It submits its own rendering and readback commands. Submit
pending application commands before starting export, and keep the scene,
camera, lighting and exposure fixed until iteration finishes. The `scene`
argument uses `RayTracingSceneRenderOptions`; its camera projection must describe
the complete output image, including its aspect ratio.

```ts
import {exportRayTracingImage} from '@luma.gl/anari';

for await (const tile of exportRayTracingImage(device, sceneOptions, {
  width: 4096,
  height: 3072,
  tileSize: 512,
  frames: 8,
  signal: abortController.signal
})) {
  // Consume tile.data at (tile.x, tile.y), e.g. in an application-owned encoder.
  // Rows are top to bottom, with tile.width * 4 bytes per row and no GPU padding.
}
```

`width`, `height` and `tileSize` are positive integers; full-image pixel count
must fit uint32 indexing. `tileSize` defaults to `512`, and `frames` defaults to
`1` (maximum `256`). Each tile uses the same explicit frame sequence and global
pixel seeds. The exporter forces full resolution, progressive accumulation,
color presentation and disabled adaptive resolution/temporal reprojection.
Other transport and sampling settings come from the scene. Exposure and tone
mapping are never adjusted per tile. Output encoding follows `outputColorSpace`
(default sRGB); output bytes are always RGBA8 rather than linear HDR floats.

The render halo is `denoiseRadius + frames - 1`: guided filtering reads spatial
neighbors, and progressive history color clamping adds one dependency radius per
additional frame. Halos are clipped to the full-image boundary; only tile
interiors are copied back. Interior tile size plus both halos must fit
`device.limits.maxTextureDimension2D`. The renderer retains one export frame,
and only one padded target/readback allocation is active at a time. Full-image
assembly and file encoding are application-owned memory costs.

Breaking out of `for await`, calling iterator `return()`, or aborting releases
export-owned GPU resources. Cancellation is checked between tiles/frames and
after readback; it does not interrupt work already submitted to the GPU.
Scene geometries and the device remain caller-owned.

`iterateRayTracingImageTiles(width, height, tileSize, halo = 0)` exposes the lazy
row-major tile plan. Each result contains interior `x`, `y`, `width`, `height`
and padded `renderX`, `renderY`, `renderWidth`, `renderHeight`. Halo must be an
integer from `0` to `257`.

For custom offscreen pipelines, `RayTracingSceneRenderOptions.imageRegion` is
`{offset: [x, y], fullSize: [width, height]}` in top-left full-image pixels. Its
local target extent must lie within the full image. This mode forces full
resolution and disables adaptive resolution and temporal reprojection.
`samplingFrameIndex` optionally chooses the uint32 sampling sequence frame,
independent of retained scheduling. Region changes reset accumulation; changing
only the explicit sample frame advances sampling without clearing history.
Default rendering omits both options and retains its existing behavior.
