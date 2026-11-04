# Type Alias: ShaderBlockLayout

> **ShaderBlockLayout** = `object`

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:41

Immutable layout metadata for a uniform or storage-style shader block.

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> **byteLength**: `number`

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:45

Exact number of packed bytes required by the block.

***

### fields[​](#fields "Direct link to fields")

> **fields**: `Record`<`string`, [`ShaderBlockLayoutEntry`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderBlockLayoutEntry.md)>

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:49

Flattened leaf field layouts keyed by field path.

***

### layout[​](#layout "Direct link to layout")

> **layout**: `"std140"` | `"wgsl-uniform"` | `"wgsl-storage"`

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:43

Packing rules used when this layout was created.

***

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> **uniformTypes**: `Record`<`string`, [`CompositeShaderType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CompositeShaderType.md)>

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:47

Original composite shader type declarations keyed by top-level field.
