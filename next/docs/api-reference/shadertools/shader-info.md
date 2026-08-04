# Shader Parsing

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[ShaderAssembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader Parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

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
