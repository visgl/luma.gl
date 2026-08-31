// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('packet-spraying handheld rendering preserves glass with a bounded mobile GPU budget', () => {
  const handheld = makeNetworkRenderProfile({
    coarsePointer: true,
    maxTouchPoints: 5,
    viewportHeight: 844,
    viewportWidth: 390
  });

  expect(handheld.handheld, 'touchscreen phone viewports use the mobile profile').toBe(true);
  expect(handheld.bloomQuality, 'phone bloom uses a smaller two-level pyramid').toBe('low');
  expect(handheld.bloomResolutionScale, 'phone bloom targets are downsampled').toBe(0.75);
  expect(
    handheld.orderIndependentTransparency,
    'phone glass uses the existing depth-sorted transparency path'
  ).toBe(false);
  expect(
    handheld.preferFloatingPointColor,
    'phone scene and refraction textures use portable 8-bit formats'
  ).toBe(false);
  void 0;
});

it('packet-spraying retains complete desktop optics in narrow non-touch viewports', () => {
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
    expect(profile.handheld, '').toBe(false);
    expect(profile.bloomQuality, '').toBe('high');
    expect(profile.bloomResolutionScale, '').toBe(1);
    expect(profile.orderIndependentTransparency, '').toBe(true);
    expect(profile.preferFloatingPointColor, '').toBe(true);
  }
  void 0;
});

it('packet-spraying guided tour tells the complete MRC recovery story', () => {
  expect(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.id),
    'chapters progress from independent conversations through confirmed recovery'
  ).toEqual(['conversations', 'packet-spraying', 'congestion', 'failure', 'recovery']);
  expect(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.networkState),
    'each chapter requests the corresponding switch state'
  ).toEqual(['healthy', 'healthy', 'congested', 'failed', 'recovering']);
  expect(
    NETWORK_STORY_CHAPTERS.map(chapter => chapter.navigationLabel),
    'every network scenario exposes a recognizable compact navigation label'
  ).toEqual(['Traffic', 'Spraying', 'Congestion', 'Failure', 'Recovery']);
  expect(
    Boolean(NETWORK_STORY_CHAPTERS.every(chapter => chapter.duration >= 7)),
    'each chapter leaves enough time to observe the network behavior'
  ).toBe(true);
  expect(
    Boolean(SWITCH_POSITIONS[GUIDED_STORY_SWITCH_INDEX]),
    'the scripted story targets a real physical spine switch'
  ).toBe(true);
  void 0;
});

it('packet-spraying guided tour wraps forward and backward between chapters', () => {
  expect(getWrappedStoryChapterIndex(-1), '').toBe(NETWORK_STORY_CHAPTERS.length - 1);
  expect(getWrappedStoryChapterIndex(NETWORK_STORY_CHAPTERS.length), '').toBe(0);
  expect(getNetworkStoryChapter(-1).id, '').toBe('recovery');
  expect(getNetworkStoryChapter(NETWORK_STORY_CHAPTERS.length).id, '').toBe('conversations');
  void 0;
});

it('packet-spraying autorotation advances scenarios every twenty unpaused seconds', () => {
  const idleAutorotation = {
    animationPaused: false,
    autoRotate: true,
    guidedStoryPlaying: false
  };

  expect(NETWORK_AUTOROTATION_SCENARIO_DURATION, '').toBe(20);
  expect(
    shouldAdvanceNetworkAutorotationScenario(19.999, idleAutorotation),
    'the current scenario remains visible for twenty complete seconds'
  ).toBe(false);
  expect(
    shouldAdvanceNetworkAutorotationScenario(20, idleAutorotation),
    'an autorotating idle camera advances at the twenty-second boundary'
  ).toBe(true);
  expect(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, autoRotate: false}),
    'a stationary camera never changes the selected scenario'
  ).toBe(false);
  expect(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, animationPaused: true}),
    'paused packet animations remain available for inspection'
  ).toBe(false);
  expect(
    shouldAdvanceNetworkAutorotationScenario(20, {...idleAutorotation, guidedStoryPlaying: true}),
    'authored guided playback retains its own chapter timing'
  ).toBe(false);
  expect(
    shouldAdvanceNetworkAutorotationScenario(Number.NaN, idleAutorotation),
    'invalid animation timestamps cannot skip scenarios'
  ).toBe(false);
  void 0;
});

it('packet-spraying chapter timeline tracks duration-weighted guided playback', () => {
  const firstChapter = getNetworkStoryProgress(0, 3.5);
  const secondChapter = getNetworkStoryProgress(1, 4);
  const finalChapter = getNetworkStoryProgress(NETWORK_STORY_CHAPTERS.length - 1, 7);

  expect(firstChapter.chapterProgress, 'individual chapter progress is normalized').toBe(0.5);
  expect(secondChapter.chapterProgress, 'different chapter lengths remain normalized').toBe(0.5);
  expect(
    Boolean(secondChapter.overallProgress > firstChapter.overallProgress),
    'the complete tour advances monotonically'
  ).toBe(true);
  expect(finalChapter.overallProgress, 'finishing the final chapter completes the tour').toBe(1);
  expect(
    getNetworkStoryProgress(0, -4).chapterProgress,
    'negative playback times clamp to zero'
  ).toBe(0);
  expect(
    getNetworkStoryProgress(0, Number.NaN).chapterProgress,
    'invalid playback times cannot poison timeline state'
  ).toBe(0);
  void 0;
});

it('packet-spraying cinematic story beats explain load, failure, and confirmed recovery', () => {
  expect(
    Boolean(NETWORK_STORY_CHAPTERS.every(chapter => chapter.beats.every(beat => beat.camera))),
    'every named network event has an authored camera shot'
  ).toBe(true);
  expect(
    Boolean(
      NETWORK_STORY_CHAPTERS.every(chapter =>
        chapter.beats.every(
          (beat, beatIndex) =>
            beat.position >= 0 &&
            beat.position < 1 &&
            (beatIndex === 0 || beat.position >= chapter.beats[beatIndex - 1].position)
        )
      )
    ),
    'chapter event markers remain ordered within their timeline segments'
  ).toBe(true);
  expect(
    NETWORK_STORY_CHAPTERS[1].beats.map(beat => beat.pathIndex),
    'the spraying chapter visits all four independent spine paths'
  ).toEqual([0, 1, 2, 3]);
  expect(getNetworkStoryBeat(1, 0), 'the first path waits for its explicit beat').toBe(null);
  expect(getNetworkStoryBeat(1, 2.5)?.id, '').toBe('path-2');
  expect(getNetworkStoryBeat(1, 7.5)?.id, '').toBe('path-4');
  expect(getNetworkStoryBeat(2, 0)?.id, 'congestion is visible immediately').toBe('pressure');
  expect(getNetworkStoryBeat(3, 0)?.id, 'failure begins with packet loss').toBe('packet-loss');
  expect(
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION - 0.01)?.id,
    'the outbound probe remains active until it reaches the repaired switch'
  ).toBe('probe');
  expect(
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION)?.id,
    'the cyan confirmation begins exactly when the outbound probe arrives'
  ).toBe('confirmation');
  expect(
    getNetworkStoryBeat(4, SWITCH_PROBE_DURATION + SWITCH_CONFIRMATION_DURATION)?.id,
    'ordinary traffic resumes exactly when the recovery acknowledgment completes'
  ).toBe('restored');
  expect(
    getNetworkStoryBeat(4, Number.NaN)?.id,
    'invalid elapsed times safely remain at the initial recovery beat'
  ).toBe('probe');
  void 0;
});

it('packet-spraying beat cameras inherit chapter framing without sharing target arrays', () => {
  const chapter = NETWORK_STORY_CHAPTERS[2];
  const beat = chapter.beats[1];
  const chapterCamera = makeNetworkStoryCamera(chapter, null);
  const beatCamera = makeNetworkStoryCamera(chapter, beat);

  expect(chapterCamera, 'a chapter starts from its establishing shot').toEqual(chapter.camera);
  expect(beatCamera.distance, 'a beat can tighten the camera distance').toBe(beat.camera?.distance);
  expect(beatCamera.target, 'a beat can focus a network event').toEqual(beat.camera?.target);
  expect(beatCamera.target, 'resolved camera targets are safe to animate in place').not.toBe(
    beat.camera?.target
  );
  void 0;
});

it('packet-spraying portrait cameras preserve enough horizontal framing for the network', () => {
  const phoneAspect = 390 / 844;
  const phoneVerticalFieldOfView = getNetworkVerticalFieldOfView(phoneAspect);
  const phoneHorizontalFieldOfView =
    (2 * Math.atan(Math.tan((phoneVerticalFieldOfView * Math.PI) / 360) * phoneAspect) * 180) /
    Math.PI;

  expect(getNetworkVerticalFieldOfView(16 / 9), 'desktop framing remains unchanged').toBe(50);
  expect(getNetworkVerticalFieldOfView(1), 'square framing remains unchanged').toBe(50);
  expect(getNetworkVerticalFieldOfView(0.9), 'wide portraits retain familiar framing').toBe(60);
  expect(
    Boolean(phoneVerticalFieldOfView > 80),
    'phone portraits receive a wider vertical field'
  ).toBe(true);
  expect(
    Boolean(Math.abs(phoneHorizontalFieldOfView - 48) < 0.001),
    'phone portraits retain the minimum horizontal network field of view'
  ).toBe(true);
  expect(getNetworkVerticalFieldOfView(0.1), 'extreme portrait fields remain bounded').toBe(105);
  expect(getNetworkVerticalFieldOfView(Number.NaN), 'invalid aspect ratios stay safe').toBe(50);
  expect(getNetworkVerticalViewportOffset(16 / 9), 'desktop cameras remain centered').toBe(0);
  expect(
    Boolean(getNetworkVerticalViewportOffset(phoneAspect) > 0.2),
    'phone portraits move the network above the guided-story panel'
  ).toBe(true);
  expect(
    Boolean(getNetworkVerticalViewportOffset(0.1) <= 0.28),
    'portrait composition shifts remain bounded'
  ).toBe(true);
  expect(
    getNetworkVerticalViewportOffset(Number.NaN),
    'invalid aspect ratios cannot displace the scene'
  ).toBe(0);
  void 0;
});

it('packet-spraying visual style introduces optical effects in readable cinematic stages', () => {
  const diagram = makeNetworkOpticsProfile(0);
  const clearGlass = makeNetworkOpticsProfile(3);
  const cinematic = makeNetworkOpticsProfile(DEFAULT_NETWORK_OPTICS_LEVEL);
  const fireworks = makeNetworkOpticsProfile(MAX_NETWORK_OPTICS_LEVEL);

  expect(diagram.label, 'zero preserves a packet-first diagram').toBe('Diagram');
  expect(diagram.refraction, 'diagram mode disables background distortion').toBe(0);
  expect(diagram.illumination, 'diagram mode disables secondary packet lighting').toBe(0);
  expect(diagram.caustics, 'diagram mode disables projected caustics').toBe(0);
  expect(diagram.bloom, 'diagram mode disables screen-space bloom').toBe(0);

  expect(clearGlass.label, 'early settings first reveal clean glass').toBe('Clear glass');
  expect(clearGlass.surface, 'surface highlights are available before heavy optics').toBe(1);
  expect(clearGlass.spectral, 'clear glass avoids spectral visual clutter').toBe(0);
  expect(clearGlass.caustics, 'caustics wait for higher visual settings').toBe(0);

  expect(cinematic.label, 'the default uses the balanced cinematic profile').toBe('Cinematic');
  expect(
    Boolean(cinematic.refraction > 0.9),
    'cinematic mode enables convincing glass refraction'
  ).toBe(true);
  expect(Boolean(cinematic.illumination > 0.9), 'cinematic mode lights nearby switches').toBe(true);
  expect(
    Boolean(cinematic.spectral < 0.5),
    'cinematic mode keeps spectral accents restrained'
  ).toBe(true);
  expect(Boolean(cinematic.caustics < 0.25), 'cinematic mode keeps caustics below maximum').toBe(
    true
  );

  expect(fireworks.label, 'eleven enables the complete visual treatment').toBe('Fireworks');
  expect(Boolean(fireworks.spectral > 1), 'fireworks enhances wavelength-dependent glass').toBe(
    true
  );
  expect(Boolean(fireworks.caustics > 1), 'fireworks intensifies focused optical caustics').toBe(
    true
  );
  expect(Boolean(fireworks.bloom > 1), 'fireworks intensifies selective bloom').toBe(true);
  expect(makeNetworkOpticsProfile(-5).level, 'negative values clamp to diagram mode').toBe(0);
  expect(makeNetworkOpticsProfile(15).level, 'values above eleven stay bounded').toBe(
    MAX_NETWORK_OPTICS_LEVEL
  );
  expect(
    makeNetworkOpticsProfile(Number.NaN).level,
    'invalid values return to the cinematic default'
  ).toBe(DEFAULT_NETWORK_OPTICS_LEVEL);
  void 0;
});

it('packet-spraying hover highlights glass without washing out transparency or switch faults', () => {
  const clearSwitch: [number, number, number, number] = [0.28, 0.48, 0.82, 0.3];
  const failedSwitch: [number, number, number, number] = [1, 0.065, 0.035, 0.59];
  const planeHighlight = makeNetworkSwitchHighlightColor(clearSwitch, 1, 0);
  const pathHighlight = makeNetworkSwitchHighlightColor(clearSwitch, 0, 1);

  expect(
    makeNetworkSwitchHighlightColor(clearSwitch, 0, 0),
    'unfocused switches retain their original glass color'
  ).toEqual(clearSwitch);
  expect(
    Boolean(planeHighlight[1] > clearSwitch[1] && planeHighlight[2] > clearSwitch[2]),
    'hovered plane switches ease toward a visible cool glass highlight'
  ).toBe(true);
  expect(
    Boolean(
      planeHighlight.every(channel => channel <= 1) && pathHighlight.every(channel => channel <= 1)
    ),
    'switch focus remains representable without clipping on standard-range WebGL displays'
  ).toBe(true);
  expect(
    Boolean(
      planeHighlight[1] - planeHighlight[2] * 0.6 > 0.008 &&
        pathHighlight[1] - pathHighlight[2] * 0.6 > 0.008
    ),
    'fully focused switches activate the chromatic Fresnel rim without exceeding display range'
  ).toBe(true);
  expect(
    Boolean(makeNetworkSwitchHighlightColor(clearSwitch, 0.5, 0)[2] < planeHighlight[2]),
    'partial plane focus fades in before reaching the complete Fresnel rim'
  ).toBe(true);
  expect(
    Boolean(pathHighlight[1] > planeHighlight[1]),
    'focused backbone paths retain a distinct cyan glass accent'
  ).toBe(true);
  expect(planeHighlight[3], 'plane highlighting preserves glass opacity').toBe(clearSwitch[3]);
  expect(pathHighlight[3], 'path highlighting preserves glass opacity').toBe(clearSwitch[3]);
  expect(
    makeNetworkSwitchHighlightColor(failedSwitch, 1, 1),
    'failed or congested switch colors remain visually authoritative'
  ).toEqual(failedSwitch);
  void 0;
});

it('packet-spraying floating-point highlights preserve honest display capabilities', () => {
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

  expect(standardProfile.displayMode, '8-bit scenes remain standard range').toBe('standard');
  expect(standardProfile.highlightBoost, 'standard scenes do not claim false headroom').toBe(0);
  expect(standardProfile.emissionScale, 'standard scenes retain their packet emission').toBe(1);
  expect(standardProfile.exposureScale, 'standard scenes retain their midtone exposure').toBe(1);
  expect(
    floatingPointProfile.displayMode,
    'floating-point scene color is distinguished from display HDR'
  ).toBe('floating-point');
  expect(
    floatingPointProfile.maximumLuminance,
    'SDR presentation never emits unsupported extended-range values'
  ).toBe(1);
  expect(
    Boolean(floatingPointProfile.highlightBoost > 0),
    'floating-point scenes retain bright detail'
  ).toBe(true);
  expect(
    Boolean(floatingPointProfile.emissionScale < 1.2),
    'SDR presentation receives only restrained floating-point accents'
  ).toBe(true);
  expect(extendedProfile.displayMode, 'true HDR requires an FP16 canvas').toBe('extended-hdr');
  expect(
    Boolean(extendedProfile.highlightBoost > floatingPointProfile.highlightBoost),
    'an extended display may use more of the available highlight headroom'
  ).toBe(true);
  expect(
    Boolean(extendedProfile.maximumLuminance > 2),
    'true HDR preserves packet and glass highlights well above SDR white'
  ).toBe(true);
  expect(
    Boolean(
      Math.abs(defaultExtendedProfile.highlightBoost - DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST) < 0.01
    ),
    'the guided tour uses a restrained HDR highlight setting by default'
  ).toBe(true);
  expect(
    Boolean(defaultExtendedProfile.maximumLuminance < 2),
    'default HDR highlights remain below twice SDR white'
  ).toBe(true);
  expect(
    Boolean(
      defaultExtendedProfile.emissionScale < 1.25 && defaultExtendedProfile.specularScale < 1.15
    ),
    'the default keeps packet emission and glass reflections restrained'
  ).toBe(true);
  expect(
    Boolean(lowExtendedProfile.maximumLuminance < 1.25 && lowExtendedProfile.emissionScale < 1.05),
    'the bottom of the slider stays close to SDR instead of lifting the scene'
  ).toBe(true);
  expect(
    maximumExtendedProfile.maximumLuminance,
    'maximum HDR reaches the tone mapper display-headroom limit'
  ).toBe(4);
  expect(
    Boolean(
      maximumExtendedProfile.emissionScale > 2.5 && maximumExtendedProfile.specularScale > 1.8
    ),
    'maximum HDR clearly accelerates packet cores and polished glass highlights'
  ).toBe(true);
  expect(
    Boolean(
      maximumExtendedProfile.exposureScale < defaultExtendedProfile.exposureScale &&
        maximumExtendedProfile.exposureScale <= 1
    ),
    'opening highlight headroom does not brighten scene midtones'
  ).toBe(true);
  expect(
    Boolean(
      maximumExtendedProfile.bloomThresholdScale > maximumExtendedProfile.bloomIntensityScale
    ),
    'maximum HDR raises the bloom threshold faster than bloom intensity for selective accents'
  ).toBe(true);
  expect(
    Boolean(
      maximumFloatingPointProfile.emissionScale < 1.1 &&
        maximumFloatingPointProfile.specularScale < 1.05
    ),
    'floating-point SDR receives only restrained highlight shaping at slider maximum'
  ).toBe(true);
  expect(
    maximumFloatingPointProfile.maximumLuminance,
    'floating-point SDR never receives extended display luminance'
  ).toBe(1);
  expect(
    diagramExtendedProfile.highlightBoost,
    'visual style does not change independently selected HDR brightness'
  ).toBe(extendedProfile.highlightBoost);
  expect(
    diagramExtendedProfile.maximumLuminance,
    'diagram mode preserves extended display headroom'
  ).toBe(extendedProfile.maximumLuminance);
  expect(
    Boolean(extendedProfile.bloomThresholdScale > floatingPointProfile.bloomThresholdScale),
    'selective bloom remains above ordinary scene brightness'
  ).toBe(true);
  expect(
    Boolean(extendedProfile.illuminationScale > floatingPointProfile.illuminationScale),
    'HDR displays can show stronger packet-driven glass lighting without washing out SDR'
  ).toBe(true);
  expect(
    makeNetworkDynamicRangeProfile({
      deviceType: 'webgpu',
      displaySupportsHighDynamicRange: true,
      highlightBoost: 8,
      presentationColorFormat: 'rgba16float',
      sceneColorFormat: 'rgba16float',
      visualIntensity: 0
    }).highlightBoost,
    'the HDR control remains bounded independently of visual style'
  ).toBe(MAX_NETWORK_HDR_HIGHLIGHT_BOOST);
  void 0;
});
