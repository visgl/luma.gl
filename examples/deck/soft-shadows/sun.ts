// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getSunDirection, getSunPosition} from '@math.gl/sun';
import type {NumberArray3} from '@math.gl/core';
import {CITY_ORIGIN} from '../river-district-data';

export const FIRST_HOUR = 6.5;
export const LAST_HOUR = 19.5;
export const DEFAULT_HOUR = 8.5;
// June 21 in New York: EDT is UTC minus four hours. Fix the date for reproducible shadows.
const MIDNIGHT_UTC = Date.UTC(2026, 5, 21, 4);

export function getRiverfrontSun(hour: number) {
  const timestamp = MIDNIGHT_UTC + hour * 3_600_000;
  const incomingDirection = getSunDirection(timestamp, CITY_ORIGIN[1], CITY_ORIGIN[0]);
  const position = getSunPosition(timestamp, CITY_ORIGIN[1], CITY_ORIGIN[0]);
  // math.gl returns incoming rays; shadow receivers need the opposite, toward the sun.
  const direction: NumberArray3 = [
    -incomingDirection[0],
    -incomingDirection[1],
    -incomingDirection[2]
  ];
  const warmth = Math.max(0, 1 - direction[2] * 1.6);
  const color: NumberArray3 = [255, 250 - warmth * 58, 238 - warmth * 105];
  return {direction, color, altitude: position.altitude, timestamp};
}

export function formatSunHour(hour: number): string {
  const totalMinutes = Math.round(hour * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')} EDT`;
}
