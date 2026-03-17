# PickingManager

`PickingManager` manages an offscreen picking framebuffer and the shader-input updates needed for luma.gl's picking shader module.

It is useful when rendering models with picking uniforms and reading back the selected object and batch ids.

## Usage

```typescript
import {PickingManager, ShaderInputs} from '@luma.gl/engine';
import {pickingUniforms} from '@luma.gl/engine/modules/picking/picking-uniforms';

const shaderInputs = new ShaderInputs({picking: pickingUniforms});
const pickingManager = new PickingManager(device, {shaderInputs});
```

## Types

### `PickInfo`

```ts
export type PickInfo = {
  batchIndex: number | null;
  objectIndex: number | null;
};
```

### `PickingManagerProps`

```ts
export type PickingManagerProps = {
  shaderInputs?: ShaderInputs<{picking: typeof pickingUniforms.props}>;
  onObjectPicked?: (info: PickInfo) => void;
};
```

## Properties

### `pickInfo`

Latest picked batch and object indices.

### `framebuffer`

Framebuffer used for picking readback.

## Methods

### `constructor(device: Device, props: PickingManagerProps)`

Creates a picking manager for one device.

### `destroy(): void`

Destroys the picking framebuffer.

### `getFramebuffer(): Framebuffer`

Returns the picking framebuffer, creating it lazily when needed.

### `clearPickState(): void`

Clears the highlighted object state in the attached `ShaderInputs`.

### `beginRenderPass()`

Begins a render pass that writes picking data into the picking framebuffer.

### `updatePickInfo(mousePosition: [number, number]): Promise<PickInfo | null>`

Reads back one picked pixel, updates shader inputs, and calls `onObjectPicked` when the pick result changes.

### `getPickPosition(mousePosition: [number, number]): [number, number]`

Converts CSS pixel mouse coordinates into device-pixel picking coordinates.
