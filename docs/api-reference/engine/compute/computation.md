# Computation

The `Computation` class is a high-level class in the luma.gl API. It brings together all GPU functionality needed to run GPU compute shaders, in a single, easy-to-use interface.

`Computation` manages the following responsibilities:
- **bindings** these can reference textures and uniform buffers
- **shader module injection**
- **debugging** - Detailed debug logging of draw calls

The `Computation` class integrates with 
- The `@luma.gl/shadertools` shader module system: [see `Shader Assembly`]( /docs/api-reference/shadertools/shader-assembler).

## Usage

```typescript
import {Computation} from `@luma.gl/engine`;
```

One of the simplest way to provide attribute data is by using a Geometry object.

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```typescript
import {Computation} from `@luma.gl/engine`;
// construct the model.
const model = new Computation(device, {
  source: COMPUTE_SHADER,
  bindings: {
    uSampler: texture
  },
})
```

### Provide attribute data using Buffer

When using `Buffer` objects, data remains on GPU and same `Buffer` object can be shared between multiple models.

```typescript
// construct the model.
const model = new Computation(device, {
  source: COMPUTE_SHADER,
  attributes: {
    attributeName1: bufferObject,
    attributeName2: device.createBuffer(new Float32Array(...))
  },
  uniforms: {uSampler: texture},
})
```

On each frame, call the `model.draw()` function after updating any uniforms (typically matrices).

```ts
model.setUniforms({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: current ComputationViewMatrix
});
model.draw();
```

Debug shader source (even when shader successful)
```ts
// construct the model.
const model = new Computation(device, {
  source: COMPUTE_SHADER,
  debugShaders: 'always'
});
```

## Types

### `ComputationProps`

| Property           | Type                                           | Description                                                                       |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `source`               | `Shader` \| _string_                           | A vertex shader object, or source as a string.                                    |
| `modules`          |                                                | shader modules to be applied (shadertools).                                       |
| `pipelineFactory?` |                                                | `PipelineFactory` to use for program creation and caching.                        |
| `debugShaders?`    | `'error' \| 'never' \| 'warnings' \| 'always'` | Specify in what triggers the display shader compilation log (default: `'error'`). |

`ComputationProps` also include `ComputePipelineProps`, which are passed through to the `ComputePipeline` constructor, e.g:

| Property          | Type                       | Description                                                                             |
| ----------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `layout`          | `ShaderLayout`             | Describes how shader attributes and bindings are laid out.                              |
| `bindings?`       | `Record<string, any>`      |                                                                                         |


## Fields

### `pipeline: ComputePipeline`

The model's `ComputePipeline` instance

## Methods

### `constructor(device: Device, props: ComputationProps)`

The constructor for the Computation class. Use this to create a new Computation.

### `destroy(): void`

Free GPU resources associated with this model immediately, instead of waiting for garbage collection.

### `dispatch(pass: ComputePass, x, y, z)`

Renders the model with provided uniforms, attributes and samplers

```typescript
computation.dispatch(computePass, 1);
```
