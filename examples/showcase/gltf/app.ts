// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DynamicTexture, loadImageBitmap, type AnimationProps, type ModelNode} from '@luma.gl/engine';
import HelloGLTFApp from '../../tutorials/hello-gltf/app';
import {pbrMaterial, skin} from '@luma.gl/shadertools';
import {voronoiMan} from './voronoi-man-module';

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
  voronoiManFaceMaskTexture: DynamicTexture;

  constructor(props: AnimationProps) {
    const modelStorageKey = 'showcase-last-gltf-model';
    const voronoiManMigrationKey = 'showcase-last-gltf-model-voronoi-man-migrated';
    if (
      !window.localStorage[modelStorageKey] ||
      (!window.localStorage[voronoiManMigrationKey] &&
        window.localStorage[modelStorageKey] === 'CesiumMan')
    ) {
      window.localStorage[modelStorageKey] = 'voronoi-man';
      window.localStorage[voronoiManMigrationKey] = 'true';
    }

    super(props);

    this.voronoiManFaceMaskTexture = new DynamicTexture(this.device, {
      data: loadImageBitmap('/models/voronoi-man/voronoi-man_face-mask.png')
    });
  }

  override getDefaultModelName(): string {
    return 'voronoi-man';
  }

  override getModelStorageKey(): string {
    return 'showcase-last-gltf-model';
  }

  override onFinalize(): void {
    super.onFinalize();
    this.voronoiManFaceMaskTexture.destroy();
  }

  override async fetchModelList(): Promise<Array<{name: string; label?: string}>> {
    const models = await super.fetchModelList();
    return [{name: 'voronoi-man', label: 'Voronoi Man'}, ...models];
  }

  override getModelUrl(modelName: string): string {
    if (modelName === 'voronoi-man') {
      return '/models/voronoi-man/voronoi-man.gltf';
    }

    return super.getModelUrl(modelName);
  }

  override getCreateScenegraphsFromGLTFOptions(modelName: string) {
    const options = super.getCreateScenegraphsFromGLTFOptions(modelName);
    if (modelName !== 'voronoi-man') {
      return options;
    }

    return {
      ...options,
      modelOptions: {
        modules: [pbrMaterial, skin, voronoiMan]
      }
    };
  }

  override applyModelShaderInputs(modelNode: ModelNode, modelName: string): void {
    if (modelName !== 'voronoi-man') {
      return;
    }

    modelNode.model.shaderInputs.setProps({
      voronoiMan: {
        cellScale: 10.5,
        edgeWidth: 0.075,
        decalSize: 1,
        decalFeather: 0.035,
        fillColor: [0.82, 0.82, 0.84, 1],
        edgeColor: [0.06, 0.06, 0.07, 1],
        voronoiMan_faceMaskSampler: this.voronoiManFaceMaskTexture
      }
    });
  }
}
