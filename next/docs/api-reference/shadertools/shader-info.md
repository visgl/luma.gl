# Shader Parsing

[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[Assembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)

It is sometimes useful to be able to inspect shader source code

## Functions[​](#functions "Direct link to Functions")

### getShaderInfo[​](#getshaderinfo "Direct link to getShaderInfo")

Returns information extracted from shader source code

```
function getShaderInfo(shaderSource: string, defaultName?: string): {

  name: string;

  language: 'glsl' | 'wgsl';

  version: number;

}
```

Returns:

* `name`: `SHADER_NAME` define, supplied default name, or `'unnamed'`.
* `language`: always `'glsl'`; this helper does not parse WGSL.
* `version`: GLSL version `100` or `300`; missing `#version` defaults to `100`. Other versions throw.
