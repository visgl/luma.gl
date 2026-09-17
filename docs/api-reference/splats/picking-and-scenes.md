# Gaussian splat picking and scenes

[Overview](https://luma.gl/docs/api-reference/splats.md)[Renderers](https://luma.gl/docs/api-reference/splats/renderers.md)[Data & shading](https://luma.gl/docs/api-reference/splats/data-and-shading.md)[Streaming](https://luma.gl/docs/api-reference/splats/streaming-and-residency.md)[Picking & scenes](https://luma.gl/docs/api-reference/splats/picking-and-scenes.md)[Formats & loaders](https://luma.gl/docs/api-reference/splats/formats-and-loaders.md)

## GPU picking[​](#gpu-picking "Direct link to GPU picking")

`SplatPicker` renders a dedicated semantic-aware picking pass while borrowing the renderer's existing source batches, visibility state, and sorted GPU draw runs:

```
import {SplatPicker} from '@luma.gl/splats';



const picker = new SplatPicker(renderer, {

  mode: 'auto',

  onPick: info => {

    console.log(info.rowIndex, info.batchIndex, info.batchRowIndex, info.semanticId);

  }

});



const pickedSplat = await picker.pick([pointerX, pointerY]);

await picker.pick([pointerX, pointerY], {force: true});



picker.destroy();
```

WebGPU and compatible WebGL devices use integer picking attachments; other WebGL devices fall back to RGBA color picking. Results report the original source batch, stable global row, batch-local row, and optional semantic identifier. Stable global rows range from zero through 2,147,483,647; WebGL color picking internally remaps larger-than-24-bit row identities without changing the original source indices. Destroy the picker before destroying the borrowing renderer or its caller-owned source batches.

For a WebGPU command graph, use `GPUSplatGraphPicker` instead:

```
import {GPUSplatGraphPicker} from '@luma.gl/splats';



const graphPicker = new GPUSplatGraphPicker(graphRenderer, {

  onPick: info => console.log(info.rowIndex, info.batchIndex, info.semanticId)

});



const selected = await graphPicker.pick([pointerX, pointerY]);

graphPicker.destroy();
```

The graph picker borrows the existing projected records, globally sorted indices, uniforms, and GPU-counted indirect command. It performs one integer-attachment draw and explicit asynchronous pixel readback without walking, copying, or repacking source batches.

## Mixed mesh and splat scenes[​](#mixed-mesh-and-splat-scenes "Direct link to Mixed mesh and splat scenes")

Use an existing render pass to draw opaque meshes, depth-tested Gaussian splats, and transparent mesh overlays against the same depth attachment:

```
renderer.drawMixed(renderPass, {

  opaqueMeshes: [terrainModel, buildingModel],

  transparentMeshes: [selectionOverlay]

});
```

Opaque meshes are drawn first, splats are composited in their selected depth order, and transparent meshes are drawn last. Set `depthCompare` for reversed-depth scenes and enable `depthWriteEnabled` only when the application explicitly needs splat depth writes.

`GPUSplatGraphMixedRenderer` provides the equivalent WebGPU graph composition against a caller-owned color/depth pass:

```
const composition = new GPUSplatGraphMixedRenderer(graphRenderer, {

  depthCompare: 'less-equal'

});



composition.predraw(commandEncoder);

const renderPass = device.beginRenderPass({framebuffer, clearDepth: 1});

composition.draw(renderPass, {opaqueMeshes, transparentMeshes});

renderPass.end();
```

The graph's current preparation step also records its normal presentation pass. The mixed pass then reuses its original projected records and one indirect draw; it does not project source rows or sort splats a second time.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Gaussian splats overview](https://luma.gl/docs/api-reference/splats.md)
* [Gaussian splat showcase](https://luma.gl/examples/showcase/gaussian-splats)
* [GPU Core](https://luma.gl/docs/api-reference/experimental/gpu-core.md)
