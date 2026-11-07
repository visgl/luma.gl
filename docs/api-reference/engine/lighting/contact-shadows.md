# Directional Contact Shadows

`ContactShadowPass` from `@luma.gl/engine/lighting` traces short screen-space rays through
camera depth, then applies bilateral filtering to produce a directional-light visibility
texture. It accepts the depth and encoded view normals from [PBRSurfacePass](./pbr-surface-pass.md)
on WebGPU and WebGL2. It does not capture surfaces, select lights, or submit commands.

```typescript
import {ContactShadowPass, createPBRModel} from '@luma.gl/engine/lighting';

const contacts = new ContactShadowPass(device, {quality: 'balanced'});
const receiver = createPBRModel(device, {
  geometry, material, receiveContactShadows: true, defines: {USE_LIGHTS: true}
});

// First record the camera surface prepass, then trace/filter its outputs.
const visibility = contacts.render({
  depthTexture: surfaces.depthTexture,
  normalTexture: surfaces.normalTexture,
  projectionMatrix,
  lightDirectionView,
  maxDistance: 1,
  thickness: 0.06,
  normalBias: 0.01
});
receiver.shaderInputs.setProps({
  lighting: {lights, useByteColors: false},
  pbrContactShadow: {
    contactShadowTexture: visibility,
    viewport: [0, 0, width, height],
    strength: 1,
    enabled: true
  }
});
// Record receiver draws, then submit through the application as usual.
```

## Camera and input contract

Inputs must be same-device, single-sample textures of the same camera and physical
resolution. Depth is hardware depth in [0, 1], cleared to one. Normals are view-space
unit vectors encoded as `normal * 0.5 + 0.5` in a linear RGB texture. Use geometric normals
for stable biasing. The trace treats cleared/far depth as background.

Supply the backend-native camera projection: [-1, 1] clip Z on WebGL2 and [0, 1] on WebGPU.
The pass computes its inverse and reconstructs view positions with the appropriate UV
origin and clip-depth conversion. Orthographic and perspective projections are supported.
Depth, normals, projection, camera jitter, and output viewport must describe the same frame.

`lightDirectionView` points **toward** the directional light, in view space, and must be
nonzero. Transform a world-space surface-to-light direction by the rigid camera view
matrix with homogeneous W zero. The canonical `lighting` directional vector points along
light travel; negate it before this transform.

## Trace and filtering controls

`quality` selects `low`, `balanced`, or `cinematic` sampling and intermediate-resolution
budgets from `SHADOW_QUALITY_SETTINGS`. The returned visibility texture is always full input
resolution, `rgba8unorm`, with visibility in RGB and alpha one. White means unoccluded.

Per-frame controls include:

- `maxDistance`: ray length in scene units.
- `thickness`: depth-hit tolerance in scene units; larger values can bridge thin gaps.
- `normalBias`: displacement along the decoded view normal, in scene units.
- `stepCount`: sample budget, up to 40 steps; the quality preset supplies the default.
- `frameIndex`: deterministic sampling seed, zero by default. Changing it does not enable temporal accumulation.

The pipeline performs trace, horizontal bilateral blur, and vertical bilateral blur.
Filtering uses depth and normal agreement to reduce cross-surface bleeding. The generic
`ShaderPassRenderer` owns execution and intermediate targets; no parallel fullscreen
execution framework is introduced.

## PBR composition

`receiveContactShadows: true` includes the `pbrContactShadow` shader module and applies its
visibility to the **first directional light** in the canonical lighting props. Other
directional lights, point/spot/area lights, ambient light, IBL, lightmaps, emission, and
output alpha retain their own contributions. This version does not trace point or spot
contact rays or bind several contact masks to one model.

`pbrContactShadow.viewport` is [origin X, origin Y, width, height] for the receiver viewport,
in physical pixels and native framebuffer coordinates. It is required for correct mask
lookup; the default unit viewport is only a placeholder. `strength` mixes toward full
visibility; `enabled: false` disables receiving while retaining bindings. A valid mask
texture remains required while the module is enabled structurally.

If `receiveShadows` is also enabled, bind ordinary shadow-map props and the receiver view
matrix as described in [PBR shadows](./pbr-shadows.md). The first directional light uses
`min(mapVisibility, contactVisibility)` to avoid multiplying two estimates of the same
occlusion. Contact receiving remains independent of `pbrShadow.enabled`; point and spot
shadow-map contributions remain unchanged. Tone mapping and output encoding run once after
light accumulation.

## Ownership and lifetime

`render` borrows its inputs and records the trace/filter chain on the device command
encoder. Submit before destroying or replacing inputs. It returns a borrowed, renderer-owned
texture; bind the returned texture every frame because ping-pong ownership can alternate.
An input-size change automatically resizes intermediate/output targets and destroys old
allocations. Previously retained output references must be replaced.

The pass contains no history. Re-rendering without an occluder resets visibility rather
than retaining a prior hit. `destroy()` is idempotent and releases owned execution resources;
input depth/normal textures, receiver models, and materials remain caller-owned.

## Shader-pass consumers

`@luma.gl/shaders` exports `contactShadowTrace`, `contactShadowBilateralBlur`, and
`contactShadowComposite` with WGSL and GLSL implementations and generic texture bindings.
`createContactShadowCompositeShaderPass` in engine lighting supplies a complete color
composition chain when the caller already has an isolated directional-direct-light texture.
That composite subtracts only the occluded part of the supplied direct contribution; it
requires the matching direct-light input rather than multiplying the entire lit color.
Use the visibility/PBR workflow above for composition with standalone shadow-map receivers.

## Limits

Screen-space tracing cannot see offscreen occluders, hidden depth layers, or geometry
absent from the surface prepass. Thin geometry, depth discontinuities, camera motion, ray
length, and thickness affect approximation quality. Large distances need shadow maps.
There is no temporal history, reprojection, translucent transport, or ray-traced visibility.
