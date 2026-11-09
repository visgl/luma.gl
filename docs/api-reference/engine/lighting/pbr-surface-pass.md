# PBR Surface Prepass

`PBRSurfacePass` and `createPBRSurfaceModel` from `@luma.gl/engine/lighting` prepare camera
depth and view-space normals on WebGPU and WebGL2. They provide input surfaces for
screen-space effects without owning a scene, selecting objects, or submitting commands.

```typescript
import {PBRSurfacePass, createPBRSurfaceModel} from '@luma.gl/engine/lighting';

const surfaces = new PBRSurfacePass(device, {width, height});
const model = createPBRSurfaceModel(device, {
  geometry,
  material,
  defines: {ALPHA_CUTOFF: true},
  parameters: {cullMode: 'none'}
});

model.shaderInputs.setProps({
  pbrProjection: {modelMatrix, normalMatrix, modelViewProjectionMatrix, camera},
  pbrSurface: {viewMatrix, useMaterialNormals: false}
});
surfaces.render({
  drawSurfaces: view => model.draw(view.renderPass)
});
// Record consumers of surfaces.normalTexture and surfaces.depthTexture, then submit.
```

## Output contract

| Output | Format | Meaning |
| --- | --- | --- |
| `normalTexture.rgb` | `rgba8unorm` | A normalized view-space normal encoded as `normal * 0.5 + 0.5`. Decode with `normalize(rgb * 2 - 1)`. |
| `normalTexture.a` | Same texture | One for covered surface pixels; zero for background and alpha-cutout holes. This is a validity mask, not material opacity. |
| `depthTexture` | `depth32float` | Hardware depth in [0, 1], cleared to one. It is nonlinear with perspective projection. |

Targets are single-sampled, linear, and sampleable with nearest filtering. There is no
HDR render-target requirement, lighting calculation, tone mapping, or color transfer.
Normals have eight-bit-per-channel quantization. Background normal RGB is [0.5, 0.5, 1];
use alpha validity rather than interpreting that RGB as a surface.

Supply the same backend-appropriate camera projection used for visible PBR draws:
OpenGL [-1, 1] clip Z for WebGL2, [0, 1] for WebGPU. WebGL's hardware depth conversion makes
the stored depth [0, 1] on both backends. Unlike the shadow-caster helper, this factory
does not convert a zero-to-one light projection for WebGL.

The view-space camera looks down -Z; positive X is right and positive Y is up. Supply a
rigid world-to-view matrix in `pbrSurface.viewMatrix` (identity by default). Depth and
normals use the same camera and resolution. Texture rows retain backend conventions:
WebGPU screen UV has a top-left origin, WebGL framebuffer texture UV a bottom-left origin.
For reconstruction, convert sampled depth to the camera's clip-Z convention and apply
its inverse projection, using the matching UV origin. Do not mix projection conventions
or independently flip one input texture.

## Mesh and material behavior

`createPBRSurfaceModel` returns an ordinary `Model`. It shares the PBR vertex path for
model transforms, normals/tangents, vertex colors, skinning, and instancing, and the PBR
alpha-cutout path for base-color alpha, selected UV set, and material UV transform.
Supply the same feature defines, skin palette, and instance attributes as the visible model.
Geometries without normal attributes use backend-correct position derivatives.

Geometric normals are the default. Set `pbrSurface.useMaterialNormals: true` to include the
canonical normal and bump maps, with their UV selection/transforms and scale factors.
The normal is then transformed into view space. `DOUBLE_SIDED` flips authored back-face
normals consistently with the PBR material shader; culling remains a pipeline parameter.
Derivative normals already face the viewer. Clearcoat-specific normals are not a separate output.

The model defaults to one `rgba8unorm` color attachment, `depth32float`, depth writes, and
`less-equal` comparison. The pass sets its viewport to the attachment size, including on
WebGL. Blended transparency and transmission do not resolve multiple surface layers;
select the surfaces and alpha policy appropriate to the consuming effect.

## Ownership, callbacks, and resizing

`PBRSurfacePass` owns its framebuffer and both textures. Texture getters return borrowed
resources. It does not own draw models, geometry, materials, or material textures.
`prepareSurfaces`, when supplied, runs before opening the pass so callers can allocate
or upload per-object data. `drawSurfaces` records draws inside the pass, which is ended
even if the callback throws. The application owns command submission.

Use independent uniform storage for distinct draws recorded into one command buffer;
repeated writes to a shared buffer do not snapshot earlier draws. Record the prepass before
its texture consumers. Match the visible camera, jitter, viewport, transforms, and alpha
policy when comparing the outputs with a visible frame.

`resize({width, height})` keeps resources for an unchanged size. For a changed size it
allocates replacements, then destroys the previous resources. Consumers must fetch and
rebind both texture getters afterward. Dimensions must be positive integers within the
device limits. Submit previously recorded work before resizing or destroying; do not
resize or destroy the owner from its render callbacks.

`destroy()` is idempotent and releases owned resources. Models and materials remain
usable independently. Destroy them separately when the application finishes:

```typescript
surfaces.destroy();
model.destroy();
material.destroy();
```

The prepass produces input textures. Consuming effects own their sampling, filtering,
temporal history, and composition.
