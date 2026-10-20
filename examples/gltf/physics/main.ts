// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BoxPanelContainer, PanelManager} from '@deck.gl-community/panels';
import {makeAnimationLoop} from '@luma.gl/engine';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {configurePanelHostElement, makeHtmlCustomPanel} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';
import App from './app';

const host = document.querySelector<HTMLElement>('#info')!;
applyExampleTheme(host, 'cinematic');
host.dataset['theme'] = 'dark';
host.classList.add('gltf-example-panel');
const content = document.createElement('div');
content.innerHTML = App.info;
content.hidden = true;
document.body.append(content);
const container = new BoxPanelContainer({
  id: 'gltf-physics-info',
  title: 'luma.gl · glTF Physics',
  placement: 'top-left',
  widthPx: 420,
  collapsible: true,
  defaultOpen: false,
  panel: makeHtmlCustomPanel({
    id: 'gltf-physics-content',
    title: 'glTF Physics',
    html: '',
    onRender: root => {
      configurePanelHostElement(root, 'cinematic');
      content.hidden = false;
      root.append(content);
      return () => {
        content.hidden = true;
        document.body.append(content);
      };
    }
  })
});
const panels = new PanelManager({parentElement: host});
panels.setProps({components: [container]});
const device = luma.createDevice({
  adapters: [webgpuAdapter],
  optionalFeatures: ['timestamp-query'],
  createCanvasContext: true
});
const animationLoop = makeAnimationLoop(App, {
  device,
  onAfterRender: () => panels.onRedraw({viewports: [], layers: []})
});
void animationLoop.start().catch(error => {
  const element = document.querySelector('#error');
  if (element) element.textContent = `WebGPU is required. ${error}`;
});
window.addEventListener(
  'pagehide',
  () => {
    animationLoop.destroy();
    panels.finalize();
    content.remove();
  },
  {once: true}
);
