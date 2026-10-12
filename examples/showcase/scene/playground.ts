import {
  ANARIDevice,
  type ANARIRendererParameters,
  type ANARIRendererSubtype,
  type ANARIVector3
} from '@luma.gl/scene';
import {
  DepthTextureCopy,
  SelectionOutline,
  getRayTracingQualityPreset
} from '@luma.gl/experimental';
import {ChartLabels} from './chart-labels';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {AnimationLoopTemplate, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {PLAYGROUND_PRESETS} from './playground-presets';
import {
  type ANARIJSONScene,
  type ANARIJSONSceneHandle,
  createANARIJSONScene
} from './playground-scene';
import {ANARISceneEditor} from './scene-editor';
import {
  applyPlaygroundQualityPreset,
  getPlaygroundRendererSubtype,
  makePlaygroundRenderer
} from './playground-renderer';
import {exportANARIJSONSceneToGLTF, exportANARIJSONSceneToUSD} from './scene-export';
import {loadSceneFile, loadSceneSample, SCENE_SAMPLES} from './usd-samples';

export default class ANARIPlayground extends AnimationLoopTemplate {
  static info = '';

  readonly anari: ANARIDevice;

  private scene: ANARIJSONSceneHandle | null = null;
  private readonly deferredRendererAvailable: boolean;
  private activePresetIndex = 0;
  private liveApplyEnabled = true;
  private pendingApply: number | null = null;
  private rendererSubtype: ANARIRendererSubtype = 'default';
  private temporalAntialiasingEnabled = true;
  private lastStatisticsUpdate = 0;
  private readonly editor: ANARISceneEditor;
  private readonly canvas: HTMLCanvasElement;
  private readonly orbitControls: OrbitControls;
  private importRequest = 0;
  private pickRequest = 0;
  private readonly selectionOutline?: SelectionOutline;
  private readonly depthCopy?: DepthTextureCopy;
  private readonly chartLabels?: ChartLabels;
  private renderedFrameCount = 0;
  private captureFrameLimit = 0;
  private selectedPlacementId: string | null = null;
  private pointerStart: {x: number; y: number} | null = null;
  private animationScrubbing = false;
  private editorCollapsed = false;

  constructor({device}: AnimationProps) {
    super();

    this.anari = new ANARIDevice(device);
    if (device.type === 'webgpu') {
      this.selectionOutline = new SelectionOutline(device);
      this.depthCopy = new DepthTextureCopy(device);
      this.chartLabels = new ChartLabels(device);
    }
    this.deferredRendererAvailable = device.type === 'webgpu';
    this.editor = new ANARISceneEditor(
      getRequiredElement('scene-editor', HTMLTextAreaElement),
      getRequiredElement('scene-monaco-editor', HTMLDivElement)
    );
    this.canvas = getRequiredElement('playground-canvas', HTMLCanvasElement);
    this.orbitControls = new OrbitControls(this.canvas, {
      distance: 20,
      pitch: 0.2,
      minDistance: 5,
      maxDistance: 70,
      minPitch: -0.06,
      maxPitch: 1.12,
      rotateSpeed: 0.005,
      pitchSpeed: -0.004
    });

    this.initializeControls();
    const parameters = new URLSearchParams(window.location.search);
    if (parameters.get('editor') === 'hidden')
      getRequiredElement('editor-toggle', HTMLButtonElement).click();
    const preset = parameters.get('preset');
    this.selectPreset(
      preset === 'chart' ? 3 : preset === 'chart-motion' ? 4 : preset === 'chart-diffuse' ? 5 : 0
    );
    if (preset === 'chart' || preset === 'chart-motion' || preset === 'chart-diffuse') {
      const sceneDescription: ANARIJSONScene = ANARISceneSchema.parse(
        JSON.parse(this.editor.value)
      );
      const renderer = parameters.get('renderer') === 'default' ? 'default' : 'raytrace';
      sceneDescription.renderer = makePlaygroundRenderer(sceneDescription.renderer, renderer);
      if (renderer === 'raytrace') {
        const denoiseRadius = Number(parameters.get('denoise') ?? 0);
        if (denoiseRadius === 0 || denoiseRadius === 1 || denoiseRadius === 2)
          sceneDescription.renderer.denoiseRadius = denoiseRadius;
        const historySampleLimit = Number(parameters.get('history') ?? 64);
        if (
          Number.isInteger(historySampleLimit) &&
          historySampleLimit >= 1 &&
          historySampleLimit <= 256
        )
          sceneDescription.renderer.historySampleLimit = historySampleLimit;
        const seed = Number(parameters.get('seed') ?? 0);
        if (Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff)
          sceneDescription.renderer.samplingSeed = seed;
        if (parameters.get('quality') === 'still')
          Object.assign(sceneDescription.renderer, getRayTracingQualityPreset('still'));
      }
      const frameLimit = Number(parameters.get('captureFrames') ?? 0);
      if (Number.isInteger(frameLimit) && frameLimit > 0 && frameLimit <= 256)
        this.captureFrameLimit = frameLimit;
      this.editor.value = formatSceneJSON(sceneDescription);
      this.applyEditorScene();
    }

    const dynamicRange = device.preferredColorFormat === 'rgba16float' ? 'HDR · DISPLAY P3' : 'SDR';
    setElementText('backend-label', `${device.type.toUpperCase()} · ${dynamicRange}`);
  }

  override onRender({device, width, height, time}: AnimationProps): void {
    const scene = this.scene;
    if (this.captureFrameLimit && this.renderedFrameCount >= this.captureFrameLimit) return;
    if (!scene) {
      return;
    }

    const elapsedSeconds = this.captureFrameLimit ? this.renderedFrameCount / 60 : time * 0.001;
    scene.update(elapsedSeconds);
    this.updateAnimationTime(scene);

    const currentSize = scene.frame.getParameter('size');
    if (!currentSize || currentSize[0] !== width || currentSize[1] !== height) {
      scene.frame.setParameter('size', [width, height]).commitParameters();
    }

    this.orbitControls.update(time);
    const target = scene.cameraTarget;
    const position: ANARIVector3 = this.orbitControls.getEyePosition();
    const direction: ANARIVector3 = [
      target[0] - position[0],
      target[1] - position[1],
      target[2] - position[2]
    ];
    scene.frame.getParameter('camera')?.setParameters({position, direction}).commitParameters();

    const statistics = scene.frame.render();
    const showChartLabels = scene.name === 'CHART MOTION' && Boolean(this.chartLabels);
    if (
      this.selectionOutline &&
      (this.selectedPlacementId || showChartLabels) &&
      this.rendererSubtype === 'raytrace'
    ) {
      device.submit();
      const channels = scene.frame.captureChannels();
      if (channels) {
        try {
          const selectedIdentifier =
            channels.identifiers.findIndex(
              identity => identity.placementId === this.selectedPlacementId
            ) + 1;
          const renderPass = device.beginRenderPass({
            clearColor: false,
            clearDepth: showChartLabels ? 1 : false,
            clearStencil: false
          });
          if (showChartLabels) {
            this.depthCopy?.draw(renderPass, {depthTexture: channels.projectedDepthTexture});
          }
          this.selectionOutline.draw(renderPass, {
            identifierTexture: channels.identifierTexture,
            selectedIdentifier
          });
          if (showChartLabels) this.chartLabels?.draw(renderPass, scene, width, height);
          renderPass.end();
          device.submit();
        } finally {
          channels.destroy();
        }
      }
    }
    this.renderedFrameCount++;
    this.canvas.dataset['renderedFrames'] = String(this.renderedFrameCount);
    if (
      elapsedSeconds - this.lastStatisticsUpdate > 0.25 ||
      this.renderedFrameCount === this.captureFrameLimit
    ) {
      setElementText('scene-instance-count', statistics.instanceCount.toLocaleString());
      setElementText('scene-draw-count', statistics.drawCount.toLocaleString());
      setElementText('scene-triangle-count', statistics.triangleCount.toLocaleString());
      const rayTracing = statistics.rayTracing;
      const resolutionTelemetry = document.getElementById('scene-ray-tracing-resolution-statistic');
      const frameTelemetry = document.getElementById('scene-ray-tracing-frame-statistic');
      if (resolutionTelemetry) {
        resolutionTelemetry.hidden = !rayTracing;
      }
      if (frameTelemetry) {
        frameTelemetry.hidden = !rayTracing;
      }
      const memoryTelemetry = document.getElementById('scene-ray-memory-statistic');
      if (memoryTelemetry) memoryTelemetry.hidden = !rayTracing?.memory;
      if (rayTracing?.memory)
        setElementText(
          'scene-ray-memory',
          `${(rayTracing.memory.totalBytes / 1048576).toFixed(2)} MiB`
        );
      if (rayTracing) {
        setElementText(
          'scene-ray-tracing-resolution',
          `${rayTracing.internalWidth} × ${rayTracing.internalHeight} · ${Math.round(rayTracing.resolutionScale * 100)}%`
        );
        setElementText(
          'scene-ray-tracing-frame',
          `${rayTracing.frameTimeMilliseconds.toFixed(1)} ms · ${Math.round(rayTracing.sampledPixelCoverage * 100)}% · ${rayTracing.accumulatedSamples} spp`
        );
      }
      this.lastStatisticsUpdate = elapsedSeconds;
    }
  }

  override onFinalize(): void {
    if (this.pendingApply !== null) {
      window.clearTimeout(this.pendingApply);
    }
    this.orbitControls.destroy();
    this.editor.dispose();
    this.scene?.destroy();
    this.selectionOutline?.destroy();
    this.depthCopy?.destroy();
    this.chartLabels?.destroy();
    this.anari.destroy();
  }

  private initializeControls(): void {
    const editorToggle = getRequiredElement('editor-toggle', HTMLButtonElement);
    const workspace = editorToggle
      .closest<HTMLElement>('.shell')
      ?.querySelector<HTMLElement>('.workspace');
    editorToggle.addEventListener('click', () => {
      if (!workspace) return;
      this.editorCollapsed = !this.editorCollapsed;
      workspace.classList.toggle('editor-collapsed', this.editorCollapsed);
      editorToggle.setAttribute('aria-expanded', String(!this.editorCollapsed));
      editorToggle.textContent = this.editorCollapsed ? 'SHOW EDITOR' : 'HIDE EDITOR';
    });

    getRequiredElement('quality-selector', HTMLSelectElement).disabled =
      !this.deferredRendererAvailable;
    getRequiredElement('quality-selector', HTMLSelectElement).addEventListener('change', event => {
      const selector = event.currentTarget;
      if (
        selector instanceof HTMLSelectElement &&
        (selector.value === 'interactive' || selector.value === 'still')
      )
        this.applyQualityPreset(selector.value);
    });
    for (const identifier of ['denoise-selector', 'history-limit']) {
      const control = document.getElementById(identifier);
      control?.addEventListener('change', () => {
        const denoiseRadius = Number(
          getRequiredElement('denoise-selector', HTMLSelectElement).value
        );
        const historySampleLimit = Number(
          getRequiredElement('history-limit', HTMLInputElement).value
        );
        if (
          !(denoiseRadius === 0 || denoiseRadius === 1 || denoiseRadius === 2) ||
          !Number.isInteger(historySampleLimit) ||
          historySampleLimit < 1 ||
          historySampleLimit > 256
        )
          return;
        const description: ANARIJSONScene = ANARISceneSchema.parse(JSON.parse(this.editor.value));
        description.renderer = {
          ...makePlaygroundRenderer(description.renderer, 'raytrace'),
          denoiseRadius,
          historySampleLimit
        };
        this.editor.value = formatSceneJSON(description);
        if (this.rendererSubtype !== 'raytrace' || !this.scene) this.applyEditorScene();
        else {
          this.scene.frame
            .getParameter('renderer')
            ?.setParameters({denoiseRadius, historySampleLimit})
            .commitParameters();
          this.updateEditorMetadata();
        }
      });
    }
    const presetList = getRequiredElement('preset-list', HTMLDivElement);
    for (const [presetIndex, preset] of PLAYGROUND_PRESETS.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'preset-button';
      button.textContent = preset.label;
      button.dataset['preset'] = String(presetIndex);
      button.addEventListener('click', () => this.selectPreset(presetIndex));
      presetList.appendChild(button);
    }

    const usdSelector = getRequiredElement('usd-scene-selector', HTMLSelectElement);
    for (const sample of SCENE_SAMPLES) {
      const option = document.createElement('option');
      option.value = sample.identifier;
      option.textContent = sample.label;
      usdSelector.appendChild(option);
    }
    usdSelector.addEventListener('change', () => {
      if (usdSelector.value === 'local-file') {
        getRequiredElement('usd-file-input', HTMLInputElement).click();
      } else if (usdSelector.value) {
        void this.importScene(loadSceneSample(usdSelector.value));
      }
    });
    getRequiredElement('usd-file-input', HTMLInputElement).addEventListener('change', event => {
      const input = event.currentTarget;
      if (input instanceof HTMLInputElement && input.files?.[0]) {
        void this.importScene(loadSceneFile(input.files[0]));
      }
    });

    this.editor.onChange(this.handleEditorInput);
    this.editor.onApply(() => this.applyEditorScene());

    getRequiredElement('apply-scene', HTMLButtonElement).addEventListener('click', () =>
      this.applyEditorScene()
    );
    getRequiredElement('format-scene', HTMLButtonElement).addEventListener('click', () =>
      this.formatEditorScene()
    );
    getRequiredElement('reset-scene', HTMLButtonElement).addEventListener('click', () =>
      this.selectPreset(this.activePresetIndex)
    );
    getRequiredElement('copy-scene', HTMLButtonElement).addEventListener('click', () => {
      void navigator.clipboard.writeText(this.editor.value);
      setElementText('editor-feedback', 'Scene JSON copied');
    });
    getRequiredElement('export-gltf', HTMLButtonElement).addEventListener('click', () => {
      void this.exportScene('gltf');
    });
    getRequiredElement('export-glb', HTMLButtonElement).addEventListener('click', () => {
      void this.exportScene('glb');
    });
    getRequiredElement('export-usd', HTMLButtonElement).addEventListener('click', () => {
      void this.exportScene('usd');
    });
    getRequiredElement('live-apply', HTMLButtonElement).addEventListener('click', event => {
      this.liveApplyEnabled = !this.liveApplyEnabled;
      const button = event.currentTarget;
      if (button instanceof HTMLButtonElement) {
        button.classList.toggle('active', this.liveApplyEnabled);
        button.setAttribute('aria-pressed', String(this.liveApplyEnabled));
      }
      if (this.liveApplyEnabled) {
        this.applyEditorScene();
      }
    });

    this.canvas.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      this.pointerStart = {x: event.clientX, y: event.clientY};
    });
    this.canvas.addEventListener('pointerup', event => {
      const start = this.pointerStart;
      this.pointerStart = null;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) {
        void this.pickScene(event.clientX, event.clientY);
      }
    });
    this.canvas.addEventListener('pointercancel', () => {
      this.pointerStart = null;
    });

    const rendererSelector = getRequiredElement('renderer-selector', HTMLSelectElement);
    const deferredOption = rendererSelector.querySelector<HTMLOptionElement>(
      'option[value="deferred"]'
    );
    if (deferredOption && !this.deferredRendererAvailable) {
      deferredOption.disabled = true;
      deferredOption.title = 'Deferred rendering requires WebGPU.';
    }
    const raytraceOption = rendererSelector.querySelector<HTMLOptionElement>(
      'option[value="raytrace"]'
    );
    if (raytraceOption && !this.deferredRendererAvailable) {
      raytraceOption.disabled = true;
      raytraceOption.title = 'Graph-based ray tracing requires WebGPU.';
    }
    const temporalAntialiasingToggle = getRequiredElement('temporal-aa-toggle', HTMLButtonElement);
    temporalAntialiasingToggle.hidden = !isTemporalAntialiasingRenderer(this.rendererSubtype);
    rendererSelector.addEventListener('change', event => {
      const selector = event.currentTarget;
      if (selector instanceof HTMLSelectElement) {
        let parsedScene: unknown;
        try {
          parsedScene = JSON.parse(this.editor.value);
        } catch {
          this.applyEditorScene();
          return;
        }
        const validatedScene = ANARISceneSchema.safeParse(parsedScene);
        if (!validatedScene.success) {
          this.applyEditorScene();
          return;
        }
        const sceneDescription: ANARIJSONScene = validatedScene.data;
        sceneDescription.renderer = makePlaygroundRenderer(
          sceneDescription.renderer,
          selector.value as ANARIRendererSubtype
        );
        this.editor.value = formatSceneJSON(sceneDescription);
        this.updateEditorMetadata();
        this.applyEditorScene();
      }
    });

    temporalAntialiasingToggle.addEventListener('click', event => {
      this.temporalAntialiasingEnabled = !this.temporalAntialiasingEnabled;
      const button = event.currentTarget;
      if (button instanceof HTMLButtonElement) {
        button.classList.toggle('active', this.temporalAntialiasingEnabled);
        button.setAttribute('aria-pressed', String(this.temporalAntialiasingEnabled));
      }
      if (isTemporalAntialiasingRenderer(this.rendererSubtype)) {
        this.scene?.frame
          .getParameter('renderer')
          ?.setParameters(this.getTemporalAntialiasingParameters())
          .commitParameters();
      }
    });

    getRequiredElement('animation-clip', HTMLSelectElement).addEventListener('change', event => {
      const selector = event.currentTarget;
      if (selector instanceof HTMLSelectElement) {
        this.scene?.animations?.selectClip(selector.value);
        this.updateAnimationControls(this.scene);
      }
    });
    getRequiredElement('animation-toggle', HTMLButtonElement).addEventListener('click', () => {
      const animations = this.scene?.animations;
      if (!animations?.activeClip) {
        return;
      }
      const action = animations.mixer.getAction(animations.activeClip);
      if (action?.playing && !action.paused) {
        animations.pause();
      } else {
        animations.play();
      }
      this.updateAnimationControls(this.scene);
    });
    const scrubber = getRequiredElement('animation-scrub', HTMLInputElement);
    scrubber.addEventListener('pointerdown', () => {
      this.animationScrubbing = true;
    });
    scrubber.addEventListener('pointerup', () => {
      this.animationScrubbing = false;
    });
    scrubber.addEventListener('input', () => {
      this.scene?.animations?.seek(Number(scrubber.value));
      this.updateAnimationTime(this.scene);
    });
    getRequiredElement('animation-speed', HTMLSelectElement).addEventListener('change', event => {
      const selector = event.currentTarget;
      if (selector instanceof HTMLSelectElement) {
        this.scene?.animations?.setSpeed(Number(selector.value));
      }
    });
  }

  private applyQualityPreset(preset: 'interactive' | 'still'): void {
    try {
      const sceneDescription: ANARIJSONScene = ANARISceneSchema.parse(
        JSON.parse(this.editor.value)
      );
      sceneDescription.renderer = {
        ...makePlaygroundRenderer(sceneDescription.renderer, 'raytrace'),
        ...getRayTracingQualityPreset(preset)
      };
      this.editor.value = formatSceneJSON(sceneDescription);
      this.updateEditorMetadata();
      if (!this.scene) {
        this.applyEditorScene();
        return;
      }
      applyPlaygroundQualityPreset(this.anari, this.scene.frame, preset);
      this.rendererSubtype = 'raytrace';
      this.temporalAntialiasingEnabled = preset === 'interactive';
      const toggle = getRequiredElement('temporal-aa-toggle', HTMLButtonElement);
      toggle.hidden = false;
      toggle.classList.toggle('active', this.temporalAntialiasingEnabled);
      toggle.setAttribute('aria-pressed', String(this.temporalAntialiasingEnabled));
      getRequiredElement('renderer-selector', HTMLSelectElement).value = 'raytrace';
      getRequiredElement('quality-selector', HTMLSelectElement).value = preset;
      if (this.captureFrameLimit) this.renderedFrameCount = 0;
    } catch {
      this.applyEditorScene();
    }
  }

  private selectPreset(presetIndex: number): void {
    const preset = PLAYGROUND_PRESETS[presetIndex];
    this.activePresetIndex = presetIndex;
    getRequiredElement('usd-scene-selector', HTMLSelectElement).value = '';
    this.editor.value = formatSceneJSON(preset.scene);
    this.updateEditorMetadata();
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
      button.classList.toggle('active', button.dataset['preset'] === String(presetIndex));
    }
    this.applyEditorScene();
  }

  private async importScene(pendingScene: Promise<ANARIJSONScene>): Promise<void> {
    const request = ++this.importRequest;
    setElementText('editor-feedback', 'Importing 3D scene…');
    try {
      const scene = await pendingScene;
      if (request !== this.importRequest) {
        return;
      }
      this.editor.value = formatSceneJSON(scene);
      this.updateEditorMetadata();
      for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
        button.classList.remove('active');
      }
      this.applyEditorScene();
      setElementText('editor-feedback', '3D asset translated into editable ANARI JSON');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setElementText('editor-feedback', '3D import failed; last valid scene preserved');
      setElementText('scene-error', message);
      document.getElementById('scene-error')?.classList.add('visible');
      document.getElementById('editor-status')?.classList.add('invalid');
    }
  }

  private applyEditorScene(): void {
    try {
      const parsedScene: unknown = JSON.parse(this.editor.value);
      const validatedScene = ANARISceneSchema.safeParse(parsedScene);
      if (!validatedScene.success) {
        this.editor.setIssues(validatedScene.error.issues);
        const issue = validatedScene.error.issues[0];
        const path = issue.path.length > 0 ? `${issue.path.join('.')} · ` : '';
        throw new Error(`${path}${issue.message}`);
      }
      this.editor.clearIssues();
      const sceneDescription: ANARIJSONScene = validatedScene.data;
      const rendererSubtype = getPlaygroundRendererSubtype(
        sceneDescription.renderer,
        this.deferredRendererAvailable
      );
      const nextScene = createANARIJSONScene(this.anari, sceneDescription);
      this.rendererSubtype = rendererSubtype;
      getRequiredElement('renderer-selector', HTMLSelectElement).value = rendererSubtype;
      const quality = (['interactive', 'still'] as const).find(preset =>
        Object.entries(getRayTracingQualityPreset(preset)).every(([name, value]) =>
          Object.entries(sceneDescription.renderer ?? {}).some(
            ([parameterName, parameterValue]) => name === parameterName && value === parameterValue
          )
        )
      );
      getRequiredElement('denoise-selector', HTMLSelectElement).value = String(
        sceneDescription.renderer?.denoiseRadius ?? 0
      );
      getRequiredElement('history-limit', HTMLInputElement).value = String(
        sceneDescription.renderer?.historySampleLimit ?? 64
      );
      getRequiredElement('quality-selector', HTMLSelectElement).value =
        rendererSubtype === 'raytrace' ? (quality ?? 'custom') : 'custom';
      getRequiredElement('temporal-aa-toggle', HTMLButtonElement).hidden =
        !isTemporalAntialiasingRenderer(rendererSubtype);
      if (isTemporalAntialiasingRenderer(this.rendererSubtype)) {
        const renderer = nextScene.frame.getParameter('renderer');
        const parameterName =
          this.rendererSubtype === 'raytrace' ? 'temporalReprojection' : 'temporalAntialiasing';
        this.temporalAntialiasingEnabled =
          sceneDescription.renderer?.[parameterName] ?? this.temporalAntialiasingEnabled;
        const toggle = getRequiredElement('temporal-aa-toggle', HTMLButtonElement);
        toggle.classList.toggle('active', this.temporalAntialiasingEnabled);
        toggle.setAttribute('aria-pressed', String(this.temporalAntialiasingEnabled));
        renderer?.setParameters(this.getTemporalAntialiasingParameters()).commitParameters();
      }
      const previousScene = this.scene;
      this.scene = nextScene;
      this.renderedFrameCount = 0;
      this.selectedPlacementId = null;
      previousScene?.destroy();
      this.resetCamera(nextScene);
      this.updateAnimationControls(nextScene);
      setElementText(
        'scene-selection',
        this.rendererSubtype === 'raytrace' ? 'Click a mark to inspect and outline it' : ''
      );
      setElementText('scene-title', nextScene.name);
      setElementText('scene-description', nextScene.description);
      setElementText('editor-feedback', 'Scene committed');
      setElementText('scene-error', '');
      document.getElementById('scene-error')?.classList.remove('visible');
      document.getElementById('editor-status')?.classList.remove('invalid');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setElementText('editor-feedback', 'Last valid scene preserved');
      setElementText('scene-error', message);
      document.getElementById('scene-error')?.classList.add('visible');
      document.getElementById('editor-status')?.classList.add('invalid');
    }
  }

  private async pickScene(clientX: number, clientY: number): Promise<void> {
    const scene = this.scene;
    if (!scene || this.rendererSubtype !== 'raytrace') {
      return;
    }
    const size = scene.frame.getParameter('size');
    const bounds = this.canvas.getBoundingClientRect();
    if (!size || bounds.width === 0 || bounds.height === 0) {
      return;
    }
    const request = ++this.pickRequest;
    try {
      const hit = await scene.frame.pick(
        ((clientX - bounds.left) * size[0]) / bounds.width,
        ((clientY - bounds.top) * size[1]) / bounds.height
      );
      if (
        this.scene !== scene ||
        request !== this.pickRequest ||
        this.rendererSubtype !== 'raytrace'
      ) {
        return;
      }
      this.selectedPlacementId = hit?.placementId ?? null;
      const identifier = hit?.instance ? scene.instanceIdentifiers.get(hit.instance) : undefined;
      setElementText(
        'scene-selection',
        hit ? `Selected: ${identifier || hit.surface.id}` : 'No mark selected'
      );
    } catch (error) {
      if (this.scene === scene && request === this.pickRequest) {
        setElementText(
          'scene-selection',
          error instanceof Error ? error.message : 'Picking failed'
        );
      }
    }
  }

  private getTemporalAntialiasingParameters(): ANARIRendererParameters {
    return this.rendererSubtype === 'raytrace'
      ? {
          temporalReprojection: this.temporalAntialiasingEnabled
        }
      : {temporalAntialiasing: this.temporalAntialiasingEnabled};
  }

  private formatEditorScene(): void {
    try {
      this.editor.value = formatSceneJSON(JSON.parse(this.editor.value));
      this.updateEditorMetadata();
      this.applyEditorScene();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setElementText('scene-error', message);
      document.getElementById('scene-error')?.classList.add('visible');
    }
  }

  private async exportScene(format: 'gltf' | 'glb' | 'usd'): Promise<void> {
    try {
      const parsedScene: unknown = JSON.parse(this.editor.value);
      const validatedScene = ANARISceneSchema.safeParse(parsedScene);
      if (!validatedScene.success) {
        const issue = validatedScene.error.issues[0];
        const path = issue.path.length > 0 ? issue.path.join('.') + ' · ' : '';
        throw new Error(path + issue.message);
      }
      setElementText('editor-feedback', 'Exporting ' + format.toUpperCase() + ' scene…');
      const scene = validatedScene.data as ANARIJSONScene;
      if (format === 'glb') {
        const binaryContents = await exportANARIJSONSceneToGLTF(scene, {binary: true});
        downloadSceneFile(
          binaryContents,
          makeExportFilename(scene.name, 'glb'),
          'model/gltf-binary'
        );
      } else {
        const contents =
          format === 'gltf'
            ? await exportANARIJSONSceneToGLTF(scene)
            : exportANARIJSONSceneToUSD(scene);
        downloadSceneFile(
          contents,
          makeExportFilename(scene.name, format === 'gltf' ? 'gltf' : 'usda'),
          format === 'gltf' ? 'model/gltf+json' : 'model/vnd.usda'
        );
      }
      setElementText('editor-feedback', format.toUpperCase() + ' scene downloaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setElementText('editor-feedback', 'Export failed; fix scene errors first');
      setElementText('scene-error', message);
      document.getElementById('scene-error')?.classList.add('visible');
    }
  }

  private updateEditorMetadata(): void {
    setElementText('editor-line-count', `${this.editor.lineCount.toLocaleString()} LINES`);
  }

  private updateAnimationControls(scene: ANARIJSONSceneHandle | null): void {
    const container = getRequiredElement('animation-controls', HTMLDivElement);
    const animations = scene?.animations;
    container.hidden = !animations?.clipNames.length;
    if (!animations?.activeClip) {
      return;
    }

    const selector = getRequiredElement('animation-clip', HTMLSelectElement);
    selector.replaceChildren();
    for (const clip of animations.clipNames) {
      const option = document.createElement('option');
      option.value = clip;
      option.textContent = clip;
      selector.appendChild(option);
    }
    selector.value = animations.activeClip;
    const action = animations.mixer.getAction(animations.activeClip);
    const button = getRequiredElement('animation-toggle', HTMLButtonElement);
    button.textContent = action?.playing && !action.paused ? 'PAUSE' : 'PLAY';
    getRequiredElement('animation-scrub', HTMLInputElement).max = String(
      action?.clip.duration || 1
    );
    this.updateAnimationTime(scene);
  }

  private updateAnimationTime(scene: ANARIJSONSceneHandle | null): void {
    const animations = scene?.animations;
    if (!animations?.activeClip) {
      return;
    }
    const action = animations.mixer.getAction(animations.activeClip);
    if (!action) {
      return;
    }
    if (!this.animationScrubbing) {
      getRequiredElement('animation-scrub', HTMLInputElement).value = String(action.time);
    }
    setElementText('animation-time', action.time.toFixed(2));
  }

  private resetCamera(scene: ANARIJSONSceneHandle): void {
    const horizontalDistance = Math.hypot(
      scene.cameraPosition[0] - scene.cameraTarget[0],
      scene.cameraPosition[2] - scene.cameraTarget[2]
    );
    this.orbitControls.setProps({
      target: scene.cameraTarget,
      distance: Math.hypot(horizontalDistance, scene.cameraPosition[1] - scene.cameraTarget[1]),
      yaw: Math.atan2(
        scene.cameraPosition[0] - scene.cameraTarget[0],
        scene.cameraPosition[2] - scene.cameraTarget[2]
      ),
      pitch: Math.atan2(scene.cameraPosition[1] - scene.cameraTarget[1], horizontalDistance),
      autoRotate: scene.cameraOrbitSpeed !== 0,
      autoRotateSpeed: scene.cameraOrbitSpeed
    });
  }

  private readonly handleEditorInput = (): void => {
    this.updateEditorMetadata();
    setElementText(
      'editor-feedback',
      this.liveApplyEnabled ? 'Waiting for edits…' : 'Uncommitted changes'
    );
    if (this.pendingApply !== null) {
      window.clearTimeout(this.pendingApply);
    }
    if (this.liveApplyEnabled) {
      this.pendingApply = window.setTimeout(() => {
        this.pendingApply = null;
        this.applyEditorScene();
      }, 480);
    }
  };
}

function getRequiredElement<ElementType extends HTMLElement>(
  identifier: string,
  ElementConstructor: new (...parameters: never[]) => ElementType
): ElementType {
  const element = document.getElementById(identifier);
  if (!(element instanceof ElementConstructor)) {
    throw new Error(`Missing playground element "${identifier}".`);
  }
  return element;
}

function setElementText(identifier: string, value: string): void {
  const element = document.getElementById(identifier);
  if (element) {
    element.textContent = value;
  }
}

function isTemporalAntialiasingRenderer(rendererName: string): boolean {
  return rendererName === 'default' || rendererName === 'deferred' || rendererName === 'raytrace';
}

function formatSceneJSON(scene: unknown): string {
  return JSON.stringify(scene, null, 2).replace(
    /\[\n((?:[ \t]+-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?,?\n)+)[ \t]*\]/g,
    (_match, components: string) => `[${components.trim().replace(/,\s+/g, ', ')}]`
  );
}

function makeExportFilename(name: string, extension: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (normalized || 'anari-scene') + '.' + extension;
}

function downloadSceneFile(
  contents: string | ArrayBuffer,
  filename: string,
  mimeType: string
): void {
  const url = URL.createObjectURL(new Blob([contents], {type: mimeType}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
