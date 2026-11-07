# PBR Shadows

Standalone PBR models can cast and receive directional, spot, and point-light shadows on
WebGPU and WebGL2. Use `createPBRShadowModel` for depth-only caster draws and
`createPBRModel({receiveShadows: true})` for receivers. Both factories are exported from
`@luma.gl/engine/lighting`.

## Caster models

```typescript
const visible = createPBRModel(device, {
  geometry, material, receiveShadows: true, defines: {USE_LIGHTS: true}
});
const caster = createPBRShadowModel(device, {
  geometry, material, defines: {ALPHA_CUTOFF: true}
});
```

A caster uses the same vertex path as the visible model: object transforms, instancing,
skinning, UV sets, and vertex colors. It defaults to no color attachments, `depth32float`,
depth writes, and `less-equal` comparison. Supply the same structural defines, material,
instance attributes, and skin palette as the visible model. Alpha-cutout casters sample
base-color alpha with the selected UV set and material UV transform. Blended transparency
and transmission do not automatically create translucent shadows.

Materials remain borrowed. Destroying either model does not destroy its material or
material textures. Geometry ownership follows ordinary `Model` rules; passing the same
CPU geometry to two factories creates separate uploads.

## Record shadow views

Use [ShadowMapRenderer](./shadow-map-renderer.md) to prepare light views and resources.
Maintain one caster model (or independent uniform storage) per object **per light view**.
Repeatedly updating one model's uniform buffer while recording several passes does not
snapshot its earlier values. Cache these models by light type, light index, cascade index,
and cube face, and destroy the cache with the application.

```typescript
const shadowProps = shadows.render({
  camera: {viewMatrix, projectionMatrix, near, far},
  spotLights,
  prepareShadowCasters(view) {
    const caster = getCasterForView(view);
    caster.shaderInputs.setProps({
      pbrProjection: {
        modelMatrix,
        normalMatrix,
        modelViewProjectionMatrix: new Matrix4(view.viewProjectionMatrix).multiplyRight(modelMatrix),
        camera: lightPosition
      }
    });
    caster.setParameters(view.rasterParameters);
  },
  drawShadowCasters(view) {
    getCasterForView(view).draw(view.renderPass);
  }
});
```

The returned light projection uses [0, 1] clip depth on both backends. Supply it directly
to `createPBRShadowModel`: its WebGL vertex path performs the required [-1, 1] conversion.
Caster culling and alpha policy remain explicit; use the light view's raster parameters
for depth bias. Ordinary visible models still require the backend's own projection convention.

## Receiver models

```typescript
visible.shaderInputs.setProps({
  pbrProjection: {modelMatrix, normalMatrix, modelViewProjectionMatrix, camera},
  lighting: {lights, useByteColors: false},
  shadow: shadowProps,
  pbrShadow: {viewMatrix, enabled: true}
});
visible.draw(renderPass);
```

`receiveShadows: true` includes the `pbrShadow` shader module and enables its mesh entry
point. Provide `shadow` props from the renderer and the **receiver camera view matrix** in
`pbrShadow.viewMatrix` for directional cascade selection. `pbrShadow.enabled` defaults to
true and toggles receiving without replacing maps or bindings. Bind valid resources even
when receiving is disabled. Custom shader sources and caller-owned `shaderInputs` must
include and invoke the matching modules explicitly.

Shadow slots match the order of lights **within each light type** in the `lighting` props.
The first directional light and the first four point and spot lights can receive shadows;
additional lights remain unshadowed, subject to the lighting module's total light capacity.
Keep the light descriptions aligned; use zero shadow strength for an aligned unshadowed
slot. Directional shadow descriptors point toward the light, while `lighting` directional
vectors point along incoming light travel. Area lights are not included in this shadow path.

Factors scale each light's direct material contribution, including clearcoat, sheen, and
diffuse transmission. Ambient light, IBL, lightmaps, emission, and output alpha retain their
own contributions. Output transfer and tone mapping still occur once after lighting.

Record caster views before receiver draws and submit through the application as usual.
After resizing maps or changing capacities/quality, get fresh `shadow` props and rebind
receivers before drawing. Submit earlier work before replacing or destroying resources.

The [PBR Shadows example](/examples/api/pbr-shadows) demonstrates a sphere and animated cube
casting onto an upward-facing ground plane, with light selection, quality/bias controls,
shadow receiving, orbit controls, and camera reset. The example creates separate caster
models for each light view so point faces and directional cascades retain their own uniforms.
