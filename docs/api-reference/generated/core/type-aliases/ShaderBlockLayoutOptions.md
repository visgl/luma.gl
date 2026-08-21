# Type Alias: ShaderBlockLayoutOptions

> **ShaderBlockLayoutOptions** = `object`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L38)

Options for [makeShaderBlockLayout](https://luma.gl/docs/api-reference/generated/core/functions/makeShaderBlockLayout.md).

## Properties[​](#properties "Direct link to Properties")

### layout?[​](#layout "Direct link to layout?")

> `optional` **layout?**: `"std140"` | `"wgsl-uniform"` | `"wgsl-storage"`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L44)

Packing rules to apply when building the layout.

Defaults to `'std140'`.
