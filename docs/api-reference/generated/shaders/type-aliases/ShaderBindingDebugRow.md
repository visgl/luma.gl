# Type Alias: ShaderBindingDebugRow

> **ShaderBindingDebugRow** = `object`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L26)

One debug row describing a WGSL binding in the assembled shader source.

## Properties[​](#properties "Direct link to Properties")

### access?[​](#access "Direct link to access?")

> `optional` **access?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L49)

WGSL access mode when cheaply available.

***

### binding[​](#binding "Direct link to binding")

> **binding**: `number`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L32)

Binding slot within the bind group.

***

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L30)

Bind-group index.

***

### kind[​](#kind "Direct link to kind")

> **kind**: `"uniform"` | `"storage"` | `"read-only-storage"` | `"texture"` | `"sampler"` | `"storage-texture"` | `"unknown"`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L34)

Resource kind inferred from the WGSL declaration.

***

### moduleName?[​](#modulename "Direct link to moduleName?")

> `optional` **moduleName?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L45)

Shader module name when the binding was contributed by a module.

***

### multisampled?[​](#multisampled "Direct link to multisampled?")

> `optional` **multisampled?**: `boolean`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L57)

Whether the texture is multisampled when cheaply available.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L28)

Binding name as declared in WGSL.

***

### owner[​](#owner "Direct link to owner")

> **owner**: `"application"` | `"module"`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L43)

Whether the binding came from application WGSL or a shader module.

***

### resourceType?[​](#resourcetype "Direct link to resourceType?")

> `optional` **resourceType?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L47)

Full WGSL resource type text from the declaration.

***

### samplerKind?[​](#samplerkind "Direct link to samplerKind?")

> `optional` **samplerKind?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L55)

Sampler kind when cheaply available.

***

### sampleType?[​](#sampletype "Direct link to sampleType?")

> `optional` **sampleType?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L53)

Texture sample type when cheaply available.

***

### viewDimension?[​](#viewdimension "Direct link to viewDimension?")

> `optional` **viewDimension?**: `string`

Defined in: [lib/shader-assembly/wgsl-binding-debug.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-binding-debug.ts#L51)

Texture view dimension when cheaply available.
