// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device} from '@luma.gl/core';
import {
  CubeGeometry,
  CylinderGeometry,
  GroupNode,
  SphereGeometry,
  TruncatedConeGeometry,
  type Geometry
} from '@luma.gl/engine';
import {SceneMeshNode, SceneRenderer, type SceneMaterial} from '@luma.gl/anari';
import {Matrix4, Quaternion} from '@math.gl/core/matrix';
import type {GPUSphereBodyState} from '@luma.gl/graph/gpu-physics';
import {BALL_RADIUS, POCKETS, TABLE_PLANES} from './table';

/** World-space vector or linear RGB triplet. */
type Vector = [number, number, number];
/** Length of the cue mesh before scaling to table units. */
const CUE_LENGTH = 3.4;
/** Convert a 58-inch cue to the length of the seven-foot playfield. */
const PLAYING_CUE_SCALE = (12 * 58) / (84 * CUE_LENGTH);
/** Convert the butt diameter to 1¼ inches at the playfield scale. */
const CUE_WIDTH_SCALE = (12 * 1.25) / (84 * 2 * 0.103);
/** Shared unit box for table surfaces and sights. */
const BOX = new CubeGeometry();
/** Shared capped cylinder with its axis normal to the cloth. */
const DISK = new CylinderGeometry({verticalAxis: 'z', nradial: 48, topCap: true});
/** Shared UV sphere for the numbered ball textures. */
const BALL = new SphereGeometry({nlat: 28, nlong: 48});

/** Describe an engine PBR surface with optional lacquer and metalness. */
function surface(
  id: string,
  color: Vector,
  roughness: number,
  metalness = 0,
  coat = 0
): SceneMaterial {
  return {
    id,
    uniforms: {
      baseColorFactor: [...color, 1],
      metallicRoughnessValues: [metalness, roughness],
      clearcoatFactor: coat,
      clearcoatRoughnessFactor: 0.15
    }
  };
}

/** Add a retained PBR mesh using its authored local matrix. */
function addMesh(
  root: GroupNode,
  id: string,
  geometry: Geometry,
  material: SceneMaterial,
  matrix: Matrix4
) {
  const node = new SceneMeshNode({id, geometry, material, matrix});
  root.add(node);
  return node;
}

/** Place a unit box scaled to the requested half extents. */
function addBox(
  root: GroupNode,
  id: string,
  material: SceneMaterial,
  position: Vector,
  halfExtents: Vector,
  angle = 0
) {
  return addMesh(
    root,
    id,
    BOX,
    material,
    new Matrix4().translate(position).rotateZ(angle).scale(halfExtents)
  );
}

/** Build the apron, rails, cushion jaws and pockets around the physics playfield. */
function addTable(root: GroupNode, woodTexture: Texture) {
  const cloth = surface('cloth', [0.022, 0.21, 0.135], 0.96);
  const cushion = surface('cushion', [0.015, 0.125, 0.075], 0.84);
  const wood = surface('walnut', [0.23, 0.083, 0.032], 0.31, 0, 0.65);
  wood.bindings = {pbr_baseColorSampler: woodTexture};
  const brass = surface('brass', [0.64, 0.39, 0.13], 0.29, 0.77);
  const leather = surface('leather', [0.052, 0.026, 0.013], 0.88);
  const pocket = surface('pocket', [0.004, 0.003, 0.002], 1);
  addBox(root, 'apron', wood, [0, 0, -0.2], [6.69, 3.69, 0.14]);
  addBox(root, 'slate', cloth, [0, 0, -0.15], [6.02, 3.02, 0.15]);
  for (const [index, rail] of TABLE_PLANES.slice(1).entries()) {
    const [horizontalPosition, verticalPosition] = rail.center!;
    const [normalX, normalY] = rail.normal!;
    const angle = Math.atan2(-normalX, normalY);
    addBox(
      root,
      `cushion-${index}`,
      cushion,
      [
        horizontalPosition + Math.sin(angle) * 0.12,
        verticalPosition - Math.cos(angle) * 0.12,
        0.052
      ],
      [rail.halfExtents![1], 0.12, 0.11],
      angle
    );
  }
  for (const side of [-1, 1]) {
    for (const half of [-1, 1]) {
      addBox(
        root,
        `long-rail-${side}-${half}`,
        wood,
        [half * 3, side * 3.45, -0.015],
        [2.57, 0.24, 0.24]
      );
      for (const sight of [1.5, 3, 4.5]) {
        addBox(
          root,
          `long-sight-${side}-${half}-${sight}`,
          brass,
          [half * sight, side * 3.46, 0.228],
          [0.043, 0.043, 0.004],
          Math.PI / 4
        );
      }
    }
    addBox(root, `end-rail-${side}`, wood, [side * 6.45, 0, -0.015], [0.24, 2.6, 0.24]);
    for (const sight of [-1.5, 0, 1.5]) {
      addBox(
        root,
        `end-sight-${side}-${sight}`,
        brass,
        [side * 6.46, sight, 0.228],
        [0.043, 0.043, 0.004],
        Math.PI / 4
      );
    }
  }
  for (const [index, [horizontalPosition, verticalPosition]] of POCKETS.entries()) {
    addMesh(
      root,
      `pocket-rim-${index}`,
      DISK,
      leather,
      new Matrix4().translate([horizontalPosition, verticalPosition, 0.08]).scale([0.47, 0.47, 0.2])
    );
    addMesh(
      root,
      `pocket-well-${index}`,
      DISK,
      pocket,
      new Matrix4()
        .translate([horizontalPosition, verticalPosition, 0.182])
        .scale([0.38, 0.38, 0.025])
    );
  }
  const spot = surface('spot', [0.41, 0.49, 0.4], 0.95);
  for (const horizontalPosition of [-3, 2]) {
    addMesh(
      root,
      `spot-${horizontalPosition}`,
      DISK,
      spot,
      new Matrix4().translate([horizontalPosition, 0, 0.001]).scale([0.031, 0.031, 0.003])
    );
  }
}

/** Trilinear filtering for surfaces viewed at grazing angles. */
const FILTERED_SURFACE = {
  usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER,
  sampler: {magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', maxAnisotropy: 8}
} as const;

/** Lined hardwood albedo and a woven normal map for the grip. */
/** Build hardwood albedo and a woven normal map for the grip. */
function makeSurfaceTextures(device: Device) {
  const size = 128;
  const wood = new Uint8Array(size * size * 4);
  const weave = new Uint8Array(wood.length);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const index = (row * size + column) * 4;
      const grain =
        Math.sin(row * 0.92 + 1.6 * Math.sin(column * 0.07)) * 21 +
        Math.sin(row * 0.29 + Math.sin(column * 0.11)) * 17;
      wood.set([216 + grain, 210 + grain, 196 + grain, 255], index);
      weave.set(
        [
          128 + 11 * Math.sin((column * Math.PI) / 4) * Math.cos((row * Math.PI) / 4),
          128 + 11 * Math.cos((column * Math.PI) / 4) * Math.sin((row * Math.PI) / 4),
          249,
          255
        ],
        index
      );
    }
  }
  const textures = {
    wood: device.createTexture({
      width: size,
      height: size,
      format: 'rgba8unorm-srgb',
      data: wood,
      ...FILTERED_SURFACE,
      mipLevels: 8
    }),
    weave: device.createTexture({
      width: size,
      height: size,
      format: 'rgba8unorm',
      data: weave,
      ...FILTERED_SURFACE,
      mipLevels: 8
    })
  };
  device.generateMipmapsWebGPU(textures.wood);
  device.generateMipmapsWebGPU(textures.weave);
  return textures;
}

/** Paint a numbered ball skin in spherical UV coordinates. */
function ballTexture(device: Device, index: number): Texture {
  const width = 256;
  const height = 128;
  const artwork = document.createElement('canvas');
  artwork.width = width;
  artwork.height = height;
  const context = artwork.getContext('2d')!;
  const palette = [
    '#191817',
    '#f1b82a',
    '#2a62cf',
    '#c73028',
    '#71429a',
    '#ed7627',
    '#247950',
    '#841e35'
  ];
  context.fillStyle = index === 0 || index > 8 ? '#fcf3d8' : palette[index % 8];
  context.fillRect(0, 0, width, height);
  if (index === 0 || index > 8) {
    context.fillStyle = index === 0 ? '#8b2220' : palette[index % 8];
    const band = index === 0 ? 6 : 38;
    context.fillRect(0, (height - band) / 2, width, band);
  }
  if (index) {
    for (const center of [width / 4, (width * 3) / 4]) {
      context.fillStyle = '#fff9e6';
      context.beginPath();
      context.arc(center, height / 2, 15, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#161619';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = 'bold 20px system-ui';
      context.fillText(String(index), center, height / 2);
    }
  }
  return device.createTexture({
    width,
    height,
    format: 'rgba8unorm-srgb',
    data: new Uint8Array(context.getImageData(0, 0, width, height).data)
  });
}

/** Assemble a two-piece cue shared by the table and turntable scenegraphs. */
function buildCue(
  root: GroupNode,
  materials: {
    shaft: SceneMaterial;
    butt: SceneMaterial;
    forearm: SceneMaterial;
    wrap: SceneMaterial;
    inlay: SceneMaterial;
    ivory: SceneMaterial;
    tip: SceneMaterial;
  }
) {
  /** Place a tapered cue section between two axial coordinates. */
  function section(
    id: string,
    material: SceneMaterial,
    start: number,
    end: number,
    bottomRadius: number,
    topRadius: number
  ) {
    addMesh(
      root,
      id,
      new TruncatedConeGeometry({
        height: end - start,
        bottomRadius,
        topRadius,
        nradial: 24,
        topCap: true,
        bottomCap: true
      }),
      material,
      new Matrix4().translate([0, (start + end) / 2, 0])
    );
  }
  const joint = -CUE_LENGTH / 2;
  section('shaft', materials.shaft, joint + 0.029, -0.095, 0.055, 0.024);
  section('forearm', materials.forearm, -2.39, joint - 0.029, 0.078, 0.055);
  section('grip', materials.wrap, -3.01, -2.39, 0.094, 0.078);
  section('joint-collar', materials.ivory, joint - 0.029, joint + 0.029, 0.056, 0.054);
  section('butt', materials.butt, -3.29, -3.01, 0.103, 0.094);
  section('butt-cap', materials.ivory, -3.37, -3.29, 0.099, 0.103);
  section('bumper', materials.tip, -CUE_LENGTH, -3.37, 0.098, 0.099);
  section('ferrule', materials.inlay, -0.095, -0.024, 0.024, 0.023);
  section('chalk', materials.tip, -0.024, 0, 0.023, 0.023);
  for (const [index, [center, radius]] of [
    [-3.28, 0.103],
    [-3.02, 0.095],
    [-2.39, 0.079],
    [joint - 0.035, 0.057]
  ].entries()) {
    section(
      `ring-${index}`,
      materials.inlay,
      center - 0.009,
      center + 0.009,
      radius + 0.002,
      radius + 0.002
    );
  }
}

/** Resolution shared by veneer textures and their full mip chains. */
const VENEER_SIZE = 512;

/** Paint the veneer in unwrapped cylinder coordinates so its finish stays flush. */
function drawVeneers(style: string, butt: boolean): Uint8Array {
  const artwork = document.createElement('canvas');
  artwork.width = artwork.height = VENEER_SIZE;
  const context = artwork.getContext('2d')!;
  const [outer, middle, inner, core, wood] =
    style === 'malachite'
      ? ['#162e22', '#f3cd58', '#79bd54', '#2b1a12', '#b7834e']
      : style === 'ember'
        ? ['#452625', '#bd543c', '#e5ad64', '#45241d', '#d4af78']
        : ['#1d4679', '#e9f6fa', '#57b7c0', '#171515', '#be9a6e'];
  context.fillStyle = butt ? core : wood;
  context.fillRect(0, 0, VENEER_SIZE, VENEER_SIZE);
  for (let face = 0; face < 4; face++) {
    const center = (face + 0.5) * (VENEER_SIZE / 4);
    const widths = butt ? [34, 27, 20, 13] : [57, 49, 41, 33];
    [outer, middle, inner, core].forEach((color, layer) => {
      context.fillStyle = butt ? [core, '#d0ba92', '#f0dfbf', core][layer] : color;
      const halfWidth = widths[layer];
      context.beginPath();
      if (butt) {
        const height = 134 - 22 * layer;
        context.moveTo(center, 256 - height);
        context.lineTo(center + halfWidth, 256);
        context.lineTo(center, 256 + height);
        context.lineTo(center - halfWidth, 256);
      } else {
        context.moveTo(center, VENEER_SIZE - 16 - layer * 34);
        context.lineTo(center + halfWidth, 0);
        context.lineTo(center - halfWidth, 0);
      }
      context.closePath();
      context.fill();
    });
  }
  return new Uint8Array(context.getImageData(0, 0, VENEER_SIZE, VENEER_SIZE).data);
}

/** Render both pool views on a single device and own their scene resources. */
export function createPoolRenderer(device: Device, previewCanvas: HTMLCanvasElement) {
  const renderer = new SceneRenderer(device);
  const preview = device.createCanvasContext({
    canvas: previewCanvas,
    autoResize: true,
    useDevicePixels: Math.max(2, devicePixelRatio)
  });
  const scene = new GroupNode({id: 'pool-table'});
  const cue = new GroupNode({id: 'playing-cue'});
  const display = new GroupNode({id: 'preview-cue'});
  scene.add(cue);
  const surfaceTextures = makeSurfaceTextures(device);
  addTable(scene, surfaceTextures.wood);
  const textures = Array.from({length: 16}, (_, index) => ballTexture(device, index));
  const balls = textures.map((texture, index) => {
    const material = surface(`ball-${index}`, [1, 1, 1], 0.18, 0, 0.9);
    material.uniforms!.baseColorMapEnabled = true;
    material.bindings = {pbr_baseColorSampler: texture};
    return addMesh(scene, `ball-${index}`, BALL, material, new Matrix4());
  });
  const veneerTextures = [false, true].map(butt =>
    device.createTexture({
      width: VENEER_SIZE,
      height: VENEER_SIZE,
      format: 'rgba8unorm-srgb',
      data: drawVeneers('peacock', butt),
      ...FILTERED_SURFACE,
      mipLevels: 10
    })
  );
  const parts = {
    shaft: surface('cue-shaft', [0.67, 0.4, 0.17], 0.25, 0, 0.75),
    butt: surface('cue-butt', [1, 1, 1], 0.21, 0, 1),
    forearm: surface('cue-forearm', [1, 1, 1], 0.21, 0, 1),
    wrap: surface('cue-wrap', [0.049, 0.041, 0.033], 0.54, 0, 0.22),
    inlay: surface('cue-inlay', [0.73, 0.47, 0.18], 0.31, 0.52, 0.6),
    ivory: surface('cue-ivory', [0.92, 0.86, 0.72], 0.26, 0, 0.58),
    tip: surface('cue-tip', [0.032, 0.069, 0.068], 0.8)
  };
  parts.forearm.bindings = {pbr_baseColorSampler: veneerTextures[0]};
  parts.butt.bindings = {pbr_baseColorSampler: veneerTextures[1]};
  parts.wrap.bindings = {pbr_normalSampler: surfaceTextures.weave};
  buildCue(cue, parts);
  buildCue(display, parts);
  const displayScene = new GroupNode({id: 'cue-display', children: [display]});
  const lights = [
    {type: 'ambient' as const, color: [1, 1, 1] as const, intensity: 0.48},
    {
      type: 'directional' as const,
      direction: [0.25, -0.35, -1] as const,
      color: [1, 0.87, 0.72] as const,
      intensity: 2.7
    },
    {
      type: 'directional' as const,
      direction: [-0.6, 0.4, -1] as const,
      color: [0.7, 0.83, 1] as const,
      intensity: 0.85
    }
  ];
  const eye: Vector = [0, 0, 15];
  const view = new Matrix4().lookAt({eye, center: [0, 0, 0], up: [0, 1, 0]});
  const depthRange = new Matrix4().translate([0, 0, 0.5]).scale([1, 1, 0.5]);
  const orthographic = (halfWidth: number, halfHeight: number) =>
    depthRange.clone().multiplyRight(
      new Matrix4().ortho({
        left: -halfWidth,
        right: halfWidth,
        bottom: -halfHeight,
        top: halfHeight,
        near: 0.1,
        far: 30
      })
    );
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const interpolatedOrientation = new Quaternion();
  let previousStates: readonly GPUSphereBodyState[] = [];
  let renderedStates: readonly GPUSphereBodyState[] = [];
  let snapshotTime = 0;
  let snapshotInterval = 1000 / 30;
  let lastStyle = '';
  let lastPreview = -Infinity;
  return {
    draw(
      extent: [number, number],
      states: readonly GPUSphereBodyState[],
      tip: [number, number] | undefined,
      direction: number,
      style: string,
      now: number,
      rolling: boolean
    ) {
      if (!rolling) {
        previousStates = renderedStates = states;
        snapshotTime = now;
      } else if (renderedStates !== states) {
        snapshotInterval = Math.max(16, Math.min(60, now - snapshotTime));
        snapshotTime = now;
        previousStates = renderedStates;
        renderedStates = states;
      }
      const blend = Math.min(1, (now - snapshotTime) / snapshotInterval);
      for (const state of states) {
        const ball = balls[state.index];
        ball.display = state.enabled;
        if (!state.enabled) continue;
        const previous = previousStates[state.index];
        const interpolate = rolling && previous?.enabled;
        const orientation = interpolate
          ? interpolatedOrientation.slerp(previous.orientation, state.orientation, blend)
          : state.orientation;
        const matrix = new Matrix4().fromQuaternion(orientation).scale(state.radius || BALL_RADIUS);
        for (let axis = 0; axis < 3; axis++) {
          const position = state.position[axis];
          matrix[12 + axis] = interpolate
            ? previous.position[axis] + (position - previous.position[axis]) * blend
            : position;
        }
        ball.setMatrix(matrix, false);
      }
      cue.setMatrix(
        new Matrix4()
          .translate(tip ? [...tip, BALL_RADIUS] : [100, 0, 0])
          .rotateZ(direction - Math.PI / 2)
          .rotateX(-0.055)
          .scale([CUE_WIDTH_SCALE, PLAYING_CUE_SCALE, CUE_WIDTH_SCALE]),
        false
      );
      if (style !== lastStyle) {
        lastStyle = style;
        veneerTextures.forEach((texture, index) => {
          texture.writeData(drawVeneers(style, index === 1));
          device.generateMipmapsWebGPU(texture);
        });
        parts.inlay.uniforms!.baseColorFactor =
          style === 'malachite'
            ? [0.82, 0.58, 0.17, 1]
            : style === 'ember'
              ? [0.89, 0.67, 0.44, 1]
              : [0.5, 0.82, 0.94, 1];
      }
      renderer.render({
        scene,
        framebuffer: device
          .getCanvasContext()
          .getCurrentFramebuffer({depthStencilFormat: 'depth24plus'}),
        camera: {
          viewMatrix: view,
          projectionMatrix: orthographic(extent[0], extent[1]),
          position: eye
        },
        lights,
        background: [0.017, 0.022, 0.019, 1],
        transmission: false
      });
      device.submit();
      if (now - lastPreview < 32 || !previewCanvas.clientWidth || !previewCanvas.clientHeight)
        return;
      lastPreview = now;
      const aspect = previewCanvas.clientWidth / previewCanvas.clientHeight;
      const halfHeight = Math.max(0.98, 0.135 / aspect);
      const halfWidth = halfHeight * aspect;
      display.setMatrix(
        new Matrix4()
          .translate([0, CUE_LENGTH * 0.72, 0])
          .rotateY(reducedMotion.matches ? 0.55 : now / 1900)
          .scale([CUE_WIDTH_SCALE, 1, CUE_WIDTH_SCALE]),
        false
      );
      renderer.render({
        scene: displayScene,
        framebuffer: preview.getCurrentFramebuffer({depthStencilFormat: 'depth24plus'}),
        camera: {
          viewMatrix: view,
          projectionMatrix: orthographic(halfWidth, halfHeight),
          position: eye
        },
        lights,
        background: [0.025, 0.032, 0.027, 1],
        transmission: false
      });
      device.submit();
    },
    destroy() {
      renderer.destroy();
      surfaceTextures.wood.destroy();
      surfaceTextures.weave.destroy();
      preview.destroy();
      for (const texture of [...textures, ...veneerTextures]) texture.destroy();
    }
  };
}
