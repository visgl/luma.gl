# ClipSpace

[ClipSpace](https://luma.gl/docs/api-reference/engine/clip-space.md)[Background texture](https://luma.gl/docs/api-reference/engine/background-texture-model.md)[Pass renderer](https://luma.gl/docs/api-reference/engine/passes/shader-pass-renderer.md)

`ClipSpace` is a convenience subclass of [`Model`](https://luma.gl/docs/api-reference/engine/model.md) that draws a fullscreen quad in clip space.

It is commonly used for fullscreen rendering, postprocessing, texture blits, and shader-pass style effects.

## Usage[​](#usage "Direct link to Usage")

```
import {ClipSpace} from '@luma.gl/engine';



const fullscreenQuad = new ClipSpace(device, {

  fs: FRAGMENT_SHADER

});
```

## Types[​](#types "Direct link to Types")

### `ClipSpaceProps`[​](#clipspaceprops "Direct link to clipspaceprops")

```
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'>;
```

The class provides its own vertex shader, quad geometry, and vertex count.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: ClipSpaceProps)`[​](#constructordevice-device-props-clipspaceprops "Direct link to constructordevice-device-props-clipspaceprops")

Creates a fullscreen quad model. When `props.source` is provided for WGSL, the built-in vertex shader source is prepended automatically.

## Remarks[​](#remarks "Direct link to Remarks")

* `ClipSpace` is a specialized `Model`, so all normal `Model` methods such as `draw()`, `setBindings()`, and `setShaderInputs()` are available.
