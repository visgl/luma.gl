// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type CityFeature = {
  name: string;
  kind: 'building' | 'water' | 'ground' | 'bridge' | 'park';
  center: [number, number, number];
  size: [number, number, number];
  color: [number, number, number];
};

/** All geometry is expressed in local east/north/up meters around this origin. */
export const CITY_ORIGIN: [number, number, number] = [-74.006, 40.7128, 0];

/** A fictional river district, generated without network requests or random state. */
export function makeCityFeatures(): CityFeature[] {
  const features: CityFeature[] = [
    {
      name: 'District',
      kind: 'ground',
      center: [0, 0, -3],
      size: [1050, 1250, 2],
      color: [0.17, 0.23, 0.27]
    },
    {
      name: 'River',
      kind: 'water',
      center: [0, 0, 0],
      size: [170, 1250, 0],
      color: [0.08, 0.39, 0.48]
    },
    {
      name: 'North bridge',
      kind: 'bridge',
      center: [0, 275, 8],
      size: [240, 30, 5],
      color: [0.69, 0.76, 0.74]
    },
    {
      name: 'South bridge',
      kind: 'bridge',
      center: [0, -265, 8],
      size: [240, 30, 5],
      color: [0.69, 0.76, 0.74]
    }
  ];
  for (const side of [-1, 1]) {
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 3; column++) {
        const center: [number, number, number] = [side * (150 + column * 125), row * 135 - 470, 0];
        if ((row + column * 2) % 7 === 0) {
          features.push({
            name: `Riverside garden ${features.length}`,
            kind: 'park',
            center,
            size: [78, 85, 1],
            color: [0.25, 0.43, 0.35]
          });
        } else {
          const height = 25 + ((row * 17 + column * 31 + (side + 1) * 11) % 100);
          features.push({
            name: `${side < 0 ? 'West' : 'East'} ${row + 1}.${column + 1}`,
            kind: 'building',
            center,
            size: [65 + column * 5, 72, height],
            color: column === 0 ? [0.83, 0.76, 0.61] : [0.61, 0.71, 0.73]
          });
        }
      }
    }
  }
  return features;
}

export {makeCityMesh} from '../river-district-data';
