// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {SWITCH_POSITIONS} from '../../examples/showcase/packet-spraying/network';
import {
  DEFAULT_NETWORK_OPTICS_LEVEL,
  getNetworkStoryBeat,
  getNetworkStoryChapter,
  getNetworkStoryProgress,
  getWrappedStoryChapterIndex,
  GUIDED_STORY_SWITCH_INDEX,
  makeNetworkDynamicRangeProfile,
  makeNetworkOpticsProfile,
  MAX_NETWORK_OPTICS_LEVEL,
  NETWORK_STORY_CHAPTERS
} from '../../examples/showcase/packet-spraying/story';

test('packet-spraying guided tour tells the complete MRC recovery story', testCase => {
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.id),
    ['conversations', 'packet-spraying', 'congestion', 'failure', 'recovery'],
    'chapters progress from independent conversations through confirmed recovery'
  );
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.networkState),
    ['healthy', 'healthy', 'congested', 'failed', 'recovering'],
    'each chapter requests the corresponding switch state'
  );
  testCase.ok(
    NETWORK_STORY_CHAPTERS.every(chapter => chapter.duration >= 7),
    'each chapter leaves enough time to observe the network behavior'
  );
  testCase.ok(
    SWITCH_POSITIONS[GUIDED_STORY_SWITCH_INDEX],
    'the scripted story targets a real physical spine switch'
  );
  testCase.end();
});

test('packet-spraying guided tour wraps forward and backward between chapters', testCase => {
  testCase.equal(getWrappedStoryChapterIndex(-1), NETWORK_STORY_CHAPTERS.length - 1);
  testCase.equal(getWrappedStoryChapterIndex(NETWORK_STORY_CHAPTERS.length), 0);
  testCase.equal(getNetworkStoryChapter(-1).id, 'recovery');
  testCase.equal(getNetworkStoryChapter(NETWORK_STORY_CHAPTERS.length).id, 'conversations');
  testCase.end();
});

test('packet-spraying chapter timeline tracks duration-weighted guided playback', testCase => {
  const firstChapter = getNetworkStoryProgress(0, 3.5);
  const secondChapter = getNetworkStoryProgress(1, 4);
  const finalChapter = getNetworkStoryProgress(NETWORK_STORY_CHAPTERS.length - 1, 7);

  testCase.equal(firstChapter.chapterProgress, 0.5, 'individual chapter progress is normalized');
  testCase.equal(secondChapter.chapterProgress, 0.5, 'different chapter lengths remain normalized');
  testCase.ok(
    secondChapter.overallProgress > firstChapter.overallProgress,
    'the complete tour advances monotonically'
  );
  testCase.equal(finalChapter.overallProgress, 1, 'finishing the final chapter completes the tour');
  testCase.equal(
    getNetworkStoryProgress(0, -4).chapterProgress,
    0,
    'negative playback times clamp to zero'
  );
  testCase.equal(
    getNetworkStoryProgress(0, Number.NaN).chapterProgress,
    0,
    'invalid playback times cannot poison timeline state'
  );
  testCase.end();
});

test('packet-spraying cinematic story beats explain load, failure, and confirmed recovery', testCase => {
  testCase.ok(
    NETWORK_STORY_CHAPTERS.every(chapter =>
      chapter.beats.every(
        (beat, beatIndex) =>
          beat.position >= 0 &&
          beat.position < 1 &&
          (beatIndex === 0 || beat.position >= chapter.beats[beatIndex - 1].position)
      )
    ),
    'chapter event markers remain ordered within their timeline segments'
  );
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS[1].beats.map(beat => beat.pathIndex),
    [0, 1, 2, 3],
    'the spraying chapter visits all four independent spine paths'
  );
  testCase.equal(getNetworkStoryBeat(1, 0), null, 'the first path waits for its explicit beat');
  testCase.equal(getNetworkStoryBeat(1, 2.5)?.id, 'path-2');
  testCase.equal(getNetworkStoryBeat(1, 7.5)?.id, 'path-4');
  testCase.equal(getNetworkStoryBeat(2, 0)?.id, 'pressure', 'congestion is visible immediately');
  testCase.equal(getNetworkStoryBeat(3, 0)?.id, 'packet-loss', 'failure begins with packet loss');
  testCase.equal(
    getNetworkStoryBeat(4, 4)?.id,
    'confirmation',
    'recovery waits for its cyan confirmation beat'
  );
  testCase.equal(
    getNetworkStoryBeat(4, Number.NaN)?.id,
    'probe',
    'invalid elapsed times safely remain at the initial recovery beat'
  );
  testCase.end();
});

test('packet-spraying visual style introduces optical effects in readable cinematic stages', testCase => {
  const diagram = makeNetworkOpticsProfile(0);
  const clearGlass = makeNetworkOpticsProfile(3);
  const cinematic = makeNetworkOpticsProfile(DEFAULT_NETWORK_OPTICS_LEVEL);
  const fireworks = makeNetworkOpticsProfile(MAX_NETWORK_OPTICS_LEVEL);

  testCase.equal(diagram.label, 'Diagram', 'zero preserves a packet-first diagram');
  testCase.equal(diagram.refraction, 0, 'diagram mode disables background distortion');
  testCase.equal(diagram.illumination, 0, 'diagram mode disables secondary packet lighting');
  testCase.equal(diagram.caustics, 0, 'diagram mode disables projected caustics');
  testCase.equal(diagram.bloom, 0, 'diagram mode disables screen-space bloom');

  testCase.equal(clearGlass.label, 'Clear glass', 'early settings first reveal clean glass');
  testCase.equal(clearGlass.surface, 1, 'surface highlights are available before heavy optics');
  testCase.equal(clearGlass.spectral, 0, 'clear glass avoids spectral visual clutter');
  testCase.equal(clearGlass.caustics, 0, 'caustics wait for higher visual settings');

  testCase.equal(cinematic.label, 'Cinematic', 'the default uses the balanced cinematic profile');
  testCase.ok(cinematic.refraction > 0.9, 'cinematic mode enables convincing glass refraction');
  testCase.ok(cinematic.illumination > 0.9, 'cinematic mode lights nearby switches');
  testCase.ok(cinematic.spectral < 0.5, 'cinematic mode keeps spectral accents restrained');
  testCase.ok(cinematic.caustics < 0.25, 'cinematic mode keeps caustics below maximum');

  testCase.equal(fireworks.label, 'Fireworks', 'eleven enables the complete visual treatment');
  testCase.ok(fireworks.spectral > 1, 'fireworks enhances wavelength-dependent glass');
  testCase.ok(fireworks.caustics > 1, 'fireworks intensifies focused optical caustics');
  testCase.ok(fireworks.bloom > 1, 'fireworks intensifies selective bloom');
  testCase.equal(makeNetworkOpticsProfile(-5).level, 0, 'negative values clamp to diagram mode');
  testCase.equal(
    makeNetworkOpticsProfile(15).level,
    MAX_NETWORK_OPTICS_LEVEL,
    'values above eleven stay bounded'
  );
  testCase.equal(
    makeNetworkOpticsProfile(Number.NaN).level,
    DEFAULT_NETWORK_OPTICS_LEVEL,
    'invalid values return to the cinematic default'
  );
  testCase.end();
});

test('packet-spraying floating-point highlights preserve honest display capabilities', testCase => {
  const standardProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgl',
    displaySupportsHighDynamicRange: true,
    highlightBoost: 0.35,
    presentationColorFormat: 'rgba8unorm',
    sceneColorFormat: 'rgba8unorm',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });
  const floatingPointProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgl',
    displaySupportsHighDynamicRange: true,
    highlightBoost: 0.35,
    presentationColorFormat: 'rgba8unorm',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });
  const extendedProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgpu',
    displaySupportsHighDynamicRange: true,
    highlightBoost: 0.35,
    presentationColorFormat: 'rgba16float',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });

  testCase.equal(standardProfile.displayMode, 'standard', '8-bit scenes remain standard range');
  testCase.equal(standardProfile.highlightBoost, 0, 'standard scenes do not claim false headroom');
  testCase.equal(
    floatingPointProfile.displayMode,
    'floating-point',
    'floating-point scene color is distinguished from display HDR'
  );
  testCase.equal(
    floatingPointProfile.maximumLuminance,
    1,
    'SDR presentation never emits unsupported extended-range values'
  );
  testCase.ok(
    floatingPointProfile.highlightBoost > 0,
    'floating-point scenes retain bright detail'
  );
  testCase.ok(
    floatingPointProfile.emissionScale < 1.2,
    'SDR presentation receives only restrained floating-point accents'
  );
  testCase.equal(extendedProfile.displayMode, 'extended-hdr', 'true HDR requires an FP16 canvas');
  testCase.ok(
    extendedProfile.highlightBoost > floatingPointProfile.highlightBoost,
    'an extended display may use more of the available highlight headroom'
  );
  testCase.ok(
    extendedProfile.maximumLuminance > 2,
    'true HDR preserves packet and glass highlights well above SDR white'
  );
  testCase.ok(
    extendedProfile.bloomThresholdScale > floatingPointProfile.bloomThresholdScale,
    'selective bloom remains above ordinary scene brightness'
  );
  testCase.ok(
    extendedProfile.illuminationScale > floatingPointProfile.illuminationScale,
    'HDR displays can show stronger packet-driven glass lighting without washing out SDR'
  );
  testCase.equal(
    makeNetworkDynamicRangeProfile({
      deviceType: 'webgpu',
      displaySupportsHighDynamicRange: true,
      highlightBoost: 8,
      presentationColorFormat: 'rgba16float',
      sceneColorFormat: 'rgba16float',
      visualIntensity: 0
    }).highlightBoost,
    0,
    'diagram mode disables additional HDR accents'
  );
  testCase.end();
});
