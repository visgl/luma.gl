# Module Structure

luma.gl contains a lot of classes and functions that might make new users wonder where to get started. luma.gl therefore organize classes and functions into groups, as shown in the following table and also in the folder structure of the source code

| New Module | Purpose |
| ---------- | ------- |
| constants | WebGL enum values |
| shadertools| Tools for manipulating and composing shader text |
| gltool     | Tooling and polyfilling for the WebGL context|
| webgl      | Wrapper classes for WebGL |
| core       | Single module re-exporting key parts of engine, webgl, shadertools |
| engine     | High-level drawing APIs |
| debug      | Debug tooling for the other modules |
| test-utils | Test tooling for the other modules |
| experimental| Experimental, unsupported APIs. Use at your own risk! |

## WebGL Classes

The heart of luma.gl is the `webgl` module, a set of JavaScript class wrappers covering all WebGL objects. From luma.gl v4,
After creating a context, perhaps with luma.gl's [`createGLContext`](/docs/api-reference/webgl/context/context.md) function, you have can start instantiating luma.gl's WebGL2 classes: [`Buffer`](/docs/api-reference/webgl/buffer.md), [`FrameBuffer`](/docs/api-reference/webgl/framebuffer.md), [`RenderBuffer`](/docs/api-reference/webgl/renderbuffer.md), [`Program`](/docs/api-reference/webgl/program.md), [`Shader`](/docs/api-reference/webgl/shader.md), [`Texture2D`](/docs/api-reference/webgl/texture-2d.md), [`Texture3D`](/docs/api-reference/webgl/texture-3d.md), [`TextureCube`](/docs/api-reference/webgl/texture-cube.md), [`Query`](/docs/api-reference/webgl/query.md), [`TransformFeedback`](/docs/api-reference/webgl/transform-feedback.md), [`VertexArrayObject`](/docs/api-reference/webgl/vertex-array.md)

## Core Classes

The `core` classes, with the signature [`Model`](/docs/api-reference/core/model.md) class, represents a set of objects that is common in most 3D rendering libraries or engines. These objects are at higher abstraction levels than the actual WebGL objects and that can serve as the basic building blocks for most 3D applications.

* [`Model`](/docs/api-reference/core/model.md) - A renderable object with program, attributes, uniforms and other state required for rendering 3D objects on the screen
* [`Geometry`](/docs/api-reference/core/geometry.md) - Holds attributes and drawType for a primitive geometric object
* [`AnimationLoop`](/docs/api-reference/core/animation-loop.md) - A simple animation loop that connects with browser's animation mechanism

<!---
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD)
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation
-->

## Basic Geometries and Models

A `Geometry` object holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a `drawMode` prop to indicate how to interpret those vertices and normals as actual geometries.

There are several basic geometry classes predefined in luma.gl: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`. They are all subclasses of the `Geometry` class.

Corresponding to those geometry objects, luma.gl also provides commonly used [`Model`](/docs/api-reference/core/model.md) classes that consist of basic geometries. These include [`Cone`](/docs/api-reference/core/scenegraph/geometries/cone.md), [`Cube`](/docs/api-reference/core/scenegraph/geometries/cube.md), [`Cylinder`](/docs/api-reference/core/scenegraph/geometries/cylinder.md), [`IcoSphere`](/docs/api-reference/core/scenegraph/geometries/ico-sphere.md), [`Plane`](/docs/api-reference/core/scenegraph/geometries/plane.md) and [`Sphere`](/docs/api-reference/core/scenegraph/geometries/sphere.md), etc...


Users are encouraged to write their own geometries and models and luma.gl could include them in its future releases.
