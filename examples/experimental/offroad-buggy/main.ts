// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@math.gl/geometry';
import {createBuggyAudio} from './audio';
import {createDashboard} from './dashboard';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  GPURigidBodyWorld,
  GPURigidBodyTerrainStream,
  GPURigidBodyTerrainSelector,
  getRigidBodyTerrainTileBounds,
  stitchRigidBodyTerrainTiles,
  makeStaticTriangleMeshGeometry,
  type GPURigidBodyCollider,
  type GPURigidBodyHeightField,
  type GPURigidBodyTerrainSeam,
  type GPURigidBodyTerrainSelection,
  type GPURigidBodyTerrainTile,
  type GPURigidBodyShape
} from '@luma.gl/graph/gpu-physics';

const canvas = document.querySelector<HTMLCanvasElement>('#view')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const terrainStatus = document.querySelector<HTMLOutputElement>('#terrain-tiles')!;
/** The reference mode keeps the same render mesh while using pre-cooked collision triangles. */
const terrainMode = new URLSearchParams(location.search).get('terrain');
const useNativeTerrain = terrainMode !== 'mesh';
const useAutomaticTerrain = terrainMode === 'auto';
const terrainBounds = [-32, -32, 32, 32] as const;
const terrainStart = [0, -11] as const;
const automaticTerrain = new THREE.Group();
const suspensionTravel = 0.5;
/** Shared inspector for the GPU physics commands submitted by the buggy. */
const diagnostics = new GPUGraphDiagnostics();
const updateDashboard = createDashboard(suspensionTravel, diagnostics);
const chassisAngles = new THREE.Euler(0, 0, 0, 'ZYX');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.add(automaticTerrain);
scene.background = new THREE.Color(0xb9cdd2);
scene.fog = new THREE.FogExp2(0xb9cdd2, 0.012);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 250);
camera.up.set(0, 0, 1);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
const orbit = new OrbitControls(camera, canvas);
orbit.enablePan = false;
const orbitTranslation = new THREE.Vector3();
const sun = new THREE.DirectionalLight(0xffe1b3, 3);
sun.position.set(-15, -20, 35);
sun.castShadow = true;
Object.assign(sun.shadow.camera, {left: -30, right: 30, top: 30, bottom: -30, far: 100});
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.normalBias = 0.035;
scene.add(sun, new THREE.HemisphereLight(0xe3f2ff, 0xc09263, 1.7));
function elevation(x: number, y: number) {
  const ridge = Math.exp(-((x + y * 0.45 - 9) ** 2) / 1.9) * 1.25;
  const jump = Math.max(0, 1 - Math.abs((x + 13) / 4)) * Math.exp(-((y + 8) ** 2) / 14) * 2;
  return (
    0.45 * Math.sin(x * 0.28) * Math.cos(y * 0.21) +
    ridge +
    jump +
    0.14 * Math.sin(y * 1.7 + x * 0.4)
  );
}
/** Neighbors in the bundled terrain provider's common metric frame. */
const TERRAIN_SEAMS: GPURigidBodyTerrainSeam[] = [
  {first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'},
  {first: 2, firstEdge: 'last-column', second: 3, secondEdge: 'first-column'},
  {first: 0, firstEdge: 'last-row', second: 2, secondEdge: 'first-row'},
  {first: 1, firstEdge: 'last-row', second: 3, secondEdge: 'first-row'}
];
/** Adjacent fields can have distinct resolutions while covering the same metric patch size. */
const sourceTiles = [-32, 0].flatMap(north =>
  [-32, 0].map(east => {
    const spacing = terrainMode === 'mixed' && east < 0 ? 2 : 1;
    const width = 32 / spacing + 1;
    const heights = Float32Array.from({length: width * width}, (_, vertex) =>
      elevation(east + (vertex % width) * spacing, north + Math.floor(vertex / width) * spacing)
    );
    const field: GPURigidBodyHeightField = {
      width,
      height: width,
      heights,
      columnStep: [spacing, 0],
      rowStep: [0, spacing],
      diagonal: '10-01'
    };
    return {position: [east, north, 0] as const, field};
  })
);
// Publish the same canonical seam samples for rendering and for every fetched collision window.
const terrainTiles = [
  ...stitchRigidBodyTerrainTiles(
    new Map(sourceTiles.map((tile, index) => [index, tile])),
    TERRAIN_SEAMS
  ).values()
];

/** Create the indexed render surface and use it for the cooked-mesh comparison. */
function makeTerrainGeometry(field: GPURigidBodyHeightField): Geometry {
  const tilePositions = new Float32Array(field.width * field.height * 3);
  const tileIndices: number[] = [];
  const columnSpacing = field.columnStep![0];
  const rowSpacing = field.rowStep![1];
  for (let row = 0; row < field.height; row++) {
    for (let column = 0; column < field.width; column++) {
      const vertex = row * field.width + column;
      tilePositions.set(
        [column * columnSpacing, row * rowSpacing, field.heights![vertex]],
        vertex * 3
      );
      if (row + 1 < field.height && column + 1 < field.width) {
        tileIndices.push(
          vertex,
          vertex + 1,
          vertex + field.width,
          vertex + 1,
          vertex + field.width + 1,
          vertex + field.width
        );
      }
    }
  }
  return new Geometry({
    topology: 'triangle-list',
    indices: new Uint16Array(tileIndices),
    attributes: {POSITION: {size: 3, value: tilePositions}}
  });
}

const terrainMaterial = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1});
/** Render the same samples, diagonal and position as the physics collider. */
function makeTerrainMesh(surface: Geometry, position: GPURigidBodyTerrainTile['position']) {
  const positions = surface.attributes['POSITION'].value;
  const colors = new Float32Array(positions.length);
  for (let vertex = 0; vertex < positions.length; vertex += 3) {
    const east = position[0] + positions[vertex];
    const north = position[1] + positions[vertex + 1];
    const track = Math.abs(Math.hypot(east / 18, north / 11) - 1) < 0.17;
    const shade = 0.92 + 0.08 * Math.cos(east * 13 + north * 27);
    const color = new THREE.Color(track ? 0xba8e60 : 0x958253).multiplyScalar(shade);
    colors.set([color.r, color.g, color.b], vertex);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.Uint16BufferAttribute(surface.indices!.value, 1));
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, terrainMaterial);
  terrain.position.fromArray(position);
  terrain.receiveShadow = true;
  return terrain;
}

/** Sample a quadtree tile on the common XY grid with 32 cells per edge. */
function loadAutomaticTerrainTile(key: string): GPURigidBodyTerrainTile {
  const [level, column, row] = key.split('/').map(Number);
  const [west, south, east, north] = getRigidBodyTerrainTileBounds(terrainBounds, {
    level,
    column,
    row
  });
  const width = 33;
  const columnSpacing = (east - west) / (width - 1);
  const rowSpacing = (north - south) / (width - 1);
  return {
    position: [west, south, 0],
    field: {
      width,
      height: width,
      heights: Float32Array.from({length: width * width}, (_, vertex) =>
        elevation(
          west + (vertex % width) * columnSpacing,
          south + Math.floor(vertex / width) * rowSpacing
        )
      ),
      columnStep: [columnSpacing, 0],
      rowStep: [0, rowSpacing],
      diagonal: '10-01'
    }
  };
}

const terrainBodies = useAutomaticTerrain
  ? Array.from({length: 4}, () => ({
      mass: 0,
      position: [0, 0, 0] as const,
      shape: {type: 'height-field' as const, field: {width: 33, height: 33}}
    }))
  : terrainTiles.map(({position, field}) => {
      const surface = makeTerrainGeometry(field);
      scene.add(makeTerrainMesh(surface, position));
      const shape: GPURigidBodyShape = useNativeTerrain
        ? {type: 'height-field', field: {width: field.width, height: field.height}}
        : {type: 'triangle-mesh', geometry: makeStaticTriangleMeshGeometry(surface)};
      return {mass: 0, position: useNativeTerrain ? ([0, 0, 0] as const) : position, shape};
    });
// Four closed rails share the same dimensions in rendering and collision detection.
const railCenter = 31.5;
const railThickness = 0.4;
const perimeter = [0, 1, 2, 3].map(side => {
  const alongX = side < 2;
  const offset = side % 2 === 0 ? -railCenter : railCenter;
  const position: [number, number, number] = [alongX ? 0 : offset, alongX ? offset : 0, 0.65];
  const halfExtents: [number, number, number] = [
    alongX ? railCenter + railThickness : railThickness,
    alongX ? railThickness : railCenter - railThickness,
    1.65
  ];
  return {mass: 0, position, shape: {type: 'box' as const, halfExtents}};
});
const audio = createBuggyAudio(
  document.querySelector<HTMLButtonElement>('#sound')!,
  perimeter.map(barrier => barrier.position)
);
const barrierMaterial = new THREE.MeshStandardMaterial({color: 0x8a8274, roughness: 0.95});
for (const barrier of perimeter) {
  const [width, depth, height] = barrier.shape.halfExtents;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width * 2, depth * 2, height * 2),
    barrierMaterial
  );
  mesh.position.fromArray(barrier.position);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
}
const chassis = new THREE.Group();
chassis.name = 'chassis';
scene.add(chassis);
const material = (color: number) => new THREE.MeshStandardMaterial({color, roughness: 0.65});
const orange = material(0xf26216),
  steel = material(0x354147),
  rubber = material(0x212425),
  hub = material(0xb7b6ac);
function part(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  surfaceMaterial: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const mesh = new THREE.Mesh(geometry, surfaceMaterial);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
part(chassis, new THREE.BoxGeometry(2.7, 1.25, 0.28), orange, 0, 0, -0.08);
part(chassis, new THREE.BoxGeometry(0.78, 1.15, 0.27), orange, 0.9, 0, 0.15);
part(chassis, new THREE.BoxGeometry(0.6, 0.65, 0.55), rubber, -0.35, 0, 0.24);
const up = new THREE.Vector3(0, 1, 0);
function connect(mesh: THREE.Mesh, startPoint: THREE.Vector3, endPoint: THREE.Vector3) {
  const delta = endPoint.clone().sub(startPoint);
  mesh.position.copy(startPoint).lerp(endPoint, 0.5);
  mesh.scale.y = delta.length();
  mesh.quaternion.setFromUnitVectors(up, delta.normalize());
}
function bar(
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  radius = 0.045,
  surfaceMaterial = steel
) {
  const mesh = part(
    chassis,
    new THREE.CylinderGeometry(radius, radius, 1, 10),
    surfaceMaterial,
    0,
    0,
    0
  );
  connect(mesh, startPoint, endPoint);
  return mesh;
}
const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Compound shape comprising the body shell and the roll cage tubes. */
const chassisColliders: GPURigidBodyCollider[] = [
  {shape: {type: 'box', halfExtents: [1.35, 0.625, 0.16]}}
];
/** Build a tube and its cylinder collider from the same chassis-local endpoints. */
function addCageBar(startPoint: THREE.Vector3, endPoint: THREE.Vector3): void {
  const radius = 0.045;
  const mesh = bar(startPoint, endPoint, radius);
  // Use the same center, orientation and length as the rendered tube.
  chassisColliders.push({
    position: mesh.position.toArray(),
    orientation: mesh.quaternion.toArray(),
    shape: {type: 'cylinder', height: mesh.scale.y, radiusBottom: radius, radiusTop: radius}
  });
}
for (const side of [-0.53, 0.53]) {
  const cage = [
    point(-1.25, side, 0.02),
    point(-0.48, side, 0.88),
    point(0.28, side, 0.85),
    point(0.85, side, 0.02)
  ];
  for (let index = 1; index < cage.length; index++) addCageBar(cage[index - 1], cage[index]);
}
for (const x of [-0.48, 0.28]) addCageBar(point(x, -0.53, 0.86), point(x, 0.53, 0.86));
// Bolt-on trail equipment is visual geometry in the chassis frame.
const gunmetal = new THREE.MeshStandardMaterial({
  color: 0x43505a,
  roughness: 0.42,
  metalness: 0.65
});
const lamp = new THREE.MeshStandardMaterial({
  color: 0xffecc0,
  emissive: 0xffbd62,
  emissiveIntensity: 0.65
});
const tailLamp = new THREE.MeshStandardMaterial({color: 0xc92219, emissive: 0x97170c});
part(chassis, new THREE.BoxGeometry(2.35, 1.18, 0.06), gunmetal, 0, 0, -0.235);
for (const side of [-1, 1]) {
  bar(point(1.18, side * 0.44, -0.18), point(1.51, side * 0.61, 0.12), 0.055);
  bar(point(1.51, side * 0.61, 0.12), point(1.42, side * 0.5, 0.31), 0.05);
  bar(point(-1.17, side * 0.56, 0), point(-0.54, side * 0.53, 0.73), 0.04);
  bar(point(-0.94, side * 0.7, -0.13), point(0.86, side * 0.7, -0.13), 0.05);
  part(chassis, new THREE.BoxGeometry(0.1, 0.2, 0.1), tailLamp, -1.37, side * 0.47, 0.05);
}
bar(point(1.51, -0.61, 0.12), point(1.51, 0.61, 0.12), 0.055);
bar(point(1.42, -0.5, 0.31), point(1.42, 0.5, 0.31), 0.04);
for (const lateral of [-0.36, -0.12, 0.12, 0.36]) {
  part(chassis, new THREE.BoxGeometry(0.17, 0.19, 0.15), steel, 0.26, lateral, 0.96);
  part(chassis, new THREE.BoxGeometry(0.02, 0.15, 0.105), lamp, 0.355, lateral, 0.96);
}
for (const lateral of [-0.32, -0.16, 0, 0.16, 0.32]) {
  part(chassis, new THREE.BoxGeometry(0.31, 0.035, 0.025), gunmetal, 0.95, lateral, 0.294);
}
const spare = new THREE.Group();
spare.position.set(-1.06, 0, 0.37);
spare.rotation.x = Math.PI / 2;
spare.rotation.z = 0.19;
chassis.add(spare);
part(spare, new THREE.CylinderGeometry(0.34, 0.34, 0.22, 24), rubber, 0, 0, 0);
part(spare, new THREE.CylinderGeometry(0.17, 0.17, 0.23, 12), hub, 0, 0, 0);
for (let lug = 0; lug < 16; lug++) {
  const angle = (lug * Math.PI) / 8;
  part(
    spare,
    new THREE.BoxGeometry(0.09, 0.23, 0.045),
    rubber,
    Math.sin(angle) * 0.34,
    0,
    Math.cos(angle) * 0.34
  ).rotation.y = angle;
}
const mounts: [number, number, number][] = [
  [1.02, 0.86, 0.04],
  [1.02, -0.86, 0.04],
  [-1.03, 0.86, 0.04],
  [-1.03, -0.86, 0.04]
];
// Model the spring along local Y so a single shared mesh can follow each shock.
const coilPath = new THREE.CatmullRomCurve3(
  Array.from({length: 121}, (_, index) => {
    const fraction = index / 120;
    const angle = fraction * 2 * Math.PI * 6;
    return point(0.082 * Math.cos(angle), fraction - 0.5, 0.082 * Math.sin(angle));
  })
);
const coilGeometry = new THREE.TubeGeometry(coilPath, 120, 0.018, 8, false);
const coilMaterial = new THREE.MeshStandardMaterial({
  color: 0xffce38,
  roughness: 0.34,
  metalness: 0.3
});
const wheels = mounts.map(([x, y, z]) => {
  const group = new THREE.Group();
  chassis.add(group);
  const rotor = new THREE.Group();
  group.add(rotor);
  part(rotor, new THREE.CylinderGeometry(0.38, 0.38, 0.29, 32), rubber, 0, 0, 0);
  for (let index = 0; index < 14; index++) {
    const angle = (index * Math.PI) / 7;
    part(
      rotor,
      new THREE.BoxGeometry(0.14, 0.32, 0.064),
      rubber,
      Math.sin(angle) * 0.38,
      0,
      Math.cos(angle) * 0.38
    ).rotation.y = angle;
  }
  part(rotor, new THREE.CylinderGeometry(0.19, 0.19, 0.302, 12), hub, 0, 0, 0);
  const anchor = point(x * 0.75, y * 0.73, z + 0.46);
  bar(point(x * 0.7, y * 0.53, 0), anchor, 0.04);
  const spring = part(chassis, coilGeometry, coilMaterial, 0, 0, 0);
  return {group, rotor, anchor, shock: bar(anchor, point(x, y, -0.3), 0.032, hub), spring};
});
const keys = new Set<string>();
let demo = true,
  chase = false,
  reset = false;
const demoButton = document.querySelector<HTMLButtonElement>('#demo')!;
function setDemo(value: boolean) {
  demo = value;
  demoButton.textContent = demo ? 'Drive manually' : 'Demo lap';
}
demoButton.onclick = () => setDemo(!demo);
window.onkeydown = event => {
  if (
    [
      'KeyW',
      'KeyS',
      'KeyA',
      'KeyD',
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight'
    ].includes(event.code)
  ) {
    event.preventDefault();
    audio.unlock();
    keys.add(event.code);
    setDemo(false);
  }
};
window.onkeyup = event => {
  keys.delete(event.code);
};
window.onblur = () => keys.clear();
document.querySelector<HTMLButtonElement>('#camera')!.onclick = event => {
  chase = !chase;
  (event.currentTarget as HTMLButtonElement).textContent = chase ? 'Orbit camera' : 'Chase camera';
};
document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
  reset = true;
};
async function start() {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query']
  });
  const step = 1 / 120;
  // Remaining tile colliders follow the compound chassis and four rail colliders.
  const terrainColliders = terrainBodies.map((_, index) =>
    index === 0 ? 0 : chassisColliders.length + perimeter.length + index
  );
  const world = new GPURigidBodyWorld({
    id: 'buggy',
    timeStep: step,
    eventCapacity: 64,
    impactImpulseThreshold: 120,
    gravity: [0, 0, -9.81],
    bodies: [
      terrainBodies[0],
      {
        position: [0, -11, elevation(0, -11) + 0.84],
        mass: 420,
        colliders: chassisColliders
      },
      ...perimeter,
      ...terrainBodies.slice(1)
    ],
    vehicle: {
      chassis: 1,
      terrainCollider: terrainColliders[0],
      additionalTerrainColliders: terrainColliders.slice(1),
      wheels: mounts.map((mount, index) => ({mount, steer: index < 2, drive: true})),
      radius: 0.38,
      travel: suspensionTravel,
      springRate: 11500,
      damping: 1450,
      grip: 1.05,
      motorTorque: 220,
      brakeTorque: 550,
      wheelInertia: 1.25,
      steeringWheelbase: Math.abs(mounts[0][0] - mounts[2][0]),
      antiRollRate: 1800,
      slipGain: [1.05, 1.6]
    }
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const terrainStream = useNativeTerrain
    ? new GPURigidBodyTerrainStream(world, {
        provider: {
          async loadTile(key, signal) {
            signal.throwIfAborted();
            return useAutomaticTerrain ? loadAutomaticTerrainTile(key) : terrainTiles[Number(key)];
          }
        }
      })
    : undefined;
  const allTiles = terrainColliders.map((collider, index) => ({collider, key: String(index)}));
  const selector = useAutomaticTerrain
    ? new GPURigidBodyTerrainSelector({
        bounds: terrainBounds,
        slots: terrainColliders,
        maximumLevel: 3
      })
    : undefined;
  let autoSelection: GPURigidBodyTerrainSelection | undefined;
  let requestedWindow: string | undefined;

  /** Publish the staged collision window and display its stitched geometry. */
  function applyTerrain(): void {
    if (!terrainStream) return;
    if (terrainStream.apply() && autoSelection) {
      for (const mesh of automaticTerrain.children) {
        if (mesh instanceof THREE.Mesh) mesh.geometry.dispose();
      }
      automaticTerrain.clear();
      for (const {collider} of autoSelection.tiles) {
        const tile = terrainStream.getTile(collider)!;
        automaticTerrain.add(makeTerrainMesh(makeTerrainGeometry(tile.field), tile.position));
      }
      const levels = [...new Set(autoSelection.tiles.map(tile => tile.address.level))].sort();
      terrainStatus.value = `${terrainStream.residentTileCount} / ${terrainColliders.length} tiles · LOD ${levels.join(', ')}`;
    } else if (!selector) {
      terrainStatus.value = `${terrainStream.residentTileCount} / 4 height-field tiles`;
    }
  }

  /** Request a new LOD only when the tile-to-slot assignment changes. */
  async function prepareAutomaticTerrain(position: readonly [number, number]): Promise<void> {
    const selection = selector!.select({position, radius: 12});
    const signature = JSON.stringify(
      selection.tiles.map(({collider, key}) => [collider, key]).sort()
    );
    if (signature === requestedWindow) return;
    requestedWindow = signature;
    if (await terrainStream!.prepare(selection)) autoSelection = selection;
  }

  if (terrainStream) {
    if (selector) await prepareAutomaticTerrain(terrainStart);
    else await terrainStream.prepare({tiles: allTiles});
    applyTerrain();
  }
  const checkpoint = world.createGPUCheckpoint();
  checkpoint.save();
  chassis.position.set(0, -11, elevation(0, -11) + 0.84);
  orbit.target.copy(chassis.position);
  camera.position.copy(orbit.target).add(point(-5, -3.5, 2.6));
  orbit.update();
  let previous = performance.now(),
    accumulator = 0,
    steering = 0;
  let invertedSince: number | undefined;
  const requestedTiles = terrainTiles.map(() => true);
  if (!terrainStream) terrainStatus.value = '4 mesh tiles';

  /** Prefetch neighboring tiles before any wheel can reach the edge. */
  function updateTerrainResidency(): void {
    if (!terrainStream) return;
    if (selector) {
      void prepareAutomaticTerrain([chassis.position.x, chassis.position.y]).catch(fail);
      return;
    }
    let changed = false;
    for (const [index, tile] of terrainTiles.entries()) {
      const east = chassis.position.x - tile.position[0];
      const north = chassis.position.y - tile.position[1];
      const distance = Math.hypot(Math.max(0, -east, east - 32), Math.max(0, -north, north - 32));
      const needed = distance <= (requestedTiles[index] ? 15 : 9);
      changed ||= needed !== requestedTiles[index];
      requestedTiles[index] = needed;
    }
    if (changed)
      void terrainStream
        .prepare({tiles: allTiles.filter((_, index) => requestedTiles[index])})
        .catch(fail);
  }

  /** Restore the checkpoint's terrain window before recovering at the requested position. */
  async function restoreTerrain(position: readonly [number, number] = terrainStart): Promise<void> {
    terrainStream?.cancel();
    if (selector) {
      selector.reset();
      requestedWindow = undefined;
      await prepareAutomaticTerrain(terrainStart);
      applyTerrain();
    } else if (terrainStream) {
      requestedTiles.fill(true);
      await terrainStream.prepare({tiles: allTiles});
      applyTerrain();
    }
    checkpoint.restore();
    if (selector && position !== terrainStart) {
      await prepareAutomaticTerrain(position);
      applyTerrain();
    }
  }

  async function recoverAt(x: number, y: number, heading: number) {
    // Leave sufficient space for the wheels when recovering alongside either rail.
    const clearance = railCenter - railThickness - 1.65;
    x = THREE.MathUtils.clamp(x, -clearance, clearance);
    y = THREE.MathUtils.clamp(y, -clearance, clearance);
    await restoreTerrain([x, y]);
    audio.reset();
    world.setBodyParameters(1, {mode: 'kinematic'});
    world.setKinematicTarget(
      1,
      [x, y, elevation(x, y) + 0.95],
      [0, 0, Math.sin(heading / 2), Math.cos(heading / 2)]
    );
    const encoder = device.createCommandEncoder();
    diagnostics.encode(graph, encoder, {parameters: undefined});
    device.submit(encoder.finish());
    world.setBodyParameters(1, {mode: 'dynamic', velocity: [0, 0, 0], angularVelocity: [0, 0, 0]});
    invertedSince = undefined;
  }
  async function frame(now: number) {
    if (reset) {
      await restoreTerrain();
      audio.reset();
      reset = false;
      invertedSince = undefined;
      steering = 0;
      accumulator = 0;
    }
    applyTerrain();
    const elapsed = Math.min((now - previous) / 1000, 0.1);
    previous = now;
    accumulator += elapsed;
    const yaw = new THREE.Euler().setFromQuaternion(chassis.quaternion, 'ZYX').z;
    const phase = Math.atan2(chassis.position.y / 11, chassis.position.x / 18);
    const target = point(18 * Math.cos(phase + 0.23), 11 * Math.sin(phase + 0.23), 0);
    const angle = Math.atan2(target.y - chassis.position.y, target.x - chassis.position.x) - yaw;
    const pressed = (key: string, alternate: string) =>
      Number(keys.has(key) || keys.has(alternate));
    const speed = Number(chassis.userData.speed ?? 0);
    const turn = demo
      ? Math.atan2(Math.sin(angle), Math.cos(angle))
      : 0.55 * (pressed('KeyA', 'ArrowLeft') - pressed('KeyD', 'ArrowRight'));
    steering = THREE.MathUtils.damp(steering, THREE.MathUtils.clamp(turn, -0.55, 0.55), 9, elapsed);
    const throttle = demo
      ? THREE.MathUtils.clamp((5 - speed) * 0.35, 0, 1)
      : pressed('KeyW', 'ArrowUp') - pressed('KeyS', 'ArrowDown');
    world.setVehicleControls(throttle, steering, keys.has('Space') ? 1 : 0);
    if (accumulator >= step) {
      const encoder = device.createCommandEncoder();
      while (accumulator >= step) {
        diagnostics.encode(graph, encoder, {parameters: undefined});
        accumulator -= step;
      }
      device.submit(encoder.finish());
      const [states, contacts, collisions] = await Promise.all([
        world.readState(),
        world.readVehicleWheels(),
        world.readContactEvents()
      ]);
      const wheelSpeed =
        contacts.reduce((sum, wheel) => sum + Math.abs(wheel.speed), 0) / contacts.length;
      const state = states[1];
      audio.update(throttle, wheelSpeed, state.position, state.velocity, collisions.events);
      chassis.position.fromArray(state.position);
      chassis.quaternion.fromArray(state.orientation);
      chassis.userData.speed = Math.hypot(...state.velocity);
      chassisAngles.setFromQuaternion(chassis.quaternion);
      const {x, y, z} = chassis.position;
      const upZ = 1 - 2 * (chassis.quaternion.x ** 2 + chassis.quaternion.y ** 2);
      const observedAt = performance.now();
      invertedSince = upZ < -0.35 ? (invertedSince ?? observedAt) : undefined;
      // Also catch jumps that clear a rail and falls below the terrain.
      if (
        (invertedSince !== undefined && observedAt - invertedSince >= 3000) ||
        Math.max(Math.abs(x), Math.abs(y)) > railCenter ||
        z < -5
      ) {
        await recoverAt(x, y, chassisAngles.z);
      } else {
        updateTerrainResidency();
      }
      contacts.forEach((contact, index) => {
        const wheel = wheels[index];
        wheel.group.position.fromArray(mounts[index]);
        wheel.group.position.z -= contact.length;
        wheel.group.rotation.z = contact.steering;
        wheel.rotor.rotation.y = contact.angle;
        const lowerMount = wheel.group.position.clone();
        lowerMount.y *= 0.84;
        connect(wheel.shock, wheel.anchor, lowerMount);
        connect(wheel.spring, wheel.anchor, lowerMount);
      });
      updateDashboard(
        now,
        chassis.userData.speed,
        -THREE.MathUtils.radToDeg(chassisAngles.y),
        THREE.MathUtils.radToDeg(chassisAngles.x),
        demo,
        contacts
      );
    }
    if (chase) {
      const offset = point(-5, -2.4, 2.15).applyAxisAngle(point(0, 0, 1), yaw);
      camera.position.lerp(chassis.position.clone().add(offset), 1 - Math.exp(-elapsed * 4));
    } else {
      orbitTranslation.subVectors(chassis.position, orbit.target);
      camera.position.add(orbitTranslation);
    }
    orbit.target.copy(chassis.position);
    orbit.enabled = !chase;
    orbit.update();

    renderer.render(scene, camera);
    requestAnimationFrame(timestamp => void frame(timestamp).catch(fail));
  }
  await frame(previous);
}
function fail(error: unknown) {
  status.value = String(error);
}
void start().catch(fail);
