# Upgrade Guide

## Upgrading from v4 to v5

Please read this documentation before upgrading your luma.gl dependency from v4 to v5. In v5 a number of previously deprecated features have been removed and a number of additional deprecations have been made at the same time.

Before upgrading to v5, it is highly recommended to run your application using latest v4 release, and check the console for any deprecated warnings, if there are any replace deprecated API with newer API as listed below.

### Model Class

The `Model` constructor expects a gl context as the first argument.

```
  // v5
  Model(gl)
  Model(gl, {...opts});
  Model(gl, {program});
```

Following style construction was deprecated in v4 and is now removed in v5.

```
  // NOT SUPPORTED
  Model({gl});
  Model({gl, ...opts});
  Model({program});
```

### useDevicePixelRatio

`useDevicePixelRatio` is used as a an argument in `AnimationLoop` class constructor and `pickModels` method. It is now deprecated in v5, but still supported with a warning message and will be removed in next major version update. It is recommended to use `useDevicePixels` instead.

### Geometry

`Geometry` class construction with inline attributes was deprecated in v4 and now removed in v5.

```
// NOT SUPPORTED
new Geometry({
  positions: new Float32Array([ ... ]),
  colors: {
    size: 4,
    value: new Float32Array([ ... ])
  }
});
```

All attributes should be grouped inside `attribute` object.

```
// SUPPORTED
new Geometry({
 attributes: {
   positions: new Float32Array([ ... ]),
   colors: {
     size: 4,
     value: new Float32Array([ ... ])
   }
 }
});
```

### Removed Features

Following features were deprecated in v3 and v4 are now removed in v5.

* Global symbols:

| Removed symbol / Usage | Replacement    | Comment |
| ---                  | ---              | --      |
| `withState`          | `withParameters` | State management |
| `glContextWithState` | `withParameters` | State management |
|`withParameters({frameBuffer})`| `withParameters({framebuffer})`| State management |
| `MONOLITHIC_SHADERS` | `MODULAR_SHADERS` | default shaders |
| `isWebGLContext` | `isWebGL` | WebGL context validation |
| `isWebGL2Context` | `isWebGL2` | WebGL2 context validation |
| `Camera`, `PerspectiveCamera`, `OrthoCamera` | `None` | |
| `Scene` | `None` | |

* Texture construction options:

| Removed symbol / Usage | Replacement    |
| ---                  | ---              |
| `generateMipmaps` | `mipmaps` |
| `magFilter` | `parameters[GL.TEXTURE_MAG_FILTER]` |
| `minFilter` | `parameters[GL.TEXTURE_MIN_FILTER]` |
| `wrapS` | `parameters[GL.TEXTURE_WRAP_S]` |
| `wrapT` | `parameters[GL.TEXTURE_WRAP_T]` |


## Upgrading from v3 to v4

luma.gl v4 is a major release with API changes. Please read this documentation before upgrading your luma.gl's dependency from v3 to v4.
In addition, a number of previously deprecated features have been removed and a number of additional deprecations have been made at the same time in this version.


## Removed Features

Some previously deprecated classes and functions have been removed in luma.gl v4 and applications must be updated with the new classes and functions if they are still using these.

| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `Vec3`               | `Vector3`        | [New math library](/#/documentation/api-reference/math) |
| `Mat4`               | `Matrix4`        | [New math library](/#/documentation/api-reference/math) |
| `Quat`               | `Quaternion`     | [New math library](/#/documentation/api-reference/math) |


## Deprecated Features

Some classes and functions have been deprecated in luma.gl v4. They will continue to function in v4, but a warning in the console will be generated. These functions are expected to be removed in a future major versions of luma.gl.


| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `withState`          | `withParameters` | [New WebGL state management](/#/documentation/api-reference/with-parameters) |
| `glContextWithState` | `withParameters` | [New WebGL state management](/#/documentation/api-reference/with-parameters) |


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
| `Vec3`               | `Vector3`        | [New math library](/#/documentation/api-reference/math) |
| `Mat4`               | `Matrix4`        | [New math library](/#/documentation/api-reference/math) |
| `Quat`               | `Quaternion`     | [New math library](/#/documentation/api-reference/math) |
