// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {ColumnLayer, PolygonLayer, ScatterplotLayer} from '@deck.gl/layers';
import {ThreeSceneLayer} from '@luma.gl/three/deck';
import type {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
  type Renderer
} from 'three/webgpu';
import {createGLTFScene} from './gltf-scene';

type Position = [number, number, number];
type CourtyardPolygon = {rings: Position[][]; color: [number, number, number, number]};
type Station = {
  id: number;
  position: Position;
  color: [number, number, number, number];
  elevation: number;
};
const FLOOR_HEIGHT = -1.4;

function makePolygonMesh(polygon: CourtyardPolygon) {
  const shape = new Shape(polygon.rings[0].map(position => new Vector2(position[0], position[1])));
  for (const ring of polygon.rings.slice(1))
    shape.holes.push(new Path(ring.map(position => new Vector2(position[0], position[1]))));
  const material = new MeshBasicMaterial({
    color: new Color().setRGB(
      polygon.color[0] / 255,
      polygon.color[1] / 255,
      polygon.color[2] / 255,
      'srgb'
    ),
    side: DoubleSide
  });
  const mesh = new Mesh(new ShapeGeometry(shape), material);
  mesh.position.z = polygon.rings[0][0][2];
  return mesh;
}

/** PBR Lantern + a native deck courtyard; equivalents are supplied to the Three reference. */
export async function createDeckLanternScene(renderer: Renderer) {
  const fixture = await createGLTFScene(renderer);
  fixture.scene.background = new Color(0, 0, 0);
  fixture.ground.material.color.setHex(0x233540);
  // The asset fixture is Y-up; the deck courtyard uses conventional Cartesian Z-up.
  const content = new Group();
  for (const object of fixture.scene.children.slice()) content.add(object);
  content.rotation.x = Math.PI / 2;
  fixture.scene.add(content);
  fixture.scene.environmentRotation.x = Math.PI / 2;
  const model = content.children.find(
    object => object !== fixture.ground && object !== fixture.light
  )!;
  model.position.y += 0.2;
  const pedestal = new Mesh(
    new CylinderGeometry(1.1, 1.2, 0.2, 64),
    new MeshStandardMaterial({color: 0x16343d, metalness: 0.5, roughness: 0.4})
  );
  pedestal.position.y = -1.3;
  pedestal.castShadow = pedestal.receiveShadow = true;
  content.add(pedestal);
  fixture.light.shadow.autoUpdate = false;
  fixture.light.shadow.needsUpdate = true;

  const polygons: CourtyardPolygon[] = [];
  for (let row = -7; row <= 7; row++)
    for (let column = -7; column <= 7; column++) {
      const positionX = column * 0.5;
      const positionY = row * 0.5;
      if (Math.abs(positionX) < 1.8 && Math.abs(positionY) < 1.8) continue;
      const halfSize = 0.235;
      const height = FLOOR_HEIGHT + 0.015;
      polygons.push({
        rings: [
          [
            [positionX - halfSize, positionY - halfSize, height],
            [positionX + halfSize, positionY - halfSize, height],
            [positionX + halfSize, positionY + halfSize, height],
            [positionX - halfSize, positionY + halfSize, height]
          ]
        ],
        color: (row + column) % 2 === 0 ? [30, 53, 64, 255] : [40, 65, 75, 255]
      });
    }
  for (const radius of [1.28, 1.5, 2.7, 3.65]) {
    const rings = [radius + 0.014, radius - 0.014].map(ringRadius =>
      Array.from({length: 129}, (_, index): Position => {
        const angle = (index / 128) * Math.PI * 2;
        return [Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, FLOOR_HEIGHT + 0.03];
      })
    );
    rings[1].reverse();
    polygons.push({rings, color: radius < 2 ? [229, 175, 77, 255] : [40, 175, 175, 255]});
  }
  const stations: Station[] = Array.from({length: 16}, (_, id) => {
    const angle = (id / 16) * Math.PI * 2;
    return {
      id,
      position: [Math.cos(angle) * 3.05, Math.sin(angle) * 3.05, FLOOR_HEIGHT],
      elevation: 0.5,
      color: id % 4 === 0 ? [229, 175, 77, 255] : [47, 163, 177, 255]
    };
  });
  const referenceContext = new Group();
  for (const polygon of polygons) referenceContext.add(makePolygonMesh(polygon));
  const stationMeshes = stations.map(station => {
    const geometry = new CylinderGeometry(0.16, 0.16, 1, 6);
    geometry.rotateX(Math.PI / 2);
    geometry.rotateZ(Math.PI / 2);
    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color: new Color().setRGB(
          station.color[0] / 255,
          station.color[1] / 255,
          station.color[2] / 255,
          'srgb'
        )
      })
    );
    referenceContext.add(mesh);
    return mesh;
  });
  const markers = stations.map(station => {
    const marker = new Mesh(
      new CircleGeometry(0.045, 256),
      new MeshBasicMaterial({color: 0xffe6ac, side: DoubleSide})
    );
    marker.position.set(station.position[0], station.position[1], FLOOR_HEIGHT + 0.035);
    referenceContext.add(marker);
    return marker;
  });
  function update(seconds: number) {
    stations.forEach((station, index) => {
      station.elevation = 0.25 + 1.1 * (0.5 + 0.5 * Math.sin(seconds * 0.7 + index * 0.65));
      stationMeshes[index].position.set(
        station.position[0],
        station.position[1],
        FLOOR_HEIGHT + station.elevation / 2
      );
      stationMeshes[index].scale.z = station.elevation;
    });
  }
  update(0);
  let disposed = false;
  return {
    ...fixture,
    polygons,
    stations,
    markers,
    referenceContext,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      referenceContext.traverse(object => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      pedestal.geometry.dispose();
      pedestal.material.dispose();
      fixture.dispose();
    }
  };
}

export function createDeckLanternLayers(
  fixture: Awaited<ReturnType<typeof createDeckLanternScene>>,
  adapter: ThreeSceneAdapter,
  {reverseOrder = false, context = true} = {}
) {
  const lantern = new ThreeSceneLayer({
    id: 'lantern-pbr',
    scene: fixture.scene,
    camera: fixture.camera,
    adapter
  });
  const parameters = {depthWriteEnabled: true, depthCompare: 'less-equal' as const};
  const contextLayers = context
    ? [
        new PolygonLayer<CourtyardPolygon>({
          id: 'courtyard-tiles-and-rings',
          data: fixture.polygons,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPolygon: polygon => polygon.rings,
          getFillColor: polygon => polygon.color,
          stroked: false,
          filled: true,
          parameters,
          getPolygonOffset: () => [0, 0]
        }),
        new ColumnLayer<Station>({
          id: 'courtyard-data-stations',
          data: fixture.stations.map(station => ({...station})),
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPosition: station => station.position,
          getElevation: station => station.elevation,
          getFillColor: station => station.color,
          diskResolution: 6,
          radius: 0.16,
          material: false,
          extruded: true,
          parameters,
          pickable: true,
          getPolygonOffset: () => [0, 0]
        }),
        new ScatterplotLayer<Station>({
          id: 'courtyard-beacons',
          data: fixture.stations,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPosition: station => [station.position[0], station.position[1], FLOOR_HEIGHT + 0.035],
          getRadius: 0.045,
          radiusUnits: 'common',
          getFillColor: [255, 230, 172, 255],
          antialiasing: false,
          billboard: false,
          parameters,
          getPolygonOffset: () => [0, 0]
        })
      ]
    : [];
  return reverseOrder ? [...contextLayers, lantern] : [lantern, ...contextLayers];
}
