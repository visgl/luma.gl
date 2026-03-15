// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import HelloGLTFApp from '../../tutorials/hello-gltf/app';

const INFO_HTML = `\
<p>
  Browse production-quality glTF sample assets with interactive camera and animation controls.
</p>
<div id="model-options">
  <div>
    <label for="model-select">Model</label>
    <select id="model-select"></select>
  </div>
  <div><label><input type="checkbox" id="useModelLights" />Use Model Lights</label></div>
  <div><label><input type="checkbox" id="cameraAnimation" />Camera Animation</label></div>
  <div><label><input type="checkbox" id="gltfAnimation" />glTF Animation</label></div>
</div>
<p style="margin-top: 8px;">Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export default class AppAnimationLoopTemplate extends HelloGLTFApp {
  static info = INFO_HTML;

  getDefaultModelName(): string {
    return 'DamagedHelmet';
  }

  getModelStorageKey(): string {
    return 'showcase-last-gltf-model';
  }
}
