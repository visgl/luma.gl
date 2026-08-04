// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Resident row count used when the showcase does not request a larger population. */
export const DEFAULT_CROSSFILTER_ROW_COUNT = 262_144;

/** Stable domain shared by the geographic brush, point renderer, and dashboard overlay. */
export const CROSS_FILTER_MAP_DOMAIN = {
  x: [-1, 1],
  y: [-1, 1]
} as const;

/** Literal scalar domains used for linked brushing and GPU histogram accumulation. */
export const CROSS_FILTER_DOMAINS = {
  value: [0, 250],
  risk: [0, 1],
  hour: [0, 24]
} as const;

/** Dense group labels matching the unsigned category values uploaded to the GPU. */
export const CROSS_FILTER_CATEGORY_NAMES = [
  'Commerce',
  'Transit',
  'Dining',
  'Healthcare',
  'Nightlife',
  'International'
] as const;

/** CPU-side upload fixture; the engine releases these arrays after its initial GPU upload. */
export type CrossfilterDataset = {
  rowCount: number;
  longitude: Float32Array;
  latitude: Float32Array;
  value: Float32Array;
  risk: Float32Array;
  hour: Float32Array;
  category: Uint32Array;
};

/** Deterministic population controls suitable for reproducible visual and node-side tests. */
export type CrossfilterDatasetOptions = {
  rowCount?: number;
  seed?: number;
};

/** Cooperative population controls keep browser navigation responsive during large uploads. */
export type CrossfilterAsyncDatasetOptions = CrossfilterDatasetOptions & {
  batchRowCount?: number;
  onProgress?: (completedRowCount: number, totalRowCount: number) => void;
  signal?: AbortSignal;
  yieldControl?: () => Promise<void>;
};

const DEFAULT_CROSSFILTER_BATCH_ROW_COUNT = 16_384;

type CityCluster = {
  longitude: number;
  latitude: number;
  longitudeRadius: number;
  latitudeRadius: number;
  valueOffset: number;
  riskOffset: number;
  preferredCategory: number;
};

/** Synthetic global metropolitan transaction clusters in normalized map coordinates. */
const CITY_CLUSTERS: readonly CityCluster[] = [
  {
    longitude: -0.64,
    latitude: -0.68,
    longitudeRadius: 0.13,
    latitudeRadius: 0.18,
    valueOffset: 34,
    riskOffset: 0.1,
    preferredCategory: 0
  },
  {
    longitude: -0.47,
    latitude: -0.43,
    longitudeRadius: 0.11,
    latitudeRadius: 0.19,
    valueOffset: 61,
    riskOffset: 0.14,
    preferredCategory: 2
  },
  {
    longitude: -0.3,
    latitude: -0.18,
    longitudeRadius: 0.12,
    latitudeRadius: 0.2,
    valueOffset: 79,
    riskOffset: 0.17,
    preferredCategory: 0
  },
  {
    longitude: -0.12,
    latitude: 0.09,
    longitudeRadius: 0.12,
    latitudeRadius: 0.19,
    valueOffset: 104,
    riskOffset: 0.2,
    preferredCategory: 0
  },
  {
    longitude: 0.09,
    latitude: 0.4,
    longitudeRadius: 0.13,
    latitudeRadius: 0.2,
    valueOffset: 84,
    riskOffset: 0.13,
    preferredCategory: 3
  },
  {
    longitude: 0.17,
    latitude: -0.41,
    longitudeRadius: 0.23,
    latitudeRadius: 0.21,
    valueOffset: 43,
    riskOffset: 0.22,
    preferredCategory: 4
  },
  {
    longitude: 0.48,
    latitude: 0.03,
    longitudeRadius: 0.2,
    latitudeRadius: 0.18,
    valueOffset: 57,
    riskOffset: 0.16,
    preferredCategory: 1
  },
  {
    longitude: 0.74,
    latitude: -0.67,
    longitudeRadius: 0.16,
    latitudeRadius: 0.13,
    valueOffset: 121,
    riskOffset: 0.29,
    preferredCategory: 5
  },
  {
    longitude: 0.62,
    latitude: 0.48,
    longitudeRadius: 0.15,
    latitudeRadius: 0.14,
    valueOffset: 96,
    riskOffset: 0.24,
    preferredCategory: 5
  }
];

/**
 * Builds correlated city, transaction, time, and category columns from a reproducible seed.
 *
 * Every row is derived directly from its seed and index, so population size does not alter the
 * shared prefix. No external data or network requests are needed for the standalone showcase.
 */
export function makeCrossfilterDataset(
  options: CrossfilterDatasetOptions = {}
): CrossfilterDataset {
  const dataset = allocateCrossfilterDataset(options.rowCount);
  populateCrossfilterDataset(dataset, options.seed, 0, dataset.rowCount);
  return dataset;
}

/** Builds exactly the same deterministic columns while yielding between bounded CPU batches. */
export async function makeCrossfilterDatasetAsync(
  options: CrossfilterAsyncDatasetOptions = {}
): Promise<CrossfilterDataset> {
  options.signal?.throwIfAborted();
  const batchRowCount = options.batchRowCount ?? DEFAULT_CROSSFILTER_BATCH_ROW_COUNT;
  if (!Number.isSafeInteger(batchRowCount) || batchRowCount <= 0) {
    throw new Error('Crossfilter showcase requires a positive, integral batch row count');
  }

  const dataset = allocateCrossfilterDataset(options.rowCount);
  for (let completedRowCount = 0; completedRowCount < dataset.rowCount; ) {
    const nextCompletedRowCount = Math.min(completedRowCount + batchRowCount, dataset.rowCount);
    populateCrossfilterDataset(dataset, options.seed, completedRowCount, nextCompletedRowCount);
    completedRowCount = nextCompletedRowCount;
    options.onProgress?.(completedRowCount, dataset.rowCount);
    options.signal?.throwIfAborted();

    if (completedRowCount < dataset.rowCount) {
      await (options.yieldControl ?? yieldCrossfilterMainThread)();
      options.signal?.throwIfAborted();
    }
  }

  return dataset;
}

function allocateCrossfilterDataset(requestedRowCount?: number): CrossfilterDataset {
  const rowCount = requestedRowCount ?? DEFAULT_CROSSFILTER_ROW_COUNT;
  if (!Number.isSafeInteger(rowCount) || rowCount <= 0) {
    throw new Error('Crossfilter showcase requires a positive, integral row count');
  }

  return {
    rowCount,
    longitude: new Float32Array(rowCount),
    latitude: new Float32Array(rowCount),
    value: new Float32Array(rowCount),
    risk: new Float32Array(rowCount),
    hour: new Float32Array(rowCount),
    category: new Uint32Array(rowCount)
  };
}

function populateCrossfilterDataset(
  dataset: CrossfilterDataset,
  requestedSeed: number | undefined,
  firstRowIndex: number,
  finalRowIndex: number
): void {
  const seed = (requestedSeed ?? 0x1a2b3c4d) >>> 0;
  const {longitude, latitude, value, risk, hour, category} = dataset;

  for (let rowIndex = firstRowIndex; rowIndex < finalRowIndex; rowIndex++) {
    const clusterRandom = makeRandomValue(seed, rowIndex, 0);
    const clusterIndex = Math.min(
      CITY_CLUSTERS.length - 1,
      Math.floor(clusterRandom * clusterRandom * CITY_CLUSTERS.length)
    );
    const cluster = CITY_CLUSTERS[clusterIndex];
    const longitudeSpread =
      makeRandomValue(seed, rowIndex, 1) + makeRandomValue(seed, rowIndex, 2) - 1;
    const latitudeSpread =
      makeRandomValue(seed, rowIndex, 3) + makeRandomValue(seed, rowIndex, 4) - 1;
    const categoryRandom = makeRandomValue(seed, rowIndex, 5);
    const categoryIndex =
      categoryRandom < 0.69
        ? cluster.preferredCategory
        : Math.floor(makeRandomValue(seed, rowIndex, 6) * CROSS_FILTER_CATEGORY_NAMES.length);
    const hourRandom = makeRandomValue(seed, rowIndex, 7);
    const rushHour = hourRandom < 0.54 ? 8.5 : categoryIndex === 4 ? 21 : 17.5;
    const hourSpread =
      (makeRandomValue(seed, rowIndex, 8) + makeRandomValue(seed, rowIndex, 9) - 1) * 8.4;
    const transactionHour = positiveModulo(rushHour + hourSpread, 24);
    const valueNoise =
      (makeRandomValue(seed, rowIndex, 10) + makeRandomValue(seed, rowIndex, 11)) * 42;
    const transactionValue = clamp(
      cluster.valueOffset + valueNoise + categoryIndex * 8 + (transactionHour > 19 ? 19 : 0),
      CROSS_FILTER_DOMAINS.value[0] + 0.01,
      CROSS_FILTER_DOMAINS.value[1] - 0.01
    );
    const transactionRisk = clamp(
      cluster.riskOffset +
        transactionValue * 0.0023 +
        (transactionHour < 6 || transactionHour > 20 ? 0.18 : 0) +
        (categoryIndex === 5 ? 0.16 : 0) +
        (makeRandomValue(seed, rowIndex, 12) - 0.5) * 0.27,
      CROSS_FILTER_DOMAINS.risk[0] + 0.002,
      CROSS_FILTER_DOMAINS.risk[1] - 0.002
    );

    longitude[rowIndex] = clamp(
      cluster.longitude + longitudeSpread * cluster.longitudeRadius + latitudeSpread * 0.055,
      CROSS_FILTER_MAP_DOMAIN.x[0] + 0.005,
      CROSS_FILTER_MAP_DOMAIN.x[1] - 0.005
    );
    latitude[rowIndex] = clamp(
      cluster.latitude + latitudeSpread * cluster.latitudeRadius + longitudeSpread * 0.04,
      CROSS_FILTER_MAP_DOMAIN.y[0] + 0.005,
      CROSS_FILTER_MAP_DOMAIN.y[1] - 0.005
    );
    value[rowIndex] = transactionValue;
    risk[rowIndex] = transactionRisk;
    hour[rowIndex] = transactionHour;
    category[rowIndex] = categoryIndex;
  }
}

function yieldCrossfilterMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function makeRandomValue(seed: number, rowIndex: number, streamIndex: number): number {
  let state = seed ^ Math.imul(rowIndex + 1, 0x9e3779b1) ^ Math.imul(streamIndex + 1, 0x85ebca6b);
  state = Math.imul(state ^ (state >>> 16), 0x7feb352d);
  state = Math.imul(state ^ (state >>> 15), 0x846ca68b);
  return ((state ^ (state >>> 16)) >>> 0) / 0x100000000;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
