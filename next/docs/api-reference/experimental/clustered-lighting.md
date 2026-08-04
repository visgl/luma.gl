# Clustered Lighting

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`ClusteredLightGrid` is an experimental WebGPU-only compute stage for many-light deferred rendering. It projects view-space point-light spheres into a fixed screen/depth grid, atomically marks candidate-light bit masks, compacts one stable bounded light-index list per cluster, and normally lets `clusteredDeferredLighting` evaluate only the list for the current pixel. Saturated clusters use the all-active-light correctness fallback described below.

The first implementation intentionally keeps the contract small and composable:

* geometry still writes the ordinary `GBuffer` material attachments;
* point-light records still use `makeDeferredPointLightBufferData()`;
* one compute pass owns cluster binning;
* one fullscreen shader-pass pipeline owns lighting;
* later effects still consume the unchanged scene color, depth, normal, and velocity channels.

### Deferred Rendering: Illumination Lab

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/deferred-rendering)Info

InfoSource

```
// Loading source…
```

## Cluster contract[​](#cluster-contract "Direct link to Cluster contract")

The default grid is `16 × 9 × 24`: normalized screen x/y tiles plus logarithmic view-depth slices between the camera near and far planes. Each cluster retains up to 64 light indices. `MAX_CLUSTERED_POINT_LIGHTS` is 512.

`ClusteredLightGrid` owns two storage buffers:

| Binding               | Payload                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `clusterLightCounts`  | Candidate count for each cluster. Values may exceed the retained capacity so debug views can expose overflow pressure. |
| `clusterLightIndices` | Fixed-stride light-index list: `clusterIndex * maxLightsPerCluster + slot`.                                            |

The fullscreen resolve uses the compact list while it fits. Overflow is compacted in stable light-index order, then saturated pixels fall back to checking the active prefix of the fixed-size point-light buffer so the image stays correct instead of exposing cluster-shaped truncation artifacts or reusing stale light records. That fallback is intentionally slower and makes the occupancy debug view useful for tuning dimensions, light ranges, and retained capacity.

## Usage[​](#usage "Direct link to Usage")

```
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

Point-light positions are view-space values. Rebuild the grid after updating the light buffer and before encoding the fullscreen resolve. The grid does not own the `GBuffer`, renderer, material packing, camera, or point-light buffer.

## API[​](#api "Direct link to API")

### `new ClusteredLightGrid(device, props?)`[​](#new-clusteredlightgriddevice-props "Direct link to new-clusteredlightgriddevice-props")

Creates the count/index storage buffers and the two compute kernels that clear and repopulate them. The optional props are `clusterDimensions`, `maxLightsPerCluster`, `maxLightCount`, and `id`.

### `encode(commandEncoder, options): void`[​](#encodecommandencoder-options-void "Direct link to encodecommandencoder-options-void")

Encodes clear and binning dispatches into the supplied command encoder. `options` contains the point-light buffer and active count plus the projection matrix and near/far planes.

### `getShaderPassBindings()`[​](#getshaderpassbindings "Direct link to getshaderpassbindings")

Returns `clusterLightCounts` and `clusterLightIndices` for `clusteredDeferredLighting`.

### `getShaderPassUniforms(nearPlane, farPlane)`[​](#getshaderpassuniformsnearplane-farplane "Direct link to getshaderpassuniformsnearplane-farplane")

Returns the dimensions, retained capacity, active point-light count from the latest `encode()`, and logarithmic depth-range uniforms needed by the fullscreen resolve.

### `createClusteredDeferredLightingShaderPassPipeline()`[​](#createclustereddeferredlightingshaderpasspipeline "Direct link to createclustereddeferredlightingshaderpasspipeline")

Returns a one-step `ShaderPassPipeline` that resolves the current cluster's point-light list into the ordered `previous` color chain.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) documents the shared G-buffer material contract and the fixed 64-light baseline resolve.
* [GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) owns the scene MRT attachments.
* [Shader Passes](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) explains ordered fullscreen composition.
