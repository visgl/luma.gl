# BufferTransform

[GPU Computations](https://luma.gl/next/docs/api-guide/engine/transforms.md)[Computation](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)[BufferTransform](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)[TextureTransform](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)[Swap](https://luma.gl/next/docs/api-reference/engine/compute/swap.md)

`BufferTransform` is the engine wrapper for WebGL transform-feedback workflows. It internally builds a [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) plus a `TransformFeedback` object and uses them to run buffer-to-buffer transforms.

`BufferTransform` is only supported on WebGL devices.

## Usage[​](#usage "Direct link to Usage")

```
import {BufferTransform} from '@luma.gl/engine';

const transform = new BufferTransform(device, {
  vs: VERTEX_SHADER,
  outputs: ['outValue'],
  attributes: {
    inValue: sourceBuffer
  }
});

transform.run({
  outputBuffers: {
    outValue: targetBuffer
  }
});
```

## Types[​](#types "Direct link to Types")

### `BufferTransformProps`[​](#buffertransformprops "Direct link to buffertransformprops")

```
export type BufferTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs'];
  outputs?: string[];
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};
```

`feedbackBuffers` is deprecated in favor of `run({outputBuffers})`.

## Properties[​](#properties "Direct link to Properties")

### `device`[​](#device "Direct link to device")

Owning device.

### `model`[​](#model "Direct link to model")

Internal model used to run the transform-feedback draw.

### `transformFeedback`[​](#transformfeedback "Direct link to transformfeedback")

Internal transform-feedback object.

## Methods[​](#methods "Direct link to Methods")

### `BufferTransform.isSupported(device: Device): boolean`[​](#buffertransformissupporteddevice-device-boolean "Direct link to buffertransformissupporteddevice-device-boolean")

Returns `true` when the device is WebGL-backed.

### `constructor(device: Device, props?: BufferTransformProps)`[​](#constructordevice-device-props-buffertransformprops "Direct link to constructordevice-device-props-buffertransformprops")

Creates the internal model and transform-feedback objects. Throws on unsupported devices.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the internal model.

### `delete(): void`[​](#delete-void "Direct link to delete-void")

Deprecated alias for `destroy()`.

### `run(options?): void`[​](#runoptions-void "Direct link to runoptions-void")

Runs one transform-feedback pass.

```
run(options?: RenderPassProps & {
  inputBuffers?: Record<string, Buffer>;
  outputBuffers?: Record<string, Buffer>;
}): void
```

### `getBuffer(varyingName: string): Buffer | BufferRange | null`[​](#getbuffervaryingname-string-buffer--bufferrange--null "Direct link to getbuffervaryingname-string-buffer--bufferrange--null")

Deprecated accessor for one named transform-feedback output.

### `readAsync(varyingName: string): Promise<Uint8Array>`[​](#readasyncvaryingname-string-promiseuint8array "Direct link to readasyncvaryingname-string-promiseuint8array")

Deprecated helper for reading back one named output.

## Remarks[​](#remarks "Direct link to Remarks")

* `BufferTransform` defaults the fragment shader to a passthrough implementation because transform feedback typically only needs vertex output.
* Prefer `run({inputBuffers, outputBuffers})` for explicit buffer management.
