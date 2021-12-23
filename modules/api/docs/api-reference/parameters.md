# Parameter API v9

> This section describes the experimental, work-in-progress v9 luma.gl API.

The luma.gl API proves a unified key/value style API enabling applications to set all WebGPU or WebGL parameters with a single plain, non-nested JavaScript object.

## Usage

To set up depth testing

```js
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```

## Parameters

Describes luma.gl setting names and values

### Rasterization Parameters

These parameters control the rasterization stage (which happens before fragment shader runs).

| Function     | Description                              | Values                  | WebGL counterpart |
| ---------    | ----------------------------------       | ---                     | --- |
| `cullMode`   | Which face to cull                       | **`'none'`**, `'front'`, `'back'` | [`gl.cullFace`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace) |
| `frontFace`  | Which triangle winding order is front    | **`ccw`**, `cw`             | [`gl.frontFace`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace) |
| `depthBias`           | Small depth offset for polygons             | `float`                 | `gl.polygonOffset` |
| `depthBiasSlopeScale` | Small depth factor for polygons              | `float`                 | `gl.polygonOffset` |
| `depthBiasClamp`      | Max depth offset for polygons                | `float`                 |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


## Stencil Parameters

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| Function                | Description                              | Values                  |
| ---------               | ----------------------------------       | ---                     |
| `stencilReadMask`       | Binary mask for reading stencil values   | `number` (**`0xffffffff`**) |
| `stencilWriteMask`      | Binary mask for writing stencil values   | `number` (**`0xffffffff`**) | `gl.frontFace` |
| `stencilCompare`        | How the mask is compared           | **`always`**, `not-equal`, ... | `gl.stencilFunc` |
| `stencilPassOperation`  |               | **`'keep'`**                 | `gl.stencilOp` |
| `stencilDepthFailOperation` |               | **`'keep'`**                 | `gl.stencilOp` |
| `stencilFailOperation`  |               | **`'keep'`**                 | `gl.stencilOp` |


#### Stencil Test Functions

| `stencilCompare` Value | Description            |
| -------------- | ---------------------- |
| `'always'`     | Always pass |
| `'never'`      | Never pass |
| `'less'`       | Pass if (ref & mask) <  (stencil & mask) |
| `'equal'`      | Pass if (ref & mask) =  (stencil & mask) |
| `'lequal'`     | Pass if (ref & mask) <= (stencil & mask) |
| `'greater'`    | Pass if (ref & mask) >  (stencil & mask) |
| `'notequal'`   | Pass if (ref & mask) != (stencil & mask) |
| `'gequal'`     | Pass if (ref & mask) >= (stencil & mask) |

#### Stencil Operations

| `stencil<>Operation` Value | Description            |
| --------------      | ---------------------- |
| `'keep'`            | Keeps the current value |
| `'zero'`            | Sets the stencil buffer value to 0 |
| `'replace'`         | Sets the stencil buffer value to the reference value as specified by `stencilFunc` |
| `'invert'`          | Inverts the current stencil buffer value bitwise |
| `'increment-clamp'` | Increments the current stencil buffer value. Clamps to the maximum representable unsigned value |
| `'increment-wrap'`  | Increments the current stencil buffer value. Wraps to zero when incrementing the maximum representable unsigned value |
| `'decrement-clamp'` | Decrements current stencil buffer value. Clamps to 0 |
| `'decrement-wrap'`  | Decrements  current stencil buffer value, wraps to maximum unsigned value when decrementing 0 |

Action when the stencil test fails
* stencil test fail action,
* depth test fail action,
* pass action

Remarks:
- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.


## v8 to v9 API Mapping

- Parameters are set on `Pipeline`/`Program` creation. They can not be modified, or passed in draw calls.
- Parameters can only be set, not queried. luma.gl longer provides a way to query parameters.


| WebGL Function  | luma.gl parameter counterparts   |
| --------- | ---------------------------------- |
| [polygonOffset](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset) | `depthBias`, `depthBiasSlopeScale` |
| [depthRange](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange) | N/A |
| [clearDepth](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth) | |
