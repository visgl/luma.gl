// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INFO_HTML = `<p>Spatial playback of the draft KHR_audio_emitter extension. Enable audio, drag to orbit, and zoom away to hear attenuation. Headphones recommended.</p>
<p>Model: The Khronos Group, CC0. Music: <a href="https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bassa%20Island%20Game%20Loop.mp3">Bassa Island Game Loop</a> by Kevin MacLeod, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Unmodified model and audio loaded from the <a href="https://github.com/omigroup/gltf-extensions/tree/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter/examples/boom_box">OMI repository</a>.</p>`;

export const GRAPH_INFO_HTML = `<p>Drum Kit uses KHR_audio_graph filters and gain processors before positional emitters. Start the repeating beat, then orbit and zoom to hear the spatial mix. Individual drum buttons play single hits.</p>
<p>This source prototype also declares audio environment and interactivity extensions. Environment effects and its prototype playing-pointer drum-hit controls are not implemented in this preset. The enable/restart button starts the authored sources directly.</p>
<p>Procedural geometry and synthesized audio: CC0, loaded unmodified from the pinned <a href="https://github.com/rudybear/gltf-webgpu/tree/188965dd2ea0a1492c39dedf69f8e75f730baf9a/examples/drum-kit">Drum Kit source</a>.</p>`;

export const ENVIRONMENT_INFO_HTML = `<p>Drum Kit uses authored processing graphs, emitter sends, and the small-room parametric reverb approximation. Start the repeating beat, then orbit and zoom to hear positioning, distance filtering, and the room response. Individual drum buttons play single hits.</p>
<p>The listener follows your camera. Command-drag to pan, drag to orbit, and scroll to zoom. Headphones recommended.</p>
<p>Procedural geometry and synthesized audio: CC0, loaded unmodified from the pinned <a href="https://github.com/rudybear/gltf-webgpu/tree/188965dd2ea0a1492c39dedf69f8e75f730baf9a/examples/drum-kit">Drum Kit source</a>.</p>`;
