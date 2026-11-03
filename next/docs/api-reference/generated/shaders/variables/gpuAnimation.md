# Variable: gpuAnimation

> `const` **gpuAnimation**: `object`

Defined in: [modules/engine/gpu-animation/gpu-animation.ts:228](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/gpu-animation/gpu-animation.ts#L228)

Portable baked clip sampling and independent per-instance morph deformation.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"gpuAnimationFrames"`; `visibility`: `1`; }, { `group`: `0`; `name`: `"gpuMorphTargets"`; `visibility`: `1`; }, { `group`: `0`; `name`: `"gpuMorphWeights"`; `visibility`: `1`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: [`GPUAnimationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GPUAnimationProps.md)

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: `""` = `''`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"gpuAnimation"` = `'gpuAnimation'`

### props[​](#props "Direct link to props")

> `readonly` **props**: [`GPUAnimationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GPUAnimationProps.md)

### source[​](#source "Direct link to source")

> **source**: "\n#ifdef HAS\_GPU\_CROWD\_ANIMATION\n\@group(0) @binding(auto) var\<storage, read> gpuAnimationFrames: array\<vec4f>;\n\nfn readGPUAnimationFrame(frame: u32, offset: u32, frameStride: u32) -> vec4f {\n return gpuAnimationFrames\[frame \* frameStride + offset];\n}\n\nfn sampleGPUAnimationFrame(\n frames: vec4f,\n blend: vec4f,\n offset: u32,\n frameStride: u32\n) -> vec4f {\n let first = mix(\n readGPUAnimationFrame(u32(frames.x), offset, frameStride),\n readGPUAnimationFrame(u32(frames.y), offset, frameStride),\n frames.z\n );\n if (blend.w <= 0.0) {\n return first;\n }\n let second = mix(\n readGPUAnimationFrame(u32(blend.x), offset, frameStride),\n readGPUAnimationFrame(u32(blend.y), offset, frameStride),\n blend.z\n );\n return mix(first, second, blend.w);\n}\n\nfn sampleGPUAnimationMatrix(\n frames: vec4f,\n blend: vec4f,\n firstColumn: u32,\n frameStride: u32\n) -> mat4x4f {\n return mat4x4f(\n sampleGPUAnimationFrame(frames, blend, firstColumn, frameStride),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 1u, frameStride),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 2u, frameStride),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 3u, frameStride)\n );\n}\n\nfn getGPUAnimatedSkinMatrix(\n weights: vec4f,\n joints: vec4u,\n frames: vec4f,\n blend: vec4f,\n frameStride: u32\n) -> mat4x4f {\n return weights.x \* sampleGPUAnimationMatrix(frames, blend, 4u + joints.x \* 4u, frameStride)\n + weights.y \* sampleGPUAnimationMatrix(frames, blend, 4u + joints.y \* 4u, frameStride)\n + weights.z \* sampleGPUAnimationMatrix(frames, blend, 4u + joints.z \* 4u, frameStride)\n + weights.w \* sampleGPUAnimationMatrix(frames, blend, 4u + joints.w \* 4u, frameStride);\n}\n#endif\n\n#ifdef HAS\_INSTANCED\_MORPH\n\@group(0) @binding(auto) var\<storage, read> gpuMorphTargets: array\<vec4f>;\n\n#ifndef HAS\_GPU\_CROWD\_ANIMATION\n\@group(0) @binding(auto) var\<storage, read> gpuMorphWeights: array\<vec4f>;\n#endif\n\nfn getGPUCrowdMorphWeight(\n instanceIndex: u32,\n targetIndex: u32,\n targetCount: u32,\n jointsPerInstance: u32,\n frames: vec4f,\n blend: vec4f,\n frameStride: u32\n) -> f32 {\n#ifdef HAS\_GPU\_CROWD\_ANIMATION\n let offset = 4u + jointsPerInstance \* 4u + targetIndex;\n return sampleGPUAnimationFrame(frames, blend, offset, frameStride).x;\n#else\n let packedCount = (targetCount + 3u) / 4u;\n let packedWeights = gpuMorphWeights\[instanceIndex \* packedCount + targetIndex / 4u];\n return packedWeights\[targetIndex % 4u];\n#endif\n}\n\nfn getGPUCrowdMorphDelta(\n instanceIndex: u32,\n vertexIndex: u32,\n attributeIndex: u32,\n vertexCount: u32,\n targetCount: u32,\n jointsPerInstance: u32,\n frames: vec4f,\n blend: vec4f,\n frameStride: u32\n) -> vec3f {\n var result = vec3f(0.0);\n for (var targetIndex = 0u; targetIndex < targetCount; targetIndex++) {\n let weight = getGPUCrowdMorphWeight(\n instanceIndex,\n targetIndex,\n targetCount,\n jointsPerInstance,\n frames,\n blend,\n frameStride\n );\n let offset = (targetIndex \* 3u + attributeIndex) \* vertexCount + vertexIndex;\n result += gpuMorphTargets\[offset].xyz \* weight;\n }\n return result;\n}\n#endif\n"

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: `object` = `{}`

### vs[​](#vs "Direct link to vs")

> **vs**: "\n#ifdef HAS\_GPU\_CROWD\_ANIMATION\nuniform highp sampler2D gpuAnimationFrames;\n\nvec4 sampleGPUAnimationFrame(vec4 frames, vec4 blend, int offset) {\n vec4 first = mix(\n texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.x)), 0),\n texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.y)), 0),\n frames.z\n );\n if (blend.w <= 0.0) {\n return first;\n }\n vec4 second = mix(\n texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.x)), 0),\n texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.y)), 0),\n blend.z\n );\n return mix(first, second, blend.w);\n}\n\nmat4 sampleGPUAnimationMatrix(vec4 frames, vec4 blend, int firstColumn) {\n return mat4(\n sampleGPUAnimationFrame(frames, blend, firstColumn),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 1),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 2),\n sampleGPUAnimationFrame(frames, blend, firstColumn + 3)\n );\n}\n\nmat4 getGPUAnimatedSkinMatrix(vec4 weights, uvec4 joints, vec4 frames, vec4 blend) {\n return weights.x \* sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.x) \* 4)\n + weights.y \* sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.y) \* 4)\n + weights.z \* sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.z) \* 4)\n + weights.w \* sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.w) \* 4);\n}\n#endif\n\n#ifdef HAS\_INSTANCED\_MORPH\nuniform highp sampler2D gpuMorphTargets;\n\n#ifndef HAS\_GPU\_CROWD\_ANIMATION\nuniform highp sampler2D gpuMorphWeights;\n#endif\n\nfloat getGPUCrowdMorphWeight(\n uint instanceIndex,\n uint targetIndex,\n uint jointsPerInstance,\n vec4 frames,\n vec4 blend\n) {\n#ifdef HAS\_GPU\_CROWD\_ANIMATION\n int offset = 4 + int(jointsPerInstance) \* 4 + int(targetIndex);\n return sampleGPUAnimationFrame(frames, blend, offset).x;\n#else\n vec4 packedWeights = texelFetch(\n gpuMorphWeights,\n ivec2(int(targetIndex / 4u), int(instanceIndex)),\n 0\n );\n return packedWeights\[int(targetIndex % 4u)];\n#endif\n}\n\nvec3 getGPUCrowdMorphDelta(\n uint instanceIndex,\n uint vertexIndex,\n uint attributeIndex,\n uint targetCount,\n uint jointsPerInstance,\n vec4 frames,\n vec4 blend\n) {\n vec3 result = vec3(0.0);\n for (uint targetIndex = 0u; targetIndex < targetCount; targetIndex++) {\n float weight = getGPUCrowdMorphWeight(\n instanceIndex,\n targetIndex,\n jointsPerInstance,\n frames,\n blend\n );\n result += texelFetch(\n gpuMorphTargets,\n ivec2(int(vertexIndex), int(targetIndex \* 3u + attributeIndex)),\n 0\n ).xyz \* weight;\n }\n return result;\n}\n#endif\n"

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`): [`GPUAnimationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GPUAnimationProps.md)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props-1 "Direct link to props?")

[`GPUAnimationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GPUAnimationProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

[`GPUAnimationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/GPUAnimationProps.md)
