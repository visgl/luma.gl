# Version 4.0

Release Date: TBD - Q2 2017?

## Major Updates

* WebGL2 support
* Experimental GPGPU support




### WebGL2 Capability Management

* New capability management helps apps determine when a feature is available
  either through WebGL2 or through a WebGL1 extension.


# What's New

## v4.0

### WebGL2 Support
* New classes for all new WebGL2 objects
* Existing Classes have additional methods that expose WebGL2 functionality
* GL State and Limit Management
* `ShaderAssembler` GLSL Module System

### Documentation Improvements
* New documentation site, aligned with deck.gl and react-vis.
* Extensive overhaul of documentation structure contents

### Library Improvements
* GLSL code now stored as JavaScript strings. Makes it possible to directly import luma.gl as pure ES6 code from 'luma.gl/src' without having to setup additional transforms in your bundler (webpack/browserify).
* Code Size Improvements - Debug code is only imported when used (requires tree-shaking bundler).

### Internal Improvements
* Coverage Integration with Coveralls
* Many new Test Cases


## v3.0

### Library Size
* Reorganized to only export a minimal surface of functions/classes.
* Tree-shaking support (package.json module keyword and dist-es6 distribution)
* Significant reduction of module dependencies.

## Major News

* Website Refresh
* Complete documentation overhaul
* `math.gl` - New math library
* Experimental WebGL2 support
* Post processing support

* All examples converted to ES6 to better showcase the luma.gl API.


## math.gl - New `gl-matrix` based math library
- Optional library: All math operations directly accept JavaScript arrays
- Math classes are subclasses of JavaScript arrays (i.e. not {x,y,z} objects)
  and can thus be used interchangeably with arrays.
- Relies on `gl-matrix` for computations.
- Adds optional error checking.
- Offers more control over details like printing precision etc.


## Debug Support
- Now uses `WEBGL_debug_shaders` extension when available to log
  translated shader source code.
- Uses `EXT_disjoint_timer_query` and `EXT_disjoint_timer_query_webgl2`


## New `AnimationFrame` class
- Wraps requestAnimationFrame on browser and Node.js
- Supports initialization promises (wait for HTML body to load, wait for
  texture images to load, etc).
- Supplies common uniforms to the frame render function:
  - `width`, `height`, `aspect`, `tick`, `time` etc.

## Samller changes
- Fix glTypeToArray and use clamped arrays by default


### Deprecations/Deletions
- Old math lib removed.
- `FBO` class removed (use `Framebuffer` directly).
- `Camera` class removed, use math library directly.
- `Scene` class removed, for effects use - TBD


- Add CORS setting to allow loading image from a different domain

Internal improvements
- Replace wildcard exports with named exports in index.js
- ES6 Conformant code base: stage-2 extensions removed
- Webpack based build
- Multiple examples now work standalone
- Experimental tree-shaking support: dist and dist-es6 directories
- Dependency removal, including removal of `autobind-decorator` dependency
- Changed precommit hook from `husky` to `pre-commit`
- `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
- `probe` moved to `/experimental`
- `webgl` folder now contains both webgl1 and webgl2 classes

Feature Improvements
- Performance query using EXT_disjoint_timer_query #121

Breaking Changes:
- BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree
  and into `packages`. This allows luma.gl to drop a number of big dependencies.
  The node IO code may be published as a separate module later.


### 2.0.0 - Major API refactoring

- CHANGE: Removes glslify as a dependency, apps that depend on glslify
  must add it to their own package.json.
# Version 2

Release Date: Gradual releases during 2015

### 2.10.0

### 2.9.0  TimerQuery
  - Support EXT_disjoint_timer_query

  - Document luma.gl use of WebGL extensions.

## Debug Support
- Built-in attribute/uniform logging
- GLSL shader compiler error handling


### 2.7.0 - Add ability to import luma without io
  - import "luma.gl/luma" will import luma without io functions
  - import "luma.gl/io" will import luma io functions only
  - omitting io functions significantly reduces dependencies


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

- Program.render() now takes a map of uniforms,
  reducing need to "set" uniforms before render.

- AttributeManager improvements
    - add logging/instrumentation hooks, to help apps profile attribute updates.
    - Pass AttributeManager.update() parameters through to the individual
      attribute updater funcs, enabling app to generate shared attributes
      independently of layers for additional performance gains.
    - Add JSDoc to all public methods and basic test cases.

- New experimental Renderer class - `requestAnimationFrame` replacement.

- Improvement/fixes to examples


## Node.js support
- Ensure luma.gl does not fail under node until createGLContext is called.

### 2.5.4 - FIX: Luma global initialization
- Makes the luma object available in console for debugging.
- Makes optional headless support more reliable.


## Headless support
- Removed `gl` (headless-gl) dependency, to simplify build and setup for
  applications that don't use headless-gl.
- `import 'luma.gl/headless'` and `npm install gl` to get headless integration.

## Improve change detection
- Redraw flag management improvements


### 2.0.0 - Major API refactoring WebGL classes

## 1 - Initial release.

- ES6 port of PhiloGL.

### Decoupled headless-gl dependency
- It is now necessary to import luma.gl through `luma.gl/headless` to get
headless integration.
  When using the basic `luma.gl` import, the app no longer needs to
have `gl` as a dependency.
 This should simplify build and setup for applications that don't use
headless-gl.

### Improve change detection
- Redraw flag management improvements

- New experimental Renderer class - `requestAnimationFrame` replacement.



## v1.0

* Initial ES6 Port from PhiloGL
