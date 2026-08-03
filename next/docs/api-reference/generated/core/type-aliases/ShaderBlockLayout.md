# Type Alias: ShaderBlockLayout

> **ShaderBlockLayout** = `object`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L50)

Immutable layout metadata for a uniform or storage-style shader block.

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> **byteLength**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L54)

Exact number of packed bytes required by the block.

***

### fields[​](#fields "Direct link to fields")

> **fields**: `Record`<`string`, [`ShaderBlockLayoutEntry`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayoutEntry.md)>

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L58)

Flattened leaf field layouts keyed by field path.

***

### layout[​](#layout "Direct link to layout")

> **layout**: `"std140"` | `"wgsl-uniform"` | `"wgsl-storage"`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L52)

Packing rules used when this layout was created.

***

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> **uniformTypes**: `Record`<`string`, [`CompositeShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompositeShaderType.md)>

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L56)

Original composite shader type declarations keyed by top-level field.
