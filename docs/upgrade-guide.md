# Upgrade Guide


## Upgrading from v3 to v4

luma.gl v4 is a major release and a number of previously deprecated features have been removed and a number of additional deprecations have been made at the same time in this version.


## Removed Features

Some previously deprecated classes and functions have been removed in luma.gl v4 and applications must be updated with the new classes and functions if they are still using these.

| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `Vec3`               | `Vector3`        | New math library |
| `Mat4`               | `Matrix4`        | New math library |
| `Quat`               | `Quaternion`     | New math library |


## Deprecated Features

Some classes and functions have been deprecated in luma.gl v4. They will continue to function in v4, but a warning in the console will be generated. These functions are expected to be removed in a future major versions of luma.gl.


| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `withState`          | `withParameters` | New WebGL state management |
| `glContextWithState` | `withParameters` | New WebGL state management |


### Deprecations

#### Model Class

The `Model` constructor now expects a gl context as the first argument.
```
  // v3
  Model({gl});
  Model({gl, ...opts});
  Model({program});

  // v4
  Model(gl)
  Model(gl, {...opts});
  Model(gl, {program});
```
the gl context is extracted from the supplied program, but since v4 emphasizes sharing shaders rather than programs (often indirectly via shader caching / shader assembly), it is less common that a gl context is available.


#### Math Library

The deprecated math library (`Vec3`, `Mat4`, `Quat`) has now been removed.

The new Math library is based on `gl-matrix` and uses Array subclassing so that objects are directly usable with luma.gl. Note that luma.gl now works directly with JavaScript arrays (a `Vector3` is just a 3 element array) and you can use any math library as long as you convert objects to arrays before passing data to luma.gl.


## Upgrading from V2 to V3

V3 was a fairly minor release, a number of deprecations were made.

### Deprecations

| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `Vec3`               | `Vector3`        | New math library |
| `Mat4`               | `Matrix4`        | New math library |
| `Quat`               | `Quaternion`     | New math library |

