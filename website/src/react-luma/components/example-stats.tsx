import React, {type CSSProperties, type FC, useEffect, useRef} from 'react';
import {Device, luma} from '@luma.gl/core';
import {Stats, type Stat} from '@probe.gl/stats';
import {StatsWidget} from '@probe.gl/stats-widget';
import {applyExampleTheme, type ExampleThemeAppearance} from '../../../../examples/example-theme';
import {
  measureBrowserMemory,
  readBrowserHeapMemory,
  supportsPageMemoryMeasurement,
  type BrowserMemoryMeasurement,
  type BrowserMemoryPerformance
} from '../utils/browser-memory';

const STAT_STYLES = {
  position: 'relative',
  color: 'var(--luma-example-text, rgb(226, 232, 240))',
  background: 'var(--luma-example-surface, rgba(8, 15, 27, 0.94))',
  border: '1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))',
  borderRadius: 'var(--luma-example-radius, 12px)',
  boxShadow: 'var(--luma-example-shadow, 0 16px 36px rgba(0, 0, 0, 0.28))',
  padding: '10px 12px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '11px',
  lineHeight: '1.55',
  header: {
    color: 'var(--luma-example-text, rgb(226, 232, 240))',
    fontSize: '11px',
    fontWeight: '650',
    letterSpacing: '0.015em'
  },
  item: {
    color: 'var(--luma-example-text-muted, rgb(148, 163, 184))',
    paddingLeft: '11px'
  }
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
const HEAP_MEMORY_SAMPLE_INTERVAL = 1_000;
const PAGE_MEMORY_SAMPLE_INTERVAL = 30_000;
const statsWidgetCollapsedStateByTitle: Record<string, boolean> = {};

type StatFormatter = (stat: Stat) => string;
type FrameRateController = {
  formatFrameRate: StatFormatter;
  start: () => void;
  stop: () => void;
  update: () => void;
};

type StatsWidgetDescriptor = {
  headerElement: HTMLElement;
  title: string;
  type: 'memory' | 'cpu-memory' | 'frame-rate';
  widget: StatsWidget;
  widgetElement: HTMLElement;
};

type ExampleStatsProps = {
  appearance?: ExampleThemeAppearance;
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

    applyExampleTheme(statsPanelElement, props.appearance ?? 'cinematic');
    const resourceCounts = luma.stats.get('GPU Resource Counts');
    const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
    const cpuMemoryStats = new Stats({id: 'CPU Memory'});
    const usedCpuMemoryStat = cpuMemoryStats.get('Used Memory');
    const allocatedHeapMemoryStat = cpuMemoryStats.get('Allocated Heap');
    const heapMemoryLimitStat = cpuMemoryStats.get('Heap Limit');
    cpuMemoryStats.get('Measurement');
    const frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
    const swapChainTextureStat = gpuTimeAndMemoryStats.get('Swap Chain Texture');
    const gpuMemoryStat = gpuTimeAndMemoryStats.get('GPU Memory');
    const browserPerformance = window.performance as BrowserMemoryPerformance;
    const supportsPageMemory = supportsPageMemoryMeasurement(
      browserPerformance,
      window.crossOriginIsolated === true
    );
    let cpuMemoryMeasurement: BrowserMemoryMeasurement | null =
      readBrowserHeapMemory(browserPerformance);
    let cpuMemoryMeasurementInFlight = false;
    let isMounted = true;
    let previousSwapChainTextureMemory = 0;

    const updateCpuMemoryStats = (measurement: BrowserMemoryMeasurement | null) => {
      cpuMemoryMeasurement = measurement;
      usedCpuMemoryStat.count = measurement?.usedBytes ?? 0;
      allocatedHeapMemoryStat.count = measurement?.allocatedHeapBytes ?? 0;
      heapMemoryLimitStat.count = measurement?.heapLimitBytes ?? 0;
    };

    const updateCpuMemoryMeasurement = () => {
      if (!isMounted || cpuMemoryMeasurementInFlight) {
        return;
      }

      if (!supportsPageMemory) {
        updateCpuMemoryStats(readBrowserHeapMemory(browserPerformance));
        return;
      }

      cpuMemoryMeasurementInFlight = true;
      void measureBrowserMemory(browserPerformance, true)
        .then(measurement => {
          if (isMounted) {
            updateCpuMemoryStats(measurement);
          }
        })
        .finally(() => {
          cpuMemoryMeasurementInFlight = false;
        });
    };

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
    updateCpuMemoryMeasurement();

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
      new StatsWidget(cpuMemoryStats, {
        title: getStatsTitle(cpuMemoryStats),
        container: statsPanelElement,
        css: STAT_STYLES,
        formatters: {
          'Used Memory': () =>
            `Used Memory: ${formatOptionalCompactMemory(cpuMemoryMeasurement?.usedBytes)}`,
          'Allocated Heap': () =>
            `Allocated Heap: ${formatOptionalCompactMemory(cpuMemoryMeasurement?.allocatedHeapBytes)}`,
          'Heap Limit': () =>
            `Heap Limit: ${formatOptionalCompactMemory(cpuMemoryMeasurement?.heapLimitBytes)}`,
          Measurement: () =>
            `Measurement: ${getCpuMemoryMeasurementLabel(cpuMemoryMeasurement)}`
        }
      }),
      new StatsWidget(resourceCounts, {
        title: getStatsTitle(resourceCounts),
        container: statsPanelElement,
        css: STAT_STYLES
      })
    ];

    const statsWidgetDescriptors = statsWidgets.map((widget, index): StatsWidgetDescriptor => {
      const widgetElement = statsPanelElement.children[index] as HTMLElement;
      const headerElement = widgetElement.firstElementChild as HTMLElement;
      const title = widget.title || widget.stats.id;
      const type = index === 0 ? 'memory' : index === 1 ? 'cpu-memory' : 'frame-rate';
      widgetElement.dataset.lumaExampleStatsWidget = type;
      headerElement.setAttribute('role', 'button');
      headerElement.tabIndex = 0;
      widget.setCollapsed(getStatsWidgetCollapsedState(title));
      return {headerElement, title, type, widget, widgetElement};
    });

    const updateStatsWidgets = () => {
      updateSwapChainTextureMemory();
      frameRateController.update();
      for (const {headerElement, title, type, widget, widgetElement} of statsWidgetDescriptors) {
        widget.update();
        const compactTitle =
          type === 'memory'
            ? `GPU ${formatCompactMemory(gpuMemoryStat.count)}`
            : type === 'cpu-memory'
              ? `CPU ${formatOptionalCompactMemory(cpuMemoryMeasurement?.usedBytes)}`
              : `${formatCompactFrameRate(gpuTimeAndMemoryStats.get('Frame Rate').count)} FPS`;
        const nextTitle = widget.collapsed ? compactTitle : title;
        if (widget.title !== nextTitle) {
          widget.title = nextTitle;
          widget.setCollapsed(widget.collapsed);
        }
        if (widget.collapsed) {
          headerElement.textContent = compactTitle;
        }
        widgetElement.dataset.lumaExampleStatsCollapsed = String(widget.collapsed);
        headerElement.setAttribute('aria-expanded', String(!widget.collapsed));
        headerElement.setAttribute(
          'aria-label',
          widget.collapsed ? `${compactTitle}. Expand ${title}` : `Collapse ${title}`
        );
      }
    };

    const handleStatsHeaderClick = () => updateStatsWidgets();
    const handleStatsWidgetClick = (event: MouseEvent) => {
      const descriptor = statsWidgetDescriptors.find(
        ({widgetElement}) => widgetElement === event.currentTarget
      );
      if (
        !descriptor ||
        descriptor.widget.collapsed ||
        descriptor.headerElement.contains(event.target as Node)
      ) {
        return;
      }

      descriptor.widget.setCollapsed(true);
      updateStatsWidgets();
    };
    const handleStatsHeaderKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
      }
    };
    for (const {headerElement, widgetElement} of statsWidgetDescriptors) {
      headerElement.addEventListener('click', handleStatsHeaderClick);
      headerElement.addEventListener('keydown', handleStatsHeaderKeyDown);
      widgetElement.addEventListener('click', handleStatsWidgetClick);
    }

    updateStatsWidgets();
    const statsIntervalId = window.setInterval(updateStatsWidgets, 250);
    const cpuMemoryIntervalId = window.setInterval(
      updateCpuMemoryMeasurement,
      supportsPageMemory ? PAGE_MEMORY_SAMPLE_INTERVAL : HEAP_MEMORY_SAMPLE_INTERVAL
    );

    return () => {
      isMounted = false;
      window.clearInterval(statsIntervalId);
      window.clearInterval(cpuMemoryIntervalId);
      frameRateController.stop();
      if (previousSwapChainTextureMemory > 0) {
        swapChainTextureStat.subtractCount(previousSwapChainTextureMemory);
        gpuMemoryStat.subtractCount(previousSwapChainTextureMemory);
      }
      for (const {headerElement, title, widget, widgetElement} of statsWidgetDescriptors) {
        headerElement.removeEventListener('click', handleStatsHeaderClick);
        headerElement.removeEventListener('keydown', handleStatsHeaderKeyDown);
        widgetElement.removeEventListener('click', handleStatsWidgetClick);
        storeStatsWidgetCollapsedState(title, widget.collapsed);
        widget.remove();
      }
      statsPanelElement.replaceChildren();
    };
  }, [props.appearance, props.device, props.trackSwapChainTextureMemory]);

  return (
    <div
      ref={statsPanelRef}
      role="group"
      aria-label="GPU, CPU memory, and frame-rate statistics"
      data-luma-example-stats=""
      style={{...STATS_CONTAINER_STYLE, ...props.style}}
    />
  );
};

function getStatsTitle(stats: Stats): string {
  return stats.id === 'GPU Time and Memory' ? 'GPU Time & Memory' : stats.id;
}

function getStatsWidgetCollapsedState(title: string): boolean {
  return statsWidgetCollapsedStateByTitle[title] ?? true;
}

function storeStatsWidgetCollapsedState(title: string, collapsed: boolean): void {
  statsWidgetCollapsedStateByTitle[title] = collapsed;
}

function formatCompactMemory(bytes: number): string {
  const gigabytes = Math.max(bytes, 0) / 1024 ** 3;
  return `${gigabytes.toFixed(gigabytes < 10 ? 2 : 1)} GB`;
}

function formatOptionalCompactMemory(bytes: number | null | undefined): string {
  return bytes === null || bytes === undefined ? 'N/A' : formatCompactMemory(bytes);
}

function formatCompactFrameRate(framesPerSecond: number): string {
  return framesPerSecond > 0 ? String(Math.round(framesPerSecond)) : '--';
}

function getCpuMemoryMeasurementLabel(measurement: BrowserMemoryMeasurement | null): string {
  if (!measurement) {
    return 'Unavailable in this browser';
  }
  return measurement.source === 'page-memory' ? 'Browser page memory' : 'JavaScript heap';
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
