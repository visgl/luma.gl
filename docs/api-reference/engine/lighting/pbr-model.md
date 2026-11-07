# Standalone PBR Models

`createPBRModel` from `@luma.gl/engine/lighting` builds a native `Model` using the canonical
PBR shaders. It accepts ordinary CPU or GPU geometry and a borrowed material, without a
scene graph, scene identifiers, picking buffers, or GPU world-matrix storage.

```typescript
import {SphereGeometry} from '@luma.gl/engine';
import {createPBRMaterial, createPBRModel} from '@luma.gl/engine/lighting';

const material = createPBRMaterial(device, {
  uniforms: {baseColorFactor: [0.7, 0.3, 0.1, 1], metallicRoughnessValues: [0.6, 0.25]}
});
const model = createPBRModel(device, {
  geometry: new SphereGeometry(),
  material,
  defines: {USE_LIGHTS: true},
  parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
});
model.shaderInputs.setProps({
  pbrProjection: {modelMatrix, normalMatrix, modelViewProjectionMatrix, camera},
  lighting: {lights, useByteColors: false}
});
model.draw(renderPass);
model.destroy();
material.destroy();
```

The caller owns the render pass, viewport, camera, light selection, sorting, and submission.
The material can be shared by several models; destroying a model leaves it and its textures alive.

## Geometry and transforms

`CreatePBRModelOptions` extends `ModelProps` with a required `material`.
`getPBRGeometryDefines(geometry)` infers normals, tangents, UV sets, vertex colors, and
skinning from CPU geometry attributes. Source semantics such as `POSITION`, `NORMAL`,
`TANGENT`, `TEXCOORD_0`, `TEXCOORD_1`, `COLOR_0`, `JOINTS_0`, and `WEIGHTS_0` remain intact.
Model upload adapts them to shader-facing attribute names. Supply explicit feature defines
for GPU geometry whose buffer binding keys do not expose the source attribute semantics.
Explicit caller defines override inference.

Supply `pbrProjection` uniforms through `model.shaderInputs`:

- `modelMatrix`: object-to-world transform.
- `normalMatrix`: inverse transpose of the model matrix, represented as a 4x4 matrix.
- `modelViewProjectionMatrix`: projection × view × model.
- `camera`: world-space camera position.

Use the backend's clip-depth convention: [-1, 1] for WebGL, [0, 1] for WebGPU.
The factory does not convert supplied projection matrices. Transforms must be nonsingular. Instancing uses `HAS_INSTANCING` and four per-instance
`float32x4` attributes named `instanceModelMatrixCol0` through `instanceModelMatrixCol3`.
Instance transforms are applied before the model transform, including their inverse-transpose
normal transforms. Reflected model, instance, and skin transforms also preserve tangent-frame
handedness. Set the instance count and instance buffer layouts explicitly.

When `HAS_SKIN` is enabled, the factory includes the `skin` module. Supply its joint palette
through `skin.jointMatrices`. The default portable path supports the skin module's uniform
palette capacity; larger or instance-specific palettes require its explicit bindings/defines.

## Lighting and output

The factory infers material map defines through `getPBRTextureDefines`. Structural changes
to geometry features or material map slots require a compatible model specialization.
Texture contents, ordinary uniform values, and existing deferred backing resources can update
without rebuilding that specialization.

For image-based lighting, set material `IBLenabled: true`, use model defines `USE_IBL`,
`USE_SCENE_ENVIRONMENT`, and `USE_TEX_LOD`, and supply the shared
[environment bindings and uniforms](./pbr-environment.md). Direct lighting uses `USE_LIGHTS`
and the canonical lighting module's props. Material extensions remain in the shader module;
this factory adds no separate BRDF implementation.

A model without caller-provided `shaderInputs` starts with identity object/clip/normal
transforms, camera `[0, 0, 1]`, no tone mapping, and linear output. `USE_SCENE_COLOR_MANAGEMENT`
is enabled so GLSL and WGSL follow the same explicit output controls. For a final display pass,
set `pbrScene` exposure, tone-map mode, and output encoding; intermediate passes should remain
linear. Caller-provided `shaderInputs` are preserved, including their existing defaults.

Alpha-mask rendering uses `ALPHA_CUTOFF` and material `alphaCutoff`. Configure blending,
depth writes, double-sided culling, and draw order with ordinary model/render-pass parameters.
These are caller policies rather than implicit scene management.

The [environment example](/examples/api/prefiltered-environment) renders a grid of native
PBR sphere models with orbit/pan/zoom controls, shared environment lighting, and explicit SDR fallback.

## Camera surface prepass

Use `createPBRSurfaceModel` and `PBRSurfacePass` to render camera depth and encoded
view-space normals through the shared vertex and alpha-cutout paths. See
[PBR surface prepasses](./pbr-surface-pass.md) for output formats, optional mapped normals,
projection conventions, resizing, and ownership.

## Shadows

Set `receiveShadows: true` and bind shadow-map props plus the receiver view matrix.
Use `createPBRShadowModel` for depth-only caster models with the same vertex transforms
and alpha cutouts. See [PBR shadows](./pbr-shadows.md) for per-view uniforms, light-slot
alignment, ownership, and the ground-plane example.

## Specialized shader passes

`PBR_MODEL_WGSL_SHADER` contains the standalone entry points. `getPBRModelWGSL(hooks)` builds
those entry points with optional WGSL snippets for adapter-specific vertex/fragment inputs,
instance transformation, vertex output, fragment declarations, return type, and fragment body.
The fragment body runs after the shared PBR fragment inputs are populated. Input/output
snippets add struct members; instance transformation runs after the instance matrix is formed.
Adapters own attribute locations, bindings, and the validity of their snippets.

Use `ModelProps.source` to supply composed WGSL and `vs`/`fs` for custom GLSL. Hooks are a
WGSL composition facility; they do not translate a custom pass into GLSL. The default
entry points remain free of adapter resources. Existing retained scene adapters compose their
specialized transforms and picking/shadow passes separately.

The example uses the shared InfoBox panels for its description, HDR/SDR status, and camera reset, and is available in the website API gallery.

## Ambient visibility

Set `receiveAmbientOcclusion: true` and bind `pbrAmbientOcclusion` props to attenuate ambient,
environment and lightmap illumination without changing direct lighting or emission.
[Ambient occlusion](./ambient-occlusion.md) documents the mask/viewport contract; the
[lighting effects guide](../../../api-guide/engine/lighting-effects.md) explains how it
combines with contact shadows, shadow maps and environment lighting.
