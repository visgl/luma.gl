# Upgrade Guide


## Upgrading from v3 to v4

luma.gl v4 is a major release with API changes. Please read this documentation before upgrading your luma.gl's dependency from v3 to v4.
In addition, a number of previously deprecated features have been removed and a number of additional deprecations have been made at the same time in this version.


## Removed Features

Some previously deprecated classes and functions have been removed in luma.gl v4 and applications must be updated with the new classes and functions if they are still using these.

| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `Vec3`               | `Vector3`        | [New math library]() |
| `Mat4`               | `Matrix4`        | [New math library]() |
| `Quat`               | `Quaternion`     | [New math library]() |


## Deprecated Features

Some classes and functions have been deprecated in luma.gl v4. They will continue to function in v4, but a warning in the console will be generated. These functions are expected to be removed in a future major versions of luma.gl.


| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `withState`          | `withParameters` | [New WebGL state management]() |
| `glContextWithState` | `withParameters` | [New WebGL state management]() |


## API Change

### Model Class

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

the gl context used to be extracted from the supplied program or provided along side with other options, but in luma.gl v4, it is expected as a separate argument to the constructor. This change is because luma.gl v4 emphasizes sharing shaders rather than programs (often indirectly via shader caching / shader assembly), it is less common that a gl context is available.


## Upgrading from V2 to V3

V3 was a fairly minor release, a number of deprecations were made.

### Deprecations

| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `Vec3`               | `Vector3`        | New math library |
| `Mat4`               | `Matrix4`        | New math library |
| `Quat`               | `Quaternion`     | New math library |

