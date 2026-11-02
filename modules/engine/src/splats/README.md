# @luma.gl/engine/splats

Experimental Gaussian splat rendering utilities for luma.gl, without dependencies on Apache Arrow,
loaders.gl, or deck.gl.

`makeGPUSplatData(...)` prepares caller-owned GPU data. `SplatRenderer` supports WebGPU and WebGL2;
`GPUSplatGraphRenderer` progressively streams preserved batches through reusable WebGPU command
graphs, global GPU sorting, and one indirect draw. `GPUPagedSplatRenderer` projects sparse rows
from independently owned source pages into bounded GPU segments while preserving one global
cross-page depth order.

For host render loops, call `GPUPagedSplatRenderer.prepare(commandEncoder)` before opening the
host pass, then `draw(renderPass)` inside it. The renderer does not clear, end, or submit a
borrowed pass. `encode(commandEncoder)` remains available for renderer-owned presentation.

Prepared batches support degree-one through degree-three spherical harmonics, semantic class IDs,
and in-place row updates. Both rendering paths evaluate view-dependent radiance and filter semantic
classes. `SplatPicker` and `GPUSplatGraphPicker` resolve original source rows; their corresponding
mixed-scene helpers compose splats with caller-owned depth-tested meshes.

`SplatHierarchyManager` traverses frustum-culled, foveated source hierarchies while preserving
coarse parent fallback and bounded asynchronous loading. `SplatRADHierarchyManager` follows
Spark's authored per-row global child links, retaining mixed source-page leaves and parent
fallback until the complete child frontier is resident. It retargets the retained coherent tree
across camera changes so resolved visible detail does not collapse while bounded traversal
reprioritizes and discovers branches. `SplatResidencyManager` bounds intact streamed batches by
GPU bytes, rows, or chunks. Structural glTF adapters accept decoded `KHR_gaussian_splatting`
attributes, mesh feature IDs, and caller-owned SPZ v2 decoder handoffs.

`selectView(view)` selects a fresh best-first complete cut; `refineView(view)` reprioritizes the
retained cut and publishes coherent intermediate sibling replacements. Both reserve required
ancestor/sibling pages and bound page demand. Progressive camera retargeting walks the retained
tree synchronously; run selection in a worker when large cuts would block the render loop.
Generic `SplatResidencyData` and `SplatRADHierarchyData` allow CPU-only worker metadata without
allocating a GPU device. The host still owns GPU admission and must acknowledge it before the
worker treats decoded pages as resident.

Use optional `expectedSplatCount` and `expectedBatchCount` hints to reserve graph capacity.
Renderers borrow source batches, preserve HDR colors, and must be destroyed before their data.

This package is public with experimental APIs. Install it with `yarn add @luma.gl/engine`.

See [luma.gl](https://luma.gl/docs/api-reference/splats) for documentation.

## Preparing glTF Gaussian primitives

When using loaders.gl, provide `SPZLoader` alongside `GLTFLoader` and request Arrow output. Pass
its result through `postProcessGLTF`, then use the optional Arrow entry to prepare both decoded SPZ
and uncompressed Gaussian primitives:

```typescript
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {SPZLoader} from '@loaders.gl/splats';
import {createScenegraphsFromGLTF, postProcessGLTF} from '@luma.gl/engine/gltf';
import type {GLTFWithBuffers} from '@luma.gl/engine/gltf';
import {getGLTFSplatSceneInstances, makeGPUSplatDataFromGLTFScene} from '@luma.gl/engine/arrow';

const loaded = await load('scene.glb', [GLTFLoader, SPZLoader], {
  splats: {shape: 'arrow-table', targetCoordinateSystem: 'LUF'}
});
const gltf = postProcessGLTF(loaded as GLTFWithBuffers);
const scenegraphs = createScenegraphsFromGLTF(device, gltf, {
  excludeGaussianSplatPrimitives: true
});
const splatGroups = await makeGPUSplatDataFromGLTFScene(device, gltf);
const instances = getGLTFSplatSceneInstances(scenegraphs, splatGroups);
// Apply each instance's worldMatrix when drawing its batches in the host render pass.
// Recalculate instances after animation or visibility changes.
// Destroy the borrowing renderer first, then each batch and scenegraphs.destroy().
```

The bridge preserves the Arrow record-batch boundaries and source mesh/primitive indices. The
splat upload is caller-owned, and decoded loader data remains borrowed. Quaternion conversion and
SH layout adaptation occur in the existing upload adapters; no coordinate-system conversion is
performed by the bridge. If decoding or preparation fails, previously prepared batches are
released. Cancellation is checked before each primitive and after preparation.

`excludeGaussianSplatPrimitives` leaves those primitives out of the mesh scenegraph; it does not
create or draw splat renderers. Applications must resolve scene-node instances, transforms,
visibility, and mixed-scene draw ordering. Decoded splats retain glTF feature-ID attributes when their row counts match the decoded table.
The decoded Arrow path currently accepts linear Rec. 709 display colors; sRGB display colors require
a separate conversion and are rejected. Strict required-extension
support remains unchanged until ordinary scene creation can render the extension end to end.

The Gaussian splat showcase includes a synthetic embedded-GLB scene. Select **Embedded glTF
Gaussian splats** in the scene control. The showcase currently accepts one visible Gaussian instance with an invertible node transform;
applications needing mixed meshes or multiple instances must compose their own render passes.
