# Version 3.2

Release Date: TBD - Q2 2017?

## Major Updates

* GPGPU support



# Version 3.1

Release Date: TBD - Q1 2017?

## Major Updates

* WebGL2 support
* Experimental GPGPU support

## WebGL2

### WebGL2 - New classes with documentation and examples

* `Texture2DArray`, `Texture3D` - for e.g. "texture atlases"
* `Query` - Asynchronously query for occlusions, transform feedback, timings
* `Sampler` - Let's shaders sample same texture in different ways
* `Sync` - Get notified when GPU reaches certain point in command stream
* `TransformFeedback` - Get output from vertex shaders
* `VertexArrayObject` - Stores multiple attribute bindings

Note that `VertexArrayObject` and `Query` can be used in WebGL1 with certain
restrictions.

### WebGL2 - Features added to existing API

* WebGL2 constants added to `GL` export

* Textures
    * Can now created from `WebGLBuffers` in addition to typed arrays
    * Tons of new texture formats
    * Compressed textures from 

    * GLSL `dFdx`, `dFdy` Texture derivatives - (e.g. to compute normals in fragment shader)
    * GLSL `texelFetch` - (e.g. for manual bilinear filtering)
    * GLSL `textureGrad` - (e.g. for tweaking mipmap levels)
    * Immutable texture?
    * Integer texture - uint sampler
    * Texture LOD
    * GLSL `textureOffset`
    * pixelStore
    * srbg
    * texture vertex (e.g. for displacement mapping)

* Vertex Formats (GL.HALF_FLOAT)

* GLSL
    * centroid
    * discard
    * flat_smooth_interpolators
    * non_square_matrix

* TBD
    * Uniform buffers

* Misc
    * New blending modes: `GL.MIN` and `GL.MAX`



### WebGL2 Capability Management

* New capability management helps apps determine when a feature is available
  either through WebGL2 or through a WebGL1 extension.



# v3.0

Release Date TBD (December 2016?)

## Library Size
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

