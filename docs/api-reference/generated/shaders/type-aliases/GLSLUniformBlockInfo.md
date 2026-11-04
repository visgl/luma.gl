# Type Alias: GLSLUniformBlockInfo

> **GLSLUniformBlockInfo** = `object`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L35)

Parsed information about one GLSL uniform block declaration.

## Properties[​](#properties "Direct link to Properties")

### blockName[​](#blockname "Direct link to blockName")

> **blockName**: `string`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L37)

Declared block type name.

***

### body[​](#body "Direct link to body")

> **body**: `string`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L47)

Raw source text inside the block braces.

***

### hasLayoutQualifier[​](#haslayoutqualifier "Direct link to hasLayoutQualifier")

> **hasLayoutQualifier**: `boolean`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L43)

Whether any explicit layout qualifier was present.

***

### instanceName[​](#instancename "Direct link to instanceName")

> **instanceName**: `string` | `null`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L39)

Optional instance name that follows the block declaration.

***

### isStd140[​](#isstd140 "Direct link to isStd140")

> **isStd140**: `boolean`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L45)

Whether the block explicitly declares `layout(std140)`.

***

### layoutQualifier[​](#layoutqualifier "Direct link to layoutQualifier")

> **layoutQualifier**: `string` | `null`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L41)

Raw layout qualifier text, if present.
