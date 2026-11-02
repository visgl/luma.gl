# GPUEffect

`GPUEffect` describes a reusable fullscreen effect using shader-pass operations. Link separately
supplied effects into a single graph, then compile once. Both `GPUGraph` and WebGPU
`GPUSimpleGraph` accept the same fragments; the evaluator API is unchanged.

## Apply separately supplied effects

```typescript
import {GPUGraph, appendEffects, gpuGraph} from '@luma.gl/graph';
import type {Texture} from '@luma.gl/core';
// Alternatively: import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const graph = new GPUGraph(); // or new GPUSimpleGraph()
graph.addInput('color', gpuGraph.texture({format: 'rgba8unorm'}));
graph.addInput('exposure', gpuGraph.scalar('float32'));

// An application can receive this list from independently authored effect modules.
const effects = [{effect: exposureEffect, parameters: {gain: 'exposure'}}];
const output = appendEffects(graph, {input: 'color', output: 'result', effects});
const compiled = graph.compile<Record<string, Texture>>(device, {outputs: [output]});
const results = await compiled.run({inputs: {color: sourceTexture, exposure: 1.2}});
// results[output] belongs to the caller; sourceTexture remains borrowed.
results[output].destroy();
compiled.destroy();
```

`appendEffects` returns the final logical texture name. An empty list returns the input name.
There is no `addOutput` step: select returned names in the existing compile options.

## Author a fragment

```typescript
import {GPUEffect, GPUShaderPassOperation, gpuGraph} from '@luma.gl/graph';

const exposureEffect = new GPUEffect({
  id: 'exposure',
  input: 'color',
  output: 'adjusted',
  parameters: ['gain'],
  operations: [new GPUShaderPassOperation({
    inputs: {image: 'color'},
    samplers: {imageSampler: {}},
    parameters: {gain: 'gain'},
    output: 'adjusted',
    outputDescriptor: gpuGraph.texture({
      format: 'rgba8unorm',
      extent: {like: 'color'}
    }),
    fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
      let color = textureSample(image, imageSampler, textureCoordinates);
      return vec4<f32>(color.rgb * parameters.gain, color.a);
    }`
  })]
});
```

The fragment is immutable and device-independent. `input` and `output` identify local texture
ports; `parameters` lists local scalar ports. Every operation writes a new local value. Reads
must refer to the input or an earlier operation's output. Branching inside a fragment is allowed:
a later pass can sample both the original input and an earlier temporary.

When linking, scalar ports map to existing graph scalar names; these may be execution inputs or
GPU-produced scalars. Texture names and `extent.like` references are remapped automatically.
Internal names are scoped beneath the chain's public output (`result/effect-0/...`); choose distinct
public output names for separate chains. Do not declare names inside that private namespace.
Repeated fragment instances and diagnostic operation IDs are supported. Linking validates every
binding before appending operations to the graph.

## Sizes and storage

Use `extent: {like: 'color', scale: [0.5, 0.5]}` for a half-resolution temporary. Width and height
are resolved from the bound input view each execution, rounded to the nearest integer and clamped
to at least one pixel. Formats remain explicit. Resizing inputs does not require recompilation.

The planner automatically reuses **storage** for operation-owned textures with non-overlapping
lifetimes and identical resolved format, dimensions, mip/sample count, and usage. The operation
that last reads a texture cannot also overwrite that allocation for a different logical result.
Reuse works across fragment boundaries, and the full graph's dependency tracking sees the shared
physical handle. SimpleGraph retains its sequential encoding path.

Selected outputs, borrowed inputs/targets, and persistent storage are never reused. Each invocation
has its own allocations; preparing two executions simultaneously does not share their scratch.
Reuse is conservative for programs with control flow or operations without complete contracts.
There is no cross-frame pool. Different sizes or usage requirements can prevent reuse.

This does not discover equivalent computations: two effects requesting a blur still execute two
blurs. Sharing a computed result requires an explicit shared producer. Linking compiled graphs,
temporal effects, general dependency negotiation, and WebGL execution are separate follow-ups.

## Caller-owned encoding

```typescript
const prepared = compiled.prepare({
  inputs: {color: sourceTexture, exposure: 1.2},
  outputTargets: {result: destinationTexture} // optional, borrowed
});
const encoder = device.createCommandEncoder();
prepared.encode(encoder);
device.submit(encoder.finish());
prepared.destroy(); // release scratch after submission (or after discarding unsubmitted commands)
encoder.destroy();
```

Without an output target, `prepared.outputs` contains caller-owned textures, including when an
execution is cancelled. Destroy those outputs separately. Calling `prepare` does not submit work.
The shader-pass restrictions and execution lifetime rules apply unchanged; see
[GPUShaderPassOperation](./gpu-shader-pass-operation).

For independently authored bloom and color-adjustment fragments and both executors, see
[the composable effects example](https://github.com/visgl/luma.gl/blob/master/examples/v10/gpu-simple-graph/src/composable-effects.ts).
