---
title: Getting started with physics
description: Build a small scene, attach bodies by path, and render GPU simulation without pose readback.
---

# Getting started with physics

Start with a scene you can recognize: a box above a floor. Give the box a dynamic body,
give the floor a static body, and let the renderer follow the simulated poses. You do not
need to write a physics shader or copy positions back to JavaScript each frame.

This guide uses **WebGPU**, an existing luma.gl `device`, and three layers:

- **Scenegraph:** describes objects, their local placement, geometry and materials. It keeps
  the hierarchy and stable node identities.
- **`PhysicsController`:** describes which objects move and how they collide. It prepares
  colliders, advances fixed steps and publishes GPU poses.
- **`SceneRenderer`:** receives the camera, lights and target. It manages PBR models,
  batches compatible meshes and binds their evaluated transforms.

For device setup, see [GPU initialization](/docs/api-guide/gpu/gpu-initialization).

## 1. Describe the scene

Use `SceneMeshNode` for meshes managed by the shared PBR renderer. Nodes share ordinary
engine geometry; a material describes appearance rather than a custom shader.

```ts
import {CubeGeometry, GroupNode} from '@luma.gl/engine';
import {SceneMeshNode, SceneRenderer} from '@luma.gl/anari';
import {PhysicsController} from '@luma.gl/engine/physics';
import {Matrix4} from '@math.gl/core';

const geometry = new CubeGeometry(); // Extends from -1 to +1 on each axis.
const box = new SceneMeshNode({
  id: 'box',
  geometry,
  matrix: new Matrix4().translate([0, 0, 3]).scale([0.5, 0.5, 0.5]),
  material: {
    id: 'blue-box',
    uniforms: {
      baseColorFactor: [0.12, 0.35, 0.8, 1],
      metallicRoughnessValues: [0, 0.5]
    }
  }
});
const floor = new SceneMeshNode({
  id: 'floor',
  geometry,
  matrix: new Matrix4().translate([0, 0, -0.25]).scale([5, 5, 0.25]),
  material: {
    id: 'floor-material',
    uniforms: {
      baseColorFactor: [0.4, 0.42, 0.45, 1],
      metallicRoughnessValues: [0, 0.8]
    }
  }
});
const scene = new GroupNode({id: 'demo', children: [box, floor]});
const renderer = new SceneRenderer(device);
```

This scene uses Z as up. Y-up scenes work too: choose gravity, camera and geometry
consistently. Node matrices are local to their parents. The authored box position remains
its starting position even after simulation moves the box on the GPU.

## 2. Attach physics by node or path

```ts
const physics = new PhysicsController(device, {
  scene,
  gravity: [0, 0, -9.81],
  timeStep: 1 / 120,
  maximumSubsteps: 4
});
const fallingBox = physics.addBody('/box', {
  mass: 1,
  friction: 0.6,
  restitution: 0.1
});
physics.addBody(floor, {motion: 'static'});
await physics.prepare();
```

The leading `/` starts below `scene`: `/box` finds the root's child. You can also pass the
node object, use a unique ID such as `box`, or use a partial path such as `room/box`.
Ambiguous paths throw so a command cannot accidentally control the wrong object.

`prepare()` infers colliders from the retained geometry and authored scale, then compiles
the GPU simulation. A box becomes an analytic box collider. For a group, descendant meshes
form a compound body, stopping at children with independently registered bodies. More
complex meshes may need a deliberate collider approximation; see
[Bodies and collisions](./bodies-and-collisions.md).

Successful preparation also attaches a generic transform source to the scene. The renderer
can now find evaluated GPU poses through the scene itself. No body indices or buffer
bindings are needed in this application code.

## 3. Advance and render

Build a camera once, updating its matrices when the user moves it or the canvas resizes.
The matrix below converts math.gl's OpenGL depth range to WebGPU's `[0, 1]` range.

```ts
const eye = [8, -10, 7];
const viewMatrix = new Matrix4().lookAt({eye, center: [0, 0, 1], up: [0, 0, 1]});
const projectionMatrix = new Matrix4([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
]).multiplyRight(new Matrix4().perspective({
  fovy: Math.PI / 3, aspect: canvas.width / canvas.height, near: 0.1, far: 100
}));

function renderFrame(elapsedSeconds: number) {
  const update = physics.update(elapsedSeconds);
  renderer.render({
    scene,
    camera: {viewMatrix, projectionMatrix, position: eye, clipDepth: 'zero-to-one'},
    lights: [
      {type: 'ambient', intensity: 0.25},
      {type: 'directional', direction: [-1, -1, -2], intensity: 2}
    ],
    background: [0.04, 0.05, 0.07, 1]
  });
  device.submit();
  return update;
}
```

Call this function from your existing animation loop. **Elapsed time is in seconds**;
`requestAnimationFrame` timestamps are in milliseconds. Compute the difference between
successive timestamps and divide by 1,000.

`physics.update()` submits a bounded number of fixed simulation steps. `renderer.render()`
then records rendering work using the current publication buffer; `device.submit()` submits
that work on the same device queue. Queue ordering keeps physics before rendering without
waiting for a CPU fence or reading a body pose.

A slow frame can require more work than the configured substep budget. The returned
`droppedTime` reports elapsed time that was discarded. Sustained dropped time means the
scene is running slower than wall-clock time: reduce work or adjust quality rather than
hiding the overload. See [Performance](./performance.md).

## 4. Add input, reset and picking

Keep the body handle returned during setup. An impulse can launch the box without
resolving its path again:

```ts
fallingBox.applyImpulse([0, 0, 3]);
```

Reset restores starting poses and clears accumulated simulation time. It leaves cameras
outside the controlled scene alone. Pause frame updates while awaiting asynchronous
operations; resume after they complete.

```ts
await physics.reset();
// The next render obtains the replacement publication automatically.
```

For selection, ask the renderer to draw an identity target using the same evaluated poses:

```ts
const selectedNode = await renderer.pick({
  scene,
  camera: {viewMatrix, projectionMatrix, position: eye},
  width: canvas.width,
  height: canvas.height
}, {x: pointerPixelX, y: pointerPixelY});
```

Coordinates are integer **render-target pixels**, measured from the top left, rather than
CSS pixels. Scale pointer coordinates by the ratio of render-target size to the element's
CSS size. Picking reads one pixel asynchronously; it does not read physics poses. It
returns a node reference, or `undefined` for the background.

## 5. Clean up in ownership order

Stop the animation loop and finish application-owned asynchronous operations first. Submit
any rendering work already encoded before disposing resources.

```ts
device.submit();
renderer.destroy();
await physics.destroy();
scene.destroy();
```

The renderer owns its compiled models and instance buffers. Physics owns simulation and
publication buffers. Nodes retain CPU geometry, and textures supplied in material descriptors
remain application-owned. Destroy your own textures separately after the renderer stops using
them. Destroying a renderer does not destroy the physics world whose buffers it borrowed.

## Where to go next

- [Scenes and glTF](./scenes-and-gltf.md) explains authored versus evaluated transforms,
  animation ownership, imports and explicit geometry rebuilds.
- [Joints and mechanisms](./joints-and-mechanisms.md) connects objects into pendulums and driven mechanisms.
- [SceneRenderer](/docs/api-reference/scene/scene-renderer) documents spot shadows, GPU transform
  sources, depth passes and rendering boundaries.
- [PhysicsController](/docs/api-reference/engine/physics-controller) lists controller commands and lifecycle rules.

## When to use the lower-level world API

Use `GPURigidBodyWorld` directly when you need explicit graph composition, specialized
publication layouts, batched residency or qualification tools. That path requires you to
create the world, add it to a command graph, compile, schedule fixed steps and connect its
publication to rendering. It is useful infrastructure, but the controller is the shorter
starting point for an existing scene.

`GPUSphereWorld` is a separate specialized simulation for large sphere workloads. It is not
selected automatically by `PhysicsController`. See [Physics overview](./overview.md) for
world selection and [Large worlds](./large-worlds.md) for independent-world batching.
