import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {DeferredRenderingExample} from '@site/src/examples';

# Clustered Lighting

<ExperimentalDocsTabs active="clustered-lighting" />

`ClusteredLightGrid` is an experimental WebGPU-only compute stage for many-light deferred
rendering. It projects view-space point-light spheres into a fixed screen/depth grid, atomically
marks candidate-light bit masks, compacts one stable bounded light-index list per cluster, and
lets `clusteredDeferredLighting` evaluate only the list for the current pixel.

The first implementation intentionally keeps the contract small and composable:

- geometry still writes the ordinary `GBuffer` material attachments;
- point-light records still use `makeDeferredPointLightBufferData()`;
- one compute pass owns cluster binning;
- one fullscreen shader-pass pipeline owns lighting;
- later effects still consume the unchanged scene color, depth, normal, and velocity channels.

<DeferredRenderingExample embedded showStats={false} />

## Cluster contract

The default grid is `16 × 9 × 24`: normalized screen x/y tiles plus logarithmic view-depth
slices between the camera near and far planes. Each cluster retains up to 64 light indices.
`MAX_CLUSTERED_POINT_LIGHTS` is 512.

`ClusteredLightGrid` owns two storage buffers:

| Binding | Payload |
| --- | --- |
| `clusterLightCounts` | Candidate count for each cluster. Values may exceed the retained capacity so debug views can expose overflow pressure. |
| `clusterLightIndices` | Fixed-stride light-index list: `clusterIndex * maxLightsPerCluster + slot`. |

The fullscreen resolve uses the compact list while it fits. Overflow is compacted in stable
light-index order, then saturated pixels fall back to checking the full fixed-size point-light
buffer so the image stays correct instead of exposing cluster-shaped truncation artifacts. That
fallback is intentionally slower and makes the occupancy debug view useful for tuning dimensions,
light ranges, and retained capacity.

## Usage

```ts
import {Buffer} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  ClusteredLightGrid,
  createClusteredDeferredLightingShaderPassPipeline,
  makeDeferredPointLightBufferData,
  MAX_CLUSTERED_POINT_LIGHTS
} from '@luma.gl/experimental';

const pointLights = device.createBuffer({
  data: makeDeferredPointLightBufferData([], MAX_CLUSTERED_POINT_LIGHTS),
  usage: Buffer.STORAGE | Buffer.COPY_DST
});

const clusteredLightGrid = new ClusteredLightGrid(device, {
  maxLightCount: MAX_CLUSTERED_POINT_LIGHTS
});

pointLights.write(makeDeferredPointLightBufferData(viewLights, MAX_CLUSTERED_POINT_LIGHTS));
clusteredLightGrid.encode(device.commandEncoder, {
  pointLights,
  pointLightCount: viewLights.length,
  projectionMatrix,
  nearPlane,
  farPlane
});

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [createClusteredDeferredLightingShaderPassPipeline()],
  colorFormat: 'rgba16float'
});

renderer.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: {
    depthTexture: gBuffer.depthTexture,
    normalTexture: gBuffer.normalRoughnessTexture,
    baseColorMetallicTexture: gBuffer.getExtraColorTexture('baseColorMetallic'),
    emissiveOcclusionTexture: gBuffer.getExtraColorTexture('emissiveOcclusion'),
    pointLights,
    ...clusteredLightGrid.getShaderPassBindings()
  },
  uniforms: {
    clusteredDeferredLighting: {
      inverseProjectionMatrix,
      ambientColor,
      directionalLightDirectionView,
      directionalLightColor,
      directionalLightIntensity,
      ...clusteredLightGrid.getShaderPassUniforms(nearPlane, farPlane)
    }
  }
});
```

Point-light positions are view-space values. Rebuild the grid after updating the light buffer and
before encoding the fullscreen resolve. The grid does not own the `GBuffer`, renderer, material
packing, camera, or point-light buffer.

## API

### `new ClusteredLightGrid(device, props?)`

Creates the count/index storage buffers and the two compute kernels that clear and repopulate them.
The optional props are `clusterDimensions`, `maxLightsPerCluster`, `maxLightCount`, and
`id`.

### `encode(commandEncoder, options): void`

Encodes clear and binning dispatches into the supplied command encoder. `options` contains the
point-light buffer and active count plus the projection matrix and near/far planes.

### `getShaderPassBindings()`

Returns `clusterLightCounts` and `clusterLightIndices` for
`clusteredDeferredLighting`.

### `getShaderPassUniforms(nearPlane, farPlane)`

Returns the dimensions, retained capacity, and logarithmic depth-range uniforms needed by the
fullscreen resolve.

### `createClusteredDeferredLightingShaderPassPipeline()`

Returns a one-step `ShaderPassPipeline` that resolves the current cluster's point-light list into
the ordered `previous` color chain.

## Related pages

- [Deferred Lighting](/docs/api-reference/experimental/deferred-lighting) documents the shared
  G-buffer material contract and the fixed 64-light baseline resolve.
- [GBuffer](/docs/api-reference/experimental/g-buffer) owns the scene MRT attachments.
- [Shader Passes](/docs/api-guide/shaders/shader-passes) explains ordered fullscreen composition.
