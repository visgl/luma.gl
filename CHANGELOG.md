# Prereleases

Note: Unfortunately 3.0.0-beta6 was published without beta tag and takes
precedence when using wildcard installs.

### 3.0.0-beta.9
- FIX: Additional fix for regression in geometry constructor

### 3.0.0-beta.8
- FIX: Regression in geometry constructor (support deprecated mode)
- FIX: Initialization of global and startup logging
- FIX: Ensure framebuffer resize logging is not visible by default

### 3.0.0-beta.7
- Bump version to avoid confusion with older incorrectly numbered beta versions
- Replace wildcard exports with named exports in index.js
- Remove all Work In Progress Examples - Focus on working code
- Multiple examples now work standalone

### 3.0.0-beta.3
- ES6 Conformant code base: stage-2 extensions removed
- Experimental tree-shaking support: dist and dist-es6 directories
- Webpack based build

### 3.0.0-beta1 - 3.0.0-beta6 obsolete, folded into master

### 3.0.0-alpha.4
- Performance query using EXT_disjoint_timer_query #121

### 3.0.0-alpha.3
- Changed from `husky` to `pre-commit`
- Removed `autobind-decorator` dependency

### 3.0.0-alpha2
- `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
- `probe` moved to `/experimental`
- `webgl` folder now contains both webgl1 and webgl2 classes

### 3.0.0-alpha1
- BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree
  and into `packages`. This allows luma.gl to drop a number of big dependencies.
  The node IO code may be published as a separate module later.

# Official releases

### 2.10.4
- FIX: Fix for glGetDebugInfo regression on Intel processors.

### 2.10.3
- FIX: Fix for glGetDebugInfo regression under Node in 2.10.2.
- FIX: Add "experimental.js" to exported "files" in package.json.

### 2.10.2
- FEATURE: Introduce experimental ShaderCache
- FIX: for glGetDebugInfo under Firefox (WEBGL_debug_renderer_info issue)
- CHANGE: Removes glslify as a dependency, apps that depend on glslify
  must add it to their own package.json.

### 2.10.1
- FIX: glslify path.

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
