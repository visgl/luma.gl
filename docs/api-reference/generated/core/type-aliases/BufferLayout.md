# Type Alias: BufferLayout

> **BufferLayout** = `object`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L44)

Specify memory layout for one buffer, describing how it is used by one or more attribute

## Note[​](#note "Direct link to Note")

Specifies format, stride, offset and step mode

## Note[​](#note-1 "Direct link to Note")

The buffer can be set using the buffer name:`.setAttributes({[bufferName]: buffer})`.

## Note[​](#note-2 "Direct link to Note")

Needs to match type/components of the ShaderLayout ('f32', 'i32', 's32')

A buffer layout is used to specify "non-standard" buffer layouts (buffers with offsets, interleaved buffers etc)

## Example[​](#example "Direct link to Example")

```
 device.createRenderPipeline({

   ...

   shaderLayout,

   bufferLayout: [

     {name: 'positions', stepMode: 'vertex', format: 'float32x3'},

     // interleaved bindings, auto offset

     {name: 'particles', stepMode: 'instance', byteStride: 32, attributes: [

       {name: 'instancePositions', format: 'float32x4', byteOffset: 0},

       {name: 'instanceVelocities', format: 'float32x4', byteOffset: 16}

     ]},

   ]

 ];
```

## Properties[​](#properties "Direct link to Properties")

### attributes?[​](#attributes "Direct link to attributes?")

> `optional` **attributes?**: [`BufferAttributeLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferAttributeLayout.md)\[]

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L52)

Option 1: interleaved attributes that read from this buffer

***

### byteStride?[​](#bytestride "Direct link to byteStride?")

> `optional` **byteStride?**: `number`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L50)

bytes between successive elements. If omitted, stride is set to reflect a "packed" buffer

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`VertexFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L54)

Option 2: Single attribute with same name as buffer.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L46)

Name of buffer

***

### stepMode?[​](#stepmode "Direct link to stepMode?")

> `optional` **stepMode?**: `"vertex"` | `"instance"`

Defined in: [modules/core/src/adapter/types/buffer-layout.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/buffer-layout.ts#L48)

Is the attribute is instanced. Default: auto-deduced from shader name.
