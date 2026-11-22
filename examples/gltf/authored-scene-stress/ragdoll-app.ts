// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {log} from '@luma.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {
  AnimationLoopTemplate,
  ModelNode,
  OrbitControls,
  type ScenegraphNode,
  type AnimationProps
} from '@luma.gl/engine';
import {
  createComposedScenegraphsFromGLTF,
  type GLTFSceneComposition,
  type GLTFSceneInstance
} from '@luma.gl/engine/gltf';
import {makeGLTFPhysicsScene, parseGLTFPhysics} from '@luma.gl/engine/gltf-physics';
import {ScenegraphPhysicsSession, ScenegraphRagdoll} from '@luma.gl/engine/physics';
import {Matrix4} from '@math.gl/core/matrix';
import type {LightingProps} from '@luma.gl/shaders';

/** Fixed simulation rate with one animated sample per accepted step. */
const TIMESTEP = 1 / 60;
/** Resolve the entrypoint and its file reference in both Vite dev and hashed production builds. */
const THEATER = new URL('./assets/puppet-theater/theater.gltf', import.meta.url);
/** Bundler URL for the shared puppet file. */
const MARIONETTE = new URL('./assets/puppet-theater/marionette.gltf', import.meta.url);
/** Unbundled URI as resolved by the glTF file loader. */
const RELATIVE_MARIONETTE = new URL('marionette.gltf', THEATER);

/** Warm stage key and cool, low-intensity rim light illuminate the glTF PBR materials. */
const LIGHTING = {
  ambientLight: {type: 'ambient', color: [195, 207, 232], intensity: 0.5},
  directionalLights: [
    {type: 'directional', color: [255, 222, 173], direction: [-0.4, -0.7, -0.6], intensity: 2.45},
    {type: 'directional', color: [172, 210, 255], direction: [0.67, -0.25, 0.4], intensity: 0.8}
  ]
} as const satisfies LightingProps;

/** State owned by one independent puppet, even when its decoded file is shared. */
type Puppet = {
  instance: GLTFSceneInstance;
  session: ScenegraphPhysicsSession;
  ragdoll: ScenegraphRagdoll;
  animatedNodes: ReadonlySet<ScenegraphNode>;
  skin: import('@luma.gl/engine').SkinBinding;
  /** The string geometry follows the authored rig until release. */
  strings: {
    node: ScenegraphNode;
    bone: ScenegraphNode;
    height: number;
  }[];
  button: HTMLButtonElement;
  released: boolean;
  resetting: boolean;
  animationTime: number;
};

/** A skinned glTF puppet that changes pose ownership without leaving the scenegraph. */
export default class MarionetteTheater extends AnimationLoopTemplate {
  /** Example description used by the gallery info box. */
  static info =
    '<p>Two instances of one glTF puppet. Release a puppet to see GPU joints and skinning take over while its partner keeps dancing.</p>';
  /** Owned asset instances and scenegraph resources. */
  private composition?: GLTFSceneComposition;
  /** Independently timed puppet and physics instances. */
  private readonly puppets: Puppet[] = [];
  /** Orbit input scoped to this canvas. */
  private controls?: OrbitControls;
  /** Owned theater controls attached to the viewport. */
  private panel?: HTMLElement;
  /** Accessible playback and physics ownership summary. */
  private status?: HTMLElement;
  /** Prevents pending initialization from reviving a closed viewport. */
  private finalized = false;
  /** An instance may still be borrowing composition nodes while its world compiles. */
  private pendingPuppet?: Promise<void>;
  /** One disposal transaction is shared by teardown and initialization failure. */
  private disposal?: Promise<void>;
  /** Previous frame timestamp in milliseconds. */
  private previousTime?: number;
  /** Unconsumed wall time for fixed simulation steps. */
  private accumulatedTime = 0;

  /** Load a composed glTF and prepare each puppet's shared engine bindings. */
  override async onInitialize({device, canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error('The theater needs a browser canvas');
    this.controls = new OrbitControls(canvas, {
      target: [0, 1.29, 0],
      distance: 7.5,
      yaw: 0.13,
      pitch: 0.16,
      minDistance: 4.2,
      maxDistance: 12,
      rotateSpeed: 0.009,
      zoomSpeed: 0.0015
    });
    /** Attach the controls to this example's viewport. */
    const panel = document.createElement('section');
    panel.className = 'marionette-panel';
    panel.style.cssText =
      'position:absolute;bottom:clamp(12px,3vw,28px);left:50%;transform:translateX(-50%);width:min(470px,calc(100% - 28px));box-sizing:border-box;padding:15px 18px;background:#171519ee;border:1px solid #886448;border-radius:12px;color:#f7e3c4;box-shadow:0 6px 28px #0009;font:14px system-ui;text-align:center;z-index:2';
    panel.innerHTML =
      '<h2 style="font:600 clamp(18px,4vw,24px) Georgia,serif;margin:0 0 6px">Marionette Theater</h2><div data-puppets style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap"></div><div data-status role="status" style="margin-top:9px;color:#d8bc9c">Preparing the stage…</div>';
    canvas.parentElement?.append(panel);
    this.panel = panel;
    this.status = panel.querySelector<HTMLElement>('[data-status]')!;

    try {
      /** The loader resolves the draft's nested files before the engine instantiates them. */
      const source = await load(THEATER.href, GLTFLoader, {
        gltf: {loadExternalAssets: true},
        core: {
          fetch: (url: string, init?: RequestInit) =>
            fetch(url === RELATIVE_MARIONETTE.href ? MARIONETTE.href : url, init)
        }
      });
      if (this.finalized) return;
      this.composition = createComposedScenegraphsFromGLTF(device, source, {
        storageSkinPalettes: true
      });
      for (const instance of this.composition.instances) {
        if (!instance.mount) continue;
        this.pendingPuppet = this.addPuppet(device, instance);
        try {
          await this.pendingPuppet;
        } finally {
          this.pendingPuppet = undefined;
        }
        if (this.finalized) return;
      }
    } catch (error) {
      await this.dispose();
      throw error;
    }
    this.updateStatus();
  }

  /** Bind frozen collider dimensions and authored joint attachments to each instance's own world. */
  private async addPuppet(
    device: AnimationProps['device'],
    instance: GLTFSceneInstance
  ): Promise<void> {
    /** The loader and runtime share node identities through the document-local node map. */
    const {scenegraphs, scene, source} = instance;
    /** Prepare the standing dynamic rig before the theater's animation claims it. */
    const description = parseGLTFPhysics(source.json, {
      animationOwnership: 'scenegraph',
      preserveAnimatedBodyModes: true
    });
    if (!description.supported) throw new Error(JSON.stringify(description.issues));
    /** Both animation and physics target the imported skin's palette. */
    const skin = scenegraphs.skins.bindings[0];
    /** The root bone claims its complete subtree while the clip is playing. */
    const animatedNodes = new Set([skin.joints[0]]);
    /** Playback takes temporary ownership of the dynamic rig. */
    const rig = makeGLTFPhysicsScene(
      description,
      {roots: [scene], nodes: scenegraphs.gltfNodeIndexToNodeMap},
      {
        solver: 'ordered',
        timeStep: TIMESTEP,
        iterations: 24
      }
    );
    /** Each cord attaches to a rig node and stays inside this document's scene space. */
    const strings = [
      {node: scene.findNode('Left string')!, bone: scene.findNode('Left elbow')!, height: -0.34},
      {node: scene.findNode('Center string')!, bone: scene.findNode('Head')!, height: 0.55},
      {node: scene.findNode('Right string')!, bone: scene.findNode('Right elbow')!, height: -0.34}
    ];
    // Keep rest-state strings hidden until their animator has placed them.
    for (const {node} of strings) node.display = false;
    /** Borrow this asset instance's nodes into an independent physics world. */
    const session = await ScenegraphPhysicsSession.create(device, rig);
    if (this.finalized) {
      await session.destroy();
      return;
    }
    /** The skin and storage palette are owned by the scene composition. */
    let ragdoll: ScenegraphRagdoll;
    try {
      ragdoll = new ScenegraphRagdoll(device, scenegraphs.skins, skin);
    } catch (error) {
      await session.destroy();
      throw error;
    }
    /** Independently color the second instance's enamel through the imported PBR material. */
    if (instance.mount!.id === 'Copper') {
      scenegraphs.materials[0].setProps({pbrMaterial: {baseColorFactor: [0.42, 0.13, 0.065, 1]}});
    }
    /** One release/reset control owns this instance only. */
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText =
      'min-width:128px;background:#2a3939;color:#f7e3c4;border:1px solid #826644;border-radius:6px;padding:8px 12px;font:600 13px system-ui;cursor:pointer';
    button.textContent = `Release ${instance.mount!.id}`;
    button.dataset['puppet'] = instance.mount!.id;
    /** Track mode transitions and playback time with this instance. */
    const puppet: Puppet = {
      instance,
      session,
      ragdoll,
      skin,
      strings,
      animatedNodes,
      button,
      released: false,
      resetting: false,
      animationTime: this.puppets.length * 790
    };
    button.onclick = () => {
      if (puppet.released) {
        puppet.resetting = true;
        button.disabled = true;
        void this.resetPuppet(puppet)
          .catch(error => {
            if (this.status) this.status.textContent = String(error);
          })
          .finally(() => {
            puppet.resetting = false;
            button.disabled = false;
          });
      } else {
        puppet.released = true;
        for (const {node} of puppet.strings) node.display = false;
        button.textContent = `Reset ${instance.mount!.id}`;
        this.updateStatus();
      }
    };
    this.panel!.querySelector('[data-puppets]')!.append(button);
    this.puppets.push(puppet);
  }

  /** Reset one world and resume its clip without changing the other instance. */
  private async resetPuppet(puppet: Puppet): Promise<void> {
    await puppet.session.reset();
    if (this.finalized) return;
    puppet.ragdoll.reset();
    puppet.released = false;
    puppet.instance.scenegraphs.animator.setTime(puppet.animationTime);
    this.updateStrings(puppet);
    puppet.button.textContent = `Release ${puppet.instance.mount!.id}`;
    this.updateStatus();
  }

  /** Reflect the independent ownership state of each puppet in the controls. */
  private updateStatus(): void {
    if (!this.status) return;
    this.status.textContent = this.puppets
      .map(
        puppet => `${puppet.instance.mount!.id} · ${puppet.released ? 'GPU ragdoll' : 'Dancing'}`
      )
      .join('  |  ');
    this.status.dataset['ready'] = String(this.puppets.length === 2);
  }

  /** Update authored cord geometry from the animated joints. */
  private updateStrings(puppet: Puppet): void {
    puppet.instance.scene.preorderTraversal((bone, {worldMatrix}) => {
      /** Only three marked attachment bones drive the theater props. */
      const string = puppet.strings.find(candidate => candidate.bone === bone);
      if (!string) return;
      /** A cord extends from the attachment to the gantry above the puppets. */
      const bottom = new Matrix4(worldMatrix).transformAsPoint([0, string.height, 0]);
      string.node.display = true;
      string.node.setMatrix(
        new Matrix4()
          .translate([bottom[0], (3.22 + bottom[1]) / 2, bottom[2]])
          .scale([1, Math.max(0.001, 3.22 - bottom[1]), 1])
      );
    });
  }

  /** Sample kinematics at fixed steps and render with the standard PBR skin path. */
  override onRender({device, aspect, time}: AnimationProps): void {
    if (this.finalized || !this.composition || !this.controls) return;
    this.accumulatedTime += Math.min(Math.max((time - (this.previousTime ?? time)) / 1000, 0), 0.1);
    this.previousTime = time;
    /** Submit each fixed step before writing kinematic targets for the next step. */
    for (let step = 0; step < 3 && this.accumulatedTime >= TIMESTEP; step++) {
      this.accumulatedTime -= TIMESTEP;
      /** Keep physics publication and palette generation ordered in one submission. */
      const encoder = device.createCommandEncoder({id: 'marionette-fixed-step'});
      for (const puppet of this.puppets) {
        if (puppet.resetting) continue;
        if (!puppet.released) {
          puppet.animationTime += TIMESTEP * 1000;
          puppet.instance.scenegraphs.animator.setTime(puppet.animationTime);
          this.updateStrings(puppet);
        }
        puppet.session.encode(encoder, {
          animatedNodes: puppet.released ? undefined : puppet.animatedNodes
        });
        if (puppet.released) {
          // Both mesh and simulated bodies are expressed in the external instance's local world.
          puppet.ragdoll.encode(encoder, puppet.session.publication, puppet.skin.node.matrix);
        }
      }
      device.submit(encoder.finish());
    }
    this.accumulatedTime = Math.min(this.accumulatedTime, TIMESTEP);

    this.controls.update(time);
    /** Camera position supplies the PBR view direction. */
    const eye = this.controls.getEyePosition();
    /** Shared camera transform for the combined scenegraph. */
    const viewProjection = new Matrix4()
      .perspective({fovy: Math.PI / 3.9, aspect, near: 0.05, far: 40})
      .multiplyRight(new Matrix4().lookAt({eye, center: [0, 1.29, 0]}));
    /** Draw the set and characters into one presentation pass. */
    const pass = device.beginRenderPass({clearColor: [0.033, 0.025, 0.027, 1], clearDepth: 1});
    this.composition.root.scene.traverse((node, {worldMatrix}) => {
      if (!(node instanceof ModelNode)) return;
      node.model.shaderInputs.setProps({
        lighting: LIGHTING,
        pbrProjection: {
          camera: eye,
          modelMatrix: worldMatrix,
          modelViewProjectionMatrix: new Matrix4(viewProjection).multiplyRight(worldMatrix),
          normalMatrix: new Matrix4(worldMatrix).invert().transpose()
        }
      });
      node.draw(pass);
    });
    pass.end();
  }

  /** Stop frame work immediately and release the borrowed scene after pending resets settle. */
  override onFinalize(): void {
    void this.dispose().catch(error => log.error(error)());
  }

  /** Dispose each borrowing session before destroying the composition's owned scenegraph. */
  private dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.finalized = true;
    this.controls?.destroy();
    this.panel?.remove();
    this.disposal = (async () => {
      try {
        await this.pendingPuppet;
      } catch {
        // Initialization reports its own error after this shared cleanup finishes.
      }
      /** Take the instances only after any pending initializer has settled. */
      const puppets = this.puppets.splice(0);
      for (const puppet of puppets) puppet.ragdoll.destroy();
      /** Await every reset or outstanding session operation before freeing scene resources. */
      const results = await Promise.allSettled(puppets.map(puppet => puppet.session.destroy()));
      this.composition?.destroy();
      this.composition = undefined;
      for (const result of results) if (result.status === 'rejected') throw result.reason;
    })();
    return this.disposal;
  }
}
