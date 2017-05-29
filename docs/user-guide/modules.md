# Modules

luma.gl is a relatively large framework, but it is divided into submodules, which hopefully makes it can be approachable in a piece-wise fashion.

## Core Classes

The [core module](api-reference/core), with the signature [`Model`](model) class, represent a set of fairly traditional 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications.

* [`Model`](api-reference/core/model) - A renderable object with attributes and uniforms. |
* [`Geometry`](api-reference/core/geometry) - Holds attributes and drawType for a geometric primitive |
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation |
* [`AnimationFrame`](api-reference/core/animation-frame) - render loop / app life cycle support |
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD) |

Note the `Model` class is in many ways the quintessential luma.gl class. It ties together many concepts in luma.gl and is a good place to start reading if you are new to the framework.


## The WebGL2 Classes

The heart of luma.gl is the [webgl2 module](api-reference/webgl2), a set of JavaScript class wrappers covering all WebGL2 API objects. These classes help organize the sprawling WebGL2 API and makes it much easier to program WebGL2 in JavaScript.

After creating a context, perhaps with luma.gl's [`createGLContext`](context.html) function, you have can start instantiating luma.gl's WebGL2 classes:
* [`Buffer`](buffer.html)
* [`FrameBuffer`](framebuffer.html)
* [`RenderBuffer`](renderbuffer.html)
* [`Program`](program.html)
* [`Shader`](shader.html)
* [`Texture2D`](texture.html)
* [`TextureCube`](texture.html)
* [`Texture2DArray`](texture.html)
* [`Texture3D`](texture.html)
* [`Query`](query.html)
* [`Sampler`](sampler.html)
* [`Sync`](sync.html)
* [`TransformFeedback`](transform-feedback.html)
* [`VertexArrayObject`](vertex-array-object.html)
* [`VertexAttributes`](vertex-attributes.html)
* [`VertexAttributes`](vertex-attributes.html)


## Geometric Primitives

A geometry holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a drawType.

Classes: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`

It should be fairly straightforward to use other primitives, e.g. from npm modules. As long as you have a number of attributes you can wrap them in a `Geometry` or set them directly on a `Model` or a `Program`.


## Supporting Modules

A couple of additional modules are provided to assist with tasks that are commonly needed when developing WebGL applications

| **Module** | **Description** |
| --- | --- | --- |
| [`Math`](math.html) | Small math library, Vec3, Vec4, Mat4, Quat |
| [`IO`](io.html)     | Node.js loader support. Also enables using streams in browser. |
| [`Event`](event.html)  | Browser Event handling |
