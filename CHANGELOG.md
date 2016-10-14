# Beta releases

### 3.0.0-beta2 - obsolete, folded into master
### 3.0.0-beta1 - obsolete, folded into master

# Official releases

### 2.10.0
- Introduce new gl-matrix based math library.
- Move old math lib to deprecated folder.
- Move FBO to deprecated folder.
- Examples converted to ES6. AnimationFrame class updates.
- Add back persistence example
- WebGL type and constant cleanup
- Fix glTypeToArray and use clamped arrays by default

### 2.9.1 GLSL shader compiler error handling
  - FIX: GLSL shader compiler error parsing

### 2.9.0  TimerQuery, WebGL Extension doc, fix crash on Travis CI
  - Support EXT_disjoint_timer_query
  - Document luma.gl use of WebGL extensions.
  - Fix: context creation crash when WEBGL_debug_info extension was undefined
  - Add

### 2.8.0  Debug log improvements, import fix
  - Debug logs now print unused attributes more compactly, number formatting
    improved.
  - FIX: io import issue in 2.7.0

### 2.7.0 - Add ability to import luma without io
  - import "luma.gl/luma" will import luma without io functions
  - import "luma.gl/io" will import luma io functions only
  - omitting io functions significantly reduces dependencies

### 2.6.0 - "64 bit" camera projection matrix
 - Add 64 bit matrix to Luma.gl Camera
 - Updated linter rules

### 2.5.4 - FIX: Luma global initialization
- Makes the luma object available in console for debugging.
- Makes optional headless support more reliable.

### 2.5.3 - FIX: Linux rendering issues
- Add missing call to getAttribLocation.
- Some polish on luma's built-in attribute/uniform logging

### 2.5.2 - FIX: document.navigator override
- More gentle override, carefully restoring the variable.

### 2.5.1 - FIX: make deprecated AttributeManager.add updateMap work again
- Attribute manager changes

### 2.5.0 - Node.js/AttributeManager/Renderer/Program.render()/Examples

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

### 2.4.2 - FIX: redraw flag management
- Fix redrawFlag names

### 2.4.1 - FIX: headless mode
- Add headless.js to exported files

### 2.4.0 - Improve change detection
- Redraw flag management improvements

### 2.3.0 - Decoupled headless-gl dependency
- It is now necessary to import luma.gl through `luma.gl/headless` to get
headless integration.
  When using the basic `luma.gl` import, the app no longer needs to
have `gl` as a dependency.
 This should simplify build and setup for applications that don't use
headless-gl.

### 2.2.0
  - Fixed a doc mistake

### 2.1.0 - Copy of 2.0.0 release
  - Published mainly to ensure 2.0.4-0 does not get included by
  semver wildcards.

### 2.0.4-0 - Misnamed beta release
  - Don't use. This was a misnamed beta release.

### 2.0.0 - Major API refactoring

### 2.0.0-beta series
  - layer architecture refactored to improve performance
  - updated to handle perspective mode
  - shaderlib
  - Beta releases, don't use.

### 1.0.1 - Initial release.
