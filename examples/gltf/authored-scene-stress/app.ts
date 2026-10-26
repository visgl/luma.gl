// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationProps, ScenegraphNode} from '@luma.gl/engine';
import {
  ScenegraphPhysicsSession,
  type ScenegraphPhysicsSessionCapture
} from '@luma.gl/engine/physics';
import {
  makeGLTFPhysicsScene,
  parseGLTFPhysics,
  snapshotGLTFPhysicsScene
} from '@luma.gl/gltf/physics';
import PhysicsApp from '../physics/app';
import {showError} from '../physics/app-ui';

/** Exercise the same scene session used by applications, using the standard glTF PBR renderer. */
export default class AuthoredSceneStress extends PhysicsApp {
  session?: ScenegraphPhysicsSession;
  captured?: ScenegraphPhysicsSessionCapture;
  animationOwns = true;
  holdPose = false;
  stressRunning = false;
  stressCycles = 0;
  private controls?: HTMLElement;
  private operation?: Promise<void>;
  private sceneLoading = false;
  private activeNodes = new Set<ScenegraphNode>();

  constructor(props: AnimationProps) {
    super(props);
    const select = document.querySelector<HTMLSelectElement>('#physics-sample');
    if (select) {
      for (const option of Array.from(select.options))
        if (!['AnimatedPlatform', 'AnimatedScale'].includes(option.value)) option.remove();
      select.add(new Option('Shared assets · 9 mechanisms', 'AuthoredGrid'));
      select.value = 'AuthoredGrid';
    }
    const controls = document.createElement('section');
    controls.className = 'physics-controls';
    controls.innerHTML = `<p>Authored-scene stress lab: animation takeover, paused/seeked poses, release to physics, GPU publication and revision-safe capture/reset.</p>
<div class="gltf-example-toolbar">
<button data-action="ownership">Release animation</button>
<button data-action="hold">Hold pose</button>
<button data-action="seek">Seek +1 s</button>
<button data-action="visibility">Toggle meshes</button>
<button data-action="recook">Recook scene</button>
<button data-action="capture">Capture</button>
<button data-action="restore">Restore</button>
<button data-action="stress">Run stress cycle</button>
</div><p data-status role="status">Preparing scene session…</p>`;
    document.querySelector('#physics-status')?.after(controls);
    controls.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        'button[data-action]'
      );
      if (!button || this.sceneLoading || this.operation || !this.session) return;
      this.operation = Promise.resolve(this.snapshot)
        .then(() => this.act(button.dataset.action!, button))
        .catch(showError)
        .finally(() => {
          this.operation = undefined;
        });
    });
    this.controls = controls;
  }

  protected override getSampleUrl(sample: string): string {
    return sample === 'AuthoredGrid'
      ? new URL('./AuthoredGrid.gltf', import.meta.url).href
      : super.getSampleUrl(sample);
  }

  override async loadGLTF(options: {preserveView?: boolean} = {}): Promise<void> {
    if (this.sceneLoading || this.loading || this.isFinalized) return;
    this.sceneLoading = true;
    this.loading = true;
    try {
      await this.operation;
      await this.snapshot;
      if (this.session) {
        await this.session.destroy();
        this.scenegraphsFromGLTF?.destroy();
        this.scenegraphsFromGLTF = undefined;
        this.session = undefined;
        this.world = undefined;
        this.graph = undefined;
        this.publication = undefined;
      }
      // The initial asynchronous load starts after subclass construction and default selection.
      await Promise.resolve();
      // The parent owns its loading flag; the outer guard covers teardown and session creation.
      this.loading = false;
      await super.loadGLTF(options);
      this.loading = true;
      if (!this.description?.supported || !this.scenegraphsFromGLTF || this.isFinalized) return;
      const rendered = this.scenegraphsFromGLTF;
      const scene = makeGLTFPhysicsScene(
        this.description,
        {
          roots: rendered.scenes,
          nodes: rendered.gltfNodeIndexToNodeMap
        },
        {timeStep: 1 / 120, iterations: 16, publishPoses: true, enableQueries: true}
      );
      const session = await ScenegraphPhysicsSession.create(this.device, scene);
      if (this.isFinalized) {
        await session.destroy();
        return;
      }
      this.graph?.destroy();
      this.world?.destroy();
      this.session = session;
      this.world = session.world;
      this.graph = session.graph;
      this.publication = session.publication;
      this.activeNodes = new Set(
        this.description.animatedBodyIndices.map(
          index => rendered.gltfNodeIndexToNodeMap.get(this.description!.bodies[index].nodeIndex)!
        )
      );
      this.captured = undefined;
      this.simulationTime = 0;
      const details = document.querySelector('#physics-description');
      if (details)
        details.textContent =
          'Shared geometry and collision-shape declarations feed independent bodies. Animation owns the platform poses; physics owns the falling boxes. Capture/restore and reset replace GPU buffers, while recooking replaces scene bindings and preserves dynamic motion.';
      this.updateStatus();
    } catch (error) {
      showError(error);
    } finally {
      this.sceneLoading = false;
      this.loading = false;
    }
  }

  private async act(action: string, button: HTMLButtonElement): Promise<void> {
    const session = this.session!;
    switch (action) {
      case 'ownership':
        this.animationOwns = !this.animationOwns;
        button.textContent = this.animationOwns ? 'Release animation' : 'Take animation control';
        break;
      case 'hold':
        this.holdPose = !this.holdPose;
        button.textContent = this.holdPose ? 'Resume animation' : 'Hold pose';
        break;
      case 'seek':
        this.simulationTime += 1;
        break;
      case 'visibility':
        for (const node of this.bodyModels.keys()) node.display = !node.display;
        session.publication.update();
        break;
      case 'recook': {
        const rendered = this.scenegraphsFromGLTF!;
        const source = snapshotGLTFPhysicsScene(
          this.description!.source,
          rendered.gltfNodeIndexToNodeMap
        );
        const description = parseGLTFPhysics(source, {
          animationOwnership: 'scenegraph',
          propertyBindings: true
        });
        await session.rebuild(async () =>
          makeGLTFPhysicsScene(
            description,
            {roots: rendered.scenes, nodes: rendered.gltfNodeIndexToNodeMap},
            {timeStep: 1 / 120, iterations: 16, publishPoses: true, enableQueries: true}
          )
        );
        this.description = description;
        break;
      }
      case 'capture':
        this.captured = await session.capture();
        break;
      case 'restore':
        if (this.captured) await session.restore(this.captured);
        break;
      case 'stress':
        this.stressRunning = !this.stressRunning;
        button.textContent = this.stressRunning ? 'Stop stress cycle' : 'Run stress cycle';
        break;
    }
    this.synchronize();
  }

  private synchronize() {
    if (!this.session) return;
    if (this.graph !== this.session.graph) this.diagnostics.clear();
    this.world = this.session.world;
    this.graph = this.session.graph;
    this.publication = this.session.publication;
    this.updateStatus();
  }
  private updateStatus() {
    const status = this.controls?.querySelector('[data-status]');
    if (status && this.session)
      status.textContent = `${this.session.world.count} bodies · revision ${this.session.revision} · ${this.stressCycles} reset/restore cycles · GPU poses (no frame readback)`;
  }

  override onRender(props: AnimationProps): void {
    if (this.sceneLoading) return;
    this.synchronize();
    const elapsed =
      this.previousTime === undefined
        ? 0
        : Math.max(0, Math.min((props.time - this.previousTime) / 1000, 0.05));
    if (!this.loading && !this.paused && !this.operation)
      this.accumulator = Math.min(this.accumulator + elapsed, 4 / 120);
    if (
      !this.loading &&
      !this.paused &&
      this.session &&
      !this.operation &&
      !this.snapshot &&
      this.accumulator >= 1 / 120
    ) {
      const session = this.session;
      const steps = Math.min(4, Math.floor(this.accumulator * 120));
      this.snapshot = (async () => {
        for (let step = 0; step < steps && !this.isFinalized; step++) {
          this.accumulator -= 1 / 120;
          if (!this.holdPose) this.simulationTime += 1 / 120;
          await session.step(
            this.animationOwns ? this.activeNodes : new Set(),
            () => {
              if (this.animationOwns)
                this.scenegraphsFromGLTF?.animator.setTime(this.simulationTime * 1000);
            },
            (graph, encoder) => {
              this.diagnostics.encode(graph, encoder, {parameters: undefined});
            }
          );
        }
        if (this.stressRunning && this.simulationTime >= 3) {
          const capture = await session.capture();
          await session.reset();
          await session.restore(capture);
          await session.reset();
          this.simulationTime = 0;
          this.stressCycles++;
        }
        this.synchronize();
      })()
        .catch(error => {
          this.paused = true;
          showError(error);
        })
        .finally(() => {
          this.snapshot = undefined;
        });
    }
    const paused = this.paused;
    this.paused = true;
    super.onRender(props);
    this.paused = paused;
  }

  override onFinalize(): void {
    const session = this.session;
    this.session = undefined;
    this.graph = undefined;
    this.world = undefined;
    super.onFinalize();
    void this.snapshot?.finally(() => session?.destroy());
    if (!this.snapshot) void session?.destroy();
    this.controls?.remove();
  }
}
