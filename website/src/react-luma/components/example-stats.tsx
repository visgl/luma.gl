import React, {type CSSProperties, type FC, useEffect, useRef} from 'react';
import {Device, luma} from '@luma.gl/core';
import type {Stat, Stats} from '@probe.gl/stats';
import {StatsWidget} from '@probe.gl/stats-widget';

const STAT_STYLES = {
  position: 'relative',
  fontSize: '12px',
  color: '#fff',
  background: '#000',
  padding: '8px',
  opacity: 0.8,
  borderRadius: '8px',
  fontFamily: 'monospace'
};

const STATS_CONTAINER_STYLE: CSSProperties = {
  position: 'absolute',
  right: '12px',
  bottom: '12px',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: 'calc(100% - 24px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  alignItems: 'flex-end'
};

const GPU_TIME_AND_MEMORY_STATS_FORMATTERS = {
  'CPU Time': (stat: Stat) => `${stat.name}: ${stat.getSampleAverageTime().toFixed(2)}ms`,
  'GPU Time': (stat: Stat) => `${stat.name}: ${stat.getSampleAverageTime().toFixed(2)}ms`,
  'GPU Memory': 'memory',
  'Buffer Memory': 'memory',
  'Texture Memory': 'memory',
  'External Buffer Memory': 'memory',
  'External Texture Memory': 'memory',
  'Swap Chain Texture': 'memory'
} as const;

const FRAME_RATE_SAMPLE_COUNT = 60;
const statsWidgetCollapsedStateByTitle: Record<string, boolean> = {};

type StatFormatter = (stat: Stat) => string;
type FrameRateController = {
  formatFrameRate: StatFormatter;
  start: () => void;
  stop: () => void;
  update: () => void;
};

type ExampleStatsProps = {
  device?: Device | null;
  trackSwapChainTextureMemory?: boolean;
  style?: CSSProperties;
};

/** Stats widgets shared by React examples and animation-loop examples. */
export const ExampleStats: FC<ExampleStatsProps> = (props: ExampleStatsProps) => {
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const statsPanelElement = statsPanelRef.current;
    if (!statsPanelElement) {
      return;
    }

    const resourceCounts = luma.stats.get('GPU Resource Counts');
    const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
    const frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
    const swapChainTextureStat = gpuTimeAndMemoryStats.get('Swap Chain Texture');
    const gpuMemoryStat = gpuTimeAndMemoryStats.get('GPU Memory');
    let previousSwapChainTextureMemory = 0;

    const updateSwapChainTextureMemory = () => {
      if (!props.trackSwapChainTextureMemory || !props.device) {
        return;
      }

      const nextSwapChainTextureMemory = getDefaultCanvasColorTextureByteLength(props.device);
      const delta = nextSwapChainTextureMemory - previousSwapChainTextureMemory;
      if (delta > 0) {
        swapChainTextureStat.addCount(delta);
        gpuMemoryStat.addCount(delta);
      } else if (delta < 0) {
        swapChainTextureStat.subtractCount(-delta);
        gpuMemoryStat.subtractCount(-delta);
      }
      previousSwapChainTextureMemory = nextSwapChainTextureMemory;
    };

    statsPanelElement.replaceChildren();
    frameRateController.start();
    updateSwapChainTextureMemory();

    const statsWidgets = [
      new StatsWidget(gpuTimeAndMemoryStats, {
        title: getStatsTitle(gpuTimeAndMemoryStats),
        container: statsPanelElement,
        css: STAT_STYLES,
        formatters: getGpuTimeAndMemoryStatFormatters(
          props.device ?? null,
          frameRateController.formatFrameRate
        )
      }),
      new StatsWidget(resourceCounts, {
        title: getStatsTitle(resourceCounts),
        container: statsPanelElement,
        css: STAT_STYLES
      })
    ];

    for (const statsWidget of statsWidgets) {
      statsWidget.setCollapsed(getStatsWidgetCollapsedState(statsWidget));
    }

    const updateStatsWidgets = () => {
      updateSwapChainTextureMemory();
      frameRateController.update();
      for (const statsWidget of statsWidgets) {
        statsWidget.update();
      }
    };

    updateStatsWidgets();
    const statsIntervalId = window.setInterval(updateStatsWidgets, 250);

    return () => {
      window.clearInterval(statsIntervalId);
      frameRateController.stop();
      if (previousSwapChainTextureMemory > 0) {
        swapChainTextureStat.subtractCount(previousSwapChainTextureMemory);
        gpuMemoryStat.subtractCount(previousSwapChainTextureMemory);
      }
      for (const statsWidget of statsWidgets) {
        storeStatsWidgetCollapsedState(statsWidget);
        statsWidget.remove();
      }
      statsPanelElement.replaceChildren();
    };
  }, [props.device, props.trackSwapChainTextureMemory]);

  return <div ref={statsPanelRef} style={{...STATS_CONTAINER_STYLE, ...props.style}} />;
};

function getStatsTitle(stats: Stats): string {
  return stats.id === 'GPU Time and Memory' ? 'GPU Time & Memory' : stats.id;
}

function getStatsWidgetCollapsedState(statsWidget: StatsWidget): boolean {
  return statsWidget.title ? (statsWidgetCollapsedStateByTitle[statsWidget.title] ?? true) : true;
}

function storeStatsWidgetCollapsedState(statsWidget: StatsWidget): void {
  if (statsWidget.title) {
    statsWidgetCollapsedStateByTitle[statsWidget.title] = statsWidget.collapsed;
  }
}

function getGpuTimeAndMemoryStatFormatters(
  device: Device | null,
  frameRateFormatter: StatFormatter
): Record<string, string | StatFormatter> {
  return {
    'Frame Rate': frameRateFormatter,
    ...GPU_TIME_AND_MEMORY_STATS_FORMATTERS,
    Adapter: () => `Adapter: ${getAdapterLabel(device)}`,
    GPU: () => `GPU: ${device?.info.gpu || 'unknown'}`,
    'GPU Type': () => `GPU Type: ${device?.info.gpuType || 'unknown'}`,
    'GPU Backend': () => `GPU Backend: ${device?.info.gpuBackend || 'unknown'}`
  };
}

function getAdapterLabel(device: Device | null): string {
  switch (device?.type) {
    case 'webgl':
      return 'WebGL 2';
    case 'webgpu':
      return 'WebGPU';
    default:
      return 'Unknown';
  }
}

function createFrameRateController(stats: Stats): FrameRateController {
  const frameRateStat = stats.get('Frame Rate');
  const cpuTimeStat = stats.get('CPU Time');
  const gpuTimeStat = stats.get('GPU Time');
  const frameDurations: number[] = [];
  let frameDurationTotal = 0;
  let previousFrameTimestamp = 0;
  let currentFrameRate = 0;
  let animationFrameId: number | null = null;

  const reset = () => {
    frameDurations.length = 0;
    frameDurationTotal = 0;
    previousFrameTimestamp = 0;
    currentFrameRate = 0;
    frameRateStat.reset();
  };

  const getAverageFrameDuration = () =>
    frameDurations.length > 0 ? frameDurationTotal / frameDurations.length : 0;

  const getStatDuration = (stat: Stat) => {
    const sampleAverageTime = stat.getSampleAverageTime();
    return sampleAverageTime > 0 ? sampleAverageTime : stat.getAverageTime();
  };

  const updateFrameRateStat = () => {
    const estimatedFrameDuration = Math.max(
      getAverageFrameDuration(),
      getStatDuration(cpuTimeStat),
      getStatDuration(gpuTimeStat)
    );
    currentFrameRate = estimatedFrameDuration > 0 ? 1000 / estimatedFrameDuration : 0;
    frameRateStat.count = currentFrameRate;
    frameRateStat.lastTiming = estimatedFrameDuration;
    frameRateStat.lastSampleTime = estimatedFrameDuration;
    frameRateStat.lastSampleCount = currentFrameRate;
  };

  const trackFrame = (timestamp: number) => {
    if (previousFrameTimestamp > 0) {
      const frameDuration = timestamp - previousFrameTimestamp;
      if (frameDuration > 0) {
        frameDurations.push(frameDuration);
        frameDurationTotal += frameDuration;
        if (frameDurations.length > FRAME_RATE_SAMPLE_COUNT) {
          frameDurationTotal -= frameDurations.shift() || 0;
        }
      }
    }

    previousFrameTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(trackFrame);
  };

  return {
    formatFrameRate: stat =>
      `${stat.name}: ${currentFrameRate.toFixed(currentFrameRate >= 10 ? 0 : 1)}fps`,
    start: () => {
      reset();
      animationFrameId = window.requestAnimationFrame(trackFrame);
    },
    stop: () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      reset();
    },
    update: updateFrameRateStat
  };
}

function getDefaultCanvasColorTextureByteLength(device: Device): number {
  const canvasContext = device.canvasContext;
  if (!canvasContext) {
    return 0;
  }

  const [width, height] = canvasContext.getDrawingBufferSize();
  const formatInfo = device.getTextureFormatInfo(device.preferredColorFormat);
  return width * height * (formatInfo.bytesPerPixel || 0);
}
