// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INFO_HTML = `\
<p>KHR_billboard draft: drag to orbit around camera-facing trees and labels.</p>
<p>Loading the original Khronos BillboardDemo downloads about 68 MB of geometry.</p>
<p>Explicit compatibility enables the original model's legacy Y-axis syntax.</p>
<p>Nik fortress and EFX trees: CC BY 4.0. Roboto by Christian Robertson: Apache 2.0.
Composition by UX3D / Khronos: CC BY 4.0.
<a href="https://github.com/KhronosGroup/glTF-External-Reference/blob/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/metadata.json">Source and attribution</a></p>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export function showError(error?: unknown): void {
  const errorDiv = document.getElementById('error') as HTMLDivElement | null;
  if (!errorDiv) {
    return;
  }

  errorDiv.textContent = error ? `Error loading model: ${getErrorMessage(error)}` : '';
  errorDiv.style.display = error ? 'block' : 'none';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export const LIGHTMAP_INFO_HTML = `
<p>KHR_lightmap draft: baked linear irradiance in a Cornell Box. Drag to orbit.</p>
<p>Original source asset by Ben Houston, three.js fork, MIT license (709 KB).</p>
<p><a href="https://github.com/bhouston/three.js/tree/91de5714e5abaf1f7105f4f1c8858bed93171a25/examples/models/gltf/LightmappedCornellBox">Source and attribution</a></p>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export const AREA_LIGHT_INFO_HTML = `
<p>EXT_lights_area draft: the upstream living room has two rectangular emitters. Gold outlines show their positions and sizes. LTC integrates rectangular emitters continuously for diffuse, isotropic GGX and clearcoat. Disk lights use a 32-sided approximation. Other lobes retain experimental numerical integration.</p>
<p><label>Scene <select id="area-light-scene"><option value="living-room">Upstream living room</option><option value="demo">Rectangle and disk diagnostic</option></select></label></p>
<p>Upstream living room by Wig42, CC BY 3.0. Scene conversion by Benedikt Bitterli; glTF conversion from Foundation Resources.</p>
<p><a href="https://creativecommons.org/licenses/by/3.0/">License</a> · <a href="https://github.com/mos9527/Foundation-Resources/tree/3c8df40aece172360612d5a01177d91d6b4ab3e6/living-room-3">Source</a></p>
<p><label><input id="cutaway-walls" type="checkbox" checked /> Cutaway walls</label></p>
<p><label><input id="show-area-lights" type="checkbox" checked /> Show lights</label></p>
<p><button id="frame-area-lights" type="button">Frame both area lights</button></p>
<p>The upstream living room downloads 33 MB of geometry plus textures. Direct lighting uses LTC for diffuse, GGX and clearcoat; shadows and indirect bounce are not simulated.</p>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

/** Show a text-free loading spinner; descriptions and errors belong in the info box. */
export function showLoadingSpinner(canvas: HTMLCanvasElement, loading: boolean): void {
  const container = canvas.parentElement;
  if (!container) return;
  let spinner = container.querySelector<HTMLDivElement>('[data-gltf-loading]');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.dataset.gltfLoading = '';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading glTF model and textures');
    Object.assign(spinner.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '36px',
      height: '36px',
      margin: '-18px',
      border: '3px solid rgba(148, 163, 184, 0.35)',
      borderTopColor: '#38bdf8',
      borderRadius: '50%',
      zIndex: '5',
      pointerEvents: 'none'
    });
    spinner.animate([{transform: 'rotate(0deg)'}, {transform: 'rotate(360deg)'}], {
      duration: 900,
      iterations: Infinity
    });
    container.appendChild(spinner);
  }
  spinner.style.display = loading ? 'block' : 'none';
  for (const animation of spinner.getAnimations()) {
    if (loading) animation.play();
    else animation.pause();
  }
}
