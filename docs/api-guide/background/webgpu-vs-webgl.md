import {ApiOverviewDocsTabs} from '@site/src/components/docs/api-overview-docs-tabs';

# WebGPU vs WebGL

<ApiOverviewDocsTabs active="webgpu-vs-webgl" />

<style>{`
  .docs-markdown-table table {
    display: table;
    max-width: 100%;
    min-width: 0;
    table-layout: fixed;
    width: 100%;
  }

  .docs-markdown-table th,
  .docs-markdown-table td {
    overflow-wrap: break-word;
  }

  .docs-markdown-table table:has(th:nth-child(4)) th:nth-child(-n + 3),
  .docs-markdown-table table:has(th:nth-child(4)) td:nth-child(-n + 3) {
    width: 18%;
  }

  .docs-markdown-table table:has(th:nth-child(4)) th:last-child,
  .docs-markdown-table table:has(th:nth-child(4)) td:last-child {
    width: 46%;
  }
`}</style>

Browsers expose two GPU APIs that matter to luma.gl applications: **WebGPU** and **WebGL 2**.
WebGPU is the modern API and the direction browser GPU programming is moving. WebGL 2 is the
older, widely deployed compatibility path. luma.gl supports both through the same `Device` API
so applications can adopt WebGPU without giving up WebGL reach where it still matters.

For most applications, register both backends and let luma.gl choose the best available device.
luma.gl prefers WebGPU when the browser can create a WebGPU device, then falls back to WebGL.

```typescript
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({
  type: 'best-available',
  adapters: [webgpuAdapter, webglAdapter],
  createCanvasContext: true
});
```

Use `device.type`, [`device.features`](/docs/api-reference/core/device-features), and
[`device.limits`](/docs/api-reference/core/device-limits) when an application needs to choose a
backend-specific path.

## Choosing a Backend

| Need | Recommendation |
| --- | --- |
| New application | Prefer WebGPU. |
| Broadest reach | Use `type: 'best-available'`. |
| Compute or storage buffers | Require WebGPU. |
| Existing GLSL or WebGL code | Keep WebGL first, then add WebGPU deliberately. |
| Portable rendering | Stay inside luma.gl `Device`, `Model`, pipeline, binding, feature, and limit APIs. |

## WebGPU

[WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) is the successor to WebGL.
It is designed around the same generation of GPU APIs as Vulkan, Metal, and Direct3D 12, and it
adds first-class support for general GPU computation as well as rendering.

For luma.gl users, WebGPU is the preferred backend when available:

| Advantage | Why it matters |
| --- | --- |
| Lower CPU and driver overhead | Better scaling for complex scenes and repeated work. |
| Compute shaders and storage buffers | Modern GPU data work does not need WebGL workarounds. |
| Modern resource model | Closely matches luma.gl resources, pipelines, bindings, and commands. |
| Better multi-canvas support | One device can present to multiple canvases directly. |

WebGPU also has practical constraints:

| Limitation | What to do in luma.gl |
| --- | --- |
| Browser, OS, and GPU support varies | Feature detect and keep a WebGL fallback when reach matters. |
| Secure context required | Serve production apps over HTTPS. |
| Shaders use WGSL | Keep WGSL, or matching WGSL and GLSL sources for portable apps. |
| More explicit setup | Describe pipelines, bindings, and buffer layouts up front. |
| Stricter formats and limits | Check `device.features` and `device.limits`. |
| Portable baseline differs from adapter maximum | Keep the default `featureLevel: 'core'` for portability; request `'max'` only when the app needs optional WebGPU features or limits. Apps that fit compatibility restrictions can request `'compatibility'`, or `'best-available'` to upgrade that request to core when possible. |

## WebGL 2

[WebGL 2](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext) is the
well-established browser GPU API based on OpenGL ES 3.0. It remains important because it is
widely available and because many applications already have GLSL and WebGL rendering code.

For luma.gl users, WebGL 2 is the compatibility backend:

| Advantage | Why it matters |
| --- | --- |
| Broad deployment | Safest path for older browsers, devices, and managed environments. |
| Existing GLSL ecosystem | WebGL shaders can move into luma.gl incrementally. |
| Familiar state model | Small apps can change draw state with less up-front setup. |
| Mature debugging path | Existing WebGL tools and knowledge still help. |

WebGL 2 has the limits that motivate the transition to WebGPU:

| Limitation | What to do in luma.gl |
| --- | --- |
| No compute shaders or storage buffers | Use WebGPU, or keep WebGL-specific transform or texture fallbacks. |
| Stateful context model | Prefer luma.gl pipelines and bindings. |
| One GPU-backed canvas per device | Use WebGPU for direct shared-resource multi-canvas workflows. |
| Extension and implementation variance | Query luma.gl features and limits. |
| Expensive readback and synchronization | Keep data on the GPU where possible. |

## WebGL 1

luma.gl v9 intentionally removed WebGL 1 support. Maintaining a third backend path would add
implementation and testing cost without serving enough users to justify it: the remaining
audience is mostly older devices and browsers that expose WebGL 1 but not WebGL 2, such as
Internet Explorer. Applications that still need WebGL 1 should stay on an older luma.gl release
or use another WebGL 1 capable stack.

## Differences That Matter in luma.gl

| Topic | WebGPU | WebGL 2 | Guidance |
| --- | --- | --- | --- |
| Default | Preferred | Reach fallback | Use `type: 'best-available'`. |
| Canvas | Multiple direct contexts | One GPU-backed canvas | Use portable presentation APIs; require WebGPU for direct multi-canvas rendering. |
| Shaders | WGSL | GLSL ES 3.00 | Keep shader sources explicit. |
| Bindings | Bind groups | Uniform blocks and textures | Use luma.gl binding layouts. |
| Compute | Compute and storage | Transform or texture fallback | Use WebGPU for modern compute. |
| State | Explicit pipelines | Mutable context | Let `Model` and pipelines own setup. |
| Formats | More explicit | More extension variance | Query features and limits. |
| Commands | Recorded and submitted | Immediate underneath | Use luma.gl command APIs. |

## Condensed Developer Notes

| Underlying API difference | Visible effect for luma.gl users |
| --- | --- |
| WebGPU descriptions are more static. | Reuse or create pipelines instead of mutating context state. |
| WebGPU has uniform buffers. | Use luma.gl binding and shader layout APIs. |
| WebGPU has no transform feedback. | Use compute on WebGPU; keep transform feedback only for WebGL paths. |
| WebGPU owns vertex layouts in pipelines. | Describe formats and layouts up front. |
| Optional capabilities differ. | Treat `device.features` and `device.limits` as the portability boundary. |

## Further Reading

- [GPU Initialization](/docs/api-guide/gpu/gpu-initialization)
- [CanvasContext](/docs/api-reference/core/canvas-context)
- [PresentationContext](/docs/api-reference/core/presentation-context)
- [GPU Bindings](/docs/api-guide/gpu/gpu-bindings)
- [GPU Commands](/docs/api-guide/gpu/gpu-commands)
- [GPU Storage Buffers](/docs/api-guide/gpu/gpu-storage-buffers)
- [GPU Computations](/docs/api-guide/engine/transforms)
- [Efficiently rendering glTF models](https://toji.dev/webgpu-gltf-case-study/)
