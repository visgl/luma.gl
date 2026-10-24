import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# Buffers and textures

<GPUCoreDocsTabs active="resources" />

## Overview

`GPUGraph` describes logical values. `GPUCommandGraph` turns those values into scheduled GPU work.
A compiled graph owns temporary allocations and records commands into an encoder supplied by the
application. It does not submit commands, present a frame, or take ownership of imported resources.

## Choose storage, then choose a view

| Layer | Buffer-backed data | Textures |
| --- | --- | --- |
| Program values | `GPUGraphScalar`, `GPUGraphVector` | `GPUGraphTexture` |
| Program subresources | Vector chunks describe logical partitions | `GPUGraphTextureView` selects mip, layer, and aspect ranges |
| Graph storage | `GraphBufferHandle` | `GraphTextureHandle` |
| Graph views | `GraphDataView`, ordered `GraphVectorView` chunks | `GraphTextureView` |
| Physical resources | `Buffer` | `Texture` and cached `TextureView` objects |

A handle identifies storage. A view describes how an operation uses part of that storage. Creating
a view does not allocate another buffer or texture, copy data, or transfer ownership. Derive views
from one canonical handle when several passes access the same writable storage.

`GPUGraphVector` is a typed one-dimensional logical value; it is not a general raw-buffer
allocation API. Use the graph's buffer APIs for byte-addressed scratch storage, indirect commands,
vertex/index buffers, or custom layouts. Importing GPU vectors preserves their existing chunks;
packing is explicit.

## Ownership and lifetime

| Resource | Who allocates it? | Who destroys it? | Contents across encodings |
| --- | --- | --- | --- |
| Imported buffer or texture | Application | Application | Persistent, unless the application replaces it |
| Transient buffer or texture | Compiled graph | Compiled graph | Scratch; initialize before reading in each encoding |
| Graph-created views and framebuffers | Compiled graph | Compiled graph | Cached for compatible bindings |
| Frame/presentation texture | Application or canvas context | Its external owner | Valid only for the supplied frame |
| External image texture | Application/browser | Its external owner | Fresh sampled snapshot for that encoding |
| History texture pair | `GPUTextureHistory` | Application calls `history.destroy()` | Persistent; application advances roles explicitly |

Declaring a transient does not immediately allocate a GPU resource. Compilation plans allocation
and reuse from scheduled uses. Compatible transients whose lifetimes do not overlap can share
storage. Texture reuse requires compatible format, dimensions, extent, mip count, and sample count;
the physical allocation carries the union of required usage flags. This is reuse of WebGPU resource
objects, not an exposed native heap-aliasing API.

Do not treat transient contents as retained state or keep physical resources obtained during
encoding for later application use. For an output that must survive graph destruction or be used
outside its scheduled lifetime, allocate it in the application and import it. A graph view is a
logical reference, not an ownership lease on a pooled allocation.

Destroy a compiled graph when its reusable execution plan is no longer needed. It destroys owned
transients, cached views/framebuffers, and node executables; it never destroys imported buffers or
textures. The application must keep imports alive while they are used and must not destroy graph
resources while commands depending on them still need to execute.

## Declare capacity and usage separately from access

Buffer descriptors declare a minimum byte capacity. Texture descriptors declare an exact format,
dimension, extent, mip count, and sample count. Imported resources must match that contract and
provide at least the declared usage flags. `DynamicBuffer` and ready `DynamicTexture` imports are
resolved again at encoding; they do not relax the descriptor contract.

Allocation usage flags (`Buffer.STORAGE`, `Texture.SAMPLE`, `Texture.RENDER`, and so on) enable
operations on a physical resource. Node access declarations (`storage-read`, `sampled`,
`render-attachment`, etc.) tell the graph which operations must be ordered. These are separate:
a sampled-and-renderable texture may be written in one pass and sampled in another.

Declare every buffer and texture access, including those hidden inside reusable operations. The
graph cannot infer a dependency from a shader binding or a sampler alone. Supplying explicit
`dependsOn` edges is not a substitute for declaring accesses needed by lifetime planning.

Buffer hazard tracking is conservative at the logical buffer-handle level. Texture hazards track
overlapping mip, array-layer, and aspect ranges. Whole-texture access covers every subresource.
Two separate active imported handles resolving to the same physical resource are rejected if
either writes; use one handle with multiple views instead. Read-only aliases are allowed.

## Program textures and views

Program texture descriptors reuse `GraphTextureDescriptor` fields, including depth/stencil formats,
arrays, cube textures, 3D textures, mip chains, and multisampling. Device support is checked during
lowering. A descriptor does not promise that every format can be sampled, stored, or rendered on
every device; the selected operation and device must support the intended usage.

```typescript
import {Texture} from '@luma.gl/core';
import {GPUGraph, GPUGraphCompiler} from '@luma.gl/graph/gpu-core';

const program = new GPUGraph({id: 'images'});
const image = program.texture('image', {
  format: 'rgba16float',
  dimension: '2d-array',
  width: 512,
  height: 512,
  depth: 4,
  mipLevels: 5,
  usage: Texture.SAMPLE | Texture.RENDER,
  external: true
});
const layerMip = program.textureView(image, {
  dimension: '2d',
  baseMipLevel: 1,
  mipLevelCount: 1,
  baseArrayLayer: 2,
  arrayLayerCount: 1
});

// Pass image or layerMip to a semantic operation. Its registered lowerer uses
// context.resolveTexture(image) or context.resolveTextureView(layerMip).
const compiler = new GPUGraphCompiler(device);
const compilation = compiler.compile(program, {textures: {image: applicationTexture}});
```

`external: true` means borrowed ordinary texture storage, not a WebGPU `ExternalTexture` image.
The compilation binding is an optional default. An operation that uses this texture requires a
compatible binding either there or in `compiled.encode(encoder, {parameters, textures: {image:
currentTexture}})`. This permits swapping history or application-owned output textures without
changing the logical program. Missing or incompatible active imports fail before node recording.

`compilation.textures` maps IDs to `GraphTextureHandle`s, not physical textures or default views.
Custom lowerers use `resolveTexture()` for storage identity and `resolveTextureView()` for an
explicit selection (or a whole-texture default view). The compiler rejects foreign program texture
objects even when their string IDs match. Views retain their source texture's format type.

## Sampling, attachments, and copies

- Sampling binds a texture view and a sampler. A sampler is sampling policy, not image storage;
  it does not change resource ownership or add another graph allocation. Declare sampled texture
  accesses even when samplers are supplied separately.
- A mip-chain view is useful for sampling. A render attachment selects the particular mip/layer
  being written. Declare separate views for separate passes; selecting one mip does not generate
  the others automatically.
- Render attachments and MSAA resolve targets participate in graph hazards. Resolve into a
  compatible single-sample target before ordinary sampling or readback. Depth/stencil views retain
  their aspects rather than becoming color-texture values.
- Copies are explicit graph nodes. Uploading or reading back pixels is not a side effect of
  creating a texture or view. Buffer/texture transfers must respect the device's layout and
  alignment rules; CPU mapping/readback happens after the caller submits and waits as needed.
- A texture cannot generally be sampled and written as a render attachment in the same pass.
  Use distinct input/output textures or disjoint, valid subresources across appropriately declared
  passes. The graph orders passes; it does not make an invalid WebGPU usage scope legal.

## Frames, history, and resizing

Use `importFrameTexture()` for freshly acquired presentation resources and
`importExternalTexture()` for browser external-image snapshots. These have explicit frame IDs and
freshness rules; they are not interchangeable with persistent imports. These low-level graph APIs
remain available alongside program lowering, but this foundation does not add program-level
presentation or external-image values.

Use persistent imports for history. `GPUTextureHistory` owns two compatible textures; the
application supplies their current roles and advances them after successful encoding according to
its submission policy. If encoded commands are discarded, reset or preserve roles consistently.
Do not use a transient allocation as implicit previous-frame history.

Extents and capacities are part of a compiled plan. After a resize that changes a texture descriptor,
rebuild the program/graph and replace the compiled plan. The graph does not silently resize imports,
change mip counts, acquire swapchain images, generate mipmaps, or manage a frame loop.

## Current boundaries

The current execution backend is WebGPU. Resource descriptors and program values are reusable
semantic concepts, but creating a program does not guarantee WebGL lowering for an operation.
Render and copy nodes under GPU predicates are rejected rather than run unconditionally.
Format-reinterpreting views, automatic usage inference, automatic resize expressions, automatic
mipmap generation, cross-graph scheduling, and native heap residency are not provided here.

For exact method contracts and examples, see [GPUCommandGraph](/docs/api-reference/experimental/gpu-core/gpu-command-graph),
[transient lifetimes](/docs/api-reference/experimental/gpu-core/gpu-transient-lifetimes),
and [texture history](/docs/api-reference/experimental/gpu-core/gpu-texture-history).
