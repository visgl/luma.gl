# What's New

## Version 5.1

## TransformFeedback Enhancements

Performing Transform Feedback operations has gotten easier, mainly in the following two ways:

`TransformFeedback` instances can now be supplied directly to `Model.draw` and feedback will begin and end during that draw call. Thus it is no longer necessary to work directly with the `Program` class to use transform feedback.

`Program` now build a `varyingMap` on creation depending on `varyings` array and `drawMode`. This `varyingMap` can be passed to `TransformFeedback.bindBuffers()` enabling buffers to be indexed by the name of the "varying" instead of using an index.

For more details check [`TransformFeedback`](/#/documentation/api-reference/transform-feedback) and [`Model`](/#/documentation/api-reference/model) documentation.


## Version 5.0

A smaller release with several new examples and some under the hood changes to improve performance, bug fixes and code cleanup.

### Picking shader module

`picking` shader module is moved from deck.gl to luma.gl and is also enhanced to support object highlighting. For more details check `picking/README.md`. // TODO : add link.

### Framebuffer binding

In v4 we added WebGL state management which automatically tracks all WebGL state settings. In this release we extended this feature to support framebuffer bindings.


### Model

`Model.draw` now supports a `moduleSettings` parameters to update shader module settings.

`Model.render` now supports `attributes` and `samplers` arguments to be used for drawing.


### Shader Modules

* `fp64` - fp64 module works under more platforms/GPUs/drivers
* `picking` - new module from deck.gl


### State Management

WebGL state management now also tracks framebuffer bindings in addition to other parameters.


### WebGL2 Improvements

Improvements in particular to the `Buffer`, `TransformFeedback` and `Framebuffer` classes based on use in applications.


### Examples

Some additional examples have been ported to the luma.gl v4 API.

* lesson 10-13

## Version 4.0

Release date: July 27th, 2017

A major release that brings full WebGL2 support to luma.gl, as well as adding support for GL state management and a new shader module system.


### Full WebGL2 Support

luma.gl now exposes the complete WebGL2 APIs
* New classes expose all the new WebGL2 objects ([`Query`](/#/documentation/api-reference/query), [`Sampler`](/#/documentation/api-reference/sampler), [`Texture2DArray`](/#/documentation/api-reference/texture-2-array), [`Texture3D`](/#/documentation/api-reference/texture-3d), and [`TransformFeedback`](/#/documentation/api-reference/transform-feedback)), together with a new [`UniformBufferLayout`](/#/documentation/api-reference/uniform-buffer-layout) helper class to make uniform buffers easy to use.
* Other existing WebGL classes with new functionalites under WebGL2 have been updated.
* Add new WebGL2 texture formats and types support, including floating point textures, and multiple render targets.


### WebGL Capability Management

luma.gl provides a single unified WebGL2-style API across WebGL2, WebGL1 and WebGL extensions, and provides a simple mechanisms for querying what capabilities are available. This simplifies building apps that run on both WebGL1 and WebGL2, seamlessly allowing applications to leverage WebGL extensions when available.


### WebGL State Management

In this version, a new WebGL state management is implemented to help address one of the weak spots of the state-machine based WebGL API
* luma.gl can track certain WebGL context state changes so the app could easily set and reset WebGL states for certain operations.
* luma.gl also has a host-side WebGL state caching system that records certain WebGL states so that expansive queries into the GPU or underlying OpenGL driver won't be necessary.


### shadertools - A New Shader Module System

* The new, optional, shadertools module with the `assembleShaders` function system allows shader code to be broken into composable pieces.

* A new `ShaderCache` class is provided to ensure that identical shaders are only compiled once and no unnecessary examination and/or checks are done on already compiled WebGL shader and program objects, which significantly accelerates app start up under some occasions.


### Documentation Improvements

Complete rewrite of luma.gl's documentation. New structure and contents for every classes provided, featured on a new website with links to other frameworks in Uber's visualization framework suite, such as deck.gl and react-map-gl.


### Code Size Improvements

Significant reduction in the size of distributed luma.gl library

* Code Size - luma.gl is continuously being tuned for code size.
* Deprecated Code Removed - Removal of deprecated features to help reduce library size.
* Tree Shaking support - special care have been taken to avoid so called "side effects" that defeat dependency analysis during tree shaking).


## v3.0

Release Date: March 15, 2017

A smaller release mainly intended to align the luma.gl code base with the big deck.gl v4 release.

## Major News

### Examples
* Examples converted to ES6 to better showcase the luma.gl API.


## Debug Support
- Now uses `WEBGL_debug_shaders` extension when available to log translated shader source code.
- Performance queries, using `EXT_disjoint_timer_query` and `EXT_disjoint_timer_query_webgl2` to provide timings.


## New `AnimationFrame` class
- Wraps requestAnimationFrame on browser and Node.js
- Supports initialization promises (wait for HTML body (canvas) to load, wait for texture images to load, etc).
- Supplies common uniforms to the frame render function: `width`, `height`, `aspect`, `tick`, `time` etc.


## Smaller changes
- Fix glTypeToArray to use `Uint8ClampedArrays` by default
- Add CORS setting to allow loading image from a different domain

## New `gl-matrix` based math library
- Optional library: All math operations directly accept JavaScript arrays
- Math classes are subclasses of JavaScript arrays (i.e. not {x,y,z} objects)
  and can thus be used interchangeably with arrays.
- Relies on `gl-matrix` for computations.
- Adds optional error checking.
- Offers more control over details like printing precision etc.

### Library Size
* Reorganized to only export a minimal surface of functions/classes.
* Tree-shaking support (package.json module keyword and dist-es6 distribution)
* Significant reduction of module dependencies.

### Experimental Additiona
- `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
- `probe` moved to `/experimental`

### Deprecations/Deletions
- Old math lib deprecated.
- `FBO` class deprecated (use `Framebuffer` directly).
- `Camera` class deprecated, use math library directly.
- `Scene` class deprecated, for effects use - TBD

### Internal improvements
- Replace wildcard exports with named exports in index.js
- ES6 Conformant code base: stage-2 extensions removed
- Webpack based build
- Multiple examples now work standalone
- Experimental tree-shaking support: dist and dist-es6 directories
- Dependency removal, including removal of `autobind-decorator` dependency
- Changed precommit hook from `husky` to `pre-commit`
- `webgl` folder now contains both webgl1 and webgl2 classes

### Breaking Changes
- BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree
  and into `packages`. This allows luma.gl to drop a number of big dependencies.
  The node IO code may be published as a separate module later.


## v2.0

Release Date: July 05, 2016 (evolved through a number of minor releases)

Theme: A bigger official release, a major API refactoring that introduced the WebGL classes that are now a characteristic aspect of the luma.gl API.

## Major Features

- CHANGE: Removes glslify as a dependency, apps that depend on glslify must add it to their own package.json.

### TimerQuery
  - Support EXT_disjoint_timer_query.

## Debug Support
- Built-in attribute/uniform logging
- GLSL shader compiler error handling

### Linux support
- Add missing call to getAttribLocation.

### Introduce new gl-matrix based math library.
- Move old math lib to deprecated folder.
- Move FBO to deprecated folder.
- Examples converted to ES6. AnimationFrame class updates.
- Add back persistence example
- WebGL type and constant cleanup
- Fix glTypeToArray and use clamped arrays by default

### TimerQuery, WebGL Extension doc, fix crash on Travis CI
- Support EXT_disjoint_timer_query
- Document luma.gl use of WebGL extensions.
- Fix: context creation crash when WEBGL_debug_info extension was undefined

### Debug log improvements, import fix
- Debug logs now print unused attributes more compactly, number formatting
improved.

### Add ability to import luma without io
- import "luma.gl/luma" will import luma without io functions
- import "luma.gl/io" will import luma io functions only
- omitting io functions significantly reduces dependencies
- Makes the luma object available in console for debugging.
- Some polish on luma's built-in attribute/uniform logging

### Node.js/AttributeManager/Renderer/Program.render()/Examples
- Ensure luma.gl does not fail under node until createGLContext is called.
- Program.render() now takes a map of uniforms, reducing need to "set" uniforms before render.
- New experimental Renderer class - `requestAnimationFrame` replacement.
- Improvement/fixes to examples

### Node.js support
- Ensure luma.gl does not fail under node until createGLContext is called.

### luma global initialization
- Makes the luma object available in console for debugging.
- Makes optional headless support more reliable.

### Headless support
- Removed `gl` (headless-gl) dependency, to simplify build and setup for applications that don't use headless-gl.
- `import 'luma.gl/headless'` and `npm install gl` to get headless integration.

### Improve change detection
- Redraw flag management improvements

### Decoupled headless-gl dependency
- It is now necessary to import luma.gl through `luma.gl/headless` to get
headless integration. When using the basic `luma.gl` import, the app no longer needs to
have `gl` as a dependency. This should simplify build and setup for applications that don't use headless-gl.


### Improve change detection
- Redraw flag management improvements
- New experimental Renderer class - `requestAnimationFrame` replacement.


## v1.0

Release Date: 2016

Theme: A smaller, mostly internal version that was the starting point for luma.gl development.

### Major Features
* Initial ES6 Port from PhiloGL
