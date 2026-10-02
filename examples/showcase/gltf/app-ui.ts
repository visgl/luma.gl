// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GLTF_ANIMATION_INFO_ID, GLTF_CROWD_INFO_ID, GLTF_MODEL_INFO_ID} from './gltf-catalog-app';

export const GLTF_DESCRIPTION_HTML = `\
<p>Explore animated glTF characters, skeletal rigs, and expressive motion.</p>
<div id="loading-state" class="gltf-loading-indicator" hidden>
  <span class="gltf-loading-spinner" aria-hidden="true"></span>
</div>
<p style="margin-top: 8px;">Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="${GLTF_MODEL_INFO_ID}" style="margin-top: 12px; display: none;"></div>
<div id="${GLTF_ANIMATION_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="${GLTF_CROWD_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="extension-support" style="margin-top: 12px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;
