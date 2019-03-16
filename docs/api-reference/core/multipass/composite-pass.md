# CompositePass (Experimental)

Holds a list of render passes (`Pass` instances), possibly including other `CompositePass` instances.


## Usage

Clear the `outputBuffer`

```
  new CompositePass(gl)
```

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

Creates a new `CompositePass` instance


## Properties

Inherits properties from `Pass`


### `passes`: Array (Default: `[]`)

An array of `Pass` subclass instances

