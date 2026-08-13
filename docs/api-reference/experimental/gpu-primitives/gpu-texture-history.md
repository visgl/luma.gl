import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUTextureHistory

<GPUPrimitivesDocsTabs active="texture-history" />

## Overview

`GPUTextureHistory` owns exactly two descriptor-identical, caller-configured textures and rotates
their previous/current roles without copying texels. Its bindings plug directly into
[`GPUCommandGraph.encode()`](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph#compiledgpucommandgraph),
allowing one compiled graph to reuse retained radiance, temporal metadata, simulation state, or
feedback buffers across frames.

The class neither records GPU commands nor submits work. Physical textures remain application-owned
and are destroyed only when the application destroys their history object.

## Why two textures are necessary

A shader must not sample its retained history and simultaneously write the same texture. Updating a
separate output texture and copying that output back into history is correct but consumes another
full-surface transfer every frame. Two persistent textures avoid the copy by exchanging roles:

| Encoding | Previous texture | Current texture | After `advance()` |
| --- | --- | --- | --- |
| First | A | B | B becomes retained history. |
| Second | B | A | A becomes retained history. |
| Third | A | B | B becomes retained history again. |

The logical graph identifiers remain stable while the physical texture bindings alternate. A
compiled graph therefore retains its pipelines, schedule, and compatible texture-view cache across
encodings.

## Constructor

### `new GPUTextureHistory(device, props)`

```ts
type GPUTextureHistoryProps<Format extends TextureFormat = TextureFormat> = {
  id?: string;
  format: Format;
  width: number;
  height: number;
  usage: number;
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  depth?: number;
  mipLevels?: number;
  samples?: number;
};
```

- Both textures receive the same format, dimensions, extent, mip count, sample count, and usage.
- `id` defaults to `gpu-texture-history`; physical IDs receive `-previous` and `-current` suffixes.
- `usage` is explicit. A compute-written, sampled history usually needs
  `Texture.SAMPLE | Texture.STORAGE`; include copy or attachment flags only when required.
- The history owns both allocations. If creating the second texture fails, the first is released
  before the constructor rethrows.
- No optional WebGPU feature, elevated adapter limit, timestamp query, or implicit submission is
  required.

## Using retained history with a command graph

```ts
import {Texture} from '@luma.gl/core';
import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/experimental';

const descriptor = {
  format: 'rgba16float' as const,
  width,
  height,
  usage: Texture.SAMPLE | Texture.STORAGE
};
const history = new GPUTextureHistory(device, {id: 'radiance-history', ...descriptor});
const graph = new GPUCommandGraph(device, {id: 'temporal-accumulation'});
const previous = graph.importTexture(
  {id: 'previous-radiance', ...descriptor},
  history.previousTexture
);
const current = graph.importTexture(
  {id: 'current-radiance', ...descriptor},
  history.currentTexture
);

graph.addComputePass({
  id: 'accumulate-radiance',
  resources: [
    {texture: previous, usage: 'sampled'},
    {texture: current, usage: 'storage-write'}
  ],
  compile: ({device}) => createAccumulationExecutable(device, previous, current)
});

const compiled = graph.compile();

function encodeFrame(commandEncoder) {
  compiled.encode(commandEncoder, {
    parameters: undefined,
    textures: history.getBindings('previous-radiance', 'current-radiance')
  });
  history.advance();
}
```

The application retains ownership of frame scheduling, command submission, and presentation.
History roles advance only after `encode()` succeeds. An exception leaves the current and previous
roles untouched, allowing the caller to discard the failed encoder and retry safely.

These are ordinary persistent texture imports. Do not use `importFrameTexture()` for retained
history: numbered frame textures represent newly acquired presentation or frame-local attachments,
not physical textures intentionally reused across encodings.

## Multiple synchronized histories

A temporal renderer can keep radiance and hit metadata in separate texture pairs while encoding one
compiled graph:

```ts
compiled.encode(commandEncoder, {
  parameters,
  textures: {
    ...radianceHistory.getBindings('previous-radiance', 'current-radiance'),
    ...metadataHistory.getBindings('previous-metadata', 'current-metadata')
  }
});
radianceHistory.advance();
metadataHistory.advance();
```

Each pair owns exactly two textures and contributes no transfer nodes. If a renderer traces only a
subset of pixels, its compute work must explicitly carry forward untouched samples or initialize
every destination pixel; alternating texture roles does not copy unmodified pixels automatically.

## Properties

### `device`

The device that owns both physical textures.

### `id`

The shared identifier prefix used for both allocations.

### `previousTexture`

The physical texture assigned to the retained-history role. Import it once as the graph's initial
read binding.

### `currentTexture`

The physical texture assigned to the next-output role. Import it once as the graph's initial write
binding.

## Methods

### `getBindings(previousIdentifier, currentIdentifier)`

Returns `Record<string, Texture>` suitable for `CompiledGPUCommandGraph.encode(..., {textures})`.
The identifiers must differ and must match distinct imported graph resources. Calling this method
does not rotate, copy, encode, submit, or allocate textures.

### `advance()`

Exchanges previous/current physical roles. Call it only after the graph successfully records the
frame. The method does not submit, wait for GPU completion, or mutate texture contents.

### `reset()`

Restores the original physical role order without clearing either texture. Consumers must
independently invalidate stale temporal samples after camera cuts, topology changes, or other
history-invalidating events.

### `destroy()`

Destroys both owned physical textures. Repeated calls are safe. Accessing or rotating a destroyed
history throws.

A compiled graph only borrows history textures. Destroy the graph before destroying or replacing
its imported histories. Resizing or changing format requires new history textures and recompiling
graphs whose fixed descriptors no longer match.

## Physical alias safety

`GPUCommandGraph` rejects two active imported handles resolving to the same physical texture when
either handle writes. This catches accidentally binding one history texture as both previous and
current before any graph node records work. Two read-only aliases remain allowed; multiple views of
one writable texture must be created from a single canonical imported handle.

See [physical texture overlap and writable
aliases](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph#physical-texture-overlap-and-writable-aliases)
for the complete graph contract.
