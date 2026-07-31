import {ANARIDevice, type ANARIVector3} from '@luma.gl/anari';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {PLAYGROUND_PRESETS} from './playground-presets';
import {
  createANARIJSONScene,
  type ANARIJSONScene,
  type ANARIJSONSceneHandle
} from './playground-scene';

export default class ANARIPlayground extends AnimationLoopTemplate {
  static info = '';

  readonly anari: ANARIDevice;

  private scene: ANARIJSONSceneHandle | null = null;
  private activePresetIndex = 0;
  private liveApplyEnabled = true;
  private pendingApply: number | null = null;
  private pointerPosition: [number, number] | null = null;
  private orbitAzimuth = 0;
  private orbitElevation = 0.2;
  private orbitDistance = 20;
  private lastStatisticsUpdate = 0;
  private readonly editor: HTMLTextAreaElement;
  private readonly canvas: HTMLCanvasElement;

  constructor({device}: AnimationProps) {
    super();

    this.anari = new ANARIDevice(device);
    this.editor = getRequiredElement('scene-editor', HTMLTextAreaElement);
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
    this.editor.removeEventListener('input', this.handleEditorInput);
    this.editor.removeEventListener('scroll', this.handleEditorScroll);
    this.editor.removeEventListener('keydown', this.handleEditorKeyDown);
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

    this.editor.addEventListener('input', this.handleEditorInput);
    this.editor.addEventListener('scroll', this.handleEditorScroll);
    this.editor.addEventListener('keydown', this.handleEditorKeyDown);
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
  }

  private selectPreset(presetIndex: number): void {
    const preset = PLAYGROUND_PRESETS[presetIndex];
    this.activePresetIndex = presetIndex;
    this.editor.value = formatSceneJSON(preset.scene);
    this.updateEditorMetadata();
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
      button.classList.toggle('active', button.dataset['preset'] === String(presetIndex));
    }
    this.applyEditorScene();
  }

  private applyEditorScene(): void {
    try {
      const sceneDescription = JSON.parse(this.editor.value) as ANARIJSONScene;
      const nextScene = createANARIJSONScene(this.anari, sceneDescription);
      const previousScene = this.scene;
      this.scene = nextScene;
      previousScene?.destroy();
      this.resetCamera(nextScene);
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

  private updateEditorMetadata(): void {
    const lines = this.editor.value.split('\n').length;
    setElementText(
      'editor-lines',
      Array.from({length: lines}, (_, line) => String(line + 1)).join('\n')
    );
    setElementText('editor-line-count', `${lines.toLocaleString()} LINES`);
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

  private readonly handleEditorScroll = (): void => {
    const lineNumbers = document.getElementById('editor-lines');
    if (lineNumbers) {
      lineNumbers.style.transform = `translateY(-${this.editor.scrollTop}px)`;
    }
  };

  private readonly handleEditorKeyDown = (event: KeyboardEvent): void => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.applyEditorScene();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const selectionStart = this.editor.selectionStart;
      const selectionEnd = this.editor.selectionEnd;
      this.editor.setRangeText('  ', selectionStart, selectionEnd, 'end');
      this.handleEditorInput();
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

function formatSceneJSON(scene: unknown): string {
  return JSON.stringify(scene, null, 2).replace(
    /\[\n((?:[ \t]+-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?,?\n)+)[ \t]*\]/g,
    (_match, components: string) => `[${components.trim().replace(/,\s+/g, ', ')}]`
  );
}
