# VertexArray

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `VertexArray` stores a set of vertex attribute bindings, including the index buffer.

On WebGL, attribute can be bound to constants,


## Usage

```typescript
const renderPipeline = device.createRenderPipeline({bufferLayout, ...});
const vertexArray = device.createVertexArray({renderPipeline});

vertexArray.setIndexBuffer(device.createBuffer({usage: Buffer.INDEX, ...));
vertexArray.setBuffer(0, device.createBuffer({usage: Buffer.VERTEX, ...));
vertexArray.setConstant(1, new Float32Array([1, 2, 3]));

const renderPipeline.setVertexArray(vertexArray);
```

## Types

### `VertexArrayProps`

| Property         | Type             | Description                                                                                            |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `renderPipeline` | `RenderPipeline` | Layout of attributes (type, size, step mode etc) will match the pipeline's shaderLayout/bufferLayouts. |


## Members

- `device`: `Device` - holds a reference to the `Device` that created this `VertexArray`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `VertexArrayProps` - holds a copy of the `VertexArrayProps` used to create this `VertexArray`.

## Methods

### `constructor(props: VertexArrayProps)`

`VertexArray` is an abstract class and cannot be instantiated directly. Create with `device.beginVertexArray(...)`.

### setIndexBuffer

```typescript
vertexArray.setIndexBuffer(location: number, buffer | null): void
```

Note that the index buffer can be unbound by calling `vertexArray.setUb

### setBuffer(location: number): void

```typescript
vertexArray.setBuffer(location: number, buffer | null): void
```

### setConstant(location: number: Float32Array | Int32Array | Uint32Array): void

```typescript
vertexArray.setConstant(location: number, buffer | null): void
```

Note:
- Under WebGL, a WebGL VertexArrayObject will be created.
- Under WebGPU, this is a simply an API class that holds attributes.

