# SceneRenderer

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[SceneRenderer](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[GPU Rasters](https://luma.gl/next/docs/api-reference/experimental/luraster.md)[GPU Graphs](https://luma.gl/next/docs/api-reference/experimental/lugraph.md)[luDF](https://luma.gl/next/docs/api-reference/experimental/ludf.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`SceneRenderer` renders retained, physically based surface descriptions on WebGPU and WebGL. It combines the canonical `@luma.gl/shadertools` PBR modules with experimental scene orchestration, instanced drawing, transparent ordering, material specialization, roughness-aware image-based lighting, opaque-scene transmission, and existing shadertools-owned skinning and engine-owned morph-target primitives.

The renderer is intentionally format-independent. glTF loaders, ANARI retained objects, and application scenegraphs remain responsible for translating their own data into `SceneSurface` descriptors. `@luma.gl/engine` continues to own generic geometry, model, material, and animation primitives rather than an opinionated scene renderer.

## Usage[​](#usage "Direct link to Usage")

```
import {Geometry} from '@luma.gl/engine';

import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/experimental';

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

Every matrix in `transforms` places the same geometry/material pair in world space. The renderer uploads the matrices to instanced vertex attributes and keeps all placements for one surface in one draw. A surface with no transforms is not drawn.

`render()` records its render pass but does not submit the device's command queue. Call `device.submit()` after encoding the frame, and always before destroying the renderer or any borrowed resources. Applications combining multiple passes may submit once after the final pass.

## Scene descriptors[​](#scene-descriptors "Direct link to Scene descriptors")

### `SceneSurface`[​](#scenesurface "Direct link to scenesurface")

| Property          | Meaning                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | Stable surface identifier within one frame.                                                                                                            |
| `geometry`        | Engine `Geometry` using source attributes such as `POSITION`, `NORMAL`, `TANGENT`, `TEXCOORD_0`, `TEXCOORD_1`, `COLOR_0`, `JOINTS_0`, and `WEIGHTS_0`. |
| `geometryVersion` | Optional structural version; increment it when geometry must be rebuilt.                                                                               |
| `material`        | A format-independent `SceneMaterial` descriptor.                                                                                                       |
| `transforms`      | Readonly column-major world matrices for all instances in this draw.                                                                                   |
| `skin`            | Optional caller-supplied shadertools skin inputs, including `jointMatrices`, for geometry containing both `JOINTS_0` and `WEIGHTS_0`.                  |
| `morphTargets`    | Optional immutable glTF-style displacement attributes.                                                                                                 |
| `morphWeights`    | Current morph-target weights; changing weights updates shared geometry buffers without recreating the model.                                           |

Geometry preserves its original source attribute names. Conversion to shader-facing attributes happens at the model boundary; applications must not add duplicate CPU aliases.

### Skinning and morph targets[​](#skinning-and-morph-targets "Direct link to Skinning and morph targets")

Supply an explicit mesh-local joint palette when animating geometry that already carries both joint and weight attributes:

```
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

The existing shadertools `skin` module uploads the supplied joint palette, and the existing engine morph helper updates the retained model's vertex buffers without mutating the source CPU geometry. Scene adapters remain responsible for extracting skeleton hierarchy, evaluating animated joints, and supplying the current palette; preserving `JOINTS_0`/`WEIGHTS_0` alone does not automatically calculate or bind joint matrices.

### `SceneMaterial`[​](#scenematerial "Direct link to scenematerial")

| Property      | Meaning                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| `id`          | Stable material identifier.                                                    |
| `version`     | Optional adapter-owned material version. Uniform changes remain nonstructural. |
| `uniforms`    | Canonical `PBRMaterialUniforms` from `@luma.gl/shadertools`.                   |
| `bindings`    | Present canonical PBR texture bindings, such as `pbr_baseColorSampler`.        |
| `alphaMode`   | Explicit `OPAQUE`, `MASK`, or `BLEND` behavior.                                |
| `doubleSided` | Disables back-face culling when `true`.                                        |
| `defines`     | Additional structural shader-feature definitions.                              |

Supported uniform families include base color, metallic/roughness, normal and occlusion maps, emission and emissive strength, specular color/intensity, index of refraction, transmission and volume factors, chromatic dispersion, clearcoat, sheen, iridescence, anisotropy, alpha cutoff, per-map UV selection, and per-map UV transforms. Transmissive surfaces sample automatically captured linear opaque-scene radiance; the shared shader combines refraction with IOR, thickness, attenuation, wavelength-dependent dispersion, Fresnel response, and roughness-aware filtering.

Bind only maps that actually exist:

```
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

Base-color and emissive image data should use the appropriate sRGB texture format; normal, metallic/roughness, occlusion, clearcoat, and other numeric maps remain linear. `baseColorUVSet: 1` requires geometry with a `TEXCOORD_1` attribute. Tangent-space normal maps can use an authored `TANGENT` attribute.

When `alphaMode` is absent, `getSceneAlphaMode(material)` infers `BLEND` only when the base-color alpha is below one; otherwise it returns `OPAQUE`. Masked surfaces remain depth-writing and use `alphaCutoff`. Blended surfaces disable depth writes, render after opaque/masked surfaces, and are ordered back-to-front at the surface level.

### `SceneRenderOptions`[​](#scenerenderoptions "Direct link to scenerenderoptions")

| Property                 | Meaning                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | Stable frame identifier used to retain compiled models between renders.                                                                                                      |
| `surfaces`               | Retained surface batches.                                                                                                                                                    |
| `camera`                 | `viewMatrix`, `projectionMatrix`, and world-space `position`.                                                                                                                |
| `lights`                 | Existing shadertools light descriptors using normalized color values; directional vectors describe incoming light propagation.                                               |
| `background`             | Linear RGBA clear color; defaults to `[0, 0, 0, 1]`.                                                                                                                         |
| `framebuffer`            | Optional caller-owned forward-rendering or ray-tracing target; its attachment dimensions and formats determine presentation.                                                 |
| `width`, `height`        | Explicit target dimensions when a framebuffer is not supplied.                                                                                                               |
| `environment`            | Optional complete `SceneEnvironment` image-based-lighting resource set.                                                                                                      |
| `transmission`           | Enables automatic opaque-scene capture for transmissive materials; set `false` to disable it.                                                                                |
| `exposure`               | Exposure multiplier; defaults to `1`.                                                                                                                                        |
| `toneMapMode`            | `0` disables tone mapping, `1` selects Reinhard, `2` selects Khronos PBR Neutral, and `3` selects ACES. SDR targets default to `2`; floating-point targets default to `0`.   |
| `outputColorSpace`       | Optional `linear` or `srgb` output encoding. Floating-point and hardware-sRGB attachments default to linear output; ordinary SDR attachments default to exact sRGB encoding. |
| `fogColor`, `fogDensity` | Optional exponential-fog inputs consumed by deferred lighting.                                                                                                               |
| `renderMode`             | `default`, `debugNormals`, or `debugDepth`.                                                                                                                                  |

### Color management and HDR output[​](#color-management-and-hdr-output "Direct link to Color management and HDR output")

The canonical shaders accumulate lighting, environment radiance, emission, and transmission in linear color space. Exposure is applied before tone mapping. Import the named selectors when configuring an output transform:

```
import {PBR_TONE_MAP_MODE} from '@luma.gl/shadertools';



renderer.render({

  ...options,

  exposure: 1.5,

  toneMapMode: PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL,

  outputColorSpace: 'srgb'

});

device.submit();
```

An `rgba16float` framebuffer defaults to linear, untonemapped output, preserving radiance above one for subsequent HDR processing. A framebuffer with a hardware-sRGB attachment also receives linear shader output so the hardware performs the transfer exactly once. Explicit `outputColorSpace` overrides the automatic selection when the caller intentionally manages the target differently. `RayTracingSceneRenderer` follows the same framebuffer, tone-mapping, and output-encoding contract while keeping its retained radiance history in linear HDR storage.

## Image-based lighting[​](#image-based-lighting "Direct link to Image-based lighting")

`SceneEnvironment` accepts caller-owned, already-prepared environment resources:

```
import type {SceneEnvironment} from '@luma.gl/experimental';



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

All three textures must be present before IBL is enabled. An incomplete environment leaves IBL disabled without creating substitute maps. The renderer does not own or destroy these textures. When the specular cubemap has multiple mip levels, canonical WGSL and GLSL shading selects the roughness-dependent reflection level using the texture's actual mip count.

Generate all three textures from an equirectangular source with the shared experimental environment pipeline:

```
import {PBREnvironmentGenerator} from '@luma.gl/experimental';



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

[`PBREnvironmentGenerator`](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md) integrates all six GGX-prefiltered specular faces at every roughness mip, cosine-weighted diffuse irradiance, and a split-sum BRDF lookup texture on WebGL or WebGPU.

Applications that already use the glTF environment loader can await its `DynamicTexture` resources and adapt their underlying textures without introducing an experimental dependency into `@luma.gl/gltf`:

```
import {loadPBREnvironment} from '@luma.gl/gltf';



const loadedEnvironment = loadPBREnvironment(device, {

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

## Physical transmission and refraction[​](#physical-transmission-and-refraction "Direct link to Physical transmission and refraction")

The forward renderer captures opaque scene color automatically whenever at least one surface has `transmissionFactor > 0`. The canonical PBR shaders then sample that captured texture while evaluating transmissive materials:

```
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

Physical transmission is distinct from alpha blending. Keep a genuinely opaque glTF transmission material in `alphaMode: 'OPAQUE'`; it can refract background geometry while retaining an opaque output alpha and participating in depth writes. Set `alphaMode: 'BLEND'` only when the material's authored alpha actually requires blending.

The capture pass renders opaque or masked **nontransmissive** surfaces into a separate retained, linear color/depth target. It uses `rgba16float` when that format can be rendered and filtered, falling back to `rgba8unorm` otherwise. Capture is not exposed, tone-mapped, or sRGB-encoded before the transmission shader samples it. Transmissive and blended surfaces are excluded, so a target is never sampled while also being rendered. The final pass draws ordinary opaque surfaces before transmissive opaque surfaces, then draws blended surfaces back-to-front. `drawCount` reports only final-pass draws; the internal capture draw is intentionally excluded.

Capture targets are created only when needed, resized with the frame, reused for the same frame identifier, and destroyed when capture is disabled or the frame is destroyed. Set `transmission: false` to suppress the capture pass and retain the shader's ordinary fallback behavior. Debug-normal/depth modes also disable capture.

This is screen-space, single-opaque-capture transmission rather than ray tracing or layered multi-bounce refraction. Overlapping transmissive objects do not refract one another, and blended background surfaces do not appear in the opaque capture. A positive `dispersion` applies the ratified `KHR_materials_dispersion` wavelength-dependent IOR model; zero keeps the ordinary single-refraction path.

## Retention and structural updates[​](#retention-and-structural-updates "Direct link to Retention and structural updates")

Reuse `SceneRenderOptions.id`, each `SceneSurface.id`, and material identifiers across frames. Camera state, lights, material factors, instance matrix values, joint palettes, and morph weights update without rebuilding the retained model. Texture binding identity, geometry identity or `geometryVersion`, instance count, alpha mode, sidedness, shader defines, IBL availability, whether the specular environment has multiple mip levels, transmission-capture availability/dimensions, render-target color format, and debug mode are structural changes and recreate the affected pipeline/resources. Changing the exact mip count within an already mipmapped environment updates the scene uniform without recompiling that shader variant.

Changing only `material.version` does not force a structural rebuild. Increment `geometryVersion` when the adapter changes the geometry in a way that requires new GPU geometry.

## Reusable PBR factories[​](#reusable-pbr-factories "Direct link to Reusable PBR factories")

The same canonical shaders can also be composed below the scene-descriptor layer:

```
import {

  createPBRMaterial,

  createPBRMaterialFactory,

  createPBRModel,

  getPBRGeometryDefines,

  getPBRMaterialMapUniforms,

  getPBRTextureDefines

} from '@luma.gl/experimental';



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

`createPBRModel` assembles portable WGSL/GLSL entry points with the canonical `pbrScene` and `pbrMaterial` shader modules, specializes present textures and geometry attributes, and adds the existing `skin` module when matching joint/weight attributes are present.

## Methods[​](#methods "Direct link to Methods")

### `new SceneRenderer(device: Device)`[​](#new-scenerendererdevice-device "Direct link to new-scenerendererdevice-device")

Creates a renderer for an existing WebGL or WebGPU device.

### `render(options: SceneRenderOptions): SceneRenderStatistics`[​](#renderoptions-scenerenderoptions-scenerenderstatistics "Direct link to renderoptions-scenerenderoptions-scenerenderstatistics")

Updates retained scene resources, draws opaque surfaces before back-to-front blended surfaces, and returns `surfaceCount`, `instanceCount`, `drawCount`, and `triangleCount`.

The WebGPU `RayTracingSceneRenderer` consumes the same scene contract and additionally returns `rayTracing.graph`: logical node counts, physical compute-pass counts, coalesced compute nodes, and synchronous CPU encoding time for the stages recorded during that frame. Its `trace` stage is always present; `topology`, `acceleration`, and `refit` appear only when the corresponding work runs. Collecting these diagnostics never submits commands or waits for GPU results.

### `destroyFrame(frameIdentifier: string): void`[​](#destroyframeframeidentifier-string-void "Direct link to destroyframeframeidentifier-string-void")

Destroys retained models, materials, and instance buffers associated with one frame identifier. Caller-owned geometry and textures are not destroyed.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases all renderer-owned frame resources.

## Related pages[​](#related-pages "Direct link to Related pages")

* [`DeferredSceneRenderer`](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md) renders compatible opaque/masked metallic-roughness scenes on WebGPU and falls back to this renderer.
* [`PBREnvironmentGenerator`](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md) generates roughness-prefiltered cubemaps, diffuse irradiance, and BRDF lookup textures.
* [`pbrMaterial`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md) documents canonical physically based shader uniforms and bindings.
* [`GBuffer`](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) documents the deferred attachment model.
* [`@luma.gl/gltf`](https://luma.gl/next/docs/api-reference/gltf.md) owns glTF parsing, material interpretation, environment-image loading, and animation decoding.
