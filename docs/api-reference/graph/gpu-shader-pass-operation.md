# GPUShaderPassOperation

`GPUShaderPassOperation` draws one fullscreen triangle into an operation-owned texture.
It uses the same description in `GPUGraph` and WebGPU `GPUSimpleGraph`, including named inputs,
scalar parameters, output targets, and caller-owned encoding. No engine model is required.

Start with [texture values and execution bindings](./gpu-graph-textures.md) for texture ownership
and selected-view rules.

## Color adjustment on either graph

```typescript
import type {Texture} from '@luma.gl/core';
import {GPUGraph, GPUShaderPassOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const graph = useSimpleGraph ? new GPUSimpleGraph() : new GPUGraph();
graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
graph.addInput('gain', gpuGraph.scalar('float32'));
graph.add(new GPUShaderPassOperation({
  inputs: {imageTexture: 'image'},
  samplers: {imageSampler: {minFilter: 'nearest', magFilter: 'nearest'}},
  parameters: {gain: 'gain'},
  output: 'result',
  outputDescriptor: gpuGraph.texture({
    format: 'rgba8unorm',
    extent: {like: 'image'}
  }),
  fragmentSource: `
fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
  let color = textureSample(imageTexture, imageSampler, textureCoordinates);
  return vec4<f32>(color.rgb * parameters.gain, color.a);
}`
}));

const compiled = graph.compile<{result: Texture}>(device);
const {result} = await compiled.run({inputs: {image: sourceTexture, gain: 0.5}});
// Consume result, then release caller-owned storage.
result.destroy();
compiled.destroy();
```

The executable example is `examples/v10/gpu-simple-graph/src/color-adjustment.ts`.
The image and gain can change on every invocation without changing the authored graph.

## Description

| Property | Meaning |
| --- | --- |
| `id` | Optional operation identifier for diagnostics. |
| `fragmentSource` | WGSL defining `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32>`. |
| `inputs` | Shader texture binding name → logical graph texture name. |
| `samplers` | Shader sampler binding name → immutable color sampler properties. No implicit sampler is added. |
| `parameters` | Generated `parameters` uniform field name → logical scalar name. |
| `output` | Logical result name, declared by the operation. |
| `outputDescriptor` | `gpuGraph.texture(...)` with a color format and explicit fixed or inherited extent. |

The operation snapshots these descriptions. Texture and sampler binding names must be distinct
WGSL identifiers. `parameters`, `shade`, `vertexMain`, `fragmentMain`, and the `GraphShaderPass`
prefix are reserved. WGSL compilation supplies diagnostics for shader source errors.

Texture coordinates run from `(0, 0)` at the upper-left to `(1, 1)` at the lower-right. The
generated vertex and fragment entry points call `shade()` once per covered pixel. The pass
clears its output to transparent black and replaces its color; it does not blend with existing
contents. A shader may use `textureLoad` without declaring a sampler.

## Sizes and selected views

Use `extent: {like: 'image', scale: [0.5, 0.5]}` for a half-size result, or a fixed
`{width, height}` extent. Size inheritance references logical graph names, not shader binding
names. Every inherited source must appear among the operation's texture inputs.

Inputs and outputs are single-sampled 2D color views. A view can select one layer and a base mip
of a larger texture. Input views may expose multiple mip levels; the output selects exactly one.
Output `dimension`, `mipLevels`, and `samples` default to `2d`, `1`, and `1`; other values are
rejected. Sampling formats must support float filtering, and the output must be a renderable
non-integer color format on the device.

As with other texture operations, output targets must have the required render-attachment usage,
and sampled inputs need sampling usage. Bindings stay borrowed. Writable values cannot alias
another named value's backing texture, even through disjoint views.

## Parameters and operation ordering

Parameters use existing scalar declarations: `float32`, `sint32`, or `uint32`. The shader reads
them as `parameters.field`, with corresponding WGSL `f32`, `i32`, or `u32` types. Supply input
scalars in `run({inputs: ...})` or `prepare({inputs: ...})`.

A parameter may also reference a scalar produced by an earlier operation. For example, add
`new GPUExpressionOperation({output: 'effectiveGain', expression: 'gain * 2'})` before the pass,
then use `parameters: {gain: 'effectiveGain'}`. Both executors transfer that scalar on the GPU,
without readback. Each invocation has independent parameter storage.

GPUGraph lowers parameter transfers and rendering into ordinary dependency-tracked copy/render
nodes. SimpleGraph encodes the same transfers and render kernel through its own execution scope.
Shader passes can be interleaved with expressions and copies in `run()`.

## Caller-owned encoding

```typescript
const execution = compiled.prepare({inputs: {image: sourceTexture, gain: 0.75}});
const encoder = device.createCommandEncoder();
try {
  execution.encode(encoder);
  // Append other GPU work using execution.outputs.result.
  device.submit(encoder.finish());
} finally {
  execution.destroy();
  encoder.destroy();
}
execution.outputs.result.destroy();
```

Preparation and encoding do not submit work. Encoding is single-use. Keep the compiled program,
bindings, and execution alive through submission; destroy the execution afterward to release
temporary buffers and framebuffer wrappers. Selected outputs remain caller-owned. When cancelling,
abandon the encoder before destroying the execution and release its selected outputs explicitly.
`run()` cleans up allocated outputs if encoding or submission fails.

GPUGraph supports prepared mixed numeric/texture programs. SimpleGraph's synchronous `prepare()`
supports texture copies and shader passes with supplied scalar parameters; a graph containing
numeric evaluator operations uses asynchronous `run()`.

## Scope

This operation is WebGPU-only. The evaluator API and existing numeric WebGL execution remain
unchanged. It does not adapt shader-module `ShaderPass`/`CompositeShaderPass` descriptions or
engine effects yet. Separately supplied effects, scoped composition, automatic cross-effect
sharing, texture pooling, temporal state, blending, depth attachments, multisampling, integer
textures, and control-flow nesting are separate work.

CPU callback/residency scheduling currently supports numeric programs only. A graph combining
texture passes with CPU operations, CPUVector input bindings, or CPU output locations is rejected;
this refresh preserves that boundary. Supplied CPU scalar numbers and GPU-produced scalar
parameters remain supported as described above.
