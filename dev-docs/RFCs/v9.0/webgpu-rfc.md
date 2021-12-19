# RFC: Road to WebGPU

## Background

WebGPU is the future of GPU based rendering and compute on the web.
The technology has broad support among browser vendors (importantly, including Apple/Safari)
and is currently entering origin trials on Chrome with an anticipated public release in Chrome 99.

### WebGPU vs WebGL

There are many differences between WebGPU and WebGL. This section emphasizes differences that impact luma.gl and deck.gl.

Limitations:
- More static API. GPU resources tend to be read-only. This reduces validation and will enable passing GPU objects between worker threads in a future WebGPU release.
- No global state. Many global WebGL context parameters are set on various objects (such as RenderPipelines) and cannot be changed dynamically without recreating objects.
- No traditional uniforms. Only Uniform buffers.
- No constant attributes.

New capabilities:
- GPU Devices (aka GL Contexts) are disconnected from a canvas. A GPU device can be used without a canvas for compute, or render into multiple canvases.
- True compute shaders (workgroups, storage buffers etc).


## Requirements

Having a single API that supports both WebGPU and WebGL is will be required for a reasonable amount of time (say 2 years).

- A question is if we should phase out WebGL1 support in luma.gl v9 or v10. In particular, supporting non-Uniform
