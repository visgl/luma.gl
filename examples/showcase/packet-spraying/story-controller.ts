// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {OrbitControls} from '@luma.gl/engine';
import {SPINE_POSITIONS, type Vector3} from './network';
import {
  getNetworkStoryBeat,
  getNetworkStoryChapter,
  getNetworkStoryProgress,
  getWrappedStoryChapterIndex,
  makeNetworkStoryCamera,
  NETWORK_AUTOROTATION_SCENARIO_DURATION,
  shouldAdvanceNetworkAutorotationScenario,
  type NetworkStoryBeat,
  type NetworkStoryChapter,
  type NetworkStoryCamera
} from './story';
import type {NetworkInfoPanel, NetworkStoryControls} from './ui';

export type NetworkStoryView = {
  canvas: HTMLCanvasElement | null;
  isReflectionLab: boolean;
  mrcPanel: NetworkInfoPanel | null;
  opticsPanel: NetworkInfoPanel | null;
  orbit: number;
  orbitControls: OrbitControls | null;
  storyControls: NetworkStoryControls | null;
};

/** Owns the showcase narrative, camera choreography, and story-related UI state. */
export class NetworkStoryController {
  animationTime = 0;
  guidedStoryPlaying = false;
  highlightedPlaneIndex: number | null = null;
  highlightedPathIndex: number | null = null;

  private rawAnimationTime = 0;
  private animationTimeOffset = 0;
  private animationPausedAt: number | null = null;
  private rawAnimationPausedAt: number | null = null;
  private autorotationScenarioStartedAt: number | null = null;
  private guidedStoryChapterIndex = 0;
  private guidedStoryChapterStartedAt = 0;
  private guidedStoryElapsedAtPause = 0;
  private guidedStoryStarted = false;
  private guidedStoryCamera: NetworkStoryCamera | null = null;
  private guidedStoryCameraTransitionEndsAt = 0;
  private guidedStoryPreviousCameraTime: number | null = null;
  private currentStoryBeat: NetworkStoryBeat | null = null;
  private manualHighlightedPlaneIndex: number | null = null;
  private manualHighlightedPathIndex: number | null = null;
  private storyHighlightedPlaneIndex: number | null = null;
  private storyHighlightedPathIndex: number | null = null;

  constructor(
    private readonly getView: () => NetworkStoryView,
    private readonly onEnterChapter: (chapter: NetworkStoryChapter) => void
  ) {}

  updateAnimationClock(rawAnimationTime: number): void {
    this.rawAnimationTime = rawAnimationTime;
    this.animationTime = this.animationPausedAt ?? rawAnimationTime - this.animationTimeOffset;

    const {canvas} = this.getView();
    if (canvas) {
      canvas.dataset.packetSprayingAnimationPaused = String(this.animationPausedAt !== null);
      canvas.dataset.packetSprayingAnimationTime = this.animationTime.toFixed(3);
    }
  }

  setAnimationClockPaused(isPaused: boolean): void {
    if (isPaused) {
      if (this.animationPausedAt === null) {
        this.animationPausedAt = this.animationTime;
        this.rawAnimationPausedAt = this.rawAnimationTime;
      }
      return;
    }

    if (this.animationPausedAt !== null && this.rawAnimationPausedAt !== null) {
      this.animationTimeOffset += this.rawAnimationTime - this.rawAnimationPausedAt;
      this.animationTime = this.rawAnimationTime - this.animationTimeOffset;
    }
    this.animationPausedAt = null;
    this.rawAnimationPausedAt = null;
  }

  updateAutorotationScenario(renderTime: number): void {
    const {canvas, isReflectionLab, orbitControls} = this.getView();
    const autoRotate = Boolean(orbitControls?.props.autoRotate) && !isReflectionLab;
    const animationPaused = this.animationPausedAt !== null;
    const automaticScenarios = autoRotate && !animationPaused && !this.guidedStoryPlaying;

    if (!automaticScenarios) {
      this.autorotationScenarioStartedAt = null;
      if (canvas) {
        canvas.dataset.packetSprayingAutomaticScenarios = 'false';
        canvas.dataset.packetSprayingScenarioProgress = '0.000';
      }
      return;
    }

    this.autorotationScenarioStartedAt ??= renderTime;
    const elapsedTime = renderTime - this.autorotationScenarioStartedAt;
    if (
      shouldAdvanceNetworkAutorotationScenario(elapsedTime, {
        animationPaused,
        autoRotate,
        guidedStoryPlaying: this.guidedStoryPlaying
      })
    ) {
      this.guidedStoryStarted = true;
      this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + 1);
      this.autorotationScenarioStartedAt = renderTime;
    }

    if (canvas) {
      canvas.dataset.packetSprayingAutomaticScenarios = 'true';
      canvas.dataset.packetSprayingScenarioProgress = Math.min(
        (renderTime - this.autorotationScenarioStartedAt) / NETWORK_AUTOROTATION_SCENARIO_DURATION,
        1
      ).toFixed(3);
    }
  }

  setGuidedStoryPlaying(isPlaying: boolean): void {
    if (isPlaying === this.guidedStoryPlaying) {
      return;
    }

    this.guidedStoryPlaying = isPlaying;
    const {orbit, orbitControls} = this.getView();
    if (isPlaying) {
      this.setAnimationClockPaused(false);
      orbitControls?.setAutoRotate(false);
      if (this.guidedStoryStarted) {
        this.guidedStoryChapterStartedAt = this.animationTime - this.guidedStoryElapsedAtPause;
      } else {
        this.guidedStoryStarted = true;
        this.enterGuidedStoryChapter(this.guidedStoryChapterIndex);
      }
    } else {
      this.guidedStoryElapsedAtPause = this.animationTime - this.guidedStoryChapterStartedAt;
      this.guidedStoryCameraTransitionEndsAt = this.animationTime;
      this.setAnimationClockPaused(true);
      orbitControls?.setAutoRotate(orbit > 0);
    }

    this.updateControls();
  }

  moveGuidedStoryChapter(direction: number): void {
    this.guidedStoryStarted = true;
    this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + direction);
  }

  selectGuidedStoryChapter(chapterIndex: number): void {
    this.guidedStoryStarted = true;
    this.enterGuidedStoryChapter(chapterIndex);
  }

  updateGuidedStory(): void {
    if (!this.guidedStoryStarted) {
      return;
    }

    const animationTime = this.animationTime;
    if (this.guidedStoryPlaying) {
      const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
      if (animationTime - this.guidedStoryChapterStartedAt >= chapter.duration) {
        this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + 1);
      }
    }

    const chapterElapsedTime = this.guidedStoryPlaying
      ? animationTime - this.guidedStoryChapterStartedAt
      : this.guidedStoryElapsedAtPause;
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    const beat = getNetworkStoryBeat(this.guidedStoryChapterIndex, chapterElapsedTime);
    const {canvas, orbitControls, storyControls} = this.getView();
    if (beat !== this.currentStoryBeat) {
      this.currentStoryBeat = beat;
      this.guidedStoryCamera = makeNetworkStoryCamera(chapter, beat);
      this.guidedStoryCameraTransitionEndsAt = animationTime + 1.25;
      storyControls?.updateBeat(chapter, beat);
      this.setStoryHighlight(beat?.planeIndex ?? null, beat?.pathIndex ?? null);
    }
    storyControls?.updateProgress(this.guidedStoryChapterIndex, chapterElapsedTime);
    if (canvas) {
      canvas.dataset.packetSprayingStoryProgress = getNetworkStoryProgress(
        this.guidedStoryChapterIndex,
        chapterElapsedTime
      ).overallProgress.toFixed(3);
      canvas.dataset.packetSprayingStoryBeat = beat?.id ?? '';
    }

    if (
      !this.guidedStoryCamera ||
      !orbitControls ||
      (!this.guidedStoryPlaying && animationTime >= this.guidedStoryCameraTransitionEndsAt)
    ) {
      return;
    }

    const elapsedTime = Math.min(
      Math.max(animationTime - (this.guidedStoryPreviousCameraTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    const smoothing = 1 - Math.exp(-elapsedTime * 3.8);
    const camera = this.guidedStoryCamera;
    const cameraTarget: Vector3 = [...camera.target];
    if (!beat?.camera?.target && beat?.pathIndex !== undefined) {
      cameraTarget[2] += SPINE_POSITIONS[beat.pathIndex][2] * 0.2;
    } else if (!beat?.camera?.target && beat?.planeIndex !== undefined) {
      cameraTarget[2] += beat.planeIndex === 0 ? 0.32 : -0.32;
    }
    const yawDelta = Math.atan2(
      Math.sin(camera.yaw - orbitControls.yaw),
      Math.cos(camera.yaw - orbitControls.yaw)
    );

    orbitControls.yaw += yawDelta * smoothing;
    orbitControls.pitch += (camera.pitch - orbitControls.pitch) * smoothing;
    orbitControls.distance += (camera.distance - orbitControls.distance) * smoothing;
    orbitControls.props.target = [
      orbitControls.props.target[0] + (cameraTarget[0] - orbitControls.props.target[0]) * smoothing,
      orbitControls.props.target[1] + (cameraTarget[1] - orbitControls.props.target[1]) * smoothing,
      orbitControls.props.target[2] + (cameraTarget[2] - orbitControls.props.target[2]) * smoothing
    ];
    this.guidedStoryPreviousCameraTime = animationTime;
  }

  updateControls(): void {
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    const {canvas, storyControls} = this.getView();
    storyControls?.update(chapter, this.guidedStoryChapterIndex, this.guidedStoryPlaying);
    storyControls?.updateBeat(chapter, this.currentStoryBeat);
    storyControls?.updateProgress(this.guidedStoryChapterIndex, this.guidedStoryElapsedAtPause);
    if (canvas) {
      canvas.dataset.packetSprayingStoryChapter = chapter.id;
      canvas.dataset.packetSprayingStoryPlaying = String(this.guidedStoryPlaying);
    }
  }

  setHighlightedPlane(planeIndex: number | null): void {
    this.manualHighlightedPlaneIndex = planeIndex;
    this.synchronizeHighlights();
  }

  setHighlightedPath(pathIndex: number | null): void {
    this.manualHighlightedPathIndex = pathIndex;
    this.synchronizeHighlights();
  }

  setMrcPanelVisible(isVisible: boolean): void {
    if (isVisible) {
      this.setOpticsPanelVisible(false);
    }

    const {canvas, mrcPanel, storyControls} = this.getView();
    const wasVisible = canvas?.dataset.packetSprayingMrcExpanded === 'true';
    mrcPanel?.setVisible(isVisible);
    storyControls?.setMrcExpanded(isVisible);
    if (!isVisible && wasVisible) {
      storyControls?.focusMrcButton();
    }
    if (canvas) {
      canvas.dataset.packetSprayingMrcExpanded = String(isVisible);
    }
  }

  setOpticsPanelVisible(isVisible: boolean): void {
    if (isVisible) {
      this.setMrcPanelVisible(false);
    }

    const {canvas, opticsPanel, storyControls} = this.getView();
    const wasVisible = canvas?.dataset.packetSprayingOpticsExpanded === 'true';
    opticsPanel?.setVisible(isVisible);
    storyControls?.setOpticsExpanded(isVisible);
    if (!isVisible && wasVisible) {
      storyControls?.focusOpticsButton();
    }
    if (canvas) {
      canvas.dataset.packetSprayingOpticsExpanded = String(isVisible);
    }
  }

  private enterGuidedStoryChapter(chapterIndex: number): void {
    this.guidedStoryChapterIndex = getWrappedStoryChapterIndex(chapterIndex);
    this.autorotationScenarioStartedAt = null;
    this.guidedStoryChapterStartedAt = this.animationTime;
    this.guidedStoryElapsedAtPause = 0;
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    this.guidedStoryCamera = chapter.camera;
    this.guidedStoryCameraTransitionEndsAt = this.animationTime + 1.4;
    this.guidedStoryPreviousCameraTime = null;
    this.currentStoryBeat = null;
    this.onEnterChapter(chapter);
    this.updateControls();
  }

  private setStoryHighlight(planeIndex: number | null, pathIndex: number | null): void {
    this.storyHighlightedPlaneIndex = planeIndex;
    this.storyHighlightedPathIndex = pathIndex;
    this.synchronizeHighlights();
  }

  private synchronizeHighlights(): void {
    const hasManualHighlight =
      this.manualHighlightedPlaneIndex !== null || this.manualHighlightedPathIndex !== null;
    this.updateHighlightedPlane(
      hasManualHighlight ? this.manualHighlightedPlaneIndex : this.storyHighlightedPlaneIndex
    );
    this.updateHighlightedPath(
      hasManualHighlight ? this.manualHighlightedPathIndex : this.storyHighlightedPathIndex
    );
  }

  private updateHighlightedPlane(planeIndex: number | null): void {
    if (this.highlightedPlaneIndex === planeIndex) {
      return;
    }

    this.highlightedPlaneIndex = planeIndex;
    const {canvas, storyControls} = this.getView();
    storyControls?.setHighlightedPlane(planeIndex);
    if (canvas) {
      canvas.dataset.packetSprayingHighlightedPlane =
        planeIndex === null ? '' : String(planeIndex + 1);
    }
  }

  private updateHighlightedPath(pathIndex: number | null): void {
    if (this.highlightedPathIndex === pathIndex) {
      return;
    }

    this.highlightedPathIndex = pathIndex;
    const {canvas, storyControls} = this.getView();
    storyControls?.setHighlightedPath(pathIndex);
    if (canvas) {
      canvas.dataset.packetSprayingHighlightedPath =
        pathIndex === null ? '' : String(pathIndex + 1);
    }
  }
}
