// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {makeDeferredPointLightBufferData} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';
import {
  LIGHTSTORM_GRID_SPACING,
  LIGHTSTORM_INSTANCE_WORD_COUNT,
  type LightstormCityData,
  makeLightstormCity
} from '../../examples/showcase/lightstorm-megacity/lightstorm-data';
import {
  getLightstormGuidedCameraSample,
  LIGHTSTORM_CAMERA_FIELD_OF_VIEW,
  type LightstormCameraSample,
  type LightstormGuidedCameraTour,
  makeLightstormGuidedCameraTour
} from '../../examples/showcase/lightstorm-megacity/lightstorm-camera';
import {
  LIGHTSTORM_LIGHT_MARKER_WORD_COUNT,
  LIGHTSTORM_POINT_LIGHT_COUNT,
  makeLightstormLightMarkerBufferData,
  makeLightstormPointLights,
  makeLightstormViewPointLights
} from '../../examples/showcase/lightstorm-megacity/lightstorm-lighting';
import {
  getLightstormLightningSkyPulse,
  LIGHTSTORM_AVENUE_SKY_PULSE_AMPLITUDE,
  LIGHTSTORM_AVENUE_STRIKE_SECONDS,
  LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE,
  LIGHTSTORM_CANYON_STRIKE_SECONDS,
  LIGHTSTORM_LIGHTNING_BOLT_COUNT,
  LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS,
  LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE,
  LIGHTSTORM_LIGHTNING_SCHEDULE,
  LIGHTSTORM_LIGHTNING_SEGMENT_CAPACITY,
  LIGHTSTORM_LIGHTNING_SEGMENT_COUNT,
  LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT,
  LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS,
  LIGHTSTORM_REVEAL_SKY_PULSE_AMPLITUDE,
  LIGHTSTORM_REVEAL_STRIKE_SECONDS,
  makeLightstormLightningBolts,
  makeLightstormLightningBufferData,
  makeLightstormLightningSegments
} from '../../examples/showcase/lightstorm-megacity/lightstorm-lightning';
import {getLightstormThunderStrikeCrossings} from '../../examples/showcase/lightstorm-megacity/lightstorm-thunder';

const LIGHTSTORM_CAMERA_INSTANCE_COUNTS = [50_000, 250_000, 1_000_000] as const;
const LIGHTSTORM_CAMERA_SAMPLES_PER_SECOND = 120;
const LIGHTSTORM_CAMERA_ROOF_CLEARANCE = 8;
const LIGHTSTORM_CAMERA_POSITION_EPSILON = 1e-5;
const LIGHTSTORM_PROJECTION_TEST_ASPECT = 16 / 9;

describe('Lightstorm Megacity data', () => {
  test('creates deterministic, conservatively bounded city records', () => {
    const instanceCount = 4096;
    const firstCity = makeLightstormCity(instanceCount);
    const secondCity = makeLightstormCity(instanceCount);

    expect(firstCity.instances).toEqual(secondCity.instances);
    expect(firstCity.instances.length).toBe(instanceCount * LIGHTSTORM_INSTANCE_WORD_COUNT);
    expect(firstCity.towerCount + firstCity.transitCount).toBe(instanceCount);
    expect(firstCity.towerCount).toBeGreaterThan(firstCity.transitCount);
    expect(firstCity.transitCount).toBeGreaterThan(0);

    for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
      const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
      const radius = firstCity.instances[wordOffset + 3];
      const halfWidth = firstCity.instances[wordOffset + 4];
      const halfHeight = firstCity.instances[wordOffset + 5];
      const halfDepth = firstCity.instances[wordOffset + 6];
      const instanceKind = firstCity.instances[wordOffset + 11];
      expect(Number.isFinite(radius)).toBe(true);
      expect(radius).toBeGreaterThanOrEqual(Math.hypot(halfWidth, halfHeight, halfDepth) - 1e-5);
      expect(instanceKind === 0 || instanceKind === 1).toBe(true);
    }
  });
});

describe('Lightstorm Megacity lighting', () => {
  test('creates a deterministic finite street-light lattice', () => {
    const cityGridSize = 500;
    const firstLights = makeLightstormPointLights(LIGHTSTORM_POINT_LIGHT_COUNT, cityGridSize);
    const secondLights = makeLightstormPointLights(LIGHTSTORM_POINT_LIGHT_COUNT, cityGridSize);

    expect(firstLights).toEqual(secondLights);
    expect(firstLights).toHaveLength(LIGHTSTORM_POINT_LIGHT_COUNT);
    expect(new Set(firstLights.map(light => light.color.join(','))).size).toBe(3);

    for (let lightIndex = 0; lightIndex < firstLights.length; lightIndex++) {
      const light = firstLights[lightIndex]!;
      expect(light.worldPosition.every(Number.isFinite)).toBe(true);
      expect(light.worldPosition[1]).toBeGreaterThan(0.01);
      expect(light.range).toBeGreaterThanOrEqual(16);
      expect(light.range).toBeLessThanOrEqual(24);
      expect(light.color.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
      expect(light.intensity).toBeGreaterThan(0);
      expect(light.intensity).toBeGreaterThanOrEqual(14);
      expect(light.intensity).toBeLessThanOrEqual(24);
      expect(Number.isFinite(light.pulsePhase)).toBe(true);
      expect(light.pulsePhase).toBeGreaterThanOrEqual(0);
      expect(light.pulseFrequency).toBeGreaterThan(0);
      const gridX = light.worldPosition[0] / LIGHTSTORM_GRID_SPACING + (cityGridSize - 1) / 2;
      const gridZ = light.worldPosition[2] / LIGHTSTORM_GRID_SPACING + (cityGridSize - 1) / 2;
      const followsEastWestStreet = Math.floor(lightIndex / 16) % 2 === 0;
      const alongStreetGridIndex = Math.round(followsEastWestStreet ? gridX : gridZ);
      const curbGridCoordinate = followsEastWestStreet ? gridZ : gridX;
      const curbGridIndex = Math.round(curbGridCoordinate);
      expect(isTransitGridIndex(alongStreetGridIndex)).toBe(false);
      expect(isTransitGridIndex(curbGridIndex)).toBe(true);
      expect(Math.abs(curbGridCoordinate - curbGridIndex)).toBeCloseTo(0.375);
      expect(
        curbGridIndex % 12 === 0
          ? curbGridCoordinate < curbGridIndex
          : curbGridCoordinate > curbGridIndex
      ).toBe(true);
    }

    const markerData = makeLightstormLightMarkerBufferData(firstLights);
    expect(markerData).toHaveLength(
      LIGHTSTORM_POINT_LIGHT_COUNT * LIGHTSTORM_LIGHT_MARKER_WORD_COUNT
    );
    for (let lightIndex = 0; lightIndex < firstLights.length; lightIndex++) {
      const light = firstLights[lightIndex]!;
      const wordOffset = lightIndex * LIGHTSTORM_LIGHT_MARKER_WORD_COUNT;
      for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
        expect(markerData[wordOffset + componentIndex]).toBeCloseTo(
          light.worldPosition[componentIndex]!
        );
        expect(markerData[wordOffset + 4 + componentIndex]).toBeCloseTo(
          light.color[componentIndex]!
        );
      }
    }
  });

  test('transforms and packs deterministic view-space point lights', () => {
    const worldLights = makeLightstormPointLights();
    const viewMatrix = new Matrix4().translate([4, -3, 2]);
    const firstViewLights = makeLightstormViewPointLights(worldLights, viewMatrix, 2.75);
    const secondViewLights = makeLightstormViewPointLights(worldLights, viewMatrix, 2.75);

    expect(firstViewLights).toEqual(secondViewLights);
    expect(firstViewLights).toHaveLength(LIGHTSTORM_POINT_LIGHT_COUNT);
    expect(firstViewLights[0]?.position).toEqual(
      Array.from(viewMatrix.transformAsPoint(worldLights[0]!.worldPosition))
    );
    const staticViewLightsAtStart = makeLightstormViewPointLights(
      worldLights,
      viewMatrix,
      0,
      false
    );
    const staticViewLightsLater = makeLightstormViewPointLights(
      worldLights,
      viewMatrix,
      120,
      false
    );
    expect(staticViewLightsAtStart).toEqual(staticViewLightsLater);
    expect(staticViewLightsAtStart.map(light => light.intensity)).toEqual(
      worldLights.map(light => light.intensity)
    );
    for (let lightIndex = 0; lightIndex < firstViewLights.length; lightIndex++) {
      const light = firstViewLights[lightIndex]!;
      const worldLight = worldLights[lightIndex]!;
      expect(light.position.every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(light.range)).toBe(true);
      expect(light.range).toBeGreaterThan(0);
      expect(light.color.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
      expect(Number.isFinite(light.intensity)).toBe(true);
      expect(light.intensity).toBeGreaterThanOrEqual(worldLight.intensity * 0.93);
      expect(light.intensity).toBeLessThanOrEqual(worldLight.intensity * 1.07);
    }

    const packedLights = makeDeferredPointLightBufferData(
      firstViewLights,
      LIGHTSTORM_POINT_LIGHT_COUNT
    );
    expect(packedLights).toHaveLength(LIGHTSTORM_POINT_LIGHT_COUNT * 8);
    expect(Array.from(packedLights).every(Number.isFinite)).toBe(true);
  });
});

describe('Lightstorm Megacity guided camera', () => {
  test.each(
    LIGHTSTORM_CAMERA_INSTANCE_COUNTS
  )('keeps the full 120 Hz loop finite and collision-free for %i instances', instanceCount => {
    const city = makeLightstormCity(instanceCount);
    const tour = makeLightstormGuidedCameraTour(city);

    expect(tour.duration).toBe(29);
    expect(getLightstormGuidedCameraSample(tour, tour.duration)).toEqual(
      getLightstormGuidedCameraSample(tour, 0)
    );
    expect(getLightstormGuidedCameraSample(tour, -tour.duration)).toEqual(
      getLightstormGuidedCameraSample(tour, 0)
    );
    expectCameraSamplesClose(
      getLightstormGuidedCameraSample(tour, tour.duration * 1.37),
      getLightstormGuidedCameraSample(tour, tour.duration * 0.37)
    );

    expectElevatedAvenueProperties(tour);
    expectRevealSkyscraperProperties(city, tour);

    const sampleCount = Math.round(tour.duration * LIGHTSTORM_CAMERA_SAMPLES_PER_SECOND);
    const invalidSamples: string[] = [];
    const intersectingSamples: string[] = [];
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const timeSeconds = sampleIndex / LIGHTSTORM_CAMERA_SAMPLES_PER_SECOND;
      const sample = getLightstormGuidedCameraSample(tour, timeSeconds);
      const numericValues = [
        ...sample.eye,
        ...sample.target,
        sample.yaw,
        sample.pitch,
        sample.distance,
        sample.duration
      ];
      const isFiniteSample = numericValues.every(Number.isFinite) && sample.distance > 0;
      const isOnAvenue = isCameraOnGuidedAvenue(sample.eye, tour);
      const isAboveRoofClearance =
        sample.eye[1] >=
        tour.maximumRoofHeight +
          LIGHTSTORM_CAMERA_ROOF_CLEARANCE -
          LIGHTSTORM_CAMERA_POSITION_EPSILON;
      if (!isFiniteSample || (!isOnAvenue && !isAboveRoofClearance)) {
        if (invalidSamples.length < 10) {
          invalidSamples.push(`${timeSeconds.toFixed(4)}s (${sample.shot})`);
        }
      }

      const towerIndex = findIntersectingTowerIndex(city, sample.eye);
      if (towerIndex !== null && intersectingSamples.length < 10) {
        intersectingSamples.push(
          `${timeSeconds.toFixed(4)}s (${sample.shot}, tower ${towerIndex})`
        );
      }
    }

    expect(invalidSamples).toEqual([]);
    expect(intersectingSamples).toEqual([]);
  });
});

describe('Lightstorm Megacity lightning', () => {
  test('aligns named bolt phases with sky-visible camera beats', () => {
    const tour = makeLightstormGuidedCameraTour(makeLightstormCity(250_000));
    const canyonBolt = LIGHTSTORM_LIGHTNING_SCHEDULE.find(bolt => bolt.role === 'canyon')!;
    const avenueBolt = LIGHTSTORM_LIGHTNING_SCHEDULE.find(bolt => bolt.role === 'avenue')!;
    const revealBolt = LIGHTSTORM_LIGHTNING_SCHEDULE.find(bolt => bolt.role === 'reveal')!;
    const expectedBeats = [
      {
        bolt: canyonBolt,
        phaseSeconds: LIGHTSTORM_CANYON_STRIKE_SECONDS,
        shot: 'elevated avenue ingress'
      },
      {
        bolt: avenueBolt,
        phaseSeconds: LIGHTSTORM_AVENUE_STRIKE_SECONDS,
        shot: 'avenue turn'
      },
      {
        bolt: revealBolt,
        phaseSeconds: LIGHTSTORM_REVEAL_STRIKE_SECONDS,
        shot: 'vertical reveal'
      }
    ];

    expect(LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS).toBe(tour.duration);
    expect(LIGHTSTORM_LIGHTNING_SCHEDULE.map(bolt => bolt.role)).toEqual([
      'canyon',
      'avenue',
      'reveal'
    ]);
    for (const {bolt, phaseSeconds, shot} of expectedBeats) {
      expect(bolt.phaseSeconds).toBe(phaseSeconds);
      expect(bolt.periodSeconds).toBe(tour.duration);
      expect(getLightstormGuidedCameraSample(tour, bolt.phaseSeconds).shot).toBe(shot);
    }
  });

  test.each(
    LIGHTSTORM_CAMERA_INSTANCE_COUNTS
  )('keeps every bolt camera-framed for %i instances', instanceCount => {
    const tour = makeLightstormGuidedCameraTour(makeLightstormCity(instanceCount));
    const bolts = makeLightstormLightningBolts(tour, LIGHTSTORM_PROJECTION_TEST_ASPECT);
    const revealBolt = bolts.find(bolt => bolt.role === 'reveal')!;
    const standardBolts = bolts.filter(bolt => bolt.role !== 'reveal');
    const maximumStandardWidth = Math.max(...standardBolts.map(bolt => bolt.width));
    const maximumStandardIntensity = Math.max(...standardBolts.map(bolt => bolt.intensity));
    const projectedFrames = bolts.map(bolt => getProjectedLightningBoltFrame(bolt, tour));
    const standardProjectedSpans = projectedFrames
      .filter((_, boltIndex) => bolts[boltIndex]!.role !== 'reveal')
      .map(frame => frame.horizontalSpan);
    const revealProjectedSpan = projectedFrames[bolts.indexOf(revealBolt)]!.horizontalSpan;

    expect(bolts).toHaveLength(LIGHTSTORM_LIGHTNING_BOLT_COUNT);
    expect(bolts.map(bolt => bolt.role)).toEqual(['canyon', 'avenue', 'reveal']);
    for (const frame of projectedFrames) {
      for (const point of [frame.start, frame.end]) {
        expect(point[0]).toBeGreaterThan(-0.95);
        expect(point[0]).toBeLessThan(0.95);
        expect(point[1]).toBeGreaterThan(0.1);
        expect(point[1]).toBeLessThan(0.95);
        expect(point[2]).toBeGreaterThan(-1);
        expect(point[2]).toBeLessThan(1);
      }
      expect(frame.start[1]).toBeGreaterThan(frame.end[1]);
    }

    expect(standardBolts.map(bolt => bolt.sizeScale)).toEqual([1, 1]);
    expect(standardProjectedSpans.every(Number.isFinite)).toBe(true);
    expect(revealBolt.sizeScale).toBe(2);
    expect(revealProjectedSpan).toBeGreaterThan(1.4);
    expect(revealProjectedSpan).toBeLessThan(1.65);
    expect(revealProjectedSpan).toBeGreaterThan(Math.max(...standardProjectedSpans) * 4);
    expect(revealBolt.width).toBeGreaterThan(maximumStandardWidth * 1.75);
    expect(revealBolt.intensity).toBeGreaterThan(maximumStandardIntensity * 1.7);

    const segments = makeLightstormLightningSegments(bolts);
    const bufferData = makeLightstormLightningBufferData(segments);
    expect(segments).toHaveLength(LIGHTSTORM_LIGHTNING_SEGMENT_COUNT);
    expect(bufferData).toHaveLength(
      LIGHTSTORM_LIGHTNING_SEGMENT_COUNT * LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT
    );
    expect(Array.from(bufferData).every(Number.isFinite)).toBe(true);
  });

  test('produces role-scaled deterministic double pulses for every strike', () => {
    const pulseDefinitions = [
      {
        phaseSeconds: LIGHTSTORM_CANYON_STRIKE_SECONDS,
        amplitude: LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE
      },
      {
        phaseSeconds: LIGHTSTORM_AVENUE_STRIKE_SECONDS,
        amplitude: LIGHTSTORM_AVENUE_SKY_PULSE_AMPLITUDE
      },
      {
        phaseSeconds: LIGHTSTORM_REVEAL_STRIKE_SECONDS,
        amplitude: LIGHTSTORM_REVEAL_SKY_PULSE_AMPLITUDE
      }
    ];

    expect(LIGHTSTORM_REVEAL_SKY_PULSE_AMPLITUDE).toBeGreaterThan(
      LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE
    );
    expect(LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE).toBeGreaterThan(
      LIGHTSTORM_AVENUE_SKY_PULSE_AMPLITUDE
    );
    for (const {phaseSeconds, amplitude} of pulseDefinitions) {
      const firstPulse = getLightstormLightningSkyPulse(phaseSeconds);
      const returnPulse = getLightstormLightningSkyPulse(
        phaseSeconds + LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS
      );
      const pulseTrough = getLightstormLightningSkyPulse(
        phaseSeconds + LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS / 2
      );
      expect(firstPulse).toBeCloseTo(amplitude, 10);
      expect(returnPulse).toBeCloseTo(amplitude * LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE, 10);
      expect(pulseTrough).toBeLessThan(amplitude * 0.15);
      expect(
        getLightstormLightningSkyPulse(phaseSeconds + LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS)
      ).toBeCloseTo(firstPulse, 10);
      expect(getLightstormLightningSkyPulse(phaseSeconds, false)).toBe(0);
    }
    expect(getLightstormLightningSkyPulse(Number.NaN)).toBe(0);

    for (
      let sampleIndex = 0;
      sampleIndex < LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS * 240;
      sampleIndex++
    ) {
      const pulse = getLightstormLightningSkyPulse(sampleIndex / 240);
      expect(Number.isFinite(pulse)).toBe(true);
      expect(pulse).toBeGreaterThanOrEqual(0);
      expect(pulse).toBeLessThanOrEqual(1);
    }
  });

  test('creates deterministic, finite, connected bolt and branch segments', () => {
    const tour = makeLightstormGuidedCameraTour(makeLightstormCity(250_000));
    const bolts = makeLightstormLightningBolts(tour, LIGHTSTORM_PROJECTION_TEST_ASPECT);
    const firstSegments = makeLightstormLightningSegments(bolts);
    const secondSegments = makeLightstormLightningSegments(bolts);

    expect(firstSegments).toEqual(secondSegments);
    expect(firstSegments).toHaveLength(LIGHTSTORM_LIGHTNING_SEGMENT_COUNT);
    expect(firstSegments.length).toBeLessThanOrEqual(LIGHTSTORM_LIGHTNING_SEGMENT_CAPACITY);
    expect(bolts).toHaveLength(LIGHTSTORM_LIGHTNING_BOLT_COUNT);

    let boltSegmentOffset = 0;
    for (let boltIndex = 0; boltIndex < bolts.length; boltIndex++) {
      const bolt = bolts[boltIndex]!;
      const trunkSegments = firstSegments.slice(
        boltSegmentOffset,
        boltSegmentOffset + bolt.segmentCount
      );
      expect(trunkSegments[0]!.start).toEqual(bolt.start);
      expect(trunkSegments.at(-1)!.end).toEqual(bolt.end);
      expectConnectedSegments(trunkSegments);

      for (let branchIndex = 0; branchIndex < bolt.branchNodeIndices.length; branchIndex++) {
        const branchOffset =
          boltSegmentOffset + bolt.segmentCount + branchIndex * bolt.branchSegmentCount;
        const branchSegments = firstSegments.slice(
          branchOffset,
          branchOffset + bolt.branchSegmentCount
        );
        const branchNodeIndex = bolt.branchNodeIndices[branchIndex]!;
        const branchStart =
          branchNodeIndex === bolt.segmentCount
            ? trunkSegments.at(-1)!.end
            : trunkSegments[branchNodeIndex]!.start;
        expect(branchSegments[0]!.start).toEqual(branchStart);
        expectConnectedSegments(branchSegments);
      }

      const boltSegmentCount =
        bolt.segmentCount + bolt.branchNodeIndices.length * bolt.branchSegmentCount;
      const boltSegments = firstSegments.slice(
        boltSegmentOffset,
        boltSegmentOffset + boltSegmentCount
      );
      for (const segment of boltSegments) {
        expect(
          [
            ...segment.start,
            ...segment.end,
            segment.width,
            segment.seed,
            ...segment.color,
            segment.intensity,
            segment.phaseSeconds,
            segment.periodSeconds,
            segment.branchLevel,
            segment.boltIndex
          ].every(Number.isFinite)
        ).toBe(true);
        expect(segment.boltIndex).toBe(boltIndex);
        expect(segment.branchLevel === 0 || segment.branchLevel === 1).toBe(true);
        expect(segment.width).toBeGreaterThan(0);
        expect(segment.intensity).toBeGreaterThan(0);
        expect(segment.periodSeconds).toBeGreaterThan(0);
        expect(segment.seed).toBeGreaterThanOrEqual(0);
        expect(segment.seed).toBeLessThan(1);
      }
      boltSegmentOffset += boltSegmentCount;
    }
    expect(boltSegmentOffset).toBe(firstSegments.length);
  });

  test('packs every lightning segment into the shader-aligned buffer layout', () => {
    const tour = makeLightstormGuidedCameraTour(makeLightstormCity(250_000));
    const bolts = makeLightstormLightningBolts(tour, LIGHTSTORM_PROJECTION_TEST_ASPECT);
    const segments = makeLightstormLightningSegments(bolts);
    const bufferData = makeLightstormLightningBufferData(segments);
    const expectedData = new Float32Array(
      segments.flatMap(segment => [
        ...segment.start,
        segment.width,
        ...segment.end,
        segment.seed,
        ...segment.color,
        segment.intensity,
        segment.phaseSeconds,
        segment.periodSeconds,
        segment.branchLevel,
        segment.boltIndex
      ])
    );

    expect(bufferData).toHaveLength(segments.length * LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT);
    expect(bufferData).toEqual(expectedData);
    expect(Array.from(bufferData).every(Number.isFinite)).toBe(true);
  });
});

describe('Lightstorm Megacity thunder schedule', () => {
  test('emits one event for each primary strike without double-firing return strokes', () => {
    for (const bolt of LIGHTSTORM_LIGHTNING_SCHEDULE) {
      const primaryCrossings = getLightstormThunderStrikeCrossings(
        bolt.phaseSeconds - 0.01,
        bolt.phaseSeconds + 0.01
      );
      expect(primaryCrossings).toHaveLength(1);
      expect(primaryCrossings[0]).toMatchObject({
        boltIndex: LIGHTSTORM_LIGHTNING_SCHEDULE.indexOf(bolt),
        role: bolt.role,
        strikeTimeSeconds: bolt.phaseSeconds
      });
      expect(primaryCrossings[0]!.strength).toBeGreaterThan(0);

      const returnStrokeTimeSeconds =
        bolt.phaseSeconds + LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS;
      expect(
        getLightstormThunderStrikeCrossings(
          returnStrokeTimeSeconds - 0.01,
          returnStrokeTimeSeconds + 0.01
        )
      ).toEqual([]);
    }
  });

  test('schedules one event per role across loop wrap and timeline restart', () => {
    const firstLoopCrossings = getLightstormThunderStrikeCrossings(
      0,
      LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS
    );
    const secondLoopCrossings = getLightstormThunderStrikeCrossings(
      LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS,
      LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS * 2
    );
    const expectedRoles = LIGHTSTORM_LIGHTNING_SCHEDULE.map(bolt => bolt.role);

    expect(firstLoopCrossings.map(crossing => crossing.role)).toEqual(expectedRoles);
    expect(firstLoopCrossings.map(crossing => crossing.strikeTimeSeconds)).toEqual(
      LIGHTSTORM_LIGHTNING_SCHEDULE.map(bolt => bolt.phaseSeconds)
    );
    expect(secondLoopCrossings.map(crossing => crossing.role)).toEqual(expectedRoles);
    expect(secondLoopCrossings.map(crossing => crossing.strikeTimeSeconds)).toEqual(
      LIGHTSTORM_LIGHTNING_SCHEDULE.map(
        bolt => bolt.phaseSeconds + LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS
      )
    );

    const strengthByRole = Object.fromEntries(
      firstLoopCrossings.map(crossing => [crossing.role, crossing.strength])
    );
    expect(strengthByRole.reveal!).toBeGreaterThan(strengthByRole.canyon!);
    expect(strengthByRole.canyon!).toBeGreaterThan(strengthByRole.avenue!);

    expect(
      getLightstormThunderStrikeCrossings(LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS - 0.01, 0.01)
    ).toEqual([]);
    expect(getLightstormThunderStrikeCrossings(null, 0.01)).toEqual([]);
    expect(
      getLightstormThunderStrikeCrossings(0.01, LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS)
    ).toEqual(firstLoopCrossings);
    expect(
      getLightstormThunderStrikeCrossings(0, LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS, false)
    ).toEqual([]);
    expect(
      getLightstormThunderStrikeCrossings(Number.NaN, LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS)
    ).toEqual([]);
  });
});

function isTransitGridIndex(gridIndex: number): boolean {
  const wrappedGridIndex = ((gridIndex % 12) + 12) % 12;
  return wrappedGridIndex <= 1;
}

function expectCameraSamplesClose(
  firstSample: LightstormCameraSample,
  secondSample: LightstormCameraSample
): void {
  expect(firstSample.shot).toBe(secondSample.shot);
  expect(firstSample.duration).toBe(secondSample.duration);
  const firstValues = [
    ...firstSample.eye,
    ...firstSample.target,
    firstSample.yaw,
    firstSample.pitch,
    firstSample.distance
  ];
  const secondValues = [
    ...secondSample.eye,
    ...secondSample.target,
    secondSample.yaw,
    secondSample.pitch,
    secondSample.distance
  ];
  for (let valueIndex = 0; valueIndex < firstValues.length; valueIndex++) {
    expect(firstValues[valueIndex]).toBeCloseTo(secondValues[valueIndex]!, 10);
  }
}

function expectRevealSkyscraperProperties(
  city: LightstormCityData,
  tour: LightstormGuidedCameraTour
): void {
  const selectedTowerIndex = findTowerIndexAtPosition(city, tour.skyscraper.position);
  expect(selectedTowerIndex).not.toBeNull();
  const selectedTowerOffset = selectedTowerIndex! * LIGHTSTORM_INSTANCE_WORD_COUNT;
  const selectedTowerRoofHeight =
    city.instances[selectedTowerOffset + 1]! + city.instances[selectedTowerOffset + 5]!;
  expect(city.instances[selectedTowerOffset + 11]).toBe(0);
  expect(tour.skyscraper.roofHeight).toBeCloseTo(selectedTowerRoofHeight);
  expect(tour.skyscraper.roofHeight).toBeLessThanOrEqual(tour.maximumRoofHeight);
  expect(Math.abs(tour.skyscraper.position[2] - tour.secondaryAvenue)).toBeLessThanOrEqual(6);
  expect(Math.abs(tour.skyscraper.position[0])).toBeLessThanOrEqual(
    Math.min(120, city.fieldHalfExtent * 0.45)
  );

  const approachPose = tour.poses.find(pose => pose.shot === 'skyscraper approach')!;
  const verticalRevealPose = tour.poses.find(pose => pose.shot === 'vertical reveal')!;
  const crownRevealPose = tour.poses.find(pose => pose.shot === 'crown reveal')!;
  for (const pose of [approachPose, verticalRevealPose, crownRevealPose]) {
    expect(pose.target[0]).toBeCloseTo(tour.skyscraper.position[0]);
    expect(pose.target[2]).toBeCloseTo(tour.skyscraper.position[2]);
  }
  expect(approachPose.target[1]).toBeLessThan(verticalRevealPose.target[1]);
  expect(verticalRevealPose.target[1]).toBeLessThan(crownRevealPose.target[1]);
  expect(crownRevealPose.target[1]).toBeGreaterThanOrEqual(tour.skyscraper.roofHeight * 0.9);
  expect(crownRevealPose.target[1]).toBeLessThanOrEqual(tour.skyscraper.roofHeight);
  expect(crownRevealPose.eye[1]).toBeCloseTo(
    tour.maximumRoofHeight + LIGHTSTORM_CAMERA_ROOF_CLEARANCE
  );
}

function expectElevatedAvenueProperties(tour: LightstormGuidedCameraTour): void {
  const elevatedShotNames = [
    'elevated avenue ingress',
    'first intersection',
    'avenue turn',
    'second intersection',
    'skyscraper turn'
  ];
  const elevatedPoses = elevatedShotNames.map(
    shotName => tour.poses.find(pose => pose.shot === shotName)!
  );
  for (const pose of elevatedPoses) {
    expect(pose.eye[1]).toBe(16);
    expect(pose.target[1]).toBe(12);
  }

  const skyscraperApproachPose = tour.poses.find(pose => pose.shot === 'skyscraper approach')!;
  const verticalRevealPose = tour.poses.find(pose => pose.shot === 'vertical reveal')!;
  expect(skyscraperApproachPose.eye[1]).toBe(12);
  expect(skyscraperApproachPose.eye[1]).toBeGreaterThan(verticalRevealPose.eye[1]);
}

function isCameraOnGuidedAvenue(
  eye: readonly [number, number, number],
  tour: LightstormGuidedCameraTour
): boolean {
  return [eye[0], eye[2]].some(
    coordinate =>
      Math.abs(coordinate - tour.primaryAvenue) <= LIGHTSTORM_CAMERA_POSITION_EPSILON ||
      Math.abs(coordinate - tour.secondaryAvenue) <= LIGHTSTORM_CAMERA_POSITION_EPSILON
  );
}

function findIntersectingTowerIndex(
  city: LightstormCityData,
  eye: readonly [number, number, number]
): number | null {
  const centeredGridCoordinate = (city.gridSize - 1) / 2;
  const nearestGridX = Math.round(eye[0] / LIGHTSTORM_GRID_SPACING + centeredGridCoordinate);
  const nearestGridZ = Math.round(eye[2] / LIGHTSTORM_GRID_SPACING + centeredGridCoordinate);

  for (let gridZ = nearestGridZ - 2; gridZ <= nearestGridZ + 2; gridZ++) {
    for (let gridX = nearestGridX - 2; gridX <= nearestGridX + 2; gridX++) {
      const instanceIndex = gridZ * city.gridSize + gridX;
      if (
        gridX < 0 ||
        gridX >= city.gridSize ||
        gridZ < 0 ||
        gridZ >= city.gridSize ||
        instanceIndex < 0 ||
        instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT >= city.instances.length
      ) {
        continue;
      }
      const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
      if (city.instances[wordOffset + 11] !== 0) {
        continue;
      }
      const centerX = city.instances[wordOffset]!;
      const centerY = city.instances[wordOffset + 1]!;
      const centerZ = city.instances[wordOffset + 2]!;
      const halfWidth = city.instances[wordOffset + 4]!;
      const halfHeight = city.instances[wordOffset + 5]!;
      const halfDepth = city.instances[wordOffset + 6]!;
      if (
        Math.abs(eye[0] - centerX) <= halfWidth &&
        Math.abs(eye[1] - centerY) <= halfHeight &&
        Math.abs(eye[2] - centerZ) <= halfDepth
      ) {
        return instanceIndex;
      }
    }
  }
  return null;
}

function findTowerIndexAtPosition(
  city: LightstormCityData,
  position: readonly [number, number, number]
): number | null {
  const centeredGridCoordinate = (city.gridSize - 1) / 2;
  const nearestGridX = Math.round(position[0] / LIGHTSTORM_GRID_SPACING + centeredGridCoordinate);
  const nearestGridZ = Math.round(position[2] / LIGHTSTORM_GRID_SPACING + centeredGridCoordinate);
  for (let gridZ = nearestGridZ - 1; gridZ <= nearestGridZ + 1; gridZ++) {
    for (let gridX = nearestGridX - 1; gridX <= nearestGridX + 1; gridX++) {
      if (gridX < 0 || gridX >= city.gridSize || gridZ < 0 || gridZ >= city.gridSize) {
        continue;
      }
      const instanceIndex = gridZ * city.gridSize + gridX;
      const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
      if (
        instanceIndex < 0 ||
        wordOffset >= city.instances.length ||
        city.instances[wordOffset + 11] !== 0
      ) {
        continue;
      }
      const matchesPosition = [0, 1, 2].every(
        componentIndex => city.instances[wordOffset + componentIndex] === position[componentIndex]
      );
      if (matchesPosition) {
        return instanceIndex;
      }
    }
  }
  return null;
}

function expectConnectedSegments(
  segments: readonly {
    start: readonly [number, number, number];
    end: readonly [number, number, number];
  }[]
): void {
  for (let segmentIndex = 1; segmentIndex < segments.length; segmentIndex++) {
    expect(segments[segmentIndex]!.start).toEqual(segments[segmentIndex - 1]!.end);
  }
}

function getProjectedLightningBoltFrame(
  bolt: {start: readonly number[]; end: readonly number[]; phaseSeconds: number},
  tour: LightstormGuidedCameraTour
): {
  start: [number, number, number];
  end: [number, number, number];
  horizontalSpan: number;
} {
  const cameraSample = getLightstormGuidedCameraSample(tour, bolt.phaseSeconds);
  const viewMatrix = new Matrix4().lookAt({
    eye: cameraSample.eye,
    center: cameraSample.target,
    up: [0, 1, 0]
  });
  const projectionMatrix = new Matrix4().perspective({
    fovy: LIGHTSTORM_CAMERA_FIELD_OF_VIEW,
    aspect: LIGHTSTORM_PROJECTION_TEST_ASPECT,
    near: 0.1,
    far: 1800
  });
  const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
  const startClip = viewProjectionMatrix.transform([...bolt.start, 1]);
  const endClip = viewProjectionMatrix.transform([...bolt.end, 1]);
  expect(startClip[3]).toBeGreaterThan(0);
  expect(endClip[3]).toBeGreaterThan(0);
  const start: [number, number, number] = [
    startClip[0]! / startClip[3]!,
    startClip[1]! / startClip[3]!,
    startClip[2]! / startClip[3]!
  ];
  const end: [number, number, number] = [
    endClip[0]! / endClip[3]!,
    endClip[1]! / endClip[3]!,
    endClip[2]! / endClip[3]!
  ];
  return {start, end, horizontalSpan: Math.abs(start[0] - end[0])};
}
