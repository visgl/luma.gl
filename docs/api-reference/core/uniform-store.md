import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# UniformStore

<CoreDocsTabs group="layouts" active="uniform-store" />

`UniformStore` packs typed uniform values into named blocks and optionally owns a GPU buffer
for each block. The device determines the default layout: WGSL uniform layout on WebGPU,
std140 on WebGL. [ShaderInputs](/docs/api-reference/engine/shader-inputs) uses this lower-level
machinery for shader-module props.

## Usage

```ts
import {UniformStore} from '@luma.gl/core';

const store = new UniformStore<{frame: {time: number}}>(device, {
  frame: {uniformTypes: {time: 'f32'}, defaultUniforms: {time: 0}}
});
const frameUniforms = store.getManagedUniformBuffer('frame');
store.setUniforms({frame: {time: 1}});

// Bind frameUniforms to a compatible shader block, then destroy the store when finished.
store.destroy();
```

## Block definitions

The constructor accepts `(device, blocks)`, keyed by uniform-block name.

| Field | Type | Meaning |
| --- | --- | --- |
| `uniformTypes?` | `Record<string, CompositeShaderType>` | Types used to pack each uniform. |
| `defaultUniforms?` | `Record<string, CompositeUniformValue>` | Initial values. |
| `layout?` | `'std140' \| 'wgsl-uniform' \| 'wgsl-storage'` | Explicit layout override. |
| `defaultProps?` | `Record<string, unknown>` | Reserved; not applied as uniform defaults. |

## Methods

- `setUniforms(values, commandEncoder?): void` merges partial block values and updates existing
  managed buffers. An encoder orders uploads with later GPU work in the same submission.
- `getUniformBufferByteLength(name): number` returns the allocation size, including the store's
  minimum buffer-size policy.
- `getUniformBufferData(name): Uint8Array` returns packed bytes; its length can be smaller than
  the allocation size.
- `getManagedUniformBuffer(name): Buffer` lazily creates a store-owned buffer. Call
  `setUniforms()` or `updateUniformBuffer()` before consuming it.
- `createUniformBuffer(name, values?): Buffer` creates an initialized, caller-owned buffer.
- `updateUniformBuffer(name, commandEncoder?): false | string` updates a dirty managed block
  and returns its redraw reason, or `false`.
- `updateUniformBuffers(commandEncoder?): false | string` updates all dirty managed blocks.
- `destroy(): void` destroys managed buffers. Caller-owned buffers remain the caller's responsibility.

## Related APIs

- [Shader types](/docs/api-reference/core/shader-types)
- [ShaderBlockLayout](/docs/api-reference/core/shader-block-layout)
