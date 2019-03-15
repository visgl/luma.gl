# PickingPass (Experimental)

Renders a scene (list of models) into and offscreen buffer and picks using color based picking.


## Usage

Renders into the pickingBuffer

```
  new PickingPass(gl)
```

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

Creates a new `ClearPass` instance


## Properties

Inherits properties from `Pass`

### `models` : Array (Default: `[]`)

Scenegraph (models) to be picked
