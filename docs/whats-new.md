# What's New

## Version 4.0

Release Date: Target early Q3 2017

A big release that brings full WebGL2 support to luma.gl, as well as support for GL state management and a shader module system.


## Major Updates

* Full WebGL2 Support
* WebGL Capability Management
* WebGL State Management
* GLSL Module System
* Debug and Profiling Support
* Documentation Refresh
* Library Size Optimizations


### WebGL2 Support

* Classes for the new WebGL2 objects (`FenceSync`, `Query`, `Sampler`, `Texture2DArray`, `Texture3D`, `TransformFeedback`).
* WebGL1 classes have additional methods that expose WebGL2 functionality when available.


### WebGL Capability Management

* Simplifies building apps that run on both WebGL1 and WebGL2
* Helps apps to query if a WebGL feature is available on the current platform - regardless of whether it is available through WebGL2 or through a WebGL extension.
* When a feature can be provided either through WebGL2 or through a WebGL1 extension, luma.gl provides a single API that transparently uses the available implementation.


### GL State Management

* Handles global WebGL context state and limits
* Lets apps temporarily change global context state without having to do expensive queries to remember what values to restore it to.
* Tracks changes to the context happening outside of luma.gl to ensure that global state always remains synchronized.
* Prevents nnecessary calls to set state to current value.


### GLSL Module System

* The `ShaderAssembler` system allows shader code to be split into composable pieces.
* It is completely optional, the application can use raw shader strings, `glslify`, the `ShaderAssembler` system or any other tools in isolation or combination to generate its shaders.
* Optionally integrates with a `ShaderCache` to ensure textually equivalent shaders are only compiled once.


### Documentation Improvements

* New documentation site, aligned with deck.gl and react-vis.
* Extensive overhaul of documentation structure and contents


### Library Improvements

* Code Size - luma.gl has been fine tuned for code size (both before and after minification) and Tree Shaking (minimizing "side effects"
* Deprecated Code Removed - Aggressively removes deprecated features to help reduce library size.
* Conditional code - Temoving unnecessary internal imports lets application decide what features are used. E.g. Debug code is now only imported when used. (Note: this requires tree-shaking bundler).
* Separate npm packages split out (math, shader-assembler, ...)


### Internal Improvements

* Coverage Integration with Coveralls
* Many new Test Cases
* GLSL code now stored as JavaScript strings. Building luma.gl shaders no longer require transforms in your bundler (webpack/browserify).
* Now possible to directly import luma.gl ES6 code: import 'luma.gl/src'


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
