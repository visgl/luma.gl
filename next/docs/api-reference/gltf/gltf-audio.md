# glTF audio mapping

`parseGLTFAudio()` from `@luma.gl/gltf` resolves emitters, source resources, graph routing, and environments into props for the engine `AudioController`. See [scene controllers](https://luma.gl/next/docs/api-guide/engine/scene-controllers.md) for the engine APIs.

Opt-in Web Audio playback of the **draft** `KHR_audio_emitter` extension. Rendering works with either WebGPU or WebGL; audio uses a borrowed browser audio context.

```
import {AudioController} from '@luma.gl/engine';

import {parseGLTFAudio} from '@luma.gl/gltf';



import {Matrix4} from '@math.gl/core';



const audioContext = new AudioContext();

const audio = new AudioController(parseGLTFAudio({

  scenegraphs,

  audioContext,

  baseUrl: modelUrl,

  sceneIndex: 0

}));



// Run from a click handler to satisfy browser playback policies.

await audioContext.resume();

await audio.play({autoplayOnly: true});



// Every frame, after animation updates:

audio.update(new Matrix4(viewMatrix).invert());



// Before destroying the scenegraph:

audio.destroy();

await audioContext.close();
```

`initialize()` fetches and decodes audio without playing. `play()` restarts all attached sources; `autoplayOnly` selects sources with the authored autoplay flag. `sourceIndices` selects authored source indices for individual hits. Set `restart: false` to trigger additional voices without stopping existing voices or clearing reverb history; the default remains a full restart. `stop()` also cancels pending playback. Set `audio.gain.gain.value` for master volume. `destroy()` is idempotent, aborts pending fetches and disconnects owned nodes, but never closes the borrowed context. Destroy the controller before its scenegraph. Use a new controller when switching scenes. One listener is shared by every controller using the same context.

External URIs (including data URIs) and embedded buffer views are supported. An optional `fetch` function can supply application authentication or caching. Browser decoding determines available audio formats. Positional emitters follow node world transforms, use local negative Z as forward, and support HRTF panning, directional cones, and linear/inverse/exponential distance attenuation. Global emitters bypass spatial processing. Model coordinates remain in meters; display normalization must also be reflected in listener coordinates.

The implementation follows the [OMI draft schema at revision 4f1fe73](https://github.com/omigroup/gltf-extensions/tree/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter). A zero/omitted `maxDistance` means unbounded distance; finite values clamp attenuation. Linear attenuation with no maximum remains constant. The example's older `autoplay` and node `emitters` spellings are accepted alongside `autoPlay` and `emitter`. Custom shapes, codec extensions, and audio animation pointers are not implemented.

See the [Spatial Audio example](https://luma.gl/next/examples/showcase/gltf-audio). The Boom Box and music are fetched unchanged from the pinned upstream repository; attribution appears in the example.

## Audio graph profile[​](#audio-graph-profile "Direct link to Audio graph profile")

The controller also reads `KHR_audio_graph` processing graphs from the [pinned draft](https://github.com/rudybear/glTF/tree/c0042d72e74dfd25790566d21e02f71e420b130f). This is a partial profile, registered as loader-only for strict required-extension checks.

Supported processors are gain, delay, compressor, waveshaper, biquad filters, channel splitter/merger, channel mixer, and audio mixer. Only graphs with an explicit output reaching an emitter in the selected scene are activated; authored graph indices remain stable. Graph inputs share one scheduled source per authored source index; explicit graph outputs replace the corresponding emitter's base source routing. Processing nodes are owned and disconnected by the controller. Cycles, invalid endpoint indices, and bypassed splitter/merger nodes are rejected before processor allocation. Multi-port bypass is unsupported in this profile.

`audio.setGraphGain(graphIndex, nodeIndex, gain)` applies an authored gain transition: immediate for zero duration, linear interpolation otherwise, or a normalized custom curve scaled to the target gain. Indices refer to the original graph and node arrays.

Clip sources support playback rate, offset, duration, loop regions, and start times relative to the current playback restart. Procedural sources support sine, square at the default duty cycle, triangle, sawtooth, and custom periodic waves. Nondefault square pulse width is rejected. Browser decoding determines codec support; encoding metadata and source priority are not used to select or schedule voices.

Audio animation/interactivity pointers, dynamic bypass changes, general pulse-width synthesis, are not implemented. Audio environment behavior is described in the [environment profile](https://luma.gl/next/docs/api-reference/gltf/gltf-audio-environment.md). The shared audio example's `graph` preset loads the unmodified CC0 Drum Kit from its pinned source. Its enable/restart button plays all authored clips; the prototype's playing-pointer drum-hit controls are explicitly unsupported.
