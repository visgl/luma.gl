# Type Alias: ShaderProps

> **ShaderProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/shader.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/shader.ts#L15)

Properties for a Shader

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### debugShaders?[​](#debugshaders "Direct link to debugShaders?")

> `optional` **debugShaders?**: `"never"` | `"errors"` | `"warnings"` | `"always"`

Show shader source in browser? Overrides the device.props.debugShaders setting

### entryPoint?[​](#entrypoint "Direct link to entryPoint?")

> `optional` **entryPoint?**: `string`

Optional shader entry point (WebGPU only)

### language?[​](#language "Direct link to language?")

> `optional` **language?**: `"glsl"` | `"wgsl"` | `"auto"`

Shader language (defaults to auto)

### source[​](#source "Direct link to source")

> **source**: `string`

Shader source code

### sourceMap?[​](#sourcemap "Direct link to sourceMap?")

> `optional` **sourceMap?**: `string` | `null`

Optional shader source map (WebGPU only)

### stage?[​](#stage "Direct link to stage?")

> `optional` **stage?**: `"vertex"` | `"fragment"` | `"compute"`

Which stage are we compiling? Required for GLSL. Ignored for WGSL.
