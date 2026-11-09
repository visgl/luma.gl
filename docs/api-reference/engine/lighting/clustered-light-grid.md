# ClusteredLightGrid

`ClusteredLightGrid` builds WebGPU point-light candidate lists for screen tiles and logarithmic depth slices. A renderer uses these lists to reduce the lights evaluated at each pixel. Clustering does not calculate shadows or ambient visibility.

```typescript
import {ClusteredLightGrid, CLUSTERED_POINT_LIGHT_LAYOUT} from '@luma.gl/engine/lighting';

const grid = new ClusteredLightGrid(device, {
  clusterDimensions: [16, 9, 24],
  maxLightCount: 512,
  maxLightsPerCluster: 64
});
grid.encode(device.commandEncoder, {
  pointLights, pointLightCount, projectionMatrix, nearPlane: 0.1, farPlane: 100
});
const bindings = grid.getBindings();
const uniforms = grid.getUniforms();
// Record a consumer using these buffers, then submit through the application.
```

## Inputs

`pointLights` is a borrowed same-device storage buffer. Each record contains eight float32 values (32 bytes): view-space position at byte 0, influence radius at byte 12, and four consumer-owned payload values at byte 16. The grid ignores the payload. `CLUSTERED_POINT_LIGHT_LAYOUT` exposes these offsets and stride. Supply at least one record even with zero active lights. `pointLightCount` selects the active prefix and cannot exceed buffer or grid capacity.

Use a rigid camera view transform, negative Z forward, nonnegative finite radii, and positive `nearPlane < farPlane`. Standard perspective and orthographic projections are supported. Screen coordinates use a top-left origin. Projection and depth range must match the consumer. Dimensions and capacities are fixed; create another grid to change them. The default maximum light count is 512, not a hardware limit.

## Outputs and lookup

`getBindings()` returns owned storage buffers `clusterLightCounts` and `clusterLightIndices`. Counts contain total candidate membership, including overflow. Each cluster has `maxLightsPerCluster` index slots. Read only `min(count, maxLightsPerCluster)` slots; unused slots are unspecified. Retained indices are in ascending input-record order. Consumers may instead use total counts to detect overflow and implement their own fallback.

`getUniforms()` returns a snapshot of dimensions, capacity, active count and the latest encoded near/far range. Call it after encoding. `getShaderPassBindings()` and `getShaderPassUniforms(near, far)` remain compatibility accessors; the latter retains caller-supplied depth parameters.

The `clusteredLightGrid` shader module from `@luma.gl/shaders` provides WGSL `clusteredLightGrid_getIndex(coordinates, viewDepth, dimensions, nearPlane, farPlane)`. Pass normalized top-left screen coordinates, positive view depth and `vec3u` dimensions. Flattening is `(depthSlice * countY + tileY) * countX + tileX`.

Binning is conservative: candidate lists may contain lights that do not illuminate the final surface. Consumers must perform their own distance and material calculations.

## Recording and ownership

`encode()` clears previous membership and records compute dispatches on the supplied encoder. It never submits or reads back. Record one encode/consume sequence per grid per submission; use separate grids for independently recorded views. Keep input and output resources alive until submitted work can safely use them.

The grid owns its computations, uniforms, scratch buffers and output buffers. It borrows the input buffer and encoder. `destroy()` is idempotent and releases only owned resources. Returned bindings must not be used afterward. WebGL is unsupported; applications choose another light-selection path explicitly.

The [PBR Shadows example](/examples/api/pbr-shadows) includes a WebGPU cluster-occupancy preview. Eight horizontal bands show depth slices for moving sample lights, with overflow highlighted. It consumes the GPU counts directly without CPU readback.
