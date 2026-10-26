// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Exact signs for near-coplanar hull decisions on the stored float32 geometry. */
export function makeExactOrientation(points: readonly (readonly number[])[]) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  const parts = points.map(point =>
    point.map(value => {
      view.setFloat32(0, value);
      const bits = view.getUint32(0);
      const exponent = (bits >>> 23) & 255;
      return {
        mantissa: BigInt((bits & 0x7fffff) | (exponent ? 0x800000 : 0)) * (bits >>> 31 ? -1n : 1n),
        exponent: exponent ? exponent - 150 : -149
      };
    })
  );
  let minimum = 128;
  for (const point of parts)
    for (const part of point) if (part.mantissa !== 0n) minimum = Math.min(minimum, part.exponent);
  const exact = parts.map(point =>
    point.map(part =>
      part.mantissa === 0n ? 0n : part.mantissa << BigInt(part.exponent - minimum)
    )
  );
  return (first: number, second: number, third: number, fourth: number): number => {
    const origin = exact[first];
    const edge = exact[second].map((value, axis) => value - origin[axis]);
    const side = exact[third].map((value, axis) => value - origin[axis]);
    const point = exact[fourth].map((value, axis) => value - origin[axis]);
    const determinant =
      (edge[1] * side[2] - edge[2] * side[1]) * point[0] +
      (edge[2] * side[0] - edge[0] * side[2]) * point[1] +
      (edge[0] * side[1] - edge[1] * side[0]) * point[2];
    return determinant > 0n ? 1 : determinant < 0n ? -1 : 0;
  };
}
