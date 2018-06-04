# RFC: Centralize Attribute Management in VertexArray

* **Authors**: Ib Green
* **Date**: Jun 2018
* **Status**: Early Draft


## Summary

This RFC proposes that attribute management (in the form of e.g `Program.setAttributes`) be moved from `Program` to the `VertexArray` class, allowing applications to manage attributes independently of `Program` instances, and centralizing attribute management code in a dedicated class.

Also proposes to use more information gleaned from shader compilation and linking, to require less layout information to be provided by apps, in many cases requiring NO additional layout information with buffers.


## Motivation

A clean API for attribute management is one of the most important design goals of luma.gl. Attribute management is a complicated area and the APIs should be natural and easy-to-understand for users. Having them in a single place, orthogonally defined, with clear API reference and developers docs, is a point of pride for the framework.

The `VertexArray` class is already focused on attribute management and is "the natural place" to put this logic. This provides a nice separation of concerns between programs and attributes, and allows more flexible and performance use of attributes in applications.

In the past we have not been able to fully adopt `VertexArray` since it is not supported on all systems, like headless gl or older WebGL phones etc. The enabler is the Khronos client side `VertexArrayObject` polyfill that allows us to always rely on `VertexArray`s being available.


## Proposal

PART I

* Port the Khronos client side `VertexArrayObject` polyfill to luma.gl.
* Move all attribute management out of `Program`, letting `Program.draw()` accept a `vertexArray`.
* Consolidate code that queries information from the linked program in `Program` to generate a single configuration object, that contains all information needed by both `VertexArray` and `TransformFeedback`
* Allow `VertexArray` and `TransformFeedback` constructors to take a `program` parameter that automatically copies the configuration object from that `program`.
* Standardize on a single `VertexArray.setAttributes` call that handles both buffers, elements and constants.

PART II

* We can extract more information than location from the shaders. We directly get *type* and *size* (components), and we can use simple name comparison heuristics to look for substrings like `instance` and `index` to determine if instance divisors or `ELEMENT_ARRAY_BUFFER` should be considered.

Given this, 90% of all attribute layout specification might be unnecessary and can be autodeduced by luma.gl, letting applications just set arrays and/or buffers with data, leading to a much simpler sample applications.


### Program

A range of attribute related Program methods will be deprecated and/or removed.


### VertexArray

Will receive a light cleanup, some deprecations. The constructor will now accept an optional `program` parameter from which to copy attribute configuration.


### Model

The `Model` class will maintain both a `program` and a `vertexArray` on behalf of the application and should be able to maintain an unchanged API.


### Open Issues

* Impact on `Attribute` class.

* Impact on `TransformFeedback` and `Transform` classes.

* Debugging - The current debugging support will almost certainly take a hit in a refactor like this, and needs to be carefully restored. Especially when we use implicitly defined attribute layouts, we should make it very easy to discover what is expected in the debugger.

