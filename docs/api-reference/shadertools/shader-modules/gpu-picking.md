# GPU picking

GPU picking renders object identities into an offscreen framebuffer, then reads the identity
under the pointer. A visible render uses that identity to highlight the selected object.

For new applications, import the picking helpers from `@luma.gl/engine`. The legacy
`picking` module in `@luma.gl/shadertools` uses an application-supplied color API; see
[legacy picking](/docs/api-reference/shadertools/shader-modules/picking).
These instructions describe the current engine API, not every earlier v9 release.

## Usage

This complete WebGL 2 example uses `colorPicking` with `mode: 'color'`. Given an existing
WebGL device, it draws one triangle with object index `0`. The model and manager share
`ShaderInputs`, so picking and highlighting uniforms reach the model.

```ts
import {Model, PickingManager, ShaderInputs, colorPicking} from '@luma.gl/engine';

const shaderInputs = new ShaderInputs({picking: colorPicking});
shaderInputs.setProps({
  picking: {indexMode: 'attribute', batchIndex: 0, highlightColor: [0, 1, 1, 1]}
});

const model = new Model(device, {
  shaderInputs,
  vertexCount: 3,
  vs: `#version 300 es
    void main() {
      vec2 positions[3] = vec2[3](
        vec2(-0.8, -0.8), vec2(0.8, -0.8), vec2(0.0, 0.8)
      );
      gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
      picking_setObjectIndex(0);
    }
  `,
  fs: `#version 300 es
    precision highp float;
    out vec4 fragmentColor;
    void main() {
      fragmentColor = picking_filterColor(vec4(1.0, 0.0, 0.0, 1.0));
    }
  `
});

const pickingManager = new PickingManager(device, {shaderInputs, mode: 'color'});

function drawVisible(): void {
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
  model.draw(renderPass);
  renderPass.end();
  device.submit();
}

async function pickObject(mousePosition: [number, number]): Promise<void> {
  const pickingPass = pickingManager.beginRenderPass();
  model.draw(pickingPass);
  pickingPass.end();
  device.submit();

  try {
    const pickInfo = await pickingManager.updatePickInfo(mousePosition);
    // objectIndex is 0 over the triangle and null over the background.
    console.log(pickInfo);
  } finally {
    shaderInputs.setProps({picking: {isActive: false}});
  }
  drawVisible();
}

// Call pickObject with canvas-relative CSS pixel coordinates. Serialize calls
// so that only one picking render/readback is in flight at a time.
drawVisible();

// When finished:
// pickingManager.destroy();
// model.destroy();
```

For a pointer event, calculate coordinates using the canvas bounding rectangle:
`[event.clientX - rectangle.left, event.clientY - rectangle.top]`.
The manager converts CSS pixels to device pixels and handles the backend's vertical
orientation. Do not multiply by the device pixel ratio or flip Y yourself.

The [instancing showcase](/examples/showcase/instancing) demonstrates picking and highlighting on
WebGL and WebGPU. Its [source](https://github.com/visgl/luma.gl/blob/master/examples/showcase/instancing/app.ts)
also shows how to schedule readback after the animation loop submits the picking pass.

## Object identity and highlighting

- `picking_setObjectIndex(...)` identifies the object in a GLSL vertex shader. With
  `indexMode: 'attribute'`, supply your own nonnegative integer identity. With the default
  `indexMode: 'instance'`, the module uses `gl_InstanceID`.
- Give all vertices of one object the same identity. Use distinct identities for objects
  that should be picked separately, and `batchIndex` to distinguish draw batches.
- Assign the return value of `picking_filterColor(...)` to the final fragment output. It
  applies both highlighting and picking. `picking_filterPickingColor(...)` alone does not
  apply highlighting, and discarding its return value does not update the output.
- `await pickingManager.updatePickInfo(...)` reads the result and updates the shared
  highlighting uniforms. Draw a visible pass afterward to display the highlight.
- `clearPickState()` clears highlighting, for example when the pointer leaves the canvas;
  it is not required before each pick. Draw again to display the cleared state.

For color picking, object indices range from `0` through `16777214` and batch indices from
`0` through `254`. The module encodes these values into RGBA bytes; arbitrary RGB colors are
not object identities. Disable blending when writing picking colors and do not modify the
encoded output afterward, including its alpha channel.

## Choosing a backend

Use matching shader modules and manager modes:

- `colorPicking` with `mode: 'color'` uses a color attachment and encoded identities.
- The unified engine `picking` module uses color picking for GLSL/WebGL and integer index
  picking for WGSL/WebGPU. The instancing showcase uses `mode: 'color'` on WebGL and
  `mode: 'index'` on WebGPU, with a separate picking model for the WebGPU output layout.

WGSL shaders pass the object index explicitly to the fragment filter functions; the GLSL
example above cannot be copied unchanged into a WGSL shader.
See [PickingManager](/docs/api-reference/engine/picking-manager) for readback, callbacks,
backend support, and framebuffer details.

Readback can synchronize CPU and GPU work. Use `shouldPick(mousePosition)` to skip unchanged
pointer positions in a static scene, and `{force: true}` when the geometry or camera changes
under a stationary pointer. GPU picking finds the visible object at a pixel; retrieving
occluded objects requires additional passes or a separate CPU geometry query.
