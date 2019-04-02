# ModelNode

## Constructor

### Model(gl: WebGLRenderingContext, props: Object) _or_ Model(model: Model, props: Object)

* `props` is the same props as `Model`
* Additionally you can pass `props.managedResources` array of objects that this model owns.
Will automatically call `delete()` on all of them when you call `ModelNode.delete()`

## Methods

