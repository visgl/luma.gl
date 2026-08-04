# VertexArray

[Shader](https://luma.gl/next/docs/api-reference/core/resources/shader.md)[RenderPipeline](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md)[ComputePipeline](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md)[VertexArray](https://luma.gl/next/docs/api-reference/core/resources/vertex-array.md)[TransformFeedback](https://luma.gl/next/docs/api-reference/core/resources/transform-feedback.md)

A `VertexArray` stores a set of vertex attribute bindings, including the index buffer.

On WebGL, attribute can be bound to constants,

## Usage[​](#usage "Direct link to Usage")

```
const renderPipeline = device.createRenderPipeline({bufferLayout, ...});

const vertexArray = device.createVertexArray({renderPipeline});



vertexArray.setIndexBuffer(device.createBuffer({usage: Buffer.INDEX, ...));

vertexArray.setBuffer(0, device.createBuffer({usage: Buffer.VERTEX, ...));

vertexArray.setConstant(1, new Float32Array([1, 2, 3]));



const renderPipeline.setVertexArray(vertexArray);
```

## Types[​](#types "Direct link to Types")

### `VertexArrayProps`[​](#vertexarrayprops "Direct link to vertexarrayprops")

| Property         | Type             | Description                                                                                            |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `renderPipeline` | `RenderPipeline` | Layout of attributes (type, size, step mode etc) will match the pipeline's shaderLayout/bufferLayouts. |

## Members[​](#members "Direct link to Members")

* `device`: `Device` - holds a reference to the `Device` that created this `VertexArray`.
* `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
* `props`: `VertexArrayProps` - holds a copy of the `VertexArrayProps` used to create this `VertexArray`.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: VertexArrayProps)`[​](#constructorprops-vertexarrayprops "Direct link to constructorprops-vertexarrayprops")

`VertexArray` is an abstract class and cannot be instantiated directly. Create with `device.beginVertexArray(...)`.

### setIndexBuffer[​](#setindexbuffer "Direct link to setIndexBuffer")

```
vertexArray.setIndexBuffer(location: number, buffer | null): void
```

Note that the index buffer can be unbound by calling \`vertexArray.setUb

### setBuffer(location: number): void[​](#setbufferlocation-number-void "Direct link to setBuffer(location: number): void")

```
vertexArray.setBuffer(location: number, buffer | null): void
```

### setConstant(location: number: Float32Array | Int32Array | Uint32Array): void[​](#setconstantlocation-number-float32array--int32array--uint32array-void "Direct link to setConstant(location: number: Float32Array | Int32Array | Uint32Array): void")

```
vertexArray.setConstant(location: number, buffer | null): void
```

Note:

* Under WebGL, a WebGL VertexArrayObject will be created.
* Under WebGPU, this is a simply an API class that holds attributes.
