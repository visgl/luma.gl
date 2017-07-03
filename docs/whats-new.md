# What's New

## Version 4.0

Release Date: Target early Q3 2017

A major release that brings full WebGL2 support to luma.gl, as well as support for GL state management and a shader module system.


### Full WebGL2 Support

luma.gl now exposes a complete WebGL2 API surface
* New classes expose all the new WebGL2 objects (`FenceSync`, `Query`, `Sampler`, `Texture2DArray`, `Texture3D`, and `TransformFeedback`), together with a new `UniformBufferLayout` helper class to make uniform buffers easy to use.
* Every existing WebGL class has been updated and have received additional methods that expose new WebGL2 functionality whenever available.
* Image-format related classes like `Texture`, `Renderbuffer` and `Framebuffer` have been updated to handle all the new WebGL2 image formats, including floating point textures, and multiple rendertargets.


### WebGL Capability Management

luma.gl provides a single unified WebGL2-style API across WebGL2, WebGL1 and WebGL extensions, and provides a simple mechanisms for querying what capabilities are available. This simplifies building apps that run on both WebGL1 and WebGL2, seamlessly allowing applications to leverage WebGL extensions when available.


### WebGL State Management

luma.gl enables apps to temporarily set WebGL parameters and modify the global WebGL context state without having to worry about side effects.
* Lets apps temporarily change global context state without having to do expensive queries to remember what values to restore it to.
* Tracks changes to the context happening outside of luma.gl to ensure that global state always remains synchronized.
* Prevents unnecessary calls to set state to current value.
* Addressed one of the weak spots of the WebGL API.


### shadertools - New GLSL Module System

* The new, optional, shadertools module with the `assembleShaders` function system allows shader code to be broken into composable pieces.
* Includes a new `ShaderCache` class to ensure that identical shaders are only compiled once, which significantly accelerates startup in some use cases.


### Documentation Improvements

Extensive improvement of documentation structure and contents, including a new website, linking to other frameworks in the same visualization suite such as deck.gl.


### Code Size Improvements

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
