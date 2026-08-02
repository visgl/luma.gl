// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const TWO_PI = Math.PI * 2;

export type SpectralOceanInitialSpectrumProps = {
  resolution: number;
  patchSize: number;
  windDirection: readonly [number, number];
  windSpeed: number;
  amplitude: number;
  gravity: number;
  seed: number;
};

/** Builds deterministic row-major complex h0 values for a Phillips ocean spectrum. */
export function makeSpectralOceanInitialSpectrum(
  props: SpectralOceanInitialSpectrumProps
): Float32Array {
  const values = new Float32Array(props.resolution * props.resolution * 2);
  const random = makeMulberry32(props.seed);
  const waveNumberStep = TWO_PI / props.patchSize;
  const largestWaveLength = (props.windSpeed * props.windSpeed) / props.gravity;
  const smallWaveDampingLength = largestWaveLength * 0.001;
  const inverseTransformScale = props.resolution * props.resolution * waveNumberStep;

  for (let y = 0; y < props.resolution; y++) {
    const signedY = y <= props.resolution / 2 ? y : y - props.resolution;
    for (let x = 0; x < props.resolution; x++) {
      const signedX = x <= props.resolution / 2 ? x : x - props.resolution;
      const waveNumberX = signedX * waveNumberStep;
      const waveNumberZ = signedY * waveNumberStep;
      const waveNumberSquared = waveNumberX * waveNumberX + waveNumberZ * waveNumberZ;
      const outputIndex = (y * props.resolution + x) * 2;

      if (waveNumberSquared === 0) {
        continue;
      }

      const waveNumber = Math.sqrt(waveNumberSquared);
      const directionalAlignment =
        (waveNumberX * props.windDirection[0] + waveNumberZ * props.windDirection[1]) / waveNumber;
      const directionalEnergy = directionalAlignment * directionalAlignment;
      const opposingWindDamping = directionalAlignment < 0 ? 0.07 : 1;
      const largestWaveSuppression = Math.exp(
        -1 / (waveNumberSquared * largestWaveLength * largestWaveLength)
      );
      const smallWaveSuppression = Math.exp(
        -waveNumberSquared * smallWaveDampingLength * smallWaveDampingLength
      );
      const phillipsSpectrum =
        (props.amplitude *
          largestWaveSuppression *
          directionalEnergy *
          opposingWindDamping *
          smallWaveSuppression) /
        (waveNumberSquared * waveNumberSquared);
      const gaussianRadius = Math.sqrt(-2 * Math.log(Math.max(random(), Number.EPSILON)));
      const gaussianAngle = TWO_PI * random();
      const spectralScale = Math.sqrt(phillipsSpectrum * 0.5) * inverseTransformScale;
      values[outputIndex] = gaussianRadius * Math.cos(gaussianAngle) * spectralScale;
      values[outputIndex + 1] = gaussianRadius * Math.sin(gaussianAngle) * spectralScale;
    }
  }

  return values;
}

function makeMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
