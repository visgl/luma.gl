# Resource Class

## Overview

The `Resources class is the base class of all WebGL resources. The typical
life cycle of a WebGL resource looks something like this:

1) Creating a handle
2) Initializing a handle
3) Using the handle
4) Destroying a handle (either explicitly or by letting it be garbage collected)

In addition, context loss can happen at any time between 1 and 4,
at which time resources will be invalidated and handles will
have to be recreated and reinitialized.


## Planned Features

### Stats

The Resource class will track allocations and initializations of resources,
making it easy to see when your application is not reusing resources.


### Context Loss

The subclass will store initialization parameters so that the
object can be automatically recreated in case of context loss.


### Sharing Resources between WebGL contexts

The plan is that the `Resource` class will be extended (`SharedResource`?)
to implement context sharing support as soon as the
[`WEBGL_shared_resources`](https://www.khronos.org/registry/webgl/extensions/WEBGL_shared_resources/)
extension becomes available in a major browser.

The assumption is that an async `aquire` method will be available that will
change the gl context stored in the `Resource`.


## Methods

### Resource Constructor

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
