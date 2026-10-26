import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# ClipSpace

<EngineDocsTabs group="fullscreen" active="clip-space" />

`ClipSpace` is a convenience subclass of [`Model`](/docs/api-reference/engine/model) that draws a fullscreen quad or oversized triangle in clip space.

It is commonly used for fullscreen rendering, postprocessing, texture blits, and shader-pass style effects.

## Usage

```typescript
import {ClipSpace} from '@luma.gl/engine';

const fullscreenModel = new ClipSpace(device, {
  fs: FRAGMENT_SHADER,
  geometryType: 'triangle'
});
```

## Types

### `ClipSpaceProps`

```ts
export type ClipSpaceProps = Omit<ModelProps, 'vs' | 'vertexCount' | 'geometry'> & {
  geometryType?: 'quad' | 'triangle';
};
```

The class provides its own vertex shader, geometry, and vertex count. `geometryType` defaults to `'quad'` (four vertices, two triangles). Select `'triangle'` for a single oversized triangle (three vertices) clipped to the viewport. Both options interpolate the same `position`, `coordinate`, and `uv` values within the viewport. Performance differences depend on the GPU and fragment shader.

## Methods

### `constructor(device: Device, props: ClipSpaceProps)`

Creates a fullscreen model with the selected geometry. When `props.source` is provided for WGSL, the built-in vertex shader source is prepended automatically.

## Remarks

- `ClipSpace` is a specialized `Model`, so all normal `Model` methods such as `draw()`, `setBindings()`, and `setShaderInputs()` are available.
