# PickingManager

`PickingManager` manages an offscreen picking framebuffer and the shader-input updates needed for luma.gl's engine picking modules.

It is useful when rendering models that use the engine `picking`, `colorPicking`, or `indexPicking` shader modules and reading back the selected object and batch ids.

## Usage

```ts
import {Model, PickingManager, ShaderInputs, picking} from '@luma.gl/engine';

const shaderInputs = new ShaderInputs({picking});
const pickingManager = new PickingManager(device, {
  shaderInputs,
  mode: 'auto'
});

const pickingPass = pickingManager.beginRenderPass();
model.draw(pickingPass);
pickingPass.end();

const pickInfo = await pickingManager.updatePickInfo(mousePosition);
```

## Types

### `PickInfo`

```ts
export type PickInfo = {
  batchIndex: number | null;
  objectIndex: number | null;
};
```

### `PickingMode`

```ts
export type PickingMode = 'auto' | 'index' | 'color';
```

- `'color'` is the default when no mode is supplied.
- `'auto'` prefers `index` when supported and otherwise falls back to `color`.
- `'index'` uses a second integer render target that stores object and batch ids directly.
- `'color'` encodes object and batch ids into an `rgba8unorm` picking target.

### `PickingManagerProps`

```ts
export type PickingManagerProps = {
  shaderInputs?: ShaderInputs<{picking: typeof pickingUniforms.props}>;
  onObjectPicked?: (info: PickInfo) => void;
  mode?: PickingMode;
};
```

### `supportsIndexPicking(device: Device): boolean`

Returns `true` when the device can use the index-picking backend.

- On WebGPU this returns `true`.
- On WebGL this returns `true` only when `rg32sint` is renderable on the current device/browser/driver.

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

When the backend is:

- `color`, the picking framebuffer has one `rgba8unorm` color attachment.
- `index`, the picking framebuffer has a visible color attachment plus a second `rg32sint` attachment that stores object and batch ids directly.

### `updatePickInfo(mousePosition: [number, number]): Promise<PickInfo | null>`

Reads back one picked pixel, updates shader inputs, and calls `onObjectPicked` when the pick result changes.

### `getPickPosition(mousePosition: [number, number]): [number, number]`

Converts CSS pixel mouse coordinates into device-pixel picking coordinates.

## Remarks

- `PickingManager` only manages the framebuffer and readback flow. Your model shaders still need to use a compatible picking module.
- Use `picking` when you want the engine to select the appropriate shader path for GLSL/WebGL vs WGSL/WebGPU.
- Use `colorPicking` when you explicitly want the color-encoded path.
- Use `indexPicking` when you explicitly want the integer render-target path.
- `mode: 'color'` is the conservative default.
- `mode: 'auto'` is the easiest way to prefer index picking when the current device supports it.
- Keep forced WebGL `mode: 'index'` for cases where you specifically want to require the integer render-target path.
