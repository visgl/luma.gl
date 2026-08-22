# PickingManager

[Workflow](https://luma.gl/next/docs/api-guide/engine/interactivity.md)[OrbitControls](https://luma.gl/next/docs/api-reference/engine/orbit-controls.md)[PickingManager](https://luma.gl/next/docs/api-reference/engine/picking-manager.md)

`PickingManager` manages an offscreen picking framebuffer and the shader-input updates needed for luma.gl's engine picking modules.

It is useful when rendering models that use the engine `picking`, `colorPicking`, or `indexPicking` shader modules and reading back the selected object and batch ids.

**PickingManager**

* Role

  Coordinate the picking framebuffer, shader state, readback, callbacks, and tooltip

* Construction

  Device, ShaderInputs, picking mode, and optional callbacks

* Updates

  Render only when shouldPick() reports a new cursor position or force is requested

* Ownership

  Owns its lazily created framebuffer and tooltip; caller owns models and ShaderInputs

* Portability

  Color picking is portable; integer index picking requires backend support

* Performance

  Readback is asynchronous but still a synchronization point; avoid unchanged picks

:::warning Common mistake Do not render and read the picking target on every animation frame when the cursor has not moved. Use `shouldPick()` and keep the last stable object index in the visible shader for immediate highlighting. :::

## Usage[​](#usage "Direct link to Usage")

```
import {Model, PickingManager, ShaderInputs, picking} from '@luma.gl/engine';



const shaderInputs = new ShaderInputs({picking});

const pickingManager = new PickingManager(device, {

  shaderInputs,

  mode: 'auto',

  getTooltip: ({objectIndex}) => (objectIndex === null ? null : `row ${objectIndex}`)

});



const pickingPass = pickingManager.beginRenderPass();

model.draw(pickingPass);

pickingPass.end();



const pickInfo = await pickingManager.updatePickInfo(mousePosition);
```

## Types[​](#types "Direct link to Types")

### `PickInfo`[​](#pickinfo "Direct link to pickinfo")

```
export type PickInfo = {

  batchIndex: number | null;

  objectIndex: number | null;

};
```

### `PickingTooltip`[​](#pickingtooltip "Direct link to pickingtooltip")

```
export type PickingTooltip = string | null;
```

### `PickingMode`[​](#pickingmode "Direct link to pickingmode")

```
export type PickingMode = 'auto' | 'index' | 'color';
```

* `'color'` is the default when no mode is supplied.
* `'auto'` prefers `index` when supported and otherwise falls back to `color`.
* `'index'` uses a second integer render target that stores object and batch ids directly.
* `'color'` encodes object and batch ids into an `rgba8unorm` picking target.

### `PickingManagerProps`[​](#pickingmanagerprops "Direct link to pickingmanagerprops")

```
export type PickingManagerProps = {

  shaderInputs?: ShaderInputs<{picking: typeof pickingUniforms.props}>;

  onObjectPicked?: (info: PickInfo) => void;

  getTooltip?: (info: PickInfo) => PickingTooltip;

  mode?: PickingMode;

};
```

* `getTooltip` returns plain tooltip text for the latest picked row/object. Returning `null` hides the tooltip.
* The tooltip is positioned beside the latest mouse position within the active canvas container.

### `supportsIndexPicking(device: Device): boolean`[​](#supportsindexpickingdevice-device-boolean "Direct link to supportsindexpickingdevice-device-boolean")

Returns `true` when the device can use the index-picking backend.

* On WebGPU this returns `true`.
* On WebGL this returns `true` only when `rg32sint` is renderable on the current device/browser/driver.

## Properties[​](#properties "Direct link to Properties")

### `pickInfo`[​](#pickinfo-1 "Direct link to pickinfo-1")

Latest picked batch and object indices.

### `framebuffer`[​](#framebuffer "Direct link to framebuffer")

Framebuffer used for picking readback.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: PickingManagerProps)`[​](#constructordevice-device-props-pickingmanagerprops "Direct link to constructordevice-device-props-pickingmanagerprops")

Creates a picking manager for one device.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the picking framebuffer.

### `getFramebuffer(): Framebuffer`[​](#getframebuffer-framebuffer "Direct link to getframebuffer-framebuffer")

Returns the picking framebuffer, creating it lazily when needed.

### `clearPickState(): void`[​](#clearpickstate-void "Direct link to clearpickstate-void")

Clears the highlighted object state in the attached `ShaderInputs`.

### `beginRenderPass()`[​](#beginrenderpass "Direct link to beginrenderpass")

Begins a render pass that writes picking data into the picking framebuffer.

When the backend is:

* `color`, the picking framebuffer has one `rgba8unorm` color attachment.
* `index`, the picking framebuffer has a visible color attachment plus a second `rg32sint` attachment that stores object and batch ids directly.

### `updatePickInfo(mousePosition: [number, number]): Promise<PickInfo | null>`[​](#updatepickinfomouseposition-number-number-promisepickinfo--null "Direct link to updatepickinfomouseposition-number-number-promisepickinfo--null")

Reads back one picked pixel, updates shader inputs, calls `onObjectPicked` when the pick result changes, and refreshes the tooltip when `getTooltip` is provided.

### `getPickPosition(mousePosition: [number, number]): [number, number]`[​](#getpickpositionmouseposition-number-number-number-number "Direct link to getpickpositionmouseposition-number-number-number-number")

Converts CSS pixel mouse coordinates into device-pixel picking coordinates.

## Remarks[​](#remarks "Direct link to Remarks")

* `PickingManager` only manages the framebuffer and readback flow. Your model shaders still need to use a compatible picking module.
* `getTooltip` is intentionally a formatting callback. Table-aware row lookup belongs with the caller so engine picking does not depend on Arrow or another columnar-data container.
* Use `picking` when you want the engine to select the appropriate shader path for GLSL/WebGL vs WGSL/WebGPU.
* Use `colorPicking` when you explicitly want the color-encoded path.
* Use `indexPicking` when you explicitly want the integer render-target path.
* `mode: 'color'` is the conservative default.
* `mode: 'auto'` is the easiest way to prefer index picking when the current device supports it.
* Keep forced WebGL `mode: 'index'` for cases where you specifically want to require the integer render-target path.
