# ClipSpace

`ClipSpace` is a convenience subclass of [`Model`](/docs/api-reference/engine/model) that draws a fullscreen quad in clip space.

It is commonly used for fullscreen rendering, postprocessing, texture blits, and shader-pass style effects.

## Usage

```typescript
import {ClipSpace} from '@luma.gl/engine';

const fullscreenQuad = new ClipSpace(device, {
  fs: FRAGMENT_SHADER
});
```

## Types

### `ClipSpaceProps`

```ts
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'>;
```

The class provides its own vertex shader, quad geometry, and vertex count.

## Methods

### `constructor(device: Device, props: ClipSpaceProps)`

Creates a fullscreen quad model. When `props.source` is provided for WGSL, the built-in vertex shader source is prepended automatically.

## Remarks

- `ClipSpace` is a specialized `Model`, so all normal `Model` methods such as `draw()`, `setBindings()`, and `setShaderInputs()` are available.
