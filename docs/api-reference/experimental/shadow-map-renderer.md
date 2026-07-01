import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# ShadowMapRenderer

<ExperimentalDocsTabs active="shadow-map-renderer" />

`ShadowMapRenderer` is an experimental WebGPU-only light-space shadow system. It owns stable
cascaded directional maps, spot arrays, point-light cube arrays, and the samplers used by the
`shadow` WGSL module. Applications retain scene traversal and draw their own shadow casters.

## Usage

```ts
import {Model, ShaderInputs} from '@luma.gl/engine';
import {ShadowMapRenderer, shadow} from '@luma.gl/experimental';

const renderer = new ShadowMapRenderer(device, {quality: 'Balanced'});
const shaderInputs = new ShaderInputs({shadow});

const shadowProps = renderer.render({
  camera: {viewMatrix, projectionMatrix, near: 0.1, far: 200},
  directionalLights: [{direction: [0.4, 0.8, 0.3]}],
  spotLights: [{position: [0, 10, 0], direction: [0, -1, 0], range: 40, outerConeAngle: 0.45}],
  pointLights: [{position: [0, 4, 0], range: 18}],
  drawShadowCasters: view => {
    const casterModel = casterModels[getViewIndex(view)];
    casterModel.shaderInputs.setProps({caster: {viewProjectionMatrix: view.viewProjectionMatrix}});
    casterModel.setParameters(view.rasterParameters);
    casterModel.draw(view.renderPass);
  }
});

shaderInputs.setProps({shadow: shadowProps});
```

The callback runs once per directional cascade, spot map, and point cube face. It receives an
already-open depth-only render pass. When several views are recorded before submission, use
independent uniform buffers or models per view; repeatedly rewriting one uniform buffer would make
all recorded draws observe its final value.

## Shader integration

Add `shadow` to a WebGPU model and apply the returned visibility to each direct-light term:

```wgsl
let sunVisibility = shadow_getDirectionalFactor(worldPosition, worldNormal, viewDepth);
let spotVisibility = shadow_getSpotFactor(spotIndex, worldPosition, worldNormal);
let pointVisibility = shadow_getPointFactor(pointIndex, worldPosition, worldNormal);

color += sunDirect * sunVisibility;
color += spotDirect * spotVisibility;
color += pointDirect * pointVisibility;
```

Ambient, emissive, and indirect terms stay outside these multiplications. Shadows therefore cannot
be implemented correctly as a color-only postprocess.

The module uses bind group 2 and binds `depth32float` `texture_depth_2d_array` resources for
directional and spot maps, a `texture_depth_cube_array` for point lights, one non-filtering depth
sampler, and one comparison sampler. PCSS performs explicit-LOD blocker search and variable-radius
comparison filtering.

## Quality presets

| Quality | Cascades | Directional | Spot | Point face | Blocker/filter | Contact scale/steps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Low | 3 | 1024 | 512 | 256 | 8 / 12 | 0.5 / 12 |
| Balanced | 4 | 1536 | 1024 | 512 | 16 / 24 | 0.75 / 24 |
| Cinematic | 4 | 2048 | 2048 | 1024 | 24 / 48 | 1.0 / 40 |

Capacities default to one directional, one spot, and one point light. Configurable hard limits are
one directional, four spot, and four point lights. `setProps()` rebuilds resources only when the
effective quality, capacity, cascade count, or map size changes.

## Contact refinement

`createContactShadowShaderPassPipeline({quality})` creates a depth ray-march, two depth/normal-aware
bilateral passes, and a composite. Bind camera depth, view-space normals, projection matrices, the
primary directional-light vector, and a texture containing that light's already-shadowed direct
contribution. The composite subtracts only the occluded directional direct term, preserving ambient
and emissive lighting. Run contact refinement immediately after scene shading and before SSAO, SSR,
fog, outlines, TAA, and motion blur.

## Lifecycle

- The renderer rejects non-WebGPU devices and active light counts above configured capacities.
- `render()` records commands but never submits, allocates, or reads GPU data.
- `destroy()` is idempotent and releases textures, layer views, framebuffers, and samplers.
