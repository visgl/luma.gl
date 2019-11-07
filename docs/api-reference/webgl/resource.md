# Resource

## Overview

The `Resource` class is the base class of all WebGL resource classes (e.g. `Buffer`, `Texture`, etc.)

## Usage

Resources must be created through subclasses, e.g.
```js
const resource = new Buffer(gl);
```

Deleting a resource
```js
const resource = new Buffer(gl);
resource.delete();
```

Getting parameters
```js
const resource = new Texture2d(gl);
resource.getParameters(); // Returns object with values keyed by GL constants.
resource.getParameters({keys: true}); // Returns object with keys and enum values converted to strings.
```

## Methods

### constructor

* `gl` - WebGL context, which is stored on the object.
* `opts` - options
* `opts.id` (string) - stores a string id, helpful for printing and debugging.
* `opts.handle` - by supplying an existing handle, the object will be created
  as a wrapper for that handle (instead of creating a new handle). This
  allows you to use the luma.gl class methods to interface with WebGL resource
  handles created using the raw WebGL API or through other WebGL frameworks.
  luma.gl will make an attempt to extract information about the handle to
  enable as much functionality as possible, although some operations may
  not be possible on imported handles. Also, imported handles can
  typically not be automatically reinitialized after context loss.

### delete

* Deletes any WebGL resources associated with this resources (i.e the underlying WebGLResource handle).

### getParameter(pname)

Gets a given parameter from the resource.

* Note querying for parameters in WebGL is slow and should be avoided in loops and other performance critical situations.

### getParameters(parameters)

Gets list of parameters from the resource (or all parameters).

If the special parameter `keys` is set to true, keys and enumerations will be converted to strings.

* Note querying for parameters in WebGL is slow and should be avoided in loops and other performance critical situations.
* Note - querying without parameters returns all parameters. This can be useful during debugging.


## Properties

### `gl`

The WebGL context is stored on the object.

### `id`

Stores a string id, helpful for printing and debugging.

### `userData`

An empty object to which the application can add keys and values. Note that
the resource object. itself is sealed to prevent additional key being added,
and any keys and values added directly to the underlying WebGL object will
be lost during WebGL context loss.
