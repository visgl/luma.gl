// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {renderWGSLExample} from './wgsl-examples';

type ShaderSource = {name: string; code: string; wgsl?: boolean};

/** Inspect source and the assembled shaders used by the model, without recompiling. */
export function createShaderViewer(
  host: HTMLElement,
  sources: ShaderSource[],
  generatedShaders: ShaderSource[],
  embedded = false
): {open: (opener: HTMLButtonElement) => void; destroy: () => void} {
  const panel = document.createElement('div');
  panel.className = 'slang-shader-viewer';
  panel.hidden = !embedded;
  if (embedded) panel.dataset.embedded = '';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Shader viewer');
  panel.innerHTML = `
    <style>
      .slang-shader-viewer { position:absolute; inset:12px; z-index:40; display:flex;
        flex-direction:column; max-height:calc(100dvh - 24px); box-sizing:border-box; color:#e6edf7; background:#0c1421; border:1px solid #ffffff30;
        border-radius:12px; box-shadow:0 12px 40px #0008; font:13px/1.5 system-ui,sans-serif; }
      .slang-shader-viewer[hidden] { display:none; }
      .slang-shader-viewer[data-embedded] { position:static; max-height:none; min-height:400px;
        border:0; border-radius:0; box-shadow:none; background:transparent; }
      .slang-shader-viewer[data-embedded] header { display:none; }
      .slang-shader-viewer[data-embedded] .shader-panes { display:flex; flex-direction:column; padding:0; }
      .slang-shader-viewer[data-embedded] pre { min-height:200px; max-height:300px; }
      .slang-shader-viewer[data-embedded] footer { padding:12px 0; }
      .slang-shader-viewer header { display:flex; align-items:center; justify-content:space-between;
        gap:12px; padding:12px 16px; border-bottom:1px solid #ffffff20; }
      .slang-shader-viewer h2 { margin:0; font-size:16px; font-weight:500; }
      .slang-shader-viewer button, .slang-shader-viewer select { color:#e6edf7; background:#182535;
        border:1px solid #ffffff30; border-radius:6px; padding:5px 9px; font:inherit; }
      .slang-shader-viewer button:focus-visible, .slang-shader-viewer select:focus-visible,
      .slang-shader-viewer pre:focus-visible { outline:2px solid #80dbde; outline-offset:2px; }
      .slang-shader-viewer .shader-panes { display:grid; flex:1; min-height:0;
        grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:12px; padding:12px; }
      .slang-shader-viewer section { display:flex; flex-direction:column; min-width:0; min-height:0; }
      .slang-shader-viewer label { display:flex; align-items:center; justify-content:space-between;
        gap:8px; margin-bottom:8px; }
      .slang-shader-viewer select { min-width:0; max-width:70%; }
      .slang-shader-viewer pre { flex:1; min-height:0; margin:0; padding:12px; overflow:auto;
        background:#080f1a; border:1px solid #ffffff15; border-radius:6px;
        font:11px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace; tab-size:2; }
      .slang-shader-viewer footer { padding:0 16px 12px; color:#9cabbd; font-size:11px; }
    </style>
    <header><h2>Source → generated shaders</h2><button type="button">Close shaders</button></header>
    <div class="shader-panes">
      <section><label>Source <select aria-label="Shader source"></select></label>
        <pre tabindex="0" aria-label="Shader source code"><code></code></pre></section>
      <section><label>Generated <select aria-label="Generated shader"></select></label>
        <pre tabindex="0" aria-label="Generated shader code"><code></code></pre></section>
    </div>
    <footer>Generated code includes the imported libraries. Slang and native shaders call each other through public functions.</footer>`;

  const selectors = panel.querySelectorAll('select');
  const codeBlocks = panel.querySelectorAll('code');
  const preview = document.createElement('canvas');
  preview.width = 480;
  preview.height = 240;
  preview.hidden = true;
  preview.setAttribute('aria-label', 'WGSL sample rendered as GLSL');
  preview.style.cssText =
    'width:100%;height:160px;object-fit:contain;background:#080f1a;margin-bottom:8px;flex-shrink:0';
  codeBlocks[0].parentElement!.before(preview);
  let runningSample: ReturnType<typeof renderWGSLExample> | null = null;
  let activeShaders = generatedShaders;
  const updateGenerated = (): void => {
    codeBlocks[1].textContent = activeShaders[selectors[1].selectedIndex]?.code || '';
    codeBlocks[1].parentElement!.scrollTo(0, 0);
  };
  const updateSource = (): void => {
    runningSample?.destroy();
    runningSample = null;
    const source = sources[selectors[0].selectedIndex];
    codeBlocks[0].textContent = source.code;
    codeBlocks[0].parentElement!.scrollTo(0, 0);
    preview.hidden = !source.wgsl;
    activeShaders = generatedShaders;
    if (source.wgsl) {
      try {
        runningSample = renderWGSLExample(preview, source.code);
        activeShaders = runningSample.shaders;
      } catch (error) {
        activeShaders = [{name: 'Compilation error', code: String(error)}];
      }
    }
    selectors[1].replaceChildren(
      ...activeShaders.map((shader, index) => new Option(shader.name, String(index)))
    );
    panel.querySelector('footer')!.textContent = source.wgsl
      ? 'This WGSL source is compiled to GLSL ES 300 and rendered on WebGL 2 above.'
      : 'Generated code includes the imported libraries. Slang and native shaders call each other through public functions.';
    updateGenerated();
  };
  sources.forEach((source, index) => selectors[0].add(new Option(source.name, String(index))));
  selectors[0].addEventListener('change', updateSource);
  selectors[1].addEventListener('change', updateGenerated);
  updateSource();

  let opener: HTMLButtonElement | null = null;
  const closeButton = panel.querySelector('button')!;
  const close = (): void => {
    panel.hidden = true;
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus();
  };
  closeButton.addEventListener('click', close);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  });
  host.append(panel);
  return {
    open(button): void {
      opener = button;
      opener.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      closeButton.focus();
    },
    destroy(): void {
      runningSample?.destroy();
      panel.remove();
    }
  };
}
