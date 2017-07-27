# Math

A JavaScript math library primarily intended to support WebGL applications.

Note that luma.gl works directly with JavaScript arrays (a `Vector3` is just a 3 element array) and you can use any math library as long as you convert objects to arrays before passing data to luma.gl.

The provided Math library is based on [`gl-matrix`](http://glmatrix.net/) and uses Array subclassing so that objects are directly usable with luma.gl.


## Features

- **Array-based**
    - All math objects can be used directly with any Javascript
      function that expects array arguments. No need to call `toArray`
      or similar.
    - Math objects are `Arrays` - All math objects are subclasses of the built-in
      JavaScript `Array` class, which means that class instances can be used
      wherever an array is expected. I.e. these classes are not wrappers of
      `Array`s, they **are** `Array`s, just with additional methods.

- **Error checking**
    - Assists in debugging.
    - Only minor performance impact, and can be disabled when performance is critical.

- **WebGL-friendly**
    - Matrices: while all accessors, `toString()` etc are row-major.
      matrices are organized internally in the layout expected
      by WebGL (an array of contiguous floats in column-major order),
    - `toArray` and `fromArray` functions take optional offsets allowing
      copying directly to and from vertex attribute array.
    - GLSL math functions (radians, sin etc) made available in JavaScript
      and work both on scalars and vectors / math objects.


## Documentation

The [gl-matrix docs](http://glmatrix.net/docs/) are a good start.
Additionally, source code is partially updated with JSDoc.

The class API is intentionally designed to remain intuitively similar
to the wrapped `gl-matrix` procedures, usually just removing the first one
or two parameters from each function (the out argument and the first
input arguments, both are implictly set to this), and exposes the remaining
arguments in the same order as the gl-matrix api.

Only in a few cases where `gl-matrix` methods take a long list arguments
(e.g. `Matrix4.perspective`, `Matrix4.ortho` etc) or return multiple values
(e.g. `quat.getAxisRotation`) do methods provide a modified API
that is more natural for modern ES6 applications to use, e.g. using named
parameters, or collecting all results in one returned object.

Also, for transforming vectors with matrices, the `transformVector*` methods
are offered in the matrix classes, instead of on the vector classes. They
also (optionally) auto allocate the result vectors.


## Caveats

A technical caveat is that JavaScript `Array` subclassing, which is
fundamental to the design of this library, is only supported on "evergreen"
browsers, such as Chrome, Safari, Firefox, Edge etc,
i.e. no Internet Explorer < 10
([details](https://github.com/loganfsmyth/babel-plugin-transform-builtin-extend)).
If this is not acceptable, this library is not the right choice for you.
As a fallback, you can always use `gl-matrix` directly.


Script: Math {#Math}
===========================

The Math script provides `Vec3`, `Mat4` and `Quat` classes to manage three dimensional vectors, four by four matrices and quaternions respectively.

### Generics:

One very interesting thing to point about the Math script is that all `Vec3`, `Mat4` and `Quat` methods are generics. This means that all
instance methods of `Vec3`, `Mat4`, and `Quat` can also be accessed as static methods in which the first parameter of the static method is the receiver.
The receiver does not *have to be* an instance of the class but can instead be a `Vec3`-like, `Mat4`-like or `Quat`-like object.
This means that a simple array (i.e `[]`) can be used as the receiver for these methods.

Although the *syntax* section for each method will include the generic and non-generic one, the arguments for each method will be described as with the instance
method syntax.

### Chainable Methods:

All methods that do not return something in particular in the math package are chainable.

### Conventions:

Say you want to add two `Vec3` vectors, `v1` and `v2`. Then there are three ways of performing this operation:

1. `v1.add(v2)` Returns a new instance with the result of adding `v1` and `v2`. This operation does not modify `v1` or `v2`.
2. `v1.$add(v2)` Returns the result of adding `v1` to `v2`, but it alters `v1` updating it with the result.
3. `vResult.add2(v1, v2)` Stores the result of adding `v1` to `v2` in `vResult`, another `Vec3` instance.

These are the conventions we will be using for method naming. Methods altering the receiver will have a dollar sign (i.e. `$`), as opposed to
methods creating a new instance with the result. Methods requiring a receiver *and* the instances involved in the operation as formal parameters
will be suffixed with the number `2`.

### Notes:

All classes extend from `Array` or some
`DataView` class (i.e. some typed array). This means that `Vector3`, `Matrix4`
and `Quaternion`-like objects are plain arrays and not plain objects. Getters
have been added for all properties in `Vector3`, `Matrix4` and `Quaternion`
classes so you can still access them via `vec.x`, etc, but remember
that the inner implementation is an array, so `vec3[0]` will also
work.
