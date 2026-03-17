# ModelNode

`ModelNode` extends [`ScenegraphNode`](/docs/api-reference/engine/scenegraph/scenegraph-node) with a [`Model`](/docs/api-reference/engine/model) and optional bounds / managed resources.

## Types

### `ModelNodeProps`

```ts
export type ModelNodeProps = ScenegraphNodeProps & {
  model: Model;
  managedResources?: any[];
  bounds?: [[number, number, number], [number, number, number]];
};
```

## Properties

### `model`

The model drawn by this node.

### `bounds`

Optional bounds returned by `getBounds()`.

### `managedResources`

Additional resources destroyed with the node.

## Methods

### `constructor(props: ModelNodeProps)`

Creates a node around an existing `Model`.

### `destroy(): void`

Destroys the model and any managed resources.

### `getBounds(): [number[], number[]] | null`

Returns the configured bounds.

### `draw(renderPass: RenderPass): boolean`

Delegates drawing to the contained model.
