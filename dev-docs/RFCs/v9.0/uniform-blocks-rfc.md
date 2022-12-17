# RFC: UBO (Uniform Buffer Object) Support in luma.gl / deck.gl

Author: Ib Green

## Summary

This RFC outlines a plan for moving luma.gl and deck.gl API to use uniform buffer objects (UBOs) instead of individual uniforms.

## Overview

Given the non-trivial effort required to support UBOs, luma and deck have so far avoided dealing with UBOs:

- WebGL2 introduced UBO bindings (in parallel with individual uniform bindings). While use of UBO’s is not required, they offer a potential untapped performance increase.

- WebGPU only supports UBO bindings.  (Of course textures and sampler bindings etc are also supported but not individual uniforms)

So, a key steps to prepare luma and deck for WebGPU is to ensure the API and shader modules library can use uniform buffers instead of individual uniform bindings.


## Uniform Buffers

Note that we may need to deal with multiple shader languages and versions:

WebGPU: WGSL
WebGPU: GLSL 4.50 -> WGSL (via glslang, however this option now seems deprecated)
WebGL2: GLSL 3.00
WebGL1: GLSL 1.00

### Uniform buffers in WGSL

- define a struct and declare a "variable" of that type

```rs
[[block]] struct Uniforms {
  [[offset(0)]] modelViewProjectionMatrix : mat4x4<f32>;
};
[[binding(0), set(0)]] var<uniform> uniforms : Uniforms;

[[stage(vertex)]]
fn main() -> void {
  Position = uniforms.modelViewProjectionMatrix * position;
}
```

### Uniform Buffers in GLSL

- [GLSL Interface Block](https://www.khronos.org/opengl/wiki/Interface_Block_(GLSL))
- [WebGL Uniform Buffer Object](https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object)

GLSL groups uniforms in blocks but this does not represent a namespace in and of itself.  See Interface Blocks in the OpenGL wiki.

Uniform blocks can have an instance name which makes the variables "scoped" - i.e. the members must be references using the instance name.

```rs
#version 450
layout(set = 0, binding = 0) uniform Uniforms {
  mat4 modelViewProjectionMatrix;
} uniforms;

void main() {
  gl_Position = uniforms.modelViewProjectionMatrix * position;
}
```

Or they can have no instance name, and be unscoped (the members can be references as if they were just global uniforms).

```rs
#version 300
uniform uDOFUniforms {
  vec2  uDepthRange;
  float uFocusDistance;
  float uBlurCoefficient;
  float uPPM;
  vec2  uTexelOffset;
};

void main() {
  gl_Position = uniforms.modelViewProjectionMatrix * position;
}
```

In GLSL 100, we have no interface blocks

```rs
#version 100
uniform vec2  uDepthRange;
uniform float uFocusDistance;
uniform float uBlurCoefficient;
uniform float uPPM;
uniform vec2  uTexelOffset;
```

Supporting UBO-style API on WebGL1

Using scoped access via block instance name. Recommended for shader modules

GLSL 3.00+ Shader source

```typescript
uniform Lighting {
  bool uEnabled;
  float uAmbient;
  Float uDiffuse;
  float uShininess;
  vec3  uSpecularColor;
} lighting;

if (lighting.uEnabled) {
```

GLSL 1.00 conversion:

```typescript
uniform bool lighting_uEnabled;
uniform float lighting_uAmbient;
uniform float lighting_uDiffuse;
uniform float lighting_uShininess;
uniform vec3  lighting_uSpecularColor;

if (lighting_uEnabled) {
```

Using unscoped access via block instance name. Acceptable for top-level shaders

GLSL 3.00+ Shader source

```typescript
uniform Lighting {
  bool  uEnabled;
  float uAmbient;
  Float uDiffuse;
  float uShininess;
  vec3  uSpecularColor;
};

if (uEnabled) {
```

GLSL 1.00 conversion:

```typescript
uniform bool uEnabled;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uShininess;
uniform vec3  uSpecularColor;

if (uEnabled) {
```

Shader Module Assembly and Parameters

The shader module assembly will now need to generate a list of UniformBufferLayouts.

To make it easy to use shader modules, it must be possible to create the required uniform buffers with minimal boiler plate. Perhaps this becomes part of the `Model` class responsibilities.

```typescript
{
  lighting: new UniformBufferLayout({
  }
),
```

Support nested settings?

```typescript
model.setModuleParameters({
  lighting: {
    uEnabled: true,
  }
});
```

Keep supporting flat settings?

```typescript
  module.setModuleParameters({
    lighting_uEnabled: true,
  });
```

## Potential improvements

### Sharing Uniform Buffers

One of the optimizations that can be done is to share uniform buffer between shaders. Like lighting parameters for instance. 

Since many uniforms do change (even project uniforms change per layer) this will likely require extra management strategy and code.
Uniform Buffer Binding Mappings
Like textures, the WebGL2 uniform buffer bank has an indirection index array, allowing multiple programs to share binding indexes to avoid rebinding uniform buffers. 

```typescript
program.uniformBlockBinding(program.getUniformBlockIndex('Uniforms'), 0);
```

Like textures, this seems hard to leverage for deck.gl’s dynamic, general purpose shaders, and seems like a rather modest, WebGL2-specific perf improvement
