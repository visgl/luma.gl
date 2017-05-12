# Overview

luma.gl is a WebGL2 JavaScript framework intended for programmers who want full access to the GPU using the capabilities of the latest WebGL2 API. luma.gl aspires to make advanced visualization and GPGPU programming techniques straightforward to use directly in JavaScript.


## High Level Design Goals

- **Advanced GPU Usage** - luma.gl continuously adopts new advanced GPU techniques in JavaScript, starting with instanced rendering in WebGL1, and currently focusing on GPGPU computing and WebGL2 based techniques.
- **Performance** - A strong focus on performance. Partly due to this focus, luma.gl provides a somewhat lower abstraction level than some other WebGL frameworks.
- **Does not hide WebGL** While many WebGL frameworks make a point of "shielding" the programmer from the WebGL API, luma.gl simplifies the use of WebGL2 but does not hide it.
-- **WebGL2 Learning** Learn luma.gl and you will learn WebGL2. If you know WebGL2 or OpenGL and some JavaScript, you should be able to understand luma.gl in minutes.
- **Shader Programming** - luma.gl makes shader programming easier and provides facilities for organizing and modularizing shader code.
- **Shader Debugging** - Extensive support for debugging and profiling your WebGL2 objects and your GLSL shaders.
- **Interoperability with other GL frameworks** - No "magic" global state that gets in the way of interoperability. All components work with a standard `WebGLRenderingContext` and can used together with components from other frameworks (e.g. stackgl).


## History

luma.gl was originally created to be a high performance WebGL engine for [deck.gl](https://github.com/uber/deck.gl). deck.gl is an advaned 3D geospatial visualization framework that does all its rendering using luma.gl.

luma.gl started out as a fork of [PhiloGL](https://github.com/philogb/philogl) however no effort has been made to maintain compatibility with PhiloGL-based applications.


## Module Structure

luma.gl is a relatively large framework, but it is divided into submodules, which hopefully makes it can be approachable in a piece-wise fashion.


### Core Classes

The [core module](api-reference/webgl), with the signature [`Model`](model) class, represent a set of fairly traditional 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications.

* [`Model`](api-reference/core/model) - A renderable object with attributes and uniforms. |
* [`Geometry`](api-reference/core/geometry) - Holds attributes and drawType for a geometric primitive |
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation |
* [`AnimationFrame`](api-reference/core/animation-frame) - render loop / app life cycle support |
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale (TBD) |

Note the `Model` class is in many ways the quintessential luma.gl class. It ties together many concepts in luma.gl and is a good place to start reading if you are new to the framework.


### The WebGL2 Classes

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


### Geometric Primitives

A geometry holds a set of attributes (native JavaScript arrays) (vertices, normals, texCoords, indices) and a drawType.

Classes: `Geometry`, `ConeGeometry`, `CubeGeometry`, `IcoSphereGeometry`, `PlaneGeometry`, `SphereGeometry`, `SphereGeometry`

It should be fairly straightforward to use other primitives, e.g. from npm modules. As long as you have a number of attributes you can wrap them in a `Geometry` or set them directly on a `Model` or a `Program`.


### Scene Graph

The [Scenegraph Module](api-reference/scenegraph) provides a primitive hierarchy of 3D objects with positioning, grouping, traversal and scene support.

* [`Object3D`](object3d.html) - Base class, golds position, rotation, scale
* [`Group`](group.html) - Supports recursive travesal and matrix transformation


### Supporting Modules

A couple of additional modules are provided to assist with tasks that are commonly needed when developing WebGL applications

| **Module** | **Description** |
| --- | --- | --- |
| [`Math`](math.html) | Small math library, Vec3, Vec4, Mat4, Quat |
| [`IO`](io.html)     | Node.js loader support. Also enables using streams in browser. |
| [`Event`](event.html)  | Browser Event handling |
