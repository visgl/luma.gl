# GLTFAudioController

Opt-in Web Audio playback of the **draft** `KHR_audio_emitter` extension. Rendering works with either WebGPU or WebGL; audio uses a borrowed browser audio context.

```typescript
import {GLTFAudioController} from '@luma.gl/gltf';
import {Matrix4} from '@math.gl/core';

const audioContext = new AudioContext();
const audio = new GLTFAudioController({
  scenegraphs,
  audioContext,
  baseUrl: modelUrl,
  sceneIndex: 0
});

// Run from a click handler to satisfy browser playback policies.
await audioContext.resume();
await audio.play({autoplayOnly: true});

// Every frame, after animation updates:
audio.update(new Matrix4(viewMatrix).invert());

// Before destroying the scenegraph:
audio.destroy();
await audioContext.close();
```

`initialize()` fetches and decodes audio without playing. `play()` restarts all attached sources; `autoplayOnly` selects sources with the authored autoplay flag. `stop()` also cancels pending playback. Set `audio.gain.gain.value` for master volume. `destroy()` is idempotent, aborts pending fetches and disconnects owned nodes, but never closes the borrowed context. Destroy the controller before its scenegraph. Use a new controller when switching scenes. One listener is shared by every controller using the same context.

External URIs (including data URIs) and embedded buffer views are supported. An optional `fetch` function can supply application authentication or caching. Browser decoding determines available audio formats. Positional emitters follow node world transforms, use local negative Z as forward, and support HRTF panning, directional cones, and linear/inverse/exponential distance attenuation. Global emitters bypass spatial processing. Model coordinates remain in meters; display normalization must also be reflected in listener coordinates.

The implementation follows the [OMI draft schema at revision 4f1fe73](https://github.com/omigroup/gltf-extensions/tree/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter). A zero/omitted `maxDistance` means unbounded distance; finite values clamp attenuation. Linear attenuation with no maximum remains constant. The example's older `autoplay` and node `emitters` spellings are accepted alongside `autoPlay` and `emitter`. Custom shapes, codec extensions, audio animation pointers, and `KHR_audio_graph` are not implemented.

See the [Spatial Audio example](/examples/showcase/gltf-audio). The Boom Box and music are fetched unchanged from the pinned upstream repository; attribution appears in the example.
