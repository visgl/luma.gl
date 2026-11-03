# Type Alias: ShaderBlockLayoutOptions

> **ShaderBlockLayoutOptions** = `object`

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:30

Options for [makeShaderBlockLayout](https://luma.gl/next/docs/api-reference/generated/core/functions/makeShaderBlockLayout.md).

## Properties[​](#properties "Direct link to Properties")

### layout?[​](#layout "Direct link to layout?")

> `optional` **layout?**: `"std140"` | `"wgsl-uniform"` | `"wgsl-storage"`

Defined in: modules/shaders/dist/types/shader-block-layout.d.ts:36

Packing rules to apply when building the layout.

Defaults to `'std140'`.
