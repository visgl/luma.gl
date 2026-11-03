# Type Alias: PickingUniforms

> **PickingUniforms** = `object`

Defined in: [modules/engine/picking/picking.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L35)

Uniforms for the picking module, which renders picking colors and highlighted item. When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer. When inactive, renders normal colors, with the exception of selected object which is rendered with highlight

## Properties[​](#properties "Direct link to Properties")

### highlightColor?[​](#highlightcolor "Direct link to highlightColor?")

> `optional` **highlightColor?**: `NumberArray4`

Defined in: [modules/engine/picking/picking.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L50)

Color of visual highlight of "selected" item

***

### highlightedObjectColor?[​](#highlightedobjectcolor "Direct link to highlightedObjectColor?")

> `optional` **highlightedObjectColor?**: `NumberArray3`

Defined in: [modules/engine/picking/picking.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L48)

Set to a picking color to visually highlight that item

***

### isActive?[​](#isactive "Direct link to isActive?")

> `optional` **isActive?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L40)

When true, renders picking colors. Set when rendering to off-screen "picking" buffer. When false, renders normal colors, with the exception of selected object which is rendered with highlight

***

### isAttribute?[​](#isattribute "Direct link to isAttribute?")

> `optional` **isAttribute?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L42)

Set to true when picking an attribute value instead of object index

***

### isHighlightActive?[​](#ishighlightactive "Direct link to isHighlightActive?")

> `optional` **isHighlightActive?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L46)

Do we have a highlighted item?

***

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

> `optional` **useByteColors?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L44)

Interpret highlight colors as byte-style 0-255 values.
