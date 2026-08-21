# Shader Parsing

[ShaderPass](https://luma.gl/docs/api-reference/shadertools/shader-pass.md)[Assembler](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md)[Shader parsing](https://luma.gl/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/docs/api-reference/shadertools/wgsl-support.md)

It is sometimes useful to be able to inspect shader source code

## Functions[​](#functions "Direct link to Functions")

### getShaderInfo[​](#getshaderinfo "Direct link to getShaderInfo")

Returns information extracted from shader source code

```
function getShaderInfo(shaderSource: string): {

  name: string;

  language: 'glsl' | 'wgsl';

  version: number;

}
```

Returns:

* `name`
* `language`: `'glsl'`
* `version`: WGLS version (100) or GLSL version (300)
