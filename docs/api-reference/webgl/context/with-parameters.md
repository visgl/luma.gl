# withParameters

Finally, luma.gl enables a 'stateless' WebGL programming model. In this model, state settings can be passed as parameters to rendering commands, or applied temporarily using `withParameters` rather than being set and unset directly on the global state. For more information, see the remarks.

The following functions are provided:
* `withParameters` - Runs a function with a set of parameters temporarily applied


## Usage

Set parameters temporarily for a function call (automatically restoring them after the call)
```js
const returnValue = withParameters(gl, {
  depthTest: true
}, () = {
  // execute code with new parameters temporarily applied
  program.draw(...);
  ...
  // parameters will be restored even the function throws an exception
  if (...) {
    throw new Error('Exception after setting parameters');
  }

  // Return value of the function will be returned from `withParameters`
  return true;
});

// previous parameters are restored here
program.draw(...);
```

## Methods

### withParameters

Executes a function after temporarily setting the parameters. Will restore the parameters to their previously value after the completion of the function, even if the function exits with an exception.

```js
withParameters(gl, {...params}, func)
```
* `gl` {WebGLRenderingContext} - context
* `params` {Object} - any parameter names accepted by `setParameters`

Returns: the value returned by `func`, if any.
