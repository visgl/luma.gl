# What's New

## Version 7.1

Date: June 4, 2019

### Enhanced Shader Injection System

luma.gl now supports a much more robust system for injecting code into shaders. In addition to the pre-defined shader hooks such as `vs:#main-start`,
the shader injection system now supports:
- Definition of arbitrary shader hook functions that can be called anywhere in a shader
- Injection of arbitrary code into shader hook functions to modify their behavior
- Automatic injection by shader modules into hook functions or pre-defined shader hooks

The combination of these features allows the behavior of the same shader code to be modified depending on included shader modules or other
requirements of the application. See [assembleShaders](/docs/api-reference/shadertools/assemble-shaders.md) documentation for more details.

### Animation Support

More robust animations are now supported via the `Timeline` and `KeyFrames` classes.

The  `Timeline` class supports easily managing a timeline with multiple channels elapsing at different rates, as well as orchestrating playing, pausing, and rewinding behavior between them. A timeline can be attached to an `AnimationLoop` and then queried for time values, which can be used in animations. See [Timeline](/docs/api-reference/addons/animation/timeline.md) documentation for more details.

The `KeyFrames` class allows arbitrary data to be associated with time points. The time value of the key frames can be set and the current key frames and interpolation factor can be queried and used in calculating animated values. See [KeyFrames](/docs/api-reference/addons/animation/key-frames.md) documentation for more details.

## Version 7.0

Date: April 19, 2019

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img height=200 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/gltf-city.gif" />
        <p><i>glTF Support</i></p>
      </td>
      <td>
        <img height=200 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/gltf-pbr.gif" />
        <p><i>PBR (Physically Based Rendering)</i></p>
      </td>
    </tr>
  </tbody>
</table>


### glTF Support

<img height=100 src="https://raw.github.com/uber-common/deck.gl-data/master/images/gltf.png" />

luma.gl can now load 3D models and scenegraphs in the popular [glTF™](https://www.khronos.org/gltf/) asset format (with the help of the loaders.gl [GLTFLoader](https://github.com/uber-web/loaders.gl/blob/master/website/docs/api-reference/gltf-loaders/gltf-loader.md). All variants of glTF 2.0 are supported, including binary `.glb` files as well as JSON `.gltf` files with binary assets in base64 encoding or in separate files. The Draco Mesh compression extension is also supported.

- **Physically-based Material Support**: Ensures that PBR models display as intended.
- **Scenegraph Improvements**: The Scenegraph classes have been refactored to ensure support for glTF objects.
- **Geometry glTF Support**: The `Geometry` class and scene graph support has been overhauled to conform to glTF conventions, simplifying loading and manipulation of glTF formatted data.


### loaders.gl Integration

[loaders.gl](https://uber-web.github.io/loaders.gl/) is a major new companion framework to luma.gl that provides a suite of 3D file format loaders (with an emphasizis on point cloud formats), including:

* Draco
* PLY
* PCD
* LAS/LAZ
* OBJ

loaders.gl output can now be passed directly into luma.gl classes like `Geometry` and `Model` making it straightforward to use luma.gl with a wide variety of file formats.


### Asynchronous Textures

Image data for `Texture` classes can now be supplied using URLs or `Promise`s, making it unnecessary for applications to handle image loading themselves.

```js
new Texture2D(gl, 'path/to/my/image.png'); // Texture2D will load the image and becomes 'renderable' once it loads
// or
new Texture2D(gl, loadImage('path/to/my/image.png')); // loadImage returns a promise
```

### Lighting

A standardized set of light classes are now supported by multiple material models (Phong, Goraud and PBR) enabling various models to be mixed and properly lit in the same scene.


### Modularization Improvements

- luma.gl has been restructured to make it easier for applications to select and import only parts of the library that they use.

* ` @luma.gl/gpgpu` **<sup>New</sup>** - A new experimental submodule with GPGPU Algorithms and Utilities has been added, containing a growing collection of GPU accelerated algorithms and utility methods.


### Performance Instrumentation

Extensive metrics about frame CPU and GPU times, resource counts, and GPU memory usage are being collected. The data is exposed as a [probe.gl](https://uber-web.github.io/probe.gl/#/) [`Stats`](https://uber-web.github.io/probe.gl/#/documentation/api-reference-logging/stats) object. The new probe.gl [StatsWidget](https://uber-web.github.io/probe.gl/#/documentation/api-reference-widgets/statswidget) can be used to present data in applications.


### Interleaved Attributes

To improve support for interleaved attributes and glTF model loading, accessor objecs and the `Accessor` class now support a `buffer` field. In addition, attribute setting functions now accept accessor objects with the `buffer` field set. This allows multiple accessor objects referencing the same buffer:

```
const buffer = // "interleaved" vertex attributes: 3 floats for position followed by 4 bytes for RGBA
model.setAttributes({
  positions: {buffer, stride: 16, offset: 0, ...}}),
  colors: {buffer, stride: 16, offset: 12, ...}})
}
```

### Unified functions for Framebuffers and Textures (Read/Copy/Blit)

A set of global methods that perform copying data to and from `Framebuffer` objects. All functions that read from or write to a `Framebuffer` object now also accept a `Texture` object (no need to create and configure a `Framebuffer` just to do a simple operation on a `Texture`).


## Experimental Features

### WebVR Support (experimental)

Just replace your `AnimationLoop` with `VRAnimationLoop` from ` @luma.gl/addons`. Works with [Firefox Reality](https://mixedreality.mozilla.org/firefox-reality/).



## Version 6.4

Date: January 29, 2018

### PBR (Physically Based) Rendering and Material

Physically-Based Rendering is now supported and the new `PBRMaterial` class can be used to set up parameters. Material can be selected per model.


### Copy and Blit methods

Several member function of `Framebuffer` and `Texture` classes are now replaced by global methods that peform copying data to and from `Framebuffer` objects. All methods that read from or write to a `Framebuffer` object, can now also accept a `Texture` object.


## Version 6.3

Date: November 16, 2018

### Uniform Caching

Uniforms are now cached at `Program` object, which improves performance by eliminating uniform setter calls when uniform values are not changed.

### New submodules

* `@luma.gl/debug` - an experimental module for debugging WebGL shaders on CPU
* `@luma.gl/glfx` - shader modules for image processing

### Offscreen Rendering (Experimental)

A new experimental class `AnimationLoopProxy` supports running an `AnimationLoop` on a worker thread using the `OffscreenCanvas` API made official in Chrome 70. For more detatils, see [API documentation](/docs/api-reference/core/animation-loop-proxy.md) and [example app](https://github.com/uber/luma.gl/tree/7.1-release/examples/wip/worker).


## Version 6.2

Date: September 12, 2018

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/render-pass.gif" />
        <p><i>glfx port using ShaderModulePass</i></p>
      </td>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/transform-texture.gif" />
        <p><i>Transform: edge detection</i></p>
      </td>
    </tr>
  </tbody>
</table>

### ShaderModulePass (Experimental)

Shader modules that expose "standard" filtering and sampling functions can be given extra metadata (the `passes` field) enabling easy construction of a `ShaderModulePass`. Look for `ShaderPass` badges in the documentation of shader modules.

### Transform Texture support (Experimental)

`Transform` class was introduced in 6.0 provides easy API to perform WebGL's complicated `TransformFeedback`. We are now extending this class to provide same easy API to read and write into textures. Running image filters, performing offline rendering and custom texture mip-map generation are some of the use-cases. Moreover, texture and buffer access can be combined, i.e. using single `Transform` instance buffers can be captured using `TransformFeedback` and data can be propagated beyond vertex shader to generate a texture.


## Version 6.1

Date: Target August 31, 2018

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/luma61-ssao-pass-thumb.gif" />
        <p><i>Ambient Occlusion Render Pass</i></p>
      </td>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/luma61-edge-pass-thumb.gif" />
        <p><i>Edge Detection Render Pass</i></p>
      </td>
    </tr>
  </tbody>
</table>

luma.gl 6.1 is a minor release that introduces a number of new experimental capabilities that are expected to be built out and become official over the next few releases.


### New Multipass Rendering System (Experimental)

luma.gl now provides a composable multipass rendering framework, based on a `MultiPassRenderer` class that accepts a list of render passes.


### Post-Processing Effects (Experimental)

A number of classic WebGL/OpenGL post processing effects have been ported to luma.gl and packaged as composable render passes. For maxiumum flexibility, many of the underlying shaders have also been exposed as shader modules, allowing filtering features to be used either directly in existing shaders or applied as a post-processing filter.


### New loaders.gl Submodule (Experimental)

A selection of open source 3D loaders have been ported to a new submodule `loaders.gl`. Initial focus is on point cloud loaders (PLY, LAZ, PCD), although a geospatial loader (KML) is also included. In addition it contains both read and write support for GLB (the glTF binary container format).


### Transform Class now supports Shader Modules

The `Transform` class now accepts shader module parameters (such as `modules`, `dependencies` and `inject`, see [assembleShaders](/docs/api-reference/shadertools/assemble-shaders.md)), enabling the use of shader modules in transform feedback operations.


### Documentation Search

luma.gl is now using the [ocular](https://github.com/uber-web/ocular) document generator to build its website, which among other things enables search.


## Version 6.0

Date: July 18, 2018

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/webgl2.jpg" />
        <p><i>WebGL Improvements</i></p>
      </td>
    </tr>
  </tbody>
</table>

A major release that as always focuses on WebGL performance and code size optimizations, better support for shader/GLSL programming, improved documentation and API cleanup.


## WebGL Improvements

### Attribute Management Optimizations

`VertexArray` objects are now used for all attribute management in luma.gl, resulting in improved performance and a simpler, more consistent API. The `Program` and `Model` class APIs have been updated to use `VertexArray`.

### Buffer Memory Optimizations

The `Buffer` class no longer holds on to the complete JavaScript typed arrays used during initialization. This can lead to significant memory savings in apps that use multiple large GPU buffers initialized from typed arrays. Also for convenience a new method `getElementCount` is added that returns number elements based on its size and type.

### Transform Feedback Improvements

A new method `Model.transform` makes it easier to run basic transform feedback operations, when the full power of the new `Transform` class (see below) is not needed.


### Transform class (WebGL2)

[`Transform`](/docs/api-reference/core/transform.md) is now an officially supported luma.gl class. This new class provides an easy-to-use interface to Transform Feedback. This class hides complexity by internally creating and managing the supporing WebGL objects that are necessary to perform Transform Feedback operations.


## Shader Module System Improvements

### GLSL Transpilation

The shader assembler now transforms shader code to the GLSL version specified by the top-level shader. GLSL 3.00 ES shader code is transparently transformed into GLSL 1.00 ES compatible code when needed, and vice versa. This allows application to write shader code in the modern GLSL version available (3.00 ES) and still run it under WebGL1 - Shader "transpilation" will automatically convert shader module source code syntax to the target version (assuming that no WebGL2 only features were used).


### Shader Code Injection

A new shader injection system allows applications to inject additional code into existing shaders. In many cases, this can avoid the need to copy (or "fork") large and complicated existing shaders just to add a few lines of code.

Shader injection can be used to "inject" new shader modules into an existing shader. Adding a shader module to the modules list automatically "prepends" the shader module functions to the beginning of your main shader code, but using a shader module still typically requires adding one or two lines of code each to the main functions in the vertex and fragment shaders. In many cases, the new shader injection feature allows this be done without copying the original shaders.


### Shader Modules now support GLSL 3.00 ES

All shader modules are now written in GLSL 3.00 syntax, and leverage the new GLSL transpilation feature to be compatible with both GLSL 3.00 ES and GLSL 1.00 ES main shaders. Care is taken to avoid using GLSL 3.00 specific features whenever possible, and exceptions will be clearly documented.


## Documentation

### Developer's Guide

luma.gl now has a more extensive Developer's Guide covering more areas of the API, including a new developer guide for shader programming, with sections about writing shaders and the shader module system. Content includes:

- Guidelines for writing shaders that work in both GLSL 3.00 ES and GLSL 1.00 ES
- A new GLSL language reference page describing both GLSL 3.00 ES and GLSL 1.00 ES (as well as what has changed between them) in a single place.


## API Cleanup

Being a major release, in v6.0 we took the opportunity to clean up the luma.gl API.


### Removal of Deprecated/Unused Methods

To keep reducing application bundle size, a number of methods have been removed from the luma.gl API. Methods that were deprecated in previous releases have now been removed, and in additional a number of rarely used methods have also been dropped (in most cases, the dropped functionality is still accessible using raw WebGL calls).

### Renamed Methods

In a few cases, methods have been renamed after API Audits, usually to improve API consistency. The details are listed in the Upgrade Guide. In most cases, running your pre-v6 application on v6 should generate messages in the console when old method calls are encountered, and you should be able to quickly address any changes one-by-one by referring to the Upgrade Guide.



## Version 5.3

Date: June 1, 2018

A minor release with bug fixes and internal improvements.


## Version 5.2

Date: Apr 24, 2018

## Transform class (WebGL2, Experimental)

The new experimental [`Transform`](/docs/api-reference/core/transform.md) class provides an easy-to-use interface to perform Transform Feedback operations.


## Framebuffer Class

**Pixel Readback to GPU Buffers** (WebGL2) - A new method [`Framebuffer.readPixelsToBuffer`](/docs/api-reference/webgl/framebuffer.md) is added to asynchronously read pixel data into a `Buffer` object. This allows  applications to reduce the CPU-GPU sync time by postponing transfer of data or to completely avoid GPU-CPU sync by using the pixel data in the GPU `Buffer` object directly as data source for another GPU draw or transform feedback operation.


## Bundle Size Reduction

The impact of importing luma.gl on production application bundle sizes has been reduced, in particular when using webpack 4 with appropriate configuration. A new article about [bundling and tree shaking](/docs/developer-guide/building-apps.md) has been added to the Developer Guide, providing in-depth information and guidance on what numbers to expect.


## Running luma.gl in Node.js

Running of luma.gl under Node.js is now easier than ever. luma.gl v5.2 automatically loads headless-gl if installed on the system, avoiding the need for the app to import special files or add other conditional logic. See [Using with Node](/docs/get-started/README.md) and the Upgrade Guide.


## Debug Mode Changes

To further reduce production application bundle sizes, luma.gl no longer support WebGL debug contexts by default, as this requires including the Khronos [WebGLDeveloperTools](https://github.com/KhronosGroup/WebGLDeveloperTools) into the bundle. WebGL debug contexts are still available, but needs to be explicitly enabled. To understand how to use WebGL debug contexts in v5.2, please refer to the article on [Debugging](/docs/developer-guide/debugging.md) and the Upgrade Guide.


## Examples

All examples have been updated to use webpack 4


## Version 5.1

A smaller release with improvements to `TransformFeedback` support.

Date: Feb 15, 2018

## TransformFeedback Class

Two improvements Performing Transform Feedback operations has gotten easier, mainly in the following two ways:

`TransformFeedback` instances can now be supplied directly to `Model.draw` and feedback will begin and end during that draw call. Thus it is no longer necessary to work directly with the `Program` class to use transform feedback.

`Program` now build a `varyingMap` on creation depending on `varyings` array and `drawMode`. This `varyingMap` can be passed to `TransformFeedback.bindBuffers()` enabling buffers to be indexed by the name of the "varying" instead of using an index.

For more details check [`TransformFeedback`](/docs/api-reference/webgl/transform-feedback.md) and [`Model`](/docs/api-reference/core/model.md) documentation.


## Version 5.0

Date: Dec 22, 2017

A smaller release with several new examples and some under the hood changes to improve performance.


### Examples

Additional examples have been ported to the luma.gl v5 API.

* [Lesson 10](http://uber.github.io/luma.gl/#/examples/webgl-lessons/lesson-10-3d-world)
* [Lesson 11](http://uber.github.io/luma.gl/#/examples/webgl-lessons/lesson-11-sphere)
* [Lesson 12](http://uber.github.io/luma.gl/#/examples/webgl-lessons/lesson-12-point-lighting)
* [Lesson 13](http://uber.github.io/luma.gl/#/examples/webgl-lessons/lesson-13-per-fragment-lighting)


### Model Class

* `Model.draw` now supports a `moduleSettings` parameters to update shader module settings.
* `Model.render` now supports `attributes` and `samplers` arguments to be used for drawing.


### Framebuffer Binding Management

In v4 we added WebGL state management which automatically tracks all WebGL state settings. In this release we extended this feature to support framebuffer bindings. When restoring context settings, the previous framebuffer binding will also be restored.


### WebGL2 Improvements

Improvements in particular to the `Buffer`, `TransformFeedback` and `Framebuffer` classes based on use in applications.


### Shader Modules

* `fp64` - fp64 module works under more platforms/GPUs/drivers
* [`picking`](/docs/api-reference/shadertools/shader-module-picking.md) shader module is moved from deck.gl to luma.gl and has been enhanced to also support object highlighting.



## Version 4.0

Release date: July 27th, 2017

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img height=150 src="https://raw.github.com/uber-common/deck.gl-data/master/images/whats-new/webgl2.jpg" />
        <p><i>WebGL 2</i></p>
      </td>
    </tr>
  </tbody>
</table>

A major release that brings full WebGL2 support to luma.gl, as well as adding support for GL state management and a new shader module system.


### Full WebGL2 Support

luma.gl now exposes the complete WebGL2 APIs:

* New classes expose all the new WebGL2 objects ([`Query`](/docs/api-reference/webgl/query.md), [`Texture3D`](/docs/api-reference/webgl/texture-3d.md), and [`TransformFeedback`](/docs/api-reference/webgl/transform-feedback.md)), together with a new [`UniformBufferLayout`](/docs/api-reference/webgl/uniform-buffer-layout.md) helper class to make uniform buffers easy to use.
* Other existing WebGL classes with new functionalites under WebGL2 have been updated.
* Add new WebGL2 texture formats and types support, including floating point textures, and multiple render targets.


### WebGL Capability Management

luma.gl provides a single unified WebGL2-style API across WebGL2, WebGL1 and WebGL extensions, and provides a simple mechanisms for querying what capabilities are available. This simplifies building apps that run on both WebGL1 and WebGL2, seamlessly allowing applications to leverage WebGL extensions when available.


### WebGL State Management

In this version, a new WebGL state management is implemented to help address one of the weak spots of the stateful WebGL API:

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

* Now uses `WEBGL_debug_shaders` extension when available to log translated shader source code.
* Performance queries, using `EXT_disjoint_timer_query` and `EXT_disjoint_timer_query_webgl2` to provide timings.


## New `AnimationFrame` class

* Wraps requestAnimationFrame on browser and Node.js
* Supports initialization promises (wait for HTML body (canvas) to load, wait for texture images to load, etc).
* Supplies common uniforms to the frame render function: `width`, `height`, `aspect`, `tick`, `time` etc.


## Smaller changes

* Fix glTypeToArray to use `Uint8ClampedArrays` by default
* Add CORS setting to allow loading image from a different domain

## New `gl-matrix` based math library

* Optional library: All math operations directly accept JavaScript arrays
* Math classes are subclasses of JavaScript arrays (i.e. not {x,y,z} objects)
  and can thus be used interchangeably with arrays.
* Relies on `gl-matrix` for computations.
* Adds optional error checking.
* Offers more control over details like printing precision etc.

### Library Size

* Reorganized to only export a minimal surface of functions/classes.
* Tree-shaking support (package.json module keyword and dist-es6 distribution)
* Significant reduction of module dependencies.

### Experimental APIs

* `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
* `probe` moved to `/experimental`

### Deprecations/Deletions

* Old math lib deprecated.
* `FBO` class deprecated (use `Framebuffer` directly).
* `Camera` class deprecated, use math library directly.
* `Scene` class deprecated, for effects use - TBD

### Internal improvements

* Replace wildcard exports with named exports in index.js
* ES6 Conformant code base: stage-2 extensions removed
* Webpack based build
* Multiple examples now work standalone
* Experimental tree-shaking support: dist and dist-es6 directories
* Dependency removal, including removal of `autobind-decorator` dependency
* Changed precommit hook from `husky` to `pre-commit`
* `webgl` folder now contains both webgl1 and webgl2 classes

### Breaking Changes

* BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree and into `packages`. This allows luma.gl to drop a number of big dependencies. The node IO code may be published as a separate module later.


## v2.0

Release Date: July 05, 2016 (evolved through a number of minor releases)

Theme: A bigger official release, a major API refactoring that introduced the WebGL classes that are now a characteristic aspect of the luma.gl API.

## Major Features

* CHANGE: Removes glslify as a dependency, apps that depend on glslify must add it to their own package.json.

### TimerQuery

* Support EXT_disjoint_timer_query.

## Debug Support

* Built-in attribute/uniform logging
* GLSL shader compiler error handling

### Linux support

* Add missing call to getAttribLocation.

### New gl-matrix based math classes

* Move old math lib to deprecated folder.
* Move FBO to deprecated folder.
* Examples converted to ES6. AnimationFrame class updates.
* Add back persistence example
* WebGL type and constant cleanup
* Fix glTypeToArray and use clamped arrays by default

### TimerQuery, WebGL Extension doc, fix crash on Travis CI

* Support EXT_disjoint_timer_query
* Document luma.gl use of WebGL extensions.
* Fix: context creation crash when WEBGL_debug_info extension was undefined

### Debug log improvements, import fix

* Debug logs now print unused attributes more compactly, number formatting improved.

### Add ability to import luma without io

* import "luma.gl/luma" will import luma without io functions
* import "luma.gl/io" will import luma io functions only
* omitting io functions significantly reduces dependencies
* Makes the luma object available in console for debugging.
* Some polish on luma's built-in attribute/uniform logging

### Node.js/AttributeManager/Renderer/Program.render()/Examples

* Ensure luma.gl does not fail under node until createGLContext is called.
* Program.render() now takes a map of uniforms, reducing need to "set" uniforms before render.
* New experimental Renderer class - `requestAnimationFrame` replacement.
* Improvement/fixes to examples

### Node.js support

* Ensure luma.gl does not fail under node until createGLContext is called.

### luma global initialization

* Makes the luma object available in console for debugging.
* Makes optional headless support more reliable.

### Headless support

* Removed `gl` (headless-gl) dependency, to simplify build and setup for applications that don't use headless-gl.
* `import 'luma.gl/headless'` and `npm install gl` to get headless integration.

### Improve change detection

* Redraw flag management improvements

### Decoupled headless-gl dependency

* It is now necessary to import luma.gl through `luma.gl/headless` to get headless integration. When using the basic `luma.gl` import, the app no longer needs to have `gl` as a dependency. This should simplify build and setup for applications that don't use headless-gl.

### Improve change detection

* Redraw flag management improvements
* New experimental Renderer class - `requestAnimationFrame` replacement.


## v1.0

Release Date: 2016

Theme: A smaller, mostly internal version that was the starting point for luma.gl development.

### Major Features

* Initial ES6 Port from PhiloGL
