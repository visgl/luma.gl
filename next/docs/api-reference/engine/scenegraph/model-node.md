# ModelNode

[Scenegraphs](https://luma.gl/next/docs/api-guide/engine/scenegraph.md)[ScenegraphNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md)

`ModelNode` extends [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md) with a [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) and optional bounds / managed resources.

## Types[​](#types "Direct link to Types")

### `ModelNodeProps`[​](#modelnodeprops "Direct link to modelnodeprops")

```
export type ModelNodeProps = ScenegraphNodeProps & {
  model: Model;
  managedResources?: any[];
  bounds?: [[number, number, number], [number, number, number]];
  instanceMatrices?: readonly NumericArray[];
};
```

## Properties[​](#properties "Direct link to Properties")

### `model`[​](#model "Direct link to model")

The model drawn by this node.

### `bounds`[​](#bounds "Direct link to bounds")

Optional local bounds for one model instance. When `instanceMatrices` is provided, the constructor transforms all eight corners by every instance matrix and stores their aggregate bounding box.

### `instanceMatrices`[​](#instancematrices "Direct link to instancematrices")

Optional transforms corresponding to the model's instanced draw. Providing these matrices lets a single `ModelNode` participate in scenegraph bounds and depth sorting without splitting its draw into individual nodes. An empty instance list has no bounds.

### `managedResources`[​](#managedresources "Direct link to managedresources")

Additional resources destroyed with the node.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: ModelNodeProps)`[​](#constructorprops-modelnodeprops "Direct link to constructorprops-modelnodeprops")

Creates a node around an existing `Model`.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the model and any managed resources.

### `getBounds(): [number[], number[]] | null`[​](#getbounds-number-number--null "Direct link to getbounds-number-number--null")

Returns the configured local bounds, or aggregate local bounds across all configured instances.

### `draw(renderPass: RenderPass): boolean`[​](#drawrenderpass-renderpass-boolean "Direct link to drawrenderpass-renderpass-boolean")

Delegates drawing to the contained model.
