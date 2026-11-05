# Function: makeGPUVectorGeometry()

> **makeGPUVectorGeometry**(`device`, `geometry`): [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md)

Defined in: [modules/engine/src/geometry/gpu-vector-geometry-adapter.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry-adapter.ts#L16)

Interleaves and uploads CPU geometry for use with GPUVectorModel. The returned geometry owns its uploaded buffers; call destroy() after all models stop using it.

## Parameters[​](#parameters "Direct link to Parameters")

### device[​](#device "Direct link to device")

`Device`

### geometry[​](#geometry "Direct link to geometry")

`Geometry`

## Returns[​](#returns "Direct link to Returns")

[`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md)
