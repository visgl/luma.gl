# Overview

A JavaScript math library primarily intended to support WebGL applications
that want to work with math objects like arrays and matrices using an object
oriented (as opposed to procedural or functional) style.


## Who is this for?

- JavaScript WebGL programmers who:
  - need a solid JavaScript library for basic computional geometry purposes.
  - prefer an object orientated programming style but still want their
  - want the ability to activate optional error checking to assist in debugging
  - do not need to support old (pre-IE10) browsers.


# Design Notes

- Objects are Arrays - All math objects are subclasses of the built-in
  JavaScript `Array` class, which means that class instances can be used
  wherever an array is expected. I.e. these classes are not wrappers of
  `Array`s, they **are** `Array`s, just with additional methods.

- Checks - An optional consistency check after every operation can be
  activated at a small runtime cost.

- Focuses on needs of WebGL based applications and basic computational
  geometry, which includes 4x4 matrices, 2, 3 and 4 dimensional vectors
  and quaternions. May grow to include other classes, but is not intended
  to become a general math library.


# History

- Started out as a set of object oriented wrappers for the procedural
  [gl-matrix](http://glmatrix.net/) library.


# Roadmap

- Additional classes and functions. This library might grow beyond just
  providing `gl-matrix` wrappers if additional classes are deemed valuable
  for the target user group.


## Documentation

The [gl-matrix docs](http://glmatrix.net/docs/) are a good start.
Additionally, source code is partially updated with JSDoc.


## API differences with gl-matrix

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
