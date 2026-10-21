# GLTFBillboardController

Opt-in camera-facing traversal for a **partial, full-axis profile** of the draft
[`KHR_billboard` proposal](https://github.com/CesiumGS/glTF/tree/aeb5a437219a33aa757743dc1a5d892e3b8e128a/extensions/2.0/Khronos/KHR_billboard).
This profile supports `viewDirection`, `up`, `scaleWithDistance`, `overlay`, and the default/all-axis
`rotationAxis`. The registry deliberately does not advertise full required-extension support.

The draft's instruction to zero facing-vector components conflicts with its Y-only rotation example.
This implementation rejects constrained-axis configurations until that ambiguity is resolved.
The original [Khronos BillboardDemo](https://github.com/KhronosGroup/glTF-External-Reference/tree/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo)
uses an older lowercase `rotationAxis: "y"` spelling. Pass `allowLegacyYAxis: true` to accept that
specific compatibility profile and preserve upright Y-axis rotation. Current draft array-constrained
configurations remain rejected. The source model requires CC BY 4.0 and Apache 2.0 attribution and
contains a 67.9 MB geometry buffer.

```typescript
import {GLTFBillboardController} from '@luma.gl/gltf';
import {ModelNode} from '@luma.gl/engine';

const billboards = new GLTFBillboardController(scenegraphs);

// Each frame, after animations update the ordinary node matrices:
for (const {node, modelMatrix, overlay} of billboards.getDrawEntries({viewMatrix, cameraId: 'main'})) {
  if (!(node instanceof ModelNode)) continue;
  // Bind modelMatrix, the corresponding projection matrix and normal matrix through the
  // application's normal shader-input path. The returned matrix already includes node.matrix.
  const parameters = node.model.parameters;
  try {
    if (overlay) node.model.setParameters({...parameters, depthCompare: 'always', depthWriteEnabled: false});
    node.model.draw(renderPass);
  } finally {
    if (overlay) node.model.setParameters(parameters);
  }
}
```

`getDrawEntries({viewMatrix, sceneIndex, cameraId})` returns ordinary leaves in source order, followed
by overlay leaves sorted back-to-front. Applications must apply the returned complete transforms to
rendering and picking, and disable depth testing/writing for overlay draws. Regular scenegraph
traversal continues to expose authored transforms. The controller never mutates either source glTF
records or animated runtime matrices.

A billboard's world position follows its full parent chain, while parent rotation and scale are
discarded for its facing transform. Its local scale remains effective. Children inherit the resolved
billboard transform; nested billboards calculate their own facing transform. Invisible branches are
omitted. Matrix-authored reflections use the usual determinant-based decomposition, assigning a
negative scale to X when needed.

`scaleWithDistance` uses view-space depth magnitude relative to the first usable rendering for each named camera.
Use a distinct `cameraId` for independently rendered cameras. Nodes absent from a traversal lose
their reference depth. Call `resetCamera(cameraId)` when replacing a camera or detaching and
reattaching a scene without an intervening traversal. A first frame at the eye plane leaves scale unchanged and defers reference capture until a usable depth is available. Crossing the eye plane does not invert scale.

`destroy()` clears controller-owned bindings and camera caches; GPU models and scene nodes remain
application-owned. Instance-local billboarding and camera-dependent skin-joint palette updates are
outside this initial profile. Runtime support for a glTF marked with required `KHR_billboard` remains
incomplete and strict loading rejects it rather than silently dropping unsupported semantics.
