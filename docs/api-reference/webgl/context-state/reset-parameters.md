# resetParameters

luma.gl enables a 'stateless' WebGL programming model. In this model, state settings can be passed as parameters to rendering commands, or applied temporarily using `withParameters` rather than being set and unset directly on the global state. For more information, see the remarks.

The following functions are provided:
* `resetParameters` - Resets all GL context parameters to their default values


## Usage

Reset all parameters to their default values
```js
resetParameters(gl);
```

## Methods

### resetParameters

```js
resetParameters(gl)
```
Resets all gl context parameters to default values.

* `gl` {WebGLRenderingContext} - context
Returns no value.

Note that technically, resetting context parameters does not fully reset the context, as buffer binding, z buffer values etc are not reset.
