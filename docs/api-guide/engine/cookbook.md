import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Engine cookbook

<EngineDocsTabs group="starting" active="engine-cookbook" />

Each recipe assumes an existing `Device`. The snippets emphasize the object or update that changes;
shader source and ordinary render-pass setup are omitted when they are not the point.

| Goal | Engine object | Result |
| --- | --- | --- |
| Render geometry | `Model` | One reusable draw contract |
| Update visible state | `ShaderInputs` or model setters | A redraw without reconstruction |
| Avoid idle work | `needsRedraw()` | Frames only when state changes |
| Pick and highlight | `PickingManager` | Stable object and batch indices |
| Retain hierarchy | `GroupNode` and `ModelNode` | Traversable scene structure |
| Apply an image effect | `ShaderPassRenderer` | A texture or presented frame |

## Render a model

```ts
const model = new Model(device, {source, vs, fs, geometry});
const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
model.draw(renderPass);
renderPass.end();
device.submit();
```

Create the model once and call `model.destroy()` when its owner unmounts.

## Update data without rebuilding

```ts
model.shaderInputs.setProps({lighting: {intensity: 0.8}});
model.setInstanceCount(visibleInstanceCount);
animationLoop.setNeedsRedraw('lighting or visibility changed');
```

Use setters for dynamic state. Reconstruct only when the object’s fundamental contract changes.

## Animate on demand

```ts
function onCameraChange(): void {
  model.setNeedsRedraw('camera changed');
  animationLoop.setNeedsRedraw('camera changed');
}
```

Treat redraw as invalidation, not permission to render forever. See [Redraw detection](./redraw).

## Pick and highlight

```ts
if (pickingManager.shouldPick(mousePosition)) {
  const pickingPass = pickingManager.beginRenderPass();
  model.draw(pickingPass);
  pickingPass.end();
  await pickingManager.updatePickInfo(mousePosition);
}
```

The manager publishes the selected index to shader inputs; skip the pass when the cursor is unchanged.

## Compose a scene

```ts
const root = new GroupNode([
  new ModelNode({model: terrainModel}),
  new ModelNode({model: vehicleModel})
]);
root.traverse(node => node.draw(renderPass));
```

Use direct model lists when transforms and parent-child traversal add no value. Destroying the root destroys its children.

## Apply a pass

```ts
const renderer = new ShaderPassRenderer(device, {shaderPasses: [bloom, toneMapping]});
renderer.renderToScreen({sourceTexture: sceneColorTexture});
```

Each subpass is another draw and may allocate intermediate textures. Call `renderer.destroy()` with its owner.

## Related pages

- [Engine programming guide](/docs/api-guide/engine)
- [`Model`](/docs/api-reference/engine/model)
- [`ShaderInputs`](/docs/api-reference/engine/shader-inputs)
- [`PickingManager`](/docs/api-reference/engine/picking-manager)
