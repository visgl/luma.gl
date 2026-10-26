# Audio environment profile

`AudioController` reads an initial profile of the [KHR_audio_environment draft](https://github.com/rudybear/glTF/tree/913251a1157661b105e5c7db189fc624eee3fe17/extensions/2.0/Khronos/KHR_audio_environment). This is partial support, not full draft conformance.

The active listener is selected from the scene's `activeListener`, the optional controller `activeCameraNodeIndex`, or the first active scene binding in depth-first order. Its node world transform supplies the listening pose by default. Set controller option `listenerPose: 'viewer'` to use the matrix passed to `update()` while retaining the authored listener gain and spatialization properties. This lets interactive viewers orbit and pan their listening position. The authored listener gain multiplies application volume independently. Unsupported spatialization models fall back to equal-power panning; `HRTF` uses the browser's panner.

Transformed box and sphere zones select the listener's acoustic environment. Higher priority wins; equal priority selects the smaller transformed volume. Spheres use the maximum scale component. Inward blend bands crossfade sends toward the environment selected just outside the nearest boundary. Emitters may override the environment, direct level, and reverb send level independently.

Impulse responses use the authored audio payload, normalization flag, and return mix. Parametric responses are a deterministic two-band diffuse convolution approximation with the draft's preset timing, early reflection level/delay, late return level/delay, and frequency-dependent RT60. They are not measured room responses or a reference implementation of I3DL2. Only default density and diffusion are supported; other values are rejected. Explicit parameters override preset values.

Stopping playback clears convolution history. Destruction disconnects owned processing nodes and leaves the borrowed audio context open.

Air absorption applies a low-pass filter to positional emitters when enabled. Its cutoff interpolates in log-frequency from 20 kHz at the reference distance to the authored cutoff at maximum distance. Unbounded maximum distances disable the filter.

## Current limitations

Doppler, custom HRTF data, listener graph hooks, and environment animation pointers are not implemented. The initial parametric profile does not claim exact acoustic equivalence across renderers. The Drum Kit uses an application-authored repeating beat and individual hit buttons; its prototype interactivity graph is not interpreted.
