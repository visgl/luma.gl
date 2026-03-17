# BufferTransform

`BufferTransform` is the engine wrapper for WebGL transform-feedback workflows.
It internally builds a [`Model`](/docs/api-reference/engine/model) plus a `TransformFeedback` object and uses them to run buffer-to-buffer transforms.

`BufferTransform` is only supported on WebGL devices.

## Usage

```typescript
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

## Types

### `BufferTransformProps`

```ts
export type BufferTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs'];
  outputs?: string[];
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};
```

`feedbackBuffers` is deprecated in favor of `run({outputBuffers})`.

## Properties

### `device`

Owning device.

### `model`

Internal model used to run the transform-feedback draw.

### `transformFeedback`

Internal transform-feedback object.

## Methods

### `BufferTransform.isSupported(device: Device): boolean`

Returns `true` when the device is WebGL-backed.

### `constructor(device: Device, props?: BufferTransformProps)`

Creates the internal model and transform-feedback objects. Throws on unsupported devices.

### `destroy(): void`

Destroys the internal model.

### `delete(): void`

Deprecated alias for `destroy()`.

### `run(options?): void`

Runs one transform-feedback pass.

```ts
run(options?: RenderPassProps & {
  inputBuffers?: Record<string, Buffer>;
  outputBuffers?: Record<string, Buffer>;
}): void
```

### `getBuffer(varyingName: string): Buffer | BufferRange | null`

Deprecated accessor for one named transform-feedback output.

### `readAsync(varyingName: string): Promise<Uint8Array>`

Deprecated helper for reading back one named output.

## Remarks

- `BufferTransform` defaults the fragment shader to a passthrough implementation because transform feedback typically only needs vertex output.
- Prefer `run({inputBuffers, outputBuffers})` for explicit buffer management.
