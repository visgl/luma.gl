# ClipSpace

[ClipSpace](https://luma.gl/docs/api-reference/engine/clip-space.md)[Background texture](https://luma.gl/docs/api-reference/engine/background-texture-model.md)[Pass renderer](https://luma.gl/docs/api-reference/engine/passes/shader-pass-renderer.md)

`ClipSpace` is a convenience subclass of [`Model`](https://luma.gl/docs/api-reference/engine/model.md) that draws a fullscreen quad or oversized triangle in clip space.

It is commonly used for fullscreen rendering, postprocessing, texture blits, and shader-pass style effects.

## Usage[​](#usage "Direct link to Usage")

```
import {ClipSpace} from '@luma.gl/engine';



const fullscreenModel = new ClipSpace(device, {

  fs: FRAGMENT_SHADER,

  geometryType: 'triangle'

});
```

## Types[​](#types "Direct link to Types")

### `ClipSpaceProps`[​](#clipspaceprops "Direct link to clipspaceprops")

```
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'> & {

  geometryType?: 'quad' | 'triangle';

};
```

The class provides its own vertex shader, geometry, and vertex count. `geometryType` defaults to `'quad'` (four vertices, two triangles). Select `'triangle'` for a single oversized triangle (three vertices) clipped to the viewport. Both options interpolate the same `position`, `coordinate`, and `uv` values within the viewport. Performance differences depend on the GPU and fragment shader.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: ClipSpaceProps)`[​](#constructordevice-device-props-clipspaceprops "Direct link to constructordevice-device-props-clipspaceprops")

Creates a fullscreen model with the selected geometry. When `props.source` is provided for WGSL, the built-in vertex shader source is prepended automatically.

## Remarks[​](#remarks "Direct link to Remarks")

* `ClipSpace` is a specialized `Model`, so all normal `Model` methods such as `draw()`, `setBindings()`, and `setShaderInputs()` are available.
