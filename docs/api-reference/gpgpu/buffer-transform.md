# BufferTransform

`BufferTransform` manages a WebGL2 transform-feedback pipeline for running buffer-to-buffer GPU computations. It wraps a [`Model`](/docs/api-reference/engine/model) plus a `TransformFeedback` object and is useful when you want to execute a vertex shader for computation rather than rendering.

## Usage

```ts
import {BufferTransform} from '@luma.gl/gpgpu';

const transform = new BufferTransform(device, {
  vs: `#version 300 es
  in float inValue;
  out float outValue;

  void main() {
    outValue = inValue * 2.0;
    gl_Position = vec4(0.0);
  }`,
  outputs: ['outValue'],
  vertexCount: 1024
});

transform.run({
  inputBuffers: {inValue: sourceBuffer},
  outputBuffers: {outValue: targetBuffer}
});
```

## Types

### `BufferTransformProps`

`BufferTransformProps` extends `ModelProps` except that `fs` is optional.

| Property | Type | Description |
| --- | --- | --- |
| `fs?` | `ModelProps['fs']` | Optional fragment shader. Defaults to a passthrough fragment shader. |
| `feedbackBufferMode?` | `'interleaved' \| 'separate'` | Transform-feedback buffer layout mode. Defaults to `'separate'`. |
| `outputs?` | `string[]` | Output varying names captured by transform feedback. |
| `feedbackBuffers?` | `Record<string, Buffer \| BufferRange>` | Deprecated initial output-buffer map. Prefer passing `outputBuffers` to `run()`. |

## Static Methods

### `BufferTransform.isSupported(device: Device): boolean`

Returns `true` when the supplied device is WebGL-based.

## Properties

### `device`

Owning device.

### `model`

Underlying engine `Model` used to draw the transform pass.

### `transformFeedback`

Transform-feedback object that captures the outputs declared by `outputs` or `varyings`.

## Methods

### `constructor(device: Device, props?: BufferTransformProps)`

Creates a WebGL2 transform-feedback pipeline. Construction throws on non-WebGL devices.

### `run(options?): void`

Executes one transform pass.

`options` may include:

| Property | Type | Description |
| --- | --- | --- |
| `inputBuffers?` | `Record<string, Buffer>` | Attribute buffers to bind before drawing. |
| `outputBuffers?` | `Record<string, Buffer \| BufferRange>` | Output buffers to capture transform-feedback results into. |

`run()` also accepts the standard `RenderPassProps`, which are forwarded to `device.beginRenderPass()`.

### `destroy(): void`

Destroys the internal model.

### `delete(): void`

Deprecated alias for `destroy()`.

### `getBuffer(varyingName: string): Buffer | BufferRange | null`

Deprecated helper that returns the currently bound transform-feedback target for one varying.

### `readAsync(varyingName: string): Promise<Uint8Array>`

Deprecated helper that reads one transform-feedback output back to the CPU.

## Remarks

- `BufferTransform` is only available on WebGL2-style devices.
- For pure compute on WebGPU, use [`Computation`](/docs/api-reference/gpgpu/computation) instead.
- Most applications should supply output buffers per run rather than relying on deprecated `feedbackBuffers`.
