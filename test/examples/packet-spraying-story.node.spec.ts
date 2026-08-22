// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  SWITCH_CONFIRMATION_DURATION,
  SWITCH_PROBE_DURATION
} from '../../examples/showcase/packet-spraying/animation';
import {SWITCH_POSITIONS} from '../../examples/showcase/packet-spraying/network';
import {makeNetworkRenderProfile} from '../../examples/showcase/packet-spraying/render-profile';
import {
  DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST,
  DEFAULT_NETWORK_OPTICS_LEVEL,
  getNetworkStoryBeat,
  getNetworkStoryChapter,
  getNetworkStoryProgress,
  getNetworkVerticalFieldOfView,
  getNetworkVerticalViewportOffset,
  getWrappedStoryChapterIndex,
  GUIDED_STORY_SWITCH_INDEX,
  makeNetworkDynamicRangeProfile,
  makeNetworkOpticsProfile,
  makeNetworkStoryCamera,
  makeNetworkSwitchHighlightColor,
  MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
  MAX_NETWORK_OPTICS_LEVEL,
  NETWORK_AUTOROTATION_SCENARIO_DURATION,
  NETWORK_STORY_CHAPTERS,
  shouldAdvanceNetworkAutorotationScenario
} from '../../examples/showcase/packet-spraying/story';

test('packet-spraying handheld rendering preserves glass with a bounded mobile GPU budget', testCase => {
  const handheld = makeNetworkRenderProfile({
    coarsePointer: true,
    maxTouchPoints: 5,
    viewportHeight: 844,
    viewportWidth: 390
  });

  testCase.equal(handheld.handheld, true, 'touchscreen phone viewports use the mobile profile');
  testCase.equal(handheld.bloomQuality, 'low', 'phone bloom uses a smaller two-level pyramid');
  testCase.equal(handheld.bloomResolutionScale, 0.75, 'phone bloom targets are downsampled');
  testCase.equal(
    handheld.orderIndependentTransparency,
    false,
    'phone glass uses the existing depth-sorted transparency path'
  );
  testCase.equal(
    handheld.preferFloatingPointColor,
    false,
    'phone scene and refraction textures use portable 8-bit formats'
  );
  testCase.end();
});

test('packet-spraying retains complete desktop optics in narrow non-touch viewports', testCase => {
  const desktop = makeNetworkRenderProfile({
    coarsePointer: false,
    maxTouchPoints: 0,
    viewportHeight: 844,
    viewportWidth: 390
  });
  const tablet = makeNetworkRenderProfile({
    coarsePointer: true,
    maxTouchPoints: 5,
    viewportHeight: 1024,
    viewportWidth: 768
  });

  for (const profile of [desktop, tablet]) {
    testCase.equal(profile.handheld, false);
    testCase.equal(profile.bloomQuality, 'high');
    testCase.equal(profile.bloomResolutionScale, 1);
    testCase.equal(profile.orderIndependentTransparency, true);
    testCase.equal(profile.preferFloatingPointColor, true);
  }
  testCase.end();
});

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
  testCase.deepEqual(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.navigationLabel),
    ['Traffic', 'Spraying', 'Congestion', 'Failure', 'Recovery'],
    'every network scenario exposes a recognizable compact navigation label'
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

test('packet-spraying autorotation advances scenarios every twenty unpaused seconds', testCase => {
  const idleAutorotation = {
    animationPaused: false,
    autoRotate: true,
    guidedStoryPlaying: false
  };

  testCase.equal(NETWORK_AUTOROTATION_SCENARIO_DURATION, 20);
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(19.999, idleAutorotation),
    false,
    'the current scenario remains visible for twenty complete seconds'
  );
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(20, idleAutorotation),
    true,
    'an autorotating idle camera advances at the twenty-second boundary'
  );
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, autoRotate: false}),
    false,
    'a stationary camera never changes the selected scenario'
  );
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, animationPaused: true}),
    false,
    'paused packet animations remain available for inspection'
  );
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, guidedStoryPlaying: true}),
    false,
    'authored guided playback retains its own chapter timing'
  );
  testCase.equal(
    shouldAdvanceNetworkAutorotationScenario(Number.NaN, idleAutorotation),
    false,
    'invalid animation timestamps cannot skip scenarios'
  );
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
    NETWORK_STORY_CHAPTERS.every(chapter => chapter.beats.every(beat => beat.camera)),
    'every named network event has an authored camera shot'
  );
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
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION - 0.01)?.id,
    'probe',
    'the outbound probe remains active until it reaches the repaired switch'
  );
  testCase.equal(
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION)?.id,
    'confirmation',
    'the cyan confirmation begins exactly when the outbound probe arrives'
  );
  testCase.equal(
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION + SWITCH_CONFIRMATION_DURATION)?.id,
    'restored',
    'ordinary traffic resumes exactly when the recovery acknowledgment completes'
  );
  testCase.equal(
    getNetworkStoryBeat(4, Number.NaN)?.id,
    'probe',
    'invalid elapsed times safely remain at the initial recovery beat'
  );
  testCase.end();
});

test('packet-spraying beat cameras inherit chapter framing without sharing target arrays', testCase => {
  const chapter = NETWORK_STORY_CHAPTERS[2];
  const beat = chapter.beats[1];
  const chapterCamera = makeNetworkStoryCamera(chapter, null);
  const beatCamera = makeNetworkStoryCamera(chapter, beat);

  testCase.deepEqual(chapterCamera, chapter.camera, 'a chapter starts from its establishing shot');
  testCase.equal(
    beatCamera.distance,
    beat.camera?.distance,
    'a beat can tighten the camera distance'
  );
  testCase.deepEqual(beatCamera.target, beat.camera?.target, 'a beat can focus a network event');
  testCase.notEqual(
    beatCamera.target,
    beat.camera?.target,
    'resolved camera targets are safe to animate in place'
  );
  testCase.end();
});

test('packet-spraying portrait cameras preserve enough horizontal framing for the network', testCase => {
  const phoneAspect = 390 / 844;
  const phoneVerticalFieldOfView = getNetworkVerticalFieldOfView(phoneAspect);
  const phoneHorizontalFieldOfView =
    (2 * Math.atan(Math.tan((phoneVerticalFieldOfView * Math.PI) / 360) * phoneAspect) * 180) /
    Math.PI;

  testCase.equal(getNetworkVerticalFieldOfView(16 / 9), 50, 'desktop framing remains unchanged');
  testCase.equal(getNetworkVerticalFieldOfView(1), 50, 'square framing remains unchanged');
  testCase.equal(getNetworkVerticalFieldOfView(0.9), 60, 'wide portraits retain familiar framing');
  testCase.ok(phoneVerticalFieldOfView > 80, 'phone portraits receive a wider vertical field');
  testCase.ok(
    Math.abs(phoneHorizontalFieldOfView - 48) < 0.001,
    'phone portraits retain the minimum horizontal network field of view'
  );
  testCase.equal(getNetworkVerticalFieldOfView(0.1), 105, 'extreme portrait fields remain bounded');
  testCase.equal(getNetworkVerticalFieldOfView(Number.NaN), 50, 'invalid aspect ratios stay safe');
  testCase.equal(getNetworkVerticalViewportOffset(16 / 9), 0, 'desktop cameras remain centered');
  testCase.ok(
    getNetworkVerticalViewportOffset(phoneAspect) > 0.2,
    'phone portraits move the network above the guided-story panel'
  );
  testCase.ok(
    getNetworkVerticalViewportOffset(0.1) <= 0.28,
    'portrait composition shifts remain bounded'
  );
  testCase.equal(
    getNetworkVerticalViewportOffset(Number.NaN),
    0,
    'invalid aspect ratios cannot displace the scene'
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

test('packet-spraying hover highlights glass without washing out transparency or switch faults', testCase => {
  const clearSwitch: [number, number, number, number] = [0.28, 0.48, 0.82, 0.3];
  const failedSwitch: [number, number, number, number] = [1, 0.065, 0.035, 0.59];
  const planeHighlight = makeNetworkSwitchHighlightColor(clearSwitch, 1, 0);
  const pathHighlight = makeNetworkSwitchHighlightColor(clearSwitch, 0, 1);

  testCase.deepEqual(
    makeNetworkSwitchHighlightColor(clearSwitch, 0, 0),
    clearSwitch,
    'unfocused switches retain their original glass color'
  );
  testCase.ok(
    planeHighlight[1] > clearSwitch[1] && planeHighlight[2] > clearSwitch[2],
    'hovered plane switches ease toward a visible cool glass highlight'
  );
  testCase.ok(
    planeHighlight.every(channel => channel <= 1) && pathHighlight.every(channel => channel <= 1),
    'switch focus remains representable without clipping on standard-range WebGL displays'
  );
  testCase.ok(
    planeHighlight[1] - planeHighlight[2] * 0.6 > 0.008 &&
      pathHighlight[1] - pathHighlight[2] * 0.6 > 0.008,
    'fully focused switches activate the chromatic Fresnel rim without exceeding display range'
  );
  testCase.ok(
    makeNetworkSwitchHighlightColor(clearSwitch, 0.5, 0)[2] < planeHighlight[2],
    'partial plane focus fades in before reaching the complete Fresnel rim'
  );
  testCase.ok(
    pathHighlight[1] > planeHighlight[1],
    'focused backbone paths retain a distinct cyan glass accent'
  );
  testCase.equal(planeHighlight[3], clearSwitch[3], 'plane highlighting preserves glass opacity');
  testCase.equal(pathHighlight[3], clearSwitch[3], 'path highlighting preserves glass opacity');
  testCase.deepEqual(
    makeNetworkSwitchHighlightColor(failedSwitch, 1, 1),
    failedSwitch,
    'failed or congested switch colors remain visually authoritative'
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
  const defaultExtendedProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgpu',
    displaySupportsHighDynamicRange: true,
    presentationColorFormat: 'rgba16float',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });
  const diagramExtendedProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgpu',
    displaySupportsHighDynamicRange: true,
    highlightBoost: 0.35,
    presentationColorFormat: 'rgba16float',
    sceneColorFormat: 'rgba16float',
    visualIntensity: 0
  });
  const lowExtendedProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgpu',
    displaySupportsHighDynamicRange: true,
    highlightBoost: 0.1,
    presentationColorFormat: 'rgba16float',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });
  const maximumExtendedProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgpu',
    displaySupportsHighDynamicRange: true,
    highlightBoost: MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
    presentationColorFormat: 'rgba16float',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });
  const maximumFloatingPointProfile = makeNetworkDynamicRangeProfile({
    deviceType: 'webgl',
    displaySupportsHighDynamicRange: true,
    highlightBoost: MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
    presentationColorFormat: 'rgba8unorm',
    sceneColorFormat: 'rgba16float',
    visualIntensity: DEFAULT_NETWORK_OPTICS_LEVEL
  });

  testCase.equal(standardProfile.displayMode, 'standard', '8-bit scenes remain standard range');
  testCase.equal(standardProfile.highlightBoost, 0, 'standard scenes do not claim false headroom');
  testCase.equal(standardProfile.emissionScale, 1, 'standard scenes retain their packet emission');
  testCase.equal(standardProfile.exposureScale, 1, 'standard scenes retain their midtone exposure');
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
    Math.abs(defaultExtendedProfile.highlightBoost - DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST) < 0.01,
    'the guided tour uses a restrained HDR highlight setting by default'
  );
  testCase.ok(
    defaultExtendedProfile.maximumLuminance < 2,
    'default HDR highlights remain below twice SDR white'
  );
  testCase.ok(
    defaultExtendedProfile.emissionScale < 1.25 && defaultExtendedProfile.specularScale < 1.15,
    'the default keeps packet emission and glass reflections restrained'
  );
  testCase.ok(
    lowExtendedProfile.maximumLuminance < 1.25 && lowExtendedProfile.emissionScale < 1.05,
    'the bottom of the slider stays close to SDR instead of lifting the scene'
  );
  testCase.equal(
    maximumExtendedProfile.maximumLuminance,
    4,
    'maximum HDR reaches the tone mapper display-headroom limit'
  );
  testCase.ok(
    maximumExtendedProfile.emissionScale > 2.5 && maximumExtendedProfile.specularScale > 1.8,
    'maximum HDR clearly accelerates packet cores and polished glass highlights'
  );
  testCase.ok(
    maximumExtendedProfile.exposureScale < defaultExtendedProfile.exposureScale &&
      maximumExtendedProfile.exposureScale <= 1,
    'opening highlight headroom does not brighten scene midtones'
  );
  testCase.ok(
    maximumExtendedProfile.bloomThresholdScale > maximumExtendedProfile.bloomIntensityScale,
    'maximum HDR raises the bloom threshold faster than bloom intensity for selective accents'
  );
  testCase.ok(
    maximumFloatingPointProfile.emissionScale < 1.1 &&
      maximumFloatingPointProfile.specularScale < 1.05,
    'floating-point SDR receives only restrained highlight shaping at slider maximum'
  );
  testCase.equal(
    maximumFloatingPointProfile.maximumLuminance,
    1,
    'floating-point SDR never receives extended display luminance'
  );
  testCase.equal(
    diagramExtendedProfile.highlightBoost,
    extendedProfile.highlightBoost,
    'visual style does not change independently selected HDR brightness'
  );
  testCase.equal(
    diagramExtendedProfile.maximumLuminance,
    extendedProfile.maximumLuminance,
    'diagram mode preserves extended display headroom'
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
    MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
    'the HDR control remains bounded independently of visual style'
  );
  testCase.end();
});
