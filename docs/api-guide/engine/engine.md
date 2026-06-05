# Engine Programming

The `@luma.gl/engine` module provides higher-level *3D engine* functionality that makes it easier to build 3D applications.

:::info
One goal of luma.gl is to provide a fairly small, relatively un-opinionated, optional 3D engine.
The luma.gl engine is intentionally separated from the core GPU API library:

- This gives users the choice of building their own engines on top of luma.gl's core functionality.
- It also makes the core library easier to reason about as its only focus is to provide portable access to the underlying GPU.
:::

Some of the major classes that are provided by the engine module:

- `AnimationLoop`
- `Model`
- `DynamicBuffer`
- `DynamicTexture`
- `PickingManager`
- `ScenegraphNode`
- ...

Cross-module areas where the engine helps the user.

- Redraw tracking
- Interactivity
- Compute (Transforms)
- ...
