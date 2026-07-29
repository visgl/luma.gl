import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# ModelNode

<EngineDocsTabs group="scenegraph" active="model-node" />

`ModelNode` extends [`ScenegraphNode`](/docs/api-reference/engine/scenegraph/scenegraph-node) with a [`Model`](/docs/api-reference/engine/model) and optional bounds / managed resources.

## Types

### `ModelNodeProps`

```ts
export type ModelNodeProps = ScenegraphNodeProps & {
  model: Model;
  managedResources?: any[];
  bounds?: [[number, number, number], [number, number, number]];
  instanceMatrices?: readonly NumericArray[];
};
```

## Properties

### `model`

The model drawn by this node.

### `bounds`

Optional local bounds for one model instance. When `instanceMatrices` is provided, the constructor
transforms all eight corners by every instance matrix and stores their aggregate bounding box.

### `instanceMatrices`

Optional transforms corresponding to the model's instanced draw. Providing these matrices lets a
single `ModelNode` participate in scenegraph bounds and depth sorting without splitting its draw
into individual nodes. An empty instance list has no bounds.

### `managedResources`

Additional resources destroyed with the node.

## Methods

### `constructor(props: ModelNodeProps)`

Creates a node around an existing `Model`.

### `destroy(): void`

Destroys the model and any managed resources.

### `getBounds(): [number[], number[]] | null`

Returns the configured local bounds, or aggregate local bounds across all configured instances.

### `draw(renderPass: RenderPass): boolean`

Delegates drawing to the contained model.
