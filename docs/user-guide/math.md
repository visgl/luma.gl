# Math

A JavaScript math library primarily intended to support WebGL applications.

Note that luma.gl works directly with JavaScript arrays (a `Vector3` is just a 3 element array) and you can use any math library as long as you convert objects to arrays before passing data to luma.gl.

The provided Math library is based on `gl-matrix` and uses Array subclassing so that objects are directly usable with luma.gl.


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
(e.g. `mat4.perspective`, `mat4.ortho` etc) or return multiple values
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
