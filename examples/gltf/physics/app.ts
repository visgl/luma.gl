// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  AnimationLoopTemplate,
  AnimationProps,
  ModelNode,
  OrbitControls,
  Interactivity,
  type InteractivityDefinition
} from '@luma.gl/engine';
import {Device, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@luma.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {Light, LightingProps} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {
  createGLTFPhysicsWorld,
  makeGLTFPhysicsBehaviors,
  makeGLTFPhysicsProperties,
  parseGLTFPhysics,
  makeGLTFPhysicsMeshResolver,
  type GLTFPhysicsDescription
} from '@luma.gl/gltf/physics';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {ScenegraphPhysicsMotion, type GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import type {ScenegraphNode} from '@luma.gl/engine';
import {INFO_HTML, showError, showSampleDescription, createPhysicsPanels} from './app-ui';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {makeLegacyMeshGeometryResolver} from './legacy-mesh-positions';

const SAMPLE_REVISION = '9dc61cb3474ff9a51f58d3592f79d5c9e572056a';
const SAMPLE_BASE_URL = `https://raw.githubusercontent.com/eoineoineoin/glTF_Physics/${SAMPLE_REVISION}/samples`;
const LOCAL_SAMPLES: Record<string, string> = {
  AnimatedScale: new URL('./assets/AnimatedScale.gltf', import.meta.url).href,
  AnimatedPlatform: new URL('./assets/AnimatedPlatform.gltf', import.meta.url).href,
  JointPendulum: new URL('./assets/JointPendulum.gltf', import.meta.url).href,
  DrivenHinge: new URL('./assets/DrivenHinge.gltf', import.meta.url).href,
  TriggerVolume: new URL('./assets/TriggerVolume.gltf', import.meta.url).href
};
const MAX_CAMERA_TILT = 0.6;

const lightSources = {
  ambientLight: {
    color: [255, 255, 255],
    intensity: 0.5,
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

  readonly diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
  readonly panels: ReturnType<typeof createPhysicsPanels>;
  device: Device;
  orbitControls: OrbitControls;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  isFinalized = false;
  description?: GLTFPhysicsDescription;
  world?: GPURigidBodyWorld;
  motion?: ScenegraphPhysicsMotion;
  behavior?: Interactivity;
  behaviorPhysics?: ReturnType<typeof makeGLTFPhysicsBehaviors>;
  simulationTime = 0;
  hasPhysicsAnimation = false;
  graph?: CompiledGPUCommandGraph<void>;
  snapshot?: Promise<void>;
  loading = false;
  loadedSample?: string;
  paused = false;
  previousTime?: number;
  accumulator = 0;
  bodyModels = new Map<ScenegraphNode, number>();
  bodyInverseMatrices: Matrix4[] = [];
  cleanupControls?: () => void;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.panels = createPhysicsPanels(this.diagnostics);

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.orbitControls = new OrbitControls(canvas, {
      distance: 2,
      yaw: Math.PI / 4,
      pitch: 0.35,
      minDistance: 0.05,
      maxDistance: 40,
      minPitch: -MAX_CAMERA_TILT,
      maxPitch: MAX_CAMERA_TILT,
      rotateSpeed: 0.01,
      zoomSpeed: 0.0015
    });

    const sample = document.querySelector<HTMLSelectElement>('#physics-sample');
    const previous = document.querySelector<HTMLButtonElement>('#physics-previous');
    const next = document.querySelector<HTMLButtonElement>('#physics-next');
    const reset = document.querySelector<HTMLButtonElement>('#physics-reset');
    const pause = document.querySelector<HTMLButtonElement>('#physics-pause');
    const reload = () => {
      void this.loadGLTF();
    };
    const resetScene = () => {
      void this.loadGLTF({preserveView: true});
    };
    const selectNeighbor = (offset: number) => {
      if (!sample || this.loading) return;
      sample.selectedIndex =
        (sample.selectedIndex + offset + sample.options.length) % sample.options.length;
      reload();
    };
    const selectPrevious = () => selectNeighbor(-1);
    const selectNext = () => selectNeighbor(1);
    previous?.addEventListener('click', selectPrevious);
    next?.addEventListener('click', selectNext);
    const togglePause = () => {
      this.paused = !this.paused;
      if (pause) pause.textContent = this.paused ? 'Resume' : 'Pause';
    };
    sample?.addEventListener('change', reload);
    reset?.addEventListener('click', resetScene);
    pause?.addEventListener('click', togglePause);
    this.cleanupControls = () => {
      previous?.removeEventListener('click', selectPrevious);
      next?.removeEventListener('click', selectNext);
      sample?.removeEventListener('change', reload);
      reset?.removeEventListener('click', resetScene);
      pause?.removeEventListener('click', togglePause);
    };
    reload();
  }

  onFinalize(): void {
    this.isFinalized = true;
    this.orbitControls.destroy();
    this.cleanupControls?.();
    this.panels.finalize();
    const graph = this.graph;
    const world = this.world;
    const scene = this.scenegraphsFromGLTF;
    const destroy = () => {
      graph?.destroy();
      world?.destroy();
      destroyScenegraphs(scene);
    };
    if (this.snapshot) void this.snapshot.finally(destroy);
    else destroy();

    this.scenegraphsFromGLTF = undefined;
    this.modelLights = [];
  }

  getClearColor(): [number, number, number, number] {
    return [0.95, 0.95, 0.97, 1];
  }

  async loadGLTF({preserveView = false}: {preserveView?: boolean} = {}): Promise<void> {
    if (this.loading || this.isFinalized) return;
    this.loading = true;
    this.previousTime = undefined;
    const controls = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('[data-physics-control]')
    );
    controls.forEach(control => {
      control.disabled = true;
    });
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    const sample =
      document.querySelector<HTMLSelectElement>('#physics-sample')?.value || 'MotionProperties';
    const modelUrl = LOCAL_SAMPLES[sample] ?? `${SAMPLE_BASE_URL}/${sample}/${sample}.glb`;
    showSampleDescription(sample);
    let replacementWorld: GPURigidBodyWorld | undefined;
    let replacementGraph: CompiledGPUCommandGraph<void> | undefined;
    let replacementScene: ReturnType<typeof createScenegraphsFromGLTF> | undefined;
    try {
      log.log(0, 'Loading glTF physics sample', {modelUrl})();
      showError();
      canvas.style.opacity = '0.2';

      await this.snapshot;
      const gltf = await load(modelUrl, GLTFLoader);
      if (this.isFinalized) return;
      const physicsScenegraph = new GLTFScenegraph(gltf);
      const description = parseGLTFPhysics(gltf.json, {
        animationOwnership: 'scenegraph',
        propertyBindings: true,
        resolveNodeMeshGeometry: makeGLTFPhysicsMeshResolver(physicsScenegraph),
        resolveLegacyMeshGeometry: makeLegacyMeshGeometryResolver(physicsScenegraph)
      });
      if (description.supported) {
        replacementWorld = createGLTFPhysicsWorld(description, {
          timeStep: 1 / 120,
          iterations: 16,
          publishPoses: true,
          enableQueries: Boolean(gltf.json.extensions?.KHR_interactivity)
        });
        const definition = new GPUCommandGraph(this.device);
        replacementWorld.addToGraph(definition);
        replacementGraph = await definition.compileAsync();
      }
      if (this.isFinalized) return;
      const physicsProperties = replacementWorld
        ? makeGLTFPhysicsProperties(replacementWorld, description)
        : undefined;
      const processedGLTF = postProcessGLTF(gltf);
      const scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        properties: physicsProperties,
        publishedTransforms: replacementWorld?.poseMatrices ?? undefined,
        lights: true,
        pbrDebug: false,
        useTangents: true
      });
      replacementScene = scenegraphsFromGLTF;
      this.hasPhysicsAnimation = scenegraphsFromGLTF.animations.some(animation =>
        animation.channels.some(channel => channel.type === 'property')
      );

      if (this.isFinalized) {
        return;
      }

      this.diagnostics.clear();
      this.graph?.destroy();
      this.world?.destroy();
      this.graph = replacementGraph;
      this.world = replacementWorld;
      this.description = description;
      replacementGraph = undefined;
      replacementWorld = undefined;
      replacementScene = undefined;
      this.accumulator = 0;
      this.simulationTime = 0;
      this.paused = false;
      const pause = document.querySelector<HTMLButtonElement>('#physics-pause');
      if (pause) pause.textContent = 'Pause';
      this.bodyModels.clear();
      this.bodyInverseMatrices = description.bodies.map(body =>
        new Matrix4()
          .translate(body.body.position)
          .multiplyRight(new Matrix4().fromQuaternion(body.body.orientation ?? [0, 0, 0, 1]))
          .invert()
      );
      for (const body of description.bodies) {
        scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(body.nodeIndex)?.traverse(node => {
          this.bodyModels.set(node, body.bodyIndex);
        });
      }
      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      const targets = new Map<ScenegraphNode, number>();
      for (const bodyIndex of description.animatedBodyIndices) {
        const node = scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(
          description.bodies[bodyIndex].nodeIndex
        );
        if (node) targets.set(node, bodyIndex);
      }
      const colliderTargets = description.animatedColliderIndices.map(index => {
        const collider = description.colliders[index];
        return {
          node: scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(collider.nodeIndex)!,
          index,
          body: scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(
            description.bodies[collider.bodyIndex].nodeIndex
          )!,
          localMatrix: collider.localMatrix
        };
      });
      this.motion =
        this.world && (targets.size || colliderTargets.length)
          ? new ScenegraphPhysicsMotion(
              this.world,
              scenegraphsFromGLTF.scenes,
              targets,
              colliderTargets
            )
          : undefined;

      this.behavior = undefined;
      this.behaviorPhysics = undefined;
      const behaviorStatus = document.querySelector('#physics-behavior');
      if (behaviorStatus) behaviorStatus.textContent = '';
      const behaviorDefinition = gltf.json.extensions?.KHR_interactivity as
        | InteractivityDefinition
        | undefined;
      if (this.world && behaviorDefinition) {
        this.behaviorPhysics = makeGLTFPhysicsBehaviors(
          this.world,
          description,
          scenegraphsFromGLTF
        );
        this.behavior = new Interactivity(behaviorDefinition, {
          physics: this.behaviorPhysics,
          properties: physicsProperties,
          onEvent: (event, values) => {
            if (behaviorStatus)
              behaviorStatus.textContent = `${event} · collider ${values.collider?.[0] ?? '—'}`;
          }
        });
        this.behavior.start();
        await this.behavior.flushPhysics();
      }

      // Authored glTF point/spot intensities need inverse-square distance falloff.
      this.modelLights = scenegraphsFromGLTF.lights.map(light =>
        light.type === 'point' || light.type === 'spot'
          ? {...light, attenuation: [0, 0, 1] as const}
          : light
      );
      if (this.modelLights.length > 0) {
        // Soft fill keeps the shaded faces readable while preserving authored light falloff.
        this.modelLights.push(
          lightSources.ambientLight,
          ...lightSources.directionalLights.map(light => ({
            ...light,
            intensity: light.intensity * 0.3
          }))
        );
      }

      const sceneBounds = scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.sceneRadius = sceneBounds.radius;
      if (!preserveView || this.loadedSample !== sample) {
        this.center = [...sceneBounds.center];
        this.center[1] =
          (description.bodies.find(body => body.body.mass === 0)?.body.position?.[1] || 0) +
          Math.min(this.sceneRadius * 0.15, 1.5);
        this.cameraHeight = this.center[1];
        this.orbitControls.setProps({
          target: [this.center[0], this.cameraHeight, this.center[2]],
          distance: sceneBounds.recommendedOrbitDistance,
          minDistance: Math.max(this.sceneRadius * 0.08, 0.025),
          maxDistance: Math.max(this.sceneRadius * 32, 12)
        });
      }
      canvas.style.opacity = '1';
      showError(
        description.supported
          ? undefined
          : 'Static preview: ' +
              description.issues
                .map(issue => issue.message)
                .filter((message, index, messages) => messages.indexOf(message) === index)
                .join('; ')
      );
      const status = document.querySelector('#physics-status');
      if (status)
        status.textContent = description.supported
          ? `${description.bodies.length} bodies · GPU simulation · 120 Hz fixed steps`
          : 'Static preview · unsupported physics features';
      this.loadedSample = sample;
    } catch (error) {
      if (this.isFinalized) {
        return;
      }

      log.error('Failed to load glTF physics sample', error)();
      canvas.style.opacity = '1';
      showError(error);
    } finally {
      replacementGraph?.destroy();
      replacementWorld?.destroy();
      destroyScenegraphs(replacementScene);
      this.loading = false;
      controls.forEach(control => {
        control.disabled = control.id === 'physics-pause' && !this.world;
      });
    }
  }

  private async advanceInteractive(steps: number): Promise<void> {
    const behavior = this.behavior!;
    const bridge = this.behaviorPhysics!;
    const graph = this.graph!;
    for (let step = 0; step < steps && !this.isFinalized; step++) {
      this.simulationTime += 1 / 120;
      this.scenegraphsFromGLTF!.animator.setTime(this.simulationTime * 1000);
      this.motion?.update();
      for (const [bodyIndex, inverse] of this.motion?.inverseBodyFrames ?? [])
        this.bodyInverseMatrices[bodyIndex] = inverse;
      behavior.tick(this.simulationTime);
      await behavior.flushPhysics();
      if (this.isFinalized) return;
      const encoder = this.device.createCommandEncoder();
      this.diagnostics.encode(graph, encoder, {parameters: undefined});
      this.device.submit(encoder.finish());
      const fence = this.device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      await bridge.dispatchTriggers(behavior);
      this.accumulator -= 1 / 120;
    }
  }

  onRender({aspect, device, time}: AnimationProps): void {
    const elapsed =
      this.previousTime === undefined
        ? 0
        : Math.max(0, Math.min((time - this.previousTime) / 1000, 0.05));
    this.previousTime = time;
    if (!this.loading && !this.paused && this.graph && this.world) {
      this.accumulator = Math.min(this.accumulator + elapsed, 4 / 120);
      // Keep at most one simulation submission awaiting publication. A slow GPU must
      // not accumulate seconds of queued physics while rendering continues.
      if (this.accumulator >= 1 / 120 && !this.snapshot) {
        if (this.behavior) {
          this.snapshot = this.advanceInteractive(Math.min(4, Math.floor(this.accumulator * 120)))
            .catch(error => {
              this.paused = true;
              showError(error);
            })
            .finally(() => {
              this.snapshot = undefined;
            });
        } else {
          let encoder = device.createCommandEncoder();
          while (this.accumulator >= 1 / 120) {
            this.simulationTime += 1 / 120;
            this.scenegraphsFromGLTF?.animator.setTime(this.simulationTime * 1000);
            this.motion?.update();
            for (const [bodyIndex, inverse] of this.motion?.inverseBodyFrames ?? [])
              this.bodyInverseMatrices[bodyIndex] = inverse;
            this.diagnostics.encode(this.graph, encoder, {parameters: undefined});
            if (this.motion || this.hasPhysicsAnimation) {
              device.submit(encoder.finish());
              encoder = device.createCommandEncoder();
            }
            this.accumulator -= 1 / 120;
          }
          device.submit(encoder.finish());
          if (!this.snapshot) {
            const fence = device.createFence();
            this.snapshot = fence.signaled
              .catch(error => {
                this.paused = true;
                showError(error);
              })
              .finally(() => {
                fence.destroy();
                this.snapshot = undefined;
              });
          }
        }
      }
    }
    const renderPass = device.beginRenderPass({clearColor: this.getClearColor(), clearDepth: 1});

    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      renderPass.end();
      return;
    }

    this.orbitControls.update(time);

    const orbitDistance = this.orbitControls.distance;
    const far = Math.max(orbitDistance + this.sceneRadius * 8, 10);
    const near = Math.max(this.sceneRadius / 1000, 0.01);
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraPos = this.orbitControls.getEyePosition();
    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});
    const lighting = this.modelLights.length > 0 ? {lights: this.modelLights} : lightSources;

    this.scenegraphsFromGLTF.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
      const {model} = node as ModelNode;
      const bodyIndex = this.bodyModels.get(node);
      if (bodyIndex !== undefined)
        modelMatrix = new Matrix4(this.bodyInverseMatrices[bodyIndex]).multiplyRight(modelMatrix);
      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      if (this.world?.poseMatrices)
        model.shaderInputs.setProps({
          publishedTransforms: {
            bodyIndex: bodyIndex ?? -1,
            viewProjection: new Matrix4(projectionMatrix).multiplyRight(viewMatrix)
          }
        });
      model.shaderInputs.setProps({
        lighting,
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
      model.draw(renderPass);
    });

    renderPass.end();
  }
}

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  scenegraphsFromGLTF?.destroy();
}
