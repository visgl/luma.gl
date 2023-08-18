# ComputePass

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

:::info
WebGPU only
:::

A pass on which to run computations with compute pipelines.

## Types

### `ComputePassProps`

| Property | Type | Description |
| -------- | ---- | ----------- |
| N/A      |      |             |

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `ComputePass`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `ComputePassProps` - holds a copy of the `ComputePassProps` used to create this `ComputePass`.

## Methods

### `constructor(props: ComputePassProps)`

`ComputePass` is an abstract class and cannot be instantiated directly. Create with `device.beginComputePass(...)`.

### `endPass(): void`

Free up any GPU resources associated with this render pass.

### `pushDebugGroup(groupLabel: string): void`

Adds a debug group (implementation dependent).

### `popDebugGroup(): void`

Removes a debug group (implementation dependent).

### `insertDebugMarker(markerLabel: string): void`

Adds a debug marker (implementation dependent).
