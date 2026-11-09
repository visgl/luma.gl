// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BillboardController, AreaLightController} from '@luma.gl/engine';
import {parseGLTFAreaLights, parseGLTFBillboards} from '@luma.gl/engine/gltf';
import {AnimationLoopTemplate, AnimationProps, ModelNode, OrbitControls} from '@luma.gl/engine';
import {Device, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/engine/gltf';
import {createAreaLightLTCTextures} from '@luma.gl/engine';
import {Light, LightingProps, pbrMaterial, pbrScene, skin} from '@luma.gl/shaders';
import {Matrix4, Vector3} from '@math.gl/core';
import {
  INFO_HTML,
  LIGHTMAP_INFO_HTML,
  AREA_LIGHT_INFO_HTML,
  SCATTER_INFO_HTML,
  showError,
  showLoadingSpinner
} from './app-ui';

import {GLTF_FEATURE_PRESETS, type GLTFFeature} from './presets';

import {AREA_LIGHT_DEMO_URL} from './area-light-demo';
import {AreaLightOutlines} from './area-light-outlines';
import {BoxPanelContainer, ColumnPanel, PanelManager} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';
import '../gltf-example-panel.css';
import './scatter-panel.css';

const MAX_CAMERA_TILT = 0.6;
const CAMERA_TILT_HEIGHT_FACTOR = 0.35;

const lightSources = {
  ambientLight: {
    color: [255, 255, 255],
    intensity: 0.35,
    type: 'ambient'
  },
  directionalLights: [
    {
      color: [255, 244, 235],
      direction: [0.6, -0.7, 0.5],
      intensity: 2.4,
      type: 'directional'
    },
    {
      color: [214, 232, 255],
      direction: [-0.45, -0.35, -0.7],
      intensity: 0.8,
      type: 'directional'
    }
  ]
} as const satisfies LightingProps;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  static getInfo(feature: GLTFFeature): string {
    if (feature === 'scatter') return SCATTER_INFO_HTML;
    return feature === 'area-lights'
      ? AREA_LIGHT_INFO_HTML
      : feature === 'lightmap'
        ? LIGHTMAP_INFO_HTML
        : INFO_HTML;
  }

  areaLTCTextures?: ReturnType<typeof createAreaLightLTCTextures>;
  device: Device;
  orbitControls: OrbitControls;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  billboardController?: BillboardController;
  areaLightController?: AreaLightController;
  areaLightOutlines?: AreaLightOutlines;
  showAreaLights = true;
  cutawayWalls = true;
  areaScene: 'demo' | 'living-room' = 'living-room';
  loadGeneration = 0;
  readonly wallModels = new Set<ModelNode>();
  cameraFieldOfView = Math.PI / 3;
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  isFinalized = false;
  scatterPanelHost?: HTMLElement;
  scatterPanelManager?: PanelManager;

  private createScatterPanel(canvas: HTMLCanvasElement): void {
    const host = document.createElement('aside');
    host.className = 'gltf-example-panel gltf-scatter-panel';
    host.dataset['theme'] = 'dark';
    Object.assign(host.style, {
      position: 'absolute',
      inset: '12px',
      pointerEvents: 'none',
      zIndex: '2'
    });
    applyExampleTheme(host, 'cinematic');
    const controls = document.createElement('div');
    controls.className = 'scatter-model-controls';
    const label = document.createElement('label');
    label.textContent = 'Model ';
    const selection = document.createElement('select');
    selection.setAttribute('aria-label', 'Model');
    for (const [value, title] of [['reference', 'Scatter Strength · Thin-Walled']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = title;
      selection.append(option);
    }
    selection.onchange = () => {
      void this.loadGLTF();
    };
    label.append(selection);
    controls.append(label);
    const details = document.createElement('section');
    details.className = 'gltf-example-details';
    details.innerHTML =
      '<p><strong>Scattering spreads light through a material.</strong> Instead of passing straight through like clear glass, transmitted light becomes diffuse—like paper, frosted plastic, or a leaf lit from behind.</p><p>This upstream thin-walled test compares two controls: <strong>transmission</strong>, how much light enters, and <strong>scatter strength</strong>, how much of that light is scattered. Look across the labeled shader balls to compare the scalar values and texture patterns.</p><p>Drag to orbit and scroll to zoom. This viewer uses direct lighting; its appearance is not a pixel match for the upstream environment-lit reference renders.</p>';
    const attributions = document.createElement('section');
    attributions.className = 'gltf-example-details';
    attributions.innerHTML = SCATTER_INFO_HTML;
    attributions.querySelector('#error')?.remove();
    document.getElementById('info')?.remove();
    const loadError = document.createElement('div');
    loadError.id = 'error';
    loadError.setAttribute('role', 'alert');
    loadError.style.display = 'none';
    canvas.parentElement?.append(host);
    const mountContent = (root: HTMLElement, content: HTMLElement) => {
      configurePanelHostElement(root, 'cinematic');
      root.append(content);
    };
    const tabs = makeExampleTabbedPanel({
      sourcePaths: ['gltf/features/app.ts'],
      id: 'scatter-tabs',
      title: '',
      theme: 'dark',
      panels: [
        makeHtmlCustomPanel({
          id: 'scatter-model',
          title: 'Model',
          html: '',
          onRender: root => mountContent(root, controls)
        }),
        makeHtmlCustomPanel({
          id: 'scatter-info',
          title: 'Info',
          html: '',
          onRender: root => mountContent(root, details)
        }),
        makeHtmlCustomPanel({
          id: 'scatter-attributions',
          title: 'Attributions',
          html: '',
          onRender: root => mountContent(root, attributions)
        })
      ]
    });
    const panel = new ColumnPanel({
      id: 'scatter-content',
      title: '',
      theme: 'dark',
      panels: [
        makeHtmlCustomPanel({
          id: 'scatter-load-error',
          title: '',
          html: '',
          onRender: root => mountContent(root, loadError)
        }),
        tabs
      ]
    });
    this.scatterPanelHost = host;
    this.scatterPanelManager = new PanelManager({parentElement: host});
    this.scatterPanelManager.setProps({
      components: [
        new BoxPanelContainer({
          id: 'scatter-panel',
          title: 'luma.gl · Material Scatter',
          placement: 'top-left',
          widthPx: 380,
          collapsible: true,
          defaultOpen: true,
          panel
        })
      ]
    });
  }

  constructor(
    {device}: AnimationProps,
    readonly feature: GLTFFeature = 'billboard'
  ) {
    super();
    this.device = device;
    if (feature === 'area-lights') this.areaLTCTextures = createAreaLightLTCTextures(device);

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    if (feature === 'area-lights') this.areaLightOutlines = new AreaLightOutlines(canvas);
    if (feature === 'scatter') this.createScatterPanel(canvas);
    this.orbitControls = new OrbitControls(canvas, {
      distance: 2,
      yaw: feature === 'lightmap' ? 0 : Math.PI / 4,
      pitch: 0.18,
      minDistance: 0.05,
      maxDistance: 40,
      minPitch: -MAX_CAMERA_TILT,
      maxPitch: MAX_CAMERA_TILT,
      rotateSpeed: 0.01,
      zoomSpeed: 0.0015
    });

    document.addEventListener('click', this.handleFrameLights);
    document.addEventListener('change', this.handleAreaScene);
    this.loadGLTF();
  }

  onFinalize(): void {
    this.scatterPanelManager?.finalize();
    this.scatterPanelHost?.remove();
    this.isFinalized = true;
    this.loadGeneration++;
    showLoadingSpinner(this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement, false);
    this.orbitControls.destroy();
    this.billboardController?.destroy();
    this.areaLightController?.destroy();
    this.areaLightOutlines?.destroy();
    document.removeEventListener('click', this.handleFrameLights);
    document.removeEventListener('change', this.handleAreaScene);

    destroyScenegraphs(this.scenegraphsFromGLTF);
    this.scenegraphsFromGLTF = undefined;
    this.areaLTCTextures?.destroy();
    this.modelLights = [];
    this.wallModels.clear();
  }

  private handleAreaScene = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement) || event.target.id !== 'area-light-scene')
      return;
    this.areaScene = event.target.value === 'demo' ? 'demo' : 'living-room';
    void this.loadGLTF();
  };

  private handleFrameLights = (event: MouseEvent): void => {
    requestAnimationFrame(() => {
      if (this.isFinalized) return;
      const showLights = document.getElementById('show-area-lights');
      const cutawayWalls = document.getElementById('cutaway-walls');
      const scene = document.getElementById('area-light-scene');
      if (showLights instanceof HTMLInputElement) showLights.checked = this.showAreaLights;
      if (cutawayWalls instanceof HTMLInputElement) cutawayWalls.checked = this.cutawayWalls;
      if (scene instanceof HTMLSelectElement) scene.value = this.areaScene;
    });
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target instanceof HTMLInputElement && event.target.id === 'show-area-lights') {
      this.showAreaLights = event.target.checked;
      return;
    }
    if (event.target instanceof HTMLInputElement && event.target.id === 'cutaway-walls') {
      this.cutawayWalls = event.target.checked;
      return;
    }
    if (event.target.id !== 'frame-area-lights') return;
    const lights = this.areaLightController?.getLights() || [];
    if (!lights.length) return;
    this.center = [0, 1, 2].map(
      axis => lights.reduce((sum, light) => sum + light.position[axis], 0) / lights.length
    );
    const radius = Math.max(
      ...lights.map(
        light =>
          Math.hypot(...light.position.map((value, axis) => value - this.center[axis])) +
          Math.hypot(...light.halfAxisX) +
          Math.hypot(...light.halfAxisY)
      )
    );
    this.cameraHeight = this.center[1];
    this.orbitControls.setProps({
      target: [this.center[0], this.center[1], this.center[2]],
      distance: radius * 2.5,
      yaw: Math.PI / 4,
      pitch: 0.2
    });
  };

  getClearColor(): [number, number, number, number] {
    return this.feature === 'area-lights' && this.areaScene === 'demo'
      ? [0.035, 0.05, 0.075, 1]
      : [0.95, 0.95, 0.97, 1];
  }

  async loadGLTF(): Promise<void> {
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    const generation = ++this.loadGeneration;

    try {
      log.log(0, 'Starting glTF feature load', {
        modelUrl: GLTF_FEATURE_PRESETS[this.feature].modelUrl
      })();
      showError();
      showLoadingSpinner(canvas, true);
      canvas.style.opacity = '0.2';

      const preset = GLTF_FEATURE_PRESETS[this.feature];
      const modelUrl =
        this.feature === 'area-lights' && this.areaScene === 'demo'
          ? AREA_LIGHT_DEMO_URL
          : preset.modelUrl;
      const gltf = await load(
        modelUrl,
        GLTFLoader,
        this.feature === 'area-lights'
          ? {
              fetch: (input: RequestInfo | URL, options?: RequestInit) => {
                const url =
                  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
                const resource =
                  url === modelUrl
                    ? url
                    : url.replace(
                        'https://raw.githubusercontent.com/',
                        'https://media.githubusercontent.com/media/'
                      );
                return globalThis.fetch(resource, options);
              }
            }
          : {}
      );
      if (this.isFinalized || generation !== this.loadGeneration) return;
      const processedGLTF = postProcessGLTF(gltf);
      const scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        lights: true,
        pbrDebug: false,
        useTangents: true,
        modelOptions:
          this.feature === 'area-lights'
            ? {
                modules: [pbrScene, pbrMaterial, skin],
                defines: {USE_SCENE_COLOR_MANAGEMENT: true, USE_AREA_LIGHT_LTC: true}
              }
            : undefined
      });

      if (this.isFinalized || generation !== this.loadGeneration) {
        destroyScenegraphs(scenegraphsFromGLTF);
        return;
      }

      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      this.modelLights = scenegraphsFromGLTF.lights;
      this.wallModels.clear();
      if (this.feature === 'area-lights') {
        const wallIndex = processedGLTF.nodes.findIndex(node => node.name === 'Walls');
        scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(wallIndex)?.traverse(node => {
          if (node instanceof ModelNode) this.wallModels.add(node);
        });
      }
      this.areaLightController?.destroy();
      this.areaLightController =
        this.feature === 'area-lights'
          ? new AreaLightController(
              parseGLTFAreaLights({gltf: processedGLTF, ...scenegraphsFromGLTF})
            )
          : undefined;
      this.billboardController?.destroy();
      this.billboardController = new BillboardController(
        parseGLTFBillboards({
          gltf: processedGLTF,
          ...scenegraphsFromGLTF,
          allowLegacyYAxis: GLTF_FEATURE_PRESETS[this.feature].allowLegacyYAxis
        })
      );

      const sceneBounds = scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.center = [...sceneBounds.center];
      this.sceneRadius = sceneBounds.radius;
      this.cameraHeight =
        this.center[1] +
        (this.feature === 'lightmap' || this.feature === 'scatter' ? 0 : this.sceneRadius * 0.3);
      this.orbitControls.setProps({
        target: [this.center[0], this.cameraHeight, this.center[2]],
        distance:
          sceneBounds.recommendedOrbitDistance *
          (this.feature === 'lightmap' ? 2 : this.feature === 'scatter' ? 1.65 : 1),
        minDistance: Math.max(this.sceneRadius * 0.08, 0.025),
        maxDistance: Math.max(this.sceneRadius * 32, 12)
      });

      this.cameraFieldOfView = Math.PI / 3;
      if (this.feature === 'area-lights' && this.areaScene === 'demo')
        this.orbitControls.setProps({yaw: Math.PI / 4, pitch: 0.18});
      if (this.feature === 'area-lights' && this.areaScene === 'living-room') {
        const sourceCameraIndex = processedGLTF.nodes.findIndex(node => node.camera !== undefined);
        const cameraNode = scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(sourceCameraIndex);
        for (const scene of scenegraphsFromGLTF.scenes)
          scene.preorderTraversal((node, {worldMatrix}) => {
            if (node !== cameraNode) return;
            const eye = new Vector3(worldMatrix.getTranslation());
            const forward = new Vector3(0, 0, -1).transformAsVector(worldMatrix).normalize();
            const distance = Math.max(this.sceneRadius * 0.5, 0.1);
            this.center = Array.from(new Vector3(eye).add(forward.scale(distance)));
            this.cameraHeight = this.center[1];
            const offset = new Vector3(eye).subtract(this.center);
            this.orbitControls.setProps({
              target: [this.center[0], this.center[1], this.center[2]],
              distance,
              yaw: Math.atan2(offset[0], offset[2]),
              pitch: Math.asin(offset[1] / distance)
            });
          });
        this.cameraFieldOfView = processedGLTF.cameras[0]?.perspective?.yfov || Math.PI / 3;
      }
      canvas.style.opacity = '1';
      showLoadingSpinner(canvas, false);
      showError();
    } catch (error) {
      if (this.isFinalized || generation !== this.loadGeneration) {
        return;
      }

      log.error('Failed to load tutorial glTF model', error)();
      canvas.style.opacity = '1';
      showError(error);
      showLoadingSpinner(canvas, false);
    }
  }

  onRender({aspect, device, time}: AnimationProps): void {
    this.scatterPanelManager?.onRedraw({viewports: [], layers: []});
    const renderPass = device.beginRenderPass({clearColor: this.getClearColor(), clearDepth: 1});

    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      renderPass.end();
      return;
    }

    this.scenegraphsFromGLTF.animator?.setTime(time);
    this.orbitControls.update(time);

    const orbitDistance = this.orbitControls.distance;
    const far = Math.max(orbitDistance + this.sceneRadius * 8, 10);
    const near = Math.max(this.sceneRadius / 1000, 0.01);
    const projectionMatrix = new Matrix4().perspective({
      fovy: this.cameraFieldOfView,
      aspect,
      near,
      far
    });
    const cameraPos = this.orbitControls.getEyePosition();
    if (this.feature !== 'area-lights')
      cameraPos[1] =
        this.cameraHeight + (cameraPos[1] - this.cameraHeight) * CAMERA_TILT_HEIGHT_FACTOR;
    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});
    const lighting =
      this.feature === 'lightmap' || this.feature === 'area-lights'
        ? {lights: [{type: 'ambient' as const, color: [0, 0, 0] as const, intensity: 0}]}
        : this.modelLights.length > 0
          ? {lights: this.modelLights}
          : lightSources;

    const areaLights = this.areaLightController?.getLights();
    this.areaLightOutlines?.update(
      this.showAreaLights ? areaLights || [] : [],
      new Matrix4(projectionMatrix).multiplyRight(viewMatrix)
    );
    for (const {node, modelMatrix, overlay} of this.billboardController!.getDrawEntries({
      viewMatrix
    })) {
      if (!(node instanceof ModelNode)) continue;
      const {model} = node;
      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      model.shaderInputs.setProps({
        lighting: areaLights ? {lights: areaLights, useByteColors: false} : lighting,
        ...(this.areaLTCTextures ? {bindings: this.areaLTCTextures.bindings} : {}),
        ...(areaLights
          ? {
              areaLighting: {lights: []},
              pbrScene: {exposure: 0.03, toneMapMode: 2, outputEncoding: 1}
            }
          : {}),
        pbrProjection: {
          camera: cameraPos,
          modelViewProjectionMatrix,
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose()
        },
        skin: {
          scenegraphsFromGLTF: this.scenegraphsFromGLTF
        }
      });
      if (this.wallModels.has(node))
        model.setParameters({cullMode: this.cutawayWalls ? 'back' : 'none'});
      const parameters = model.parameters;
      try {
        if (overlay)
          model.setParameters({...parameters, depthCompare: 'always', depthWriteEnabled: false});
        model.draw(renderPass);
      } finally {
        if (overlay) model.setParameters(parameters);
      }
    }

    renderPass.end();
  }
}

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  scenegraphsFromGLTF?.destroy();
}
