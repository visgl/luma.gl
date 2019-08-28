# RFC: Transform Refactor

* **Author**: Ravi Akkenapally
* **Date**: August, 2019
* **Status**: **Review**


## Summary

This RFC proposes refactoring `Transform` API, this class currently supports reading from `Buffer`s and `Texture`s and writing to one or more `Buffer`s and/or a `Texture`. It is now time to look back and divide this class into multiple modules for easier maintenance and scaling.


## Goals

### Support Textures under WEBGL1

`Texture` transform support was added to `Transform` class as experimental, given `Transform` class primarily designed to use `TransformFeedback` it is only supported in `WebGL2`, by separating `Buffer` and `Texture` functionalities `Texture` only transforms can be run under `WebGL1`

### Auto creation of resources

`Transform` class auto creates `Buffer`s and `Texture`s using reference resource, this requires tracking these resources, updating when reference resource is updated and deleting them. This has increased code complexity, instead we can provide utility methods to create these resource and have users maintain these resources.

### Moving Texture components to `gpgpu` module

By separating `Buffer` and `Texture` transform, `Texture` transform functionality can be moved to `gpgpu` module hence reducing the size of `core` module.


## Refactor

`Transform` class can be subdivided into following classes :

### BufferTransformBinding

- Contains all `Buffer` and `TransformFeedback` bindings for a single run.

### BufferTransform

- Takes user provided `Buffer` options, auto creates and tracks `Buffers` if requested.
- Creates one or two `BufferTransformBinding` instances, and performs swapping between them.
- Provides `attributes`, `varyings`, `uniforms` and `TransformFeedback` objects when drawing the model.
- Has getter methods to return and read data from output buffers.

### TextureTransformBinding

- Contains all `Texture` and `Framebuffer` bindings for a single run.

### TextureTransform

- Takes user provided `Texture` options, auto creates and tracks `Texture`s if requested.
- Creates one or two `TextureTransformBinding` instances, and performs swapping between them.
- Provides `attributes`, `shader injects`, `uniforms` and `Framebuffer` objects when drawing the model.
- Has getter methods to return and read data from Framebuffer object.

### Transform

- It creates `Model` object and performs `Model.draw()` for each run.
- Based on user provided options it creates `BufferTransform` and/or `TextureTransform`.
- `BufferTransform` and `TextureTransform` has following methods that are used by `Transform` class to setup resources and query required model props.

   `setupResources({model: Model})` : `model.program` is used to setup `TransformFeedback` object.

   `getModelProps(props)` : `Model` props like, `varyings`, `vs`, shader `injects` and `uniforms` are updated and returned

   `updateDrawOptions(opts)` : Based on current bindings, `attributes`, `transformFeedback` and `framebuffer` instances and updated and returned.


## Approach

We can perform refactor in following two phases:

### Phase-1

This is going to be a non breaking change, existing `Transform` API is kept as is, but internally it will create new classes.

### Phase-2

All auto creation of `Buffer`s and `Texture`s will be removed. All required resources must be supplied (either during construction or using `update`) method, before running a transform loop. More over `Buffer` and `Texture` functionality can be divided, following are the possible options :

#### Option#1:

Rename the current class in `core` module to `TransformBasic`/`TransformBuffer`, which will only create `BufferTransform` and all the `Texture` related API is removed.

Add a new class `Transform` to `gpgpu` module, that extends to `TransformBasic`/`TransformBuffer` class and can also create `TextureTransform` and supports full functionality

#### Option#2:

Make `BufferTransform` and `TextureTransform` public APIs and change `Transform` API to accept these instances as inputs instead of individual `Texture` and `Buffer` objects.

##### Problem:

But we need to resolve how `Buffer` or `Textures` are updated.

#### Option#3:

Remove `Transform` class, and move handling `Model` object into `BufferTransform` and `TextureTransform`.

##### Problem:
Use cases, where we are writing to a `Buffer` and `Texture` at the same time can't be supported.
