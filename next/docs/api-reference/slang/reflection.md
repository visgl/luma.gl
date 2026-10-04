# Slang reflection helpers

ExperimentalSince v10

Start with the [Slang overview](https://luma.gl/next/docs/api-reference/slang.md) to compile source and run the live example.

## Application-owned integration[​](#application-owned-integration "Direct link to Application-owned integration")

Import these helpers from `@luma.gl/slang/luma`. This separate entry point consumes existing compiler reflection; it does not parse generated WGSL, import luma at runtime, or add any package dependencies. The compiler entry point does not import these helpers.

* `getSlangShaderLayout(compiled, options?)` returns a structurally compatible luma `ShaderLayout`: vertex attributes, active resource bindings, stage visibility, uniform buffer sizes, storage access, texture dimensions/sample types/formats, and comparison sampler types.
* `getSlangBindingNames(compiled)` maps active source resource names to generated binding names, including GLSL block names and combined texture/sampler uniforms.
* `getSlangUniformBufferLayouts(compiled)` returns each active source uniform buffer's generated `name`, `byteLength`, and packing `layout`. Use the existing `packSlangUniforms` to upload values.
* `getSlangShaderRequirements(compiled)` reports compute/storage buffer usage, the actual GLSL version, declared storage texture formats/access, required WGSL language features, and optional WebGPU device features. `unsupportedStorageTextures` lists active bindings with unsupported WebGPU storage access.

`compiled` may be a `transpileSlang` result, a unified `transpileSlangWGSL` result, or an array of separately compiled render stages using the same target/version and compatible resource slots. For pipeline layouts, select one entry point per stage and compile compute separately from render. Shared bindings combine visibility without modifying source reflection. Reflection visibility is `1` for vertex, `2` for fragment, `4` for compute, or `0` when unused by that entry point. Usage includes resolved reachable helper overloads and respects local variable shadowing; it does not perform constant-condition elimination.

The example assumes an existing WebGPU `device`, a compute `source` declaring a `ConstantBuffer<Settings> settings`, and `values` matching that buffer. Bind any remaining resources before dispatch.

```
import {Buffer} from '@luma.gl/core';

import {transpileSlang, packSlangUniforms} from '@luma.gl/slang';

import {

  getSlangShaderLayout,

  getSlangBindingNames,

  getSlangUniformBufferLayouts,

  getSlangShaderRequirements

} from '@luma.gl/slang/luma';



const compiled = transpileSlang(source, {target: 'wgsl', stage: 'compute'});

const requirements = getSlangShaderRequirements(compiled);

// Check requirements.deviceFeatures before device creation and request them explicitly.

// Check requirements.wgslLanguageFeatures against navigator.gpu.wgslLanguageFeatures.

// Reject requirements.unsupportedStorageTextures when nonempty.

// Check storage texture format/access support on the destination device.

const uniform = getSlangUniformBufferLayouts(compiled).settings;

const uniformBuffer = device.createBuffer({

  byteLength: uniform.byteLength,

  usage: Buffer.UNIFORM | Buffer.COPY_DST

});

uniformBuffer.write(packSlangUniforms(uniform.layout, values));

const shader = device.createShader({stage: compiled.stage, source: compiled.code});

const pipeline = device.createComputePipeline({

  shader,

  entryPoint: compiled.entryPoint,

  shaderLayout: getSlangShaderLayout(compiled)

});

pipeline.setBindings({[getSlangBindingNames(compiled).settings]: uniformBuffer});
```

Applications still import/register their compiler and own resources, sampler state, feature requests, and device-limit checks. Requirements are compiler-known facts, not a full device compatibility validator. WGSL storage declarations need their language features even when unused by a selected entry point. Active read/write `rgba8unorm`, `rgba16float`, and `rgba32*` storage bindings require `texture-formats-tier2`; `r32*` read/write storage is available in core WebGPU. Read/write `rgba8snorm` storage is unsupported on WebGPU and is reported separately. These distinctions follow the [WebGPU format capabilities](https://www.w3.org/TR/webgpu/#texture-format-caps). Concrete sampled texture formats are not knowable from source types: use `textureSampleTypes: {sourceName: 'unfilterable-float'}` and `samplerTypes: {sourceName: 'non-filtering'}` when appropriate. Comparison samplers stay comparison. GLSL ES 300 remains the WebGL target, and binding groups must be zero for the layout helper. Plain GLSL uniform globals remain application-managed with `setUniforms` and are omitted from uniform-buffer layouts. Pass the returned layout explicitly to a native pipeline, `Model`, or `Computation`; registering a transpiler alone does not install the helpers in the framework.

The [sculpture adapter](https://github.com/visgl/luma.gl/blob/master/examples/tutorials/slang-shaders/slang-transpiler.ts) shows how an application collects reflection while assembling a render program. The [particle example](https://luma.gl/next/examples/tutorials/slang-particles) uses the helpers for compute and rendering.
