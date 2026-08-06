import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# DeferredSceneRenderer

<ExperimentalDocsTabs active="deferred-scene-renderer" />

`DeferredSceneRenderer` renders compatible physically based scene descriptions through a WebGPU
G-buffer and a reusable fullscreen deferred-lighting pass. It accepts the same `SceneRenderOptions`
and returns the same statistics as
[`SceneRenderer`](/docs/api-reference/experimental/scene-renderer).

The constructor requires a WebGPU device. A renderer created successfully on WebGPU automatically
uses its shared forward renderer whenever a scene cannot be represented faithfully by the current
metallic-roughness G-buffer. This fallback does not make the deferred constructor available on
WebGL; create `SceneRenderer` directly for that backend.

## Usage

```ts
import {
  DeferredSceneRenderer,
  SceneRenderer,
  supportsDeferredScene,
  type SceneRenderOptions
} from '@luma.gl/experimental';

const renderer =
  device.type === 'webgpu' ? new DeferredSceneRenderer(device) : new SceneRenderer(device);

const options: SceneRenderOptions = {
  id: 'main-scene',
  surfaces,
  camera,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.15},
    {
      type: 'directional',
      color: [1, 1, 1],
      direction: [-0.5, -1, -0.5],
      intensity: 1
    },
    {type: 'point', color: [1, 0.6, 0.3], position: [2, 1, 0], intensity: 6}
  ],
  width,
  height,
  exposure: 1,
  fogColor: [0.02, 0.03, 0.05],
  fogDensity: 0.015
};

console.log('Deferred-compatible scene:', supportsDeferredScene(options));

const statistics = renderer.render(options);
device.submit();

renderer.destroy();
```

`supportsDeferredScene(options)` reports the current scene's compatibility before rendering.
Calling it is optional: `DeferredSceneRenderer.render(options)` performs the same check and
selects forward rendering automatically when required. Rendering records the frame; submit the
device's command queue before presenting or destroying renderer-owned resources.

## Supported deferred scenes

The deferred path accepts opaque or alpha-masked metallic-roughness materials, including normal
PBR factors, authored base-color/metallic/roughness textures, instance transforms, ambient light,
one directional-light selection, point lights, exposure, and exponential fog. `MASK` materials
retain their alpha-cutoff behavior.

The renderer switches the entire scene to the existing forward renderer when any of these are
present:

- A `BLEND` material or base-color alpha that infers blending.
- Any supplied environment-lighting texture.
- Transmission, nonzero thickness, clearcoat, sheen, iridescence, or anisotropy.
- A nondefault index of refraction, specular intensity, specular color, or authored specular map.
- Spot lights, whose direction and cone angles require forward shading.
- More than one directional light, which exceeds the deferred lighting pass's single-light layout.
- An unlit material.
- `debugNormals` or `debugDepth` output.

This is a scene-level decision: one incompatible surface causes all surfaces in that render to use
the forward path, preserving their material semantics, transparent ordering, roughness-aware
image-based lighting, and opaque-scene transmission/refraction.

```ts
const metallicSceneSupported = supportsDeferredScene({
  ...options,
  surfaces: [
    {
      ...surfaces[0],
      material: {
        id: 'metal',
        uniforms: {metallicRoughnessValues: [0.8, 0.25]}
      }
    }
  ]
});

const clearcoatSceneSupported = supportsDeferredScene({
  ...options,
  surfaces: [
    {
      ...surfaces[0],
      material: {
        id: 'coated-metal',
        uniforms: {clearcoatFactor: 0.5}
      }
    }
  ]
});

// true: rendered through the G-buffer.
console.log(metallicSceneSupported);

// false: rendered through the shared forward renderer.
console.log(clearcoatSceneSupported);
```

## Rendering stages

For a compatible scene, the renderer:

1. Retains one [`GBuffer`](/docs/api-reference/experimental/g-buffer) per frame identifier and
   resizes its attachments when the render dimensions change.
2. Reuses `SceneRenderer` surface preparation, PBR material specialization, and instanced model
   batches to draw geometry into scene color, normal/roughness, velocity, and two named material
   attachments: `baseColorMetallic` and `emissiveOcclusion`.
3. Converts ambient, directional, point, and spot light descriptors into deferred scene-light
   inputs; local lights use the existing bounded point-light storage buffer. Spot lights are
   currently approximated as omnidirectional point lights, dropping their authored direction and
   cone angles; use the forward renderer when faithful spot cones are required.
4. Runs [`deferredLighting`](/docs/api-reference/experimental/deferred-lighting) through the
   existing engine `ShaderPassRenderer`, applying exposure and fog in the fullscreen resolve.

The G-buffer, light buffer, deferred shader pass, and lazily created forward-fallback renderer are
owned by `DeferredSceneRenderer`. Application geometry, materials descriptors, textures, and
camera state remain caller-owned.

## Backend and feature boundaries

| Capability | `SceneRenderer` | `DeferredSceneRenderer` |
| --- | --- | --- |
| WebGL | Supported | Constructor rejects the device. |
| WebGPU | Supported | Supported. |
| Opaque and masked metallic-roughness | Forward shading | G-buffer plus deferred lighting. |
| Blended transparency | Sorted forward shading | Automatic forward fallback. |
| Advanced physical material factors | Existing forward PBR shading | Automatic forward fallback. |
| Complete image-based-lighting environment | Forward IBL | Automatic forward fallback. |
| Physical scene-color transmission | Opaque-scene capture and refraction | Automatic forward fallback. |
| Scene instancing | One draw per retained surface | Same instanced geometry preparation. |
| Debug normals/depth | Supported | Automatic forward fallback. |

Deferred rendering currently resolves the shared direct-lighting contract; it does not implement
deferred image-based lighting, transmission/refraction, advanced physical layers, shadows, or
order-independent transparency. Generated
[`PreparedPBREnvironment`](/docs/api-reference/experimental/pbr-environment) resources and
transmissive scenes therefore use the fully featured shared forward path automatically.

## Methods

### `new DeferredSceneRenderer(device: Device)`

Constructs the renderer and its reusable WebGPU lighting resources. Throws when `device.type` is
not `webgpu`.

### `supportsDeferredScene(options: SceneRenderOptions): boolean`

Standalone exported predicate that reports whether every surface and the selected render mode fit
the current deferred material contract.

### `render(options: SceneRenderOptions): SceneRenderStatistics`

Draws a compatible scene through deferred lighting or delegates the same descriptor to the shared
forward renderer. Returns surface, instance, draw, and triangle counts.

### `destroyFrame(frameIdentifier: string): void`

Destroys cached frame models, any matching deferred G-buffer, and matching forward-fallback
resources.

### `destroy(): void`

Destroys all frame buffers, retained models, forward-fallback resources, the point-light storage
buffer, and the deferred-lighting renderer.

## Related pages

- [`SceneRenderer`](/docs/api-reference/experimental/scene-renderer) documents scene descriptors,
  instancing, physical materials, environment resources, captured scene-color transmission,
  skinning, and morph targets.
- [Physically Based Environment Lighting](/docs/api-reference/experimental/pbr-environment)
  describes portable GGX cubemap, diffuse irradiance, and BRDF-LUT generation.
- [`GBuffer`](/docs/api-reference/experimental/g-buffer) describes reusable attachment ownership.
- [`deferredLighting`](/docs/api-reference/experimental/deferred-lighting) describes the fullscreen
  metallic-roughness lighting pass.
- [`ClusteredLightGrid`](/docs/api-reference/experimental/clustered-lighting) documents the
  separately composable clustered-lighting infrastructure.
