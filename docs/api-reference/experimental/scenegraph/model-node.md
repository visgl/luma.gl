# ModelNode

`ModelNode` is simply a `ScenegraphNode` that contains a `Model` for drawing.

## Constructor

`ModelNode(webglContextOrModel, props: Object)`

- If a WebGL context is passed, a `Model` will be created internally, otherwise the passed `Model` will be used.
- `props` is the same props as `Model`, plus `props.managedResources`, an array of resources that this model owns.

## Methods

`ModelNode` wraps the following `Model` method and simply proxies them to its internal `Model`:

- `draw`
- `setUniforms`
- `setAttributes`
- `updateModuleSettings`
- `delete` (calls `Model.delete` and also deletes managed resource)
