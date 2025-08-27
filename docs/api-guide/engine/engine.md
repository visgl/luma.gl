# Engine Programming

The `@luma.gl/engine` modules provides higher-level *3D engine* functionality that makes it easier to build 3D applications.

:::info
The goal of luma.gl is to provides a fairly small, unopinionated engine.
luma.gl intentionally separates *engine* from the *core* GPU API library. This allows applications to build
their own engines on top of luma.gl's core functionality. It also makes the core library easier to reason about.
:::

Some of the major classes that are provided by the engine module:

- `AnimationLoop`
- `Model`
- `DynamicTexture`
- `PickingManager`
- `ScenegraphNode`
- ...

Cross-module areas where the engine helps the user.

- Redraw tracking
- Interactivity
- Compute (Transforms)
- ...
