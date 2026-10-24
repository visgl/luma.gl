# Engine cookbook

[Overview](https://luma.gl/docs/api-reference/engine.md)[Programming guide](https://luma.gl/docs/api-guide/engine.md)[Cookbook](https://luma.gl/docs/api-guide/engine/cookbook.md)

Each recipe assumes an existing `Device`. The snippets emphasize the object or update that changes; shader source and ordinary render-pass setup are omitted when they are not the point.

| Goal                  | Engine object                   | Result                          |
| --------------------- | ------------------------------- | ------------------------------- |
| Render geometry       | `Model`                         | One reusable draw contract      |
| Update visible state  | `ShaderInputs` or model setters | A redraw without reconstruction |
| Avoid idle work       | `needsRedraw()`                 | Frames only when state changes  |
| Pick and highlight    | `PickingManager`                | Stable object and batch indices |
| Retain hierarchy      | `GroupNode` and `ModelNode`     | Traversable scene structure     |
| Apply an image effect | `ShaderPassRenderer`            | A texture or presented frame    |

## Render a model[​](#render-a-model "Direct link to Render a model")

```
const model = new Model(device, {source, vs, fs, geometry});

const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

model.draw(renderPass);

renderPass.end();

device.submit();
```

Create the model once and call `model.destroy()` when its owner unmounts.

## Update data without rebuilding[​](#update-data-without-rebuilding "Direct link to Update data without rebuilding")

```
model.shaderInputs.setProps({lighting: {intensity: 0.8}});

model.setInstanceCount(visibleInstanceCount);

animationLoop.setNeedsRedraw('lighting or visibility changed');
```

Use setters for dynamic state. Reconstruct only when the object’s fundamental contract changes.

## Animate on demand[​](#animate-on-demand "Direct link to Animate on demand")

```
function onCameraChange(): void {

  model.setNeedsRedraw('camera changed');

  animationLoop.setNeedsRedraw('camera changed');

}
```

Treat redraw as invalidation, not permission to render forever. See [Redraw detection](https://luma.gl/docs/api-guide/engine/redraw.md).

## Pick and highlight[​](#pick-and-highlight "Direct link to Pick and highlight")

```
if (pickingManager.shouldPick(mousePosition)) {

  const pickingPass = pickingManager.beginRenderPass();

  model.draw(pickingPass);

  pickingPass.end();

  await pickingManager.updatePickInfo(mousePosition);

}
```

The manager publishes the selected index to shader inputs; skip the pass when the cursor is unchanged.

## Compose a scene[​](#compose-a-scene "Direct link to Compose a scene")

```
const root = new GroupNode([

  new ModelNode({model: terrainModel}),

  new ModelNode({model: vehicleModel})

]);

root.traverse(node => node.draw(renderPass));
```

Use direct model lists when transforms and parent-child traversal add no value. Destroying the root destroys its children.

## Apply a pass[​](#apply-a-pass "Direct link to Apply a pass")

```
const renderer = new ShaderPassRenderer(device, {shaderPasses: [bloom, toneMapping]});

renderer.renderToScreen({sourceTexture: sceneColorTexture});
```

Each subpass is another draw and may allocate intermediate textures. Call `renderer.destroy()` with its owner.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Engine programming guide](https://luma.gl/docs/api-guide/engine.md)
* [`Model`](https://luma.gl/docs/api-reference/engine/model.md)
* [`ShaderInputs`](https://luma.gl/docs/api-reference/engine/shader-inputs.md)
* [`PickingManager`](https://luma.gl/docs/api-reference/engine/picking-manager.md)
