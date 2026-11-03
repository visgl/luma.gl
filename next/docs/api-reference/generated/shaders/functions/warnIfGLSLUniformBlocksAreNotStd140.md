# Function: warnIfGLSLUniformBlocksAreNotStd140()

> **warnIfGLSLUniformBlocksAreNotStd140**(`shaderSource`, `stage`, `log?`, `context?`): [`GLSLUniformBlockInfo`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GLSLUniformBlockInfo.md)\[]

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:191](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L191)

Emits warnings for GLSL uniform blocks that do not explicitly declare `layout(std140)`.

## Parameters[​](#parameters "Direct link to Parameters")

### shaderSource[​](#shadersource "Direct link to shaderSource")

`string`

### stage[​](#stage "Direct link to stage")

`"vertex"` | `"fragment"`

### log?[​](#log "Direct link to log?")

`Logger`

### context?[​](#context "Direct link to context?")

#### label?[​](#label "Direct link to label?")

`string`

## Returns[​](#returns "Direct link to Returns")

[`GLSLUniformBlockInfo`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GLSLUniformBlockInfo.md)\[]

The list of parsed blocks that were considered non-compliant.
