// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSDefinition} from '@math.gl/crs';

export const geographicCRS = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    type: 'GeodeticReferenceFrame',
    name: 'World Geodetic System 1984',
    ellipsoid: {name: 'WGS 84', semi_major_axis: 6378137, inverse_flattening: 298.257223563}
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {name: 'Latitude', abbreviation: 'lat', direction: 'north', unit: 'degree'},
      {name: 'Longitude', abbreviation: 'lon', direction: 'east', unit: 'degree'}
    ]
  }
} as const satisfies CRSDefinition;

export function makeTransverseMercatorCRS(zone = 10, southernHemisphere = false) {
  return {
    type: 'ProjectedCRS',
    name: `WGS 84 / UTM zone ${zone}${southernHemisphere ? 'S' : 'N'}`,
    base_crs: geographicCRS,
    conversion: {
      name: 'UTM',
      method: {name: 'Transverse Mercator', id: {authority: 'EPSG', code: 9807}},
      parameters: [
        {
          name: 'Latitude of natural origin',
          value: 0,
          unit: 'degree',
          id: {authority: 'EPSG', code: 8801}
        },
        {
          name: 'Longitude of natural origin',
          value: zone * 6 - 183,
          unit: 'degree',
          id: {authority: 'EPSG', code: 8802}
        },
        {
          name: 'Scale factor at natural origin',
          value: 0.9996,
          unit: 'unity',
          id: {authority: 'EPSG', code: 8805}
        },
        {name: 'False easting', value: 500000, unit: 'metre', id: {authority: 'EPSG', code: 8806}},
        {
          name: 'False northing',
          value: southernHemisphere ? 10000000 : 0,
          unit: 'metre',
          id: {authority: 'EPSG', code: 8807}
        }
      ]
    },
    coordinate_system: {
      subtype: 'Cartesian',
      axis: [
        {name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre'},
        {name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre'}
      ]
    }
  } as const satisfies CRSDefinition;
}

export function makeWebMercatorCRS() {
  const projected = makeTransverseMercatorCRS();
  return {
    ...projected,
    name: 'WGS 84 / Pseudo-Mercator',
    conversion: {
      name: 'Popular Visualisation Pseudo-Mercator',
      method: {name: 'Popular Visualisation Pseudo Mercator', id: {authority: 'EPSG', code: 1024}},
      parameters: projected.conversion.parameters
        .filter(parameter => parameter.id.code !== 8805)
        .map(parameter => ({...parameter, value: 0}))
    }
  } as const satisfies CRSDefinition;
}
