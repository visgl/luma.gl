# WebGL Notes (Advanced)

This is a scratch pad with various notes made during research of the luma.gl API that currently don't fit cleanly into the docs (e.g. because too much detail).

* Familiar API - Work directly with classes mapping to the familiar OpenGL objects (Buffers, Textures, Programs, Framebuffers etc) and use the standard GL constants just like you always have.
* Stateless WebGL - Easy to locally override global GL state.
* Portability - luma.gl simplifies working with WebGL extensions and creating code that works across WebGL versions (WebGL 1 and WebGL 2). And `Capabilities` helps your app determine what features are available.
* Boilerplate reduction - luma.gl automatically deduces common parameters and binds/unbinds your resources as needed.
* No ownership of WebGL context. Use your luma.gl context with other WebGL code, or use luma.gl with WebGL contexts created by other frameworks.

API Design
Note: luma.gl is not a "classic WebGL framework", in the sense that it intentionally doesn't try to hide WebGL from the developer under higher levels of abstraction (while a couple of higher level classes, like [`Model`](/docs/api-reference/core/model.md), are offered, they do not ).


## WebGL Extensions

luma.gl uses [`WebGL Extensions`](https://www.khronos.org/registry/webgl/extensions/) to make WebGL2 features (conditionally) available under WebGL1 and to enable an improved debugging/profiling experience.

## Using the WebGL Classes versus the Raw WebGL API

luma.gl provides JavaScript classes that manage core WebGL object types, with the intention of making these WebGL objects easier to work with in JavaScript, without adding an abstraction layer.

### Advantages

* *Boilerplate reduction* - These classes provide an API that closely matches the operations supported by the underlying WebGL object, while reducing the boilerplate often required by low-level WebGL functions (such as long, repeated argument lists, or the multiple WebGL calls that are often necessary to bind and configure parameters before doing an actual operation).

### Disavdantages

* Executable size - any type of wrapper layer will add some overhead. Care has been taken to keep the overhead reasonable, and to support tree-shaking so that unused parts of the library will not be included in application bundles.
* Occasionally issues more WebGL calls - the classes automatically bind objects before calling methods. When you repeatedly call methods on the same class, there is no memory of which object was bound last, and multiple binding calls will be issued.
* Slight runtime overhead - A very slight runtime overhead since WebGL functions are wrapped in luma.gl methods.

### Interoperability

To maximize interoperability with WebGL code that does not use luma.gl, the WebGLRendingContext type does not have a corresponding luma.gl wrapper class, but is instead used directly by the luma.gl API. A simple global function is provided to help in creating gl contexts.
