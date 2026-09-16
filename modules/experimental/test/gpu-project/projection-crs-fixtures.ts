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

export function makeConicCRS(method: 'lambert-1sp' | 'lambert-2sp' | 'albers', southern = false) {
  const sign = southern ? -1 : 1;
  const singleParallel = method === 'lambert-1sp';
  const codes = singleParallel
    ? [8801, 8802, 8805, 8806, 8807]
    : [8821, 8822, 8823, 8824, 8826, 8827];
  const names = singleParallel
    ? [
        'Latitude of natural origin',
        'Longitude of natural origin',
        'Scale factor at natural origin',
        'False easting',
        'False northing'
      ]
    : [
        'Latitude of false origin',
        'Longitude of false origin',
        'Latitude of 1st standard parallel',
        'Latitude of 2nd standard parallel',
        'Easting at false origin',
        'Northing at false origin'
      ];
  const values = singleParallel
    ? [41 * sign, -71.5, 0.9999, 200000, 750000]
    : [41 * sign, -71.5, 42.6833333333 * sign, 41.7166666667 * sign, 200000, 750000];
  const projected = makeTransverseMercatorCRS();
  return {
    ...projected,
    name: '',
    conversion: {
      name: '',
      method: {
        name:
          method === 'albers'
            ? 'Albers Equal Area'
            : singleParallel
              ? 'Lambert Conic Conformal (1SP)'
              : 'Lambert Conic Conformal (2SP)',
        id: {authority: 'EPSG', code: method === 'albers' ? 9822 : singleParallel ? 9801 : 9802}
      },
      parameters: codes.map(
        (code, index) =>
          ({
            name: names[index],
            value: values[index],
            unit:
              code === 8805
                ? 'unity'
                : [8801, 8802, 8821, 8822, 8823, 8824].includes(code)
                  ? 'degree'
                  : 'metre',
            id: {authority: 'EPSG', code}
          }) as const
      )
    }
  } satisfies CRSDefinition;
}

/** Independent serialized definition: never derive the oracle through PROJJSON normalization. */
export function getConicOracleDefinition(
  method: 'lambert-1sp' | 'lambert-2sp' | 'albers',
  southern = false
): string {
  const sign = southern ? -1 : 1;
  const parallels =
    method === 'lambert-1sp'
      ? `+lat_1=${41 * sign} +lat_2=${41 * sign} +k_0=0.9999`
      : `+lat_1=${42.6833333333 * sign} +lat_2=${41.7166666667 * sign}`;
  return `+proj=${method === 'albers' ? 'aea' : 'lcc'} +lat_0=${41 * sign} +lon_0=-71.5 ${parallels} +x_0=200000 +y_0=750000 +ellps=WGS84 +units=m`;
}
