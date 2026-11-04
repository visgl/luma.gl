# Function: getShaderModuleSource()

> **getShaderModuleSource**(`module`, `stage`, `log?`): `string`

Defined in: [lib/shader-assembly/shader-assembly-shared.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-assembly-shared.ts#L59)

Extracts the source code chunk for the specified shader type from the named shader module

## Parameters[​](#parameters "Direct link to Parameters")

### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

### stage[​](#stage "Direct link to stage")

`"vertex"` | `"fragment"` | `"wgsl"`

### log?[​](#log "Direct link to log?")

`any`

## Returns[​](#returns "Direct link to Returns")

`string`
