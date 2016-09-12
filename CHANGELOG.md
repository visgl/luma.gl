# Official releases

### 2.5.1
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

### 2.4.2 - Bugfix for redraw flag management
- Fix redrawFlag names

### 2.4.1 - Bugfix for headless mode
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

# Older BETA releases

### 3.0.0-beta1 - Changes folded into 2.5.1
