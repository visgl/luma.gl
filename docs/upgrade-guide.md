# Upgrade Guide

## Upgrading from v6.x to v7.0

luma.gl v7.0 represents a major overhaul of the API. The majority of changes are in areas that are only infrequently used by applications, and the intention is that most applications should only require very light porting.


## Core API Removals

### Loading Functions Removed

Extensive loading functionality is now provided by a new companion framework [loaders.gl]() and because of this, most of the limited legacy luma.gl loading functions have been removed.

For the most common case (loading of images for use with textures), loading functions are no longer needed as the `data` prop in the `Texture2D` constructor now accepts url strings and `Promise` objects (this is the new Async Textures function).

| Removed Function | Replacement  |
| ---              | ---          |
| `loadTexture(url, parameters)`  | `new Texture(gl, {data: url, parameters})` |
| `loadFiles`      | Multiple calls to `loadFile` |
| `loadImages`     | Multiple calls to `loadImage` |
| `loadTextures`   | As per `loadTexture` |
| `loadProgram`    | Manually load `fs` and `vs`, call `new Program(gl, {vs, fs})` |
| `loadModel`      | call `loadFile` and copy `parseModel` code from examples/lesson/16|
| `parseModel`     | call `loadFile` and copy `parseModel` code from examples/lesson/16 |

### Attribute Class Removed

This experimental class has been moved to deck.gl and is now an internal class. Attribute accessor API improvements in luma.gl v7 should cover any issue.


## WebGL API Removals

### Sampler Class Removed

The `Sampler` class has been removed as its utility was limited and it added complexity to the library. It may be added back in the future if a clear use case arises.

### Texture2DArray Class Removed

The `Texture2DArray` class has been removed as its utility was limited and the status of support was unclear due to limited testing. It may be added back in the future if a clear use case arises.

### FenceSync Class Removed

The `FenceSync` class has been removed as its utility was limited. It may be added back in the future if a clear use case arises. If required, syncing can be done directly through the `WebGLFenceSync` object.

## Framebuffer and Texture: Copy and Blit methods

Following member function of `Framebuffer` and `Texture` classes are no longer supported, instead use the corresponding new global methods:

| Removed method                  | Replacement |
| ---                             | ---         |
| `Framebuffer.readPixels`        | `readPixelsToArray` |
| `Framebuffer.readPixelsToBuffer`| `readPixelsToBuffer` |
| `Frambuffer.copyToDataUrl`      | `copyToDataUrl` |
| `Frambuffer.copyToImage`        | `copyToImage` |
| `Frambuffer.copyToTexture`      | `copyToTexture` |
| `Frambuffer.blit`               | `blit` |
| `Texture.copyFramebuffer`       | `copyToTexture` |

Parameters have also changed in some cases, see separate section.


## Module Structure Changes

### Debug functionality moved to separate npm module

To reduce bundle size and increase separation of concerns, debug functionality is now more cleanly separated from the core library and needs to be imported from a separate npm module:

To upgrade, install the new module

```bash
npm install @luma.gl/debug
```

And replace

```js
import "luma.gl/debug";
````
with
```js
import "@luma.gl/debug";
```

### Model

Changes:
* `Model` no longer extends `ScenegraphNode`. This ensures that applications that do not need scenegraph support do not need to include scenegraph related code. Use the new `ModelNode` class to inject `Models` into scenegraphs.

Deletions:
* Redraw flag handling has been removed: `Model.setNeedsRedraw()` and `Model.getNeedsRedraw()`.

Additions:
* A new `Model.isAnimated()` method is provided, indicating that redraws are required every frame.

## Geometry

The `Geometry` class has been simplified and is now a conceptually "immutable" class that holds typed arrays and accessor metatadata describing attributes for a geometry.

| Removal                      | Replacement | Reason for Change |
| ---                          | ---         | ---               |
| `Geometry.drawMode` no longer accepts `String` values | `Geometry.DRAW_MODE` enum | API simplification |
| `Geometry.setNeedsRedraw()`  | N/A | Not needed for immutable geometry |
| `Geometry.getNeedsRedraw()`  | N/A | Not needed for immutable geometry |


## Buffer

| Removed Method               | Replacement | Reason for Change |
| ---                          | ---         | ---               |
| `Buffer.updateAccessor(...)` | `Buffer.setAccessor(new Accessor(buffer.accessor, ...)` | Decoupling accessors from `Buffer` |


### Framebuffer

To maximize rendering performance, the default framebuffer is no longer preserved between frames.

The most common use case for preserving the draw buffer is capturing canvas contents into an image via `toDataURL`. This can now be done via `AnimationLoop.toDataURL` which returns a `Promise` that resolves to the canvas data URL:

```js
dataURL = await animationLoop.toDataURL();
snapshotImage.src = dataURL;
```

More generally, moving code that depends on canvas contents to the end of `onRender`, after all draw operations, will ensure that canvas contents are available.

Prior behaviour can re-enabled using the `glOptions` argument to the `createGLContext` or `AnimationLoop` constructors:

```js
new AnimationLoop({
  glOptions: {
    preserveDrawingBuffer: true
  }
});
```

Note that setting `preserveDrawingBuffers` may result in a performance drop on some platforms.


### Query

Use `Query.getTimerMilliseconds` to retrieve timer results in milliseconds. `Query.getResult` now returns raw query results.

To improve performance and simplify the library, support for tracking `Query` instances with promises has changed: The `Query` constructor no longer takes `onComplete` and `onError` callbacks, and `pollGLContext` has been removed. Instead `Query.createPoll` now provides a simple, optional promise-based API.


### Copy And Blit Parameter Unification

Names of certain parameters to these methods have been unified in an effort to reduce confusion and use the same conventions across all functions implementing image read-back, copy or blit.

This table lists parameter mapping between old and new function.

| `Framebuffer.readPixels` | `readPixelsToArray` |
| ---                      | --- |
| -                        | `source` |
| `opts.x`                 | `opts.sourceX` |
| `opts.y`                 | `opts.sourceY` |
| `opts.width`             | `opts.sourceWidth` |
| `opts.height`            | `opts.sourceHeight` |
| `opts.format`            | `opts.sourceFormat` |
| `opts.type`              | `opts.sourceType` |
| `opts.attachment`        | `opts.sourceAttachment` |
| `opts.pixelArray`        | `opts.target` |

| `Framebuffer.readPixelsToBuffer` | `readPixelsToBuffer` |
| ---               | --- |
| -                 | `source` |
| `opts.x`          | `opts.sourceX` |
| `opts.y`          | `opts.sourceY` |
| `opts.width`      | `opts.sourceWidth` |
| `opts.height`     | `opts.sourceHeight` |
| `opts.format`     | `opts.sourceFormat` |
| `opts.type`       | `opts.sourceType` |
| `opts.buffer`     | `opts.target` |
| `opts.byteOffset` | `opts.targetByteOffset` |

| `Framebuffer.copyToDataUrl` | `copyToDataUrl` |
| ------------      | ---- |
| -                 | `source` |
| `opts.attachment` | `opts.sourceAttachment` |
| `opts.maxheight`  | `opts.targetMaxHeight` |

| `Framebuffer.copyToImage` | `copyToImage` |
| ------------              | ---- |
| -                         | `source` |
| `opts.attachment`         | `opts.sourceAttachment` |
| `opts.image`              | `opts.targetImage` |

| `Framebuffer.copyToTexture` | `copyToTexture` |
| ------------          | ---- |
| -                     | `source` |
| `opts.target`         | `target` |
| `opts.texture`        | `target` |
| `opts.x`              | `opts.sourceX` |
| `opts.y`              | `opts.sourceY` |
| `opts.xoffset`        | `opts.targetX` |
| `opts.yoffset`        | `opts.targetY` |
| `opts.zoffset`        | `opts.targetZ` |
| `opts.width`          | `opts.width` |
| `opts.height`         | `opts.height` |
| `opts.internalFormat` | `opts.targetInternalFormat` |
| `opts.mipmapLevel`    | `opts.targetMipmapLevel` |

| `Texture.copyFramebuffer` | `copyToTexture` |
| ------------           | ---- |
| `opts.framebuffer` | `source` |
| `opts.target`      | `target` |
| `opts.x`           | `opts.sourceX` |
| `opts.y`           | `opts.sourceY` |
| `opts.width`       | `opts.width` |
| `opts.height`      | `opts.height` |
| `opts.internalFormat` | `opts.targetInternalFormat` |
| `opts.level`       | `opts.targetMipmapLevel` |

| `Framebuffer.blit` | `blit` |
| ------------       | ---- |
| `opts.srcFramebuffer` | `source` |
| -                 | `target` |
| `opts.attachment` | `opts.sourceAttachment` |
| `opts.srcX0`      | `opts.sourceX0` |
| `opts.srcX1`      | `opts.sourceX1` |
| `opts.srcY0`      | `opts.sourceY0` |
| `opts.srcY1`      | `opts.sourceY1` |
| `opts.dstX0`      | `opts.targetX0` |
| `opts.dstX1`      | `opts.targetX1` |
| `opts.dstY0`      | `opts.targetY0` |
| `opts.dstY1`      | `opts.targetY1` |
| `opts.color`      | `opts.color` |
| `opts.depth`      | `opts.depth` |
| `opts.stencil`    | `opts.stencil` |
| `opts.mask`       | `opts.mask` |
| `opts.filter`     | `opts.filter` |


### Geometry Scenegraph Models

Geometry scenegraph models have been deprecated. Simply create a `Model` or `ModelNode` and explicitly pass a `Geometry` instance as
an argument, e.g.:

```js
  const sphere = new Model(gl, {
    geometry: new SphereGeometry({
      nlat: 30,
      nlong: 30,
      radius: 2
    })
  });
```

## Upgrading from v5.3 to v6.0

luma.gl v6.0 underwent a major API cleanup, resulting in a smaller, easier-to-learn API and smaller application bundles. While there are many smaller changes, the impact on most applications should be limited:

* Most removed functions were in practice rarely used by applications, and the impact on typical luma.gl applications should be limited.
* A number of API changes are related to moving attribute management from `Program` to `VertexArray`, however for higher level applications that work with the `Model` class rather than `Program` directly, there should not be much impact.


### GL Constants Import Path

The biggest change for many apps will probably be that the static `GL` symbol (that contains all WebGL2 constants) must now be separately imported GL from 'luma.gl/constants'.


### Experimental Exports: New Naming Convention

Experimental exports are now prefixed with underscore (\_). The `experimental` "name space" export has been removed.

```js
// NOW: luma.gl v6
import {_Attribute as Attribute} from 'luma.gl';

// BEFORE: luma.gl v5.x
import {experimental} from 'luma.gl';
const {Attribute} = experimental;
```

This change will enable tree-shaking bundlers to remove unused experimental exports, resulting in smaller final application bundles.


### Removed symbols

Math functions were moved from luma.gl to the separate math.gl module in v4.1. As of v6.0, they are no longer forwarded by luma.gl and now need to be imported directly from math.gl:

```js
import {radians, degrees, Vector2, Vector3, Vector4, Matrix4} from 'math.gl';
```

luma.gl v6.0 removes a number of previously deprecated symbols. luma.gl will now issue an error rather than a warning if the old usage is detecated.


### Constants

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `GL`                             | `import GL from 'luma.gl/constants'` | Bundle size reduction (by making this import optional). |
| `glGet(name)`                    | `glGet(gl, name)`               | Bundle size reduction (Was deprecated in v5.3) |
| `glKey(value)`                   | `glKey(gl, value)`              | Bundle size reduction (Was deprecated in v5.3) |
| `glKeyType(value)`               | `glKeyType(gl, value)`          | Bundle size reduction (Was deprecated in v5.3) |


### Context

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `deleteGLContest`                | `destroyGLContext`              | Naming audit (Was deprecated in v5.3) |
| `pollContext`                    | `pollGLContext`                 | Naming audit (Was deprecated in v5.3) |
| `trackContextCreation`           | N/A                             | Rarely used, overly specialized |


### Global Functions

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `readPixels`                     | `Framebuffer.readPixels`        | Naming audit (was deprecated in v3.0) |
| `FrameBufferObject`              | `FrameBuffer`                   | Naming audit (was deprecated in v3.0) |


### AnimationLoop

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `AnimationLoop.setViewParams()`  | `AnimationLoop.setProps()`      | Naming audit  |


### Program

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `varyingMap`                     | N/A (`configuration`)           | Program now auto discovers varyings.        |
| `Program.setAttributes()`        | `VertexArray.setAttributes()`   | Attribute management moved to `VertexArray` |
| `Program.setBuffers()`           | `VertexArray.setAttributes()`   | Attribute management moved to `VertexArray` |
| `Program.setVertexArray()`       | `Program.draw({vertexArray})`   | No longer needed, just supply a `VertexArray` to `Program.draw()` |
| `Program.unsetBuffers()`         | N/A                             | No longer needed, just supply a `VertexArray` to `Program.draw()` |
| `Program.use()`                  | `gl.useProgram(program.handle)` | Rarely needed by apps, can use raw WebGL API |
| `getUniformCount()`              | `getParameter(GL.ACTIVE_UNIFORMS)` | Rarely needed |
| `getUniformInfo()`               | `gl.getActiveUniform()`         | Rarely needed by apps, can use raw WebGL API |
| `getUniformLocation()`           | `gl.getUniformLocation()`       | Rarely needed by apps, can use raw WebGL API |
| `getUniformValue()`              | `gl.getUniform()`               | Rarely needed by apps, can use raw WebGL API |
| 'getVarying()'                   |                                 | Rarely needed by apps, can use raw WebGL API |
| 'getFragDataLocation()'          |                                 | Rarely needed by apps, can use raw WebGL API |
| 'getAttachedShaders()'           |                                 | Rarely needed by apps, can use raw WebGL API |
| 'getAttributeCount()'            |                                 | Rarely needed by apps, can use raw WebGL API |
| 'getAttributeLocation()'         |                                 | Rarely needed by apps, can use raw WebGL API |
| 'getAttributeInfo()'             |                                 | Rarely needed by apps, can use raw WebGL API |


### TransformFeedback

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --          |
| `TransformFeedback.pause()`      | `gl.pauseTransformFeedback`     | Rarely needed by apps, can use raw WebGL API |
| `TransformFeedback.resume()`     | `gl.resumeTransformFeedback`    | Rarely needed by apps, can use raw WebGL API |


### VertexArray

| Removed symbol                   | Replacement                     | Reason for change     |
| ---                              | ---                             | --        |
| `VertexArray.setBuffers()`       | `VertexArray.setAttributes()`   | API Audit, setAttributes handles more cases. |
| `VertexArray.setGeneric()`       | `VertexArray.setConstant()`     | API Audit, prefer "constant" instead of "generic" |
| `VertexArray.filledLocations()`  | N/A                             | No longer needed. |
| `VertexArray.clearBindings()`    | `VertexArray.reset()`           | API Audit |
| `VertexArray.setLocations()`     | `VertexArray.constructor({program})` | Autodetected from `program` parameter |
| `VertexArray.setGenericValues()` | `VertexArray.setConstant()`     | API Audit, prefer "constant" instead of "generic" |
| `VertexArray.setDivisor()`       | `gl.vertexAttribDivisor()`      | Rarely needed by apps, can use raw WebGL API |
| `VertexArray.enable()`           | `gl.enableVertexAttribArray()`  | Rarely needed by apps, can use raw WebGL API |
| `VertexArray.disable()`          | `gl.disableVertexAttribArray()` | Rarely needed by apps, can use raw WebGL API |



## Upgrading from v5.2 to v5.3

v5.3 deprecates a number of symbols. It is recommended that you replace their usage in your source code.

| Deprecated symbol                | Replacement                     | Reason     |
| ---                              | ---                             | --         |
| `GL`                             | `import GL from 'luma.gl/constants'` | Bundle size concerns |
| `deleteGLContest`                | `destroyGLContext`              | API Audit: Naming alignment |
| `pollContext`                    | `pollGLContext`                 | API Audit: Naming alignment |


## Upgrading from v5.1 to v5.2

### Running under Node.js

[Using with Node](/docs/get-started/using-with-node.md): `"import luma.gl/headless"` is no longer required for luma.gl to load headless gl and the usage has been deprecated. You can now simply remove any such import statements from your code.


### Using Debug Contexts

[Debugging](/docs/developer-guide/debugging.md): The Khronos group's `WebGLDeveloperTools` are automatically installed when luma.gl is installed, but are not actually bundled into the application unless explicitly imported. This avoids impacting the size of production bundles built on luma.gl that typically do not need debug support.

To use debug support, first import the debug tools, then call `getDebugContext` to create a debug contexts from a normal WebGL context:

```js
import "luma.gl/debug";
const gl = getDebugContext(gl);
```


## Upgrading from v4 to v5

Please read this documentation before upgrading your luma.gl dependency from v4 to v5. In v5 a number of previously deprecated features have been removed and a number of additional deprecations have been made at the same time.

Before upgrading to v5, it is highly recommended to run your application using latest v4 release, and check the console for any deprecated warnings, if there are any replace deprecated API with newer API as listed below.

### Model Class

The `Model` constructor expects a gl context as the first argument.

```js
  // v5
  Model(gl)
  Model(gl, {...opts});
  Model(gl, {program});
```

Following style construction was deprecated in v4 and is now removed in v5.

```js
  // NOT SUPPORTED
  Model({gl});
  Model({gl, ...opts});
  Model({program});
```

### useDevicePixelRatio

`useDevicePixelRatio` is used as a an argument in `AnimationLoop` class constructor and `pickModels` method. It is now deprecated in v5, but still supported with a warning message and will be removed in next major version update. It is recommended to use `useDevicePixels` instead.

### Geometry

`Geometry` class construction with inline attributes was deprecated in v4 and now removed in v5.

```js
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

```js
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
| `Vec3`               | `Vector3`        | [New math library]( https://github.com/uber-web/math.gl) |
| `Mat4`               | `Matrix4`        | [New math library]( https://github.com/uber-web/math.gl) |
| `Quat`               | `Quaternion`     | [New math library]( https://github.com/uber-web/math.gl) |


## Deprecated Features

Some classes and functions have been deprecated in luma.gl v4. They will continue to function in v4, but a warning in the console will be generated. These functions are expected to be removed in a future major versions of luma.gl.


| Symbol               | Replacement      | Comment |
| ---                  | ---              | --- |
| `withState`          | `withParameters` | [New WebGL state management](/docs/api-reference/webgl/context/with-parameters.md) |
| `glContextWithState` | `withParameters` | [New WebGL state management](/docs/api-reference/webgl/context/with-parameters.md) |


## API Change

### Model Class

The `Model` constructor now expects a gl context as the first argument.

```js
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
| `Vec3`               | `Vector3`        | [New math library]( https://github.com/uber-web/math.gl) |
| `Mat4`               | `Matrix4`        | [New math library]( https://github.com/uber-web/math.gl) |
| `Quat`               | `Quaternion`     | [New math library]( https://github.com/uber-web/math.gl) |
