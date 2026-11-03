# Type Alias: PickingProps

> **PickingProps** = `object`

Defined in: [modules/engine/picking/picking.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L17)

Props for the picking module, which depending on mode renders picking colors or highlighted item. When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer. When inactive, renders normal colors, with the exception of selected object which is rendered with highlight

## Properties[​](#properties "Direct link to Properties")

### highlightColor?[​](#highlightcolor "Direct link to highlightColor?")

> `optional` **highlightColor?**: `NumberArray3` | `NumberArray4`

Defined in: [modules/engine/picking/picking.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L25)

Color of visual highlight of "selected" item

***

### highlightedObjectColor?[​](#highlightedobjectcolor "Direct link to highlightedObjectColor?")

> `optional` **highlightedObjectColor?**: `NumberArray3` | `null`

Defined in: [modules/engine/picking/picking.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L23)

Set to a picking color to visually highlight that item, or `null` to explicitly clear \*

***

### isActive?[​](#isactive "Direct link to isActive?")

> `optional` **isActive?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L19)

Are we picking? I.e. rendering picking colors?

***

### isAttribute?[​](#isattribute "Direct link to isAttribute?")

> `optional` **isAttribute?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L21)

Set to true when picking an attribute value instead of object index

***

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

> `optional` **useByteColors?**: `boolean`

Defined in: [modules/engine/picking/picking.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L27)

Interpret highlight colors as byte-style 0-255 values.
