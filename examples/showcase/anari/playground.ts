import {
  ANARIDevice,
  type ANARIRendererParameters,
  type ANARIRendererSubtype,
  type ANARIVector3
} from '@luma.gl/anari';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {PLAYGROUND_PRESETS} from './playground-presets';
import {
  type ANARIJSONScene,
  type ANARIJSONSceneHandle,
  createANARIJSONScene
} from './playground-scene';
import {ANARISceneEditor} from './scene-editor';
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
  private pointerPosition: [number, number] | null = null;
  private orbitAzimuth = 0;
  private orbitElevation = 0.2;
  private orbitDistance = 20;
  private rendererSubtype: ANARIRendererSubtype = 'default';
  private temporalAntialiasingEnabled = true;
  private lastStatisticsUpdate = 0;
  private readonly editor: ANARISceneEditor;
  private readonly canvas: HTMLCanvasElement;
  private importRequest = 0;
  private animationScrubbing = false;

  constructor({device}: AnimationProps) {
    super();

    this.anari = new ANARIDevice(device);
    this.deferredRendererAvailable = device.type === 'webgpu';
    this.editor = new ANARISceneEditor(
      getRequiredElement('scene-editor', HTMLTextAreaElement),
      getRequiredElement('scene-monaco-editor', HTMLDivElement)
    );
    this.canvas = getRequiredElement('playground-canvas', HTMLCanvasElement);

    this.initializeControls();
    this.selectPreset(0);

    const dynamicRange = device.preferredColorFormat === 'rgba16float' ? 'HDR · DISPLAY P3' : 'SDR';
    setElementText('backend-label', `${device.type.toUpperCase()} · ${dynamicRange}`);
  }

  override onRender({width, height, time}: AnimationProps): void {
    const scene = this.scene;
    if (!scene) {
      return;
    }

    const elapsedSeconds = time * 0.001;
    scene.update(elapsedSeconds);
    this.updateAnimationTime(scene);

    const currentSize = scene.frame.getParameter('size');
    if (!currentSize || currentSize[0] !== width || currentSize[1] !== height) {
      scene.frame.setParameter('size', [width, height]).commitParameters();
    }

    const azimuth = this.orbitAzimuth + elapsedSeconds * scene.cameraOrbitSpeed;
    const horizontalDistance = this.orbitDistance * Math.cos(this.orbitElevation);
    const target = scene.cameraTarget;
    const position: ANARIVector3 = [
      target[0] + Math.sin(azimuth) * horizontalDistance,
      target[1] + Math.sin(this.orbitElevation) * this.orbitDistance,
      target[2] + Math.cos(azimuth) * horizontalDistance
    ];
    const direction: ANARIVector3 = [
      target[0] - position[0],
      target[1] - position[1],
      target[2] - position[2]
    ];
    scene.frame.getParameter('camera')?.setParameters({position, direction}).commitParameters();

    const statistics = scene.frame.render();
    if (elapsedSeconds - this.lastStatisticsUpdate > 0.25) {
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
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.editor.dispose();
    this.scene?.destroy();
    this.anari.destroy();
  }

  private initializeControls(): void {
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
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('wheel', this.handleWheel, {passive: false});

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
        this.rendererSubtype = selector.value as ANARIRendererSubtype;
        temporalAntialiasingToggle.hidden = !isTemporalAntialiasingRenderer(this.rendererSubtype);
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
      const nextScene = createANARIJSONScene(this.anari, sceneDescription, {
        rendererSubtype: this.rendererSubtype
      });
      if (isTemporalAntialiasingRenderer(this.rendererSubtype)) {
        nextScene.frame
          .getParameter('renderer')
          ?.setParameters(this.getTemporalAntialiasingParameters())
          .commitParameters();
      }
      const previousScene = this.scene;
      this.scene = nextScene;
      previousScene?.destroy();
      this.resetCamera(nextScene);
      this.updateAnimationControls(nextScene);
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

  private getTemporalAntialiasingParameters(): ANARIRendererParameters {
    return this.rendererSubtype === 'raytrace'
      ? {
          temporalReprojection: this.temporalAntialiasingEnabled,
          progressive: this.temporalAntialiasingEnabled
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

  private async exportScene(format: 'gltf' | 'usd'): Promise<void> {
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
      const contents =
        format === 'gltf'
          ? await exportANARIJSONSceneToGLTF(scene)
          : exportANARIJSONSceneToUSD(scene);
      downloadTextFile(
        contents,
        makeExportFilename(scene.name, format === 'gltf' ? 'gltf' : 'usda'),
        format === 'gltf' ? 'model/gltf+json' : 'model/vnd.usda'
      );
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
    this.orbitDistance = Math.hypot(
      horizontalDistance,
      scene.cameraPosition[1] - scene.cameraTarget[1]
    );
    this.orbitAzimuth = Math.atan2(
      scene.cameraPosition[0] - scene.cameraTarget[0],
      scene.cameraPosition[2] - scene.cameraTarget[2]
    );
    this.orbitElevation = Math.atan2(
      scene.cameraPosition[1] - scene.cameraTarget[1],
      horizontalDistance
    );
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

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerPosition = [event.clientX, event.clientY];
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerPosition) {
      return;
    }
    this.orbitAzimuth -= (event.clientX - this.pointerPosition[0]) * 0.005;
    this.orbitElevation = clamp(
      this.orbitElevation + (event.clientY - this.pointerPosition[1]) * 0.004,
      -0.06,
      1.12
    );
    this.pointerPosition = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (): void => {
    this.pointerPosition = null;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.orbitDistance = clamp(this.orbitDistance * Math.exp(event.deltaY * 0.001), 5, 70);
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
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

function downloadTextFile(contents: string, filename: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([contents], {type: mimeType}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
