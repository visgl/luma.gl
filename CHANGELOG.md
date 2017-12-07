# Pre-releases

# Official releases

## v4.0

### 4.0.6 - "December 6, 2017"
- Add Intel Tan Shader WA for default GPU (#369)

### 4.0.5 - "October 6, 2017"
- Fix Shadowmap demo
- Fix `TransformFeedback.isSupported` bug (#333)
- Conditionally add shader extensions defines (#330)

### 4.0.4 -  “September 28, 2017”
- Add examples, lesson-10, 11, 12 and 13. (#303, #305, #307, #309, #310, #311, #312)
- Fix fp64 shader module unit test (#298)
- WebGL2 Buffer API fixes (#317)
- Add context management support for Framebuffer bindings. (#319)
- Fix Framebuffer.clear (#321)

### 4.0.3 -  “September 15, 2017”
- FIX: Allow cross-origin image loads using loadTextures(). (#308)
- FIX: GLSL version 3.0 compilation (WebGL2 shaders). ( #306)
- FIX: GLSL compiler error reporting.  (#308)
- TEST: Add unit tests for MIN and MAX blend equation. ( #308)

### 4.0.2 - “September 1, 2017”
- Wire up ShaderCache in Model class to avoid re-compilaiton of same shader (#301)

### 4.0.1 - "August 10, 2017"
- bufferData workaround to fix Safari crash. (#294)
- Picking shader module: Handle invalid/null picking color (#288)
- fix the link of lesson 16

### 4.0.0

This is a major release that brings WebGL2 support to luma.gl. For more info, please see
[What's new](https://github.com/uber/luma.gl/blob/4.0-release/docs/whats-new.md)

## v3.0

Theme: Pure ES6 Codebase/Build tooling improvements

### 3.0.2
- Check compilation and linking status only when debug WebGL context is used to improve performance (#144)

### 3.0.1
- Add CORS setting to allow loading image from a different domain

## 3.0.0

Codebase/Build tooling improvements
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

## v2.0

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
- Examples converted to ES6. AnimationLoop class updates.
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

### 1.0.1 - Initial release.


# Previous Beta Releases

## v4.0 Beta Releases

### 4.0.0-beta.6
- Call assembleShaders always (#270)
- Remove invalid assert on GL.POINTS (#268)
- Fix the WebGL context creation issue on Safari (#267)

### 4.0.0-beta.5
- Fix Shader Module dependency ordering (#266)
- API Audit - change 'settings' to 'parameters' (#264)
- Remove duplicate docs for faature management (#265)

### 4.0.0-beta.4
- Parameters: draw(`settings`) renamed to `parameters`
- Shader Modules: Move fp32 and fp64 from deck.gl
- WEBSITE: Remove/Retitle examples

### 4.0.0-beta.3
- Export feature detection functions (#260)
- Improve shadertools docs (#258)

### 4.0.0-beta.2
- FIX: Shader error parsing, shadertools export fix
- Changes to Picking module & fix Picking example  (#256)
- math library fixes (#253)
- Matrix docs (#254)
- Fix picking color encoding. (#252)
- Fix picking module & add FB unit tests. (#251)

### 4.0.0-beta.1
- Canvas and Drawing Buffer API fixes
- Reduce size of gl-matrix dependencies
- Support v3 texture parameters
- Shader Module System cleanup and use in some examples
- Webpack configuration consolidation

- WEBSITE: Shippable docs
- WEBSITE: SIZE and MULTIPLE CANVAS fixes
- WEBSITE: Restore Shadowmap and Particles Examples
- WEBSITE: Shader Module System - use in some examples
- WEBSITE: Webpack configuration consolidation
- WEBSITE: Framework links

### 4.0.0-alpha.14

- v4 Capability Management API finalization
- New Shader Module refactor
- Query objects enabled + unit tests
- NPOT workaround for texture-2d object
INTERNAL
- Add webgl-util readme
- Canvas resize/context creation moved to webgl-utils
- getParameter polyfill consolidated in webgl-utils
- Move non-working examples to wip folder
- Rename demo folder to website

### 4.0.0-alpha.13

- Un-deprecate `scenegraph` module (except `Scene`), merge with `core` module.
- `shadertools` module no longer experimental
- webgl2 uniform support

### 4.0.0-alpha.12

- FIX: Seer integration

### 4.0.0-alpha.11

- State and Parameter support
- Many fixes to examples

### 4.0.0-alpha.10

- FIX: Framebuffer resize & add unit test (#200)
- Add the pixel parameter back in texture class for compatibility with v3 (#198)
- FIX: 'npm run build' for demos (#195)
- FIX: Lesson 08 (#196)
- FIX: Lesson 07 (#194)

### 4.0.0-alpha.9

- FIX: Some leftover export fix and storage mode fix (#192)

### 4.0.0-alpha.8

- FIX: Remove duplicate export that fails tests in other repos (#191)

### 4.0.0-alpha.7

- FIX: Fix the texture storage mode settings (#189)
- FIX: examples/lessons (#188)
- Transform feedback fixes (#187)
- FIX: Example updates and fixes for textures (#186)
- Size improvements to transpiled code (dist)
- Tree-shaking improvements - carefully avoid dependencies that defeat tree shaking (#185)

### 4.0.0-alpha.6
- Fix framebuffer creation error AGAIN (#183)
- NEW: `UniformBufferLayout` class

### 4.0.0-alpha.4
- Remove null params given to Float32Array constructor (#176)
- Fix framebuffer creation error (#177)

### 4.0.0-alpha.3
- bump seer
- remove duplicate info from readme

### 4.0.0-alpha.2

- Reorgnize files (#168)
- Transform feedback improvement (#165)
- WebGL2 updates (#160)
- Buffer refactor (#156)
- Fix examples (#161, #149, #172, #173)
- Adding new docs for WebGL2 (#159)
- Demo site creation (#158)
- Docs cleanup and updates (#157, #169, #170)
- seer integration
- Add coverage support (#155)

### 4.0.0-alpha.1

- Refactor WebGL classes using new `Resource` base class
- `Resource.getParameters` for ease of debugging
- Fix FramebufferObject export
- GL state and limit management (#146)
- Fix shader file name (#151)
- Refactor many classes in the webgl folder (#136, #154)
- Check compilation and linking status only with debug WebGL context (#144)
- Add benchmarking scaffolding and a benchmark test for Program constructor (#142)
- Docs update (#137)

## v3.0 Beta Releases

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
