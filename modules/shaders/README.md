# @luma.gl/shaders

This is the shader module system module for luma.gl.

See [luma.gl](http://luma.gl) for documentation.

## Language-specific assembly

```ts
import type {ShaderAssembler} from '@luma.gl/shaders';
import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';
import {WGSLShaderAssembler} from '@luma.gl/shaders/wgsl';
```

The shared abstract contract owns modules, hooks and transpiler registration. Each language entry
loads its own assembly backend. Root exports retain their constructor identity and legacy factory.
The existing WGSL scanner remains available from `/wgsl`.
