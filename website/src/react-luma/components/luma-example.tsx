import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import type {Panel} from '@deck.gl-community/panels';
import {Device, luma} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationLoop, makeAnimationLoop, setPathPrefix} from '@luma.gl/engine';
import {StatsWidget} from '@probe.gl/stats-widget';
import type {Stat, Stats} from '@probe.gl/stats';
import {
  configurePanelHostElement,
  renderExamplePanel
} from '../../../../examples/example-panels';
import {DeviceTabs, type DeviceTabSelection} from './device-tabs';
import {
  clearActiveCpuHotspotProfilerDevice,
  setActiveCpuHotspotProfilerDevice
} from '../debug/luma-cpu-hotspot-profiler';
import {logError} from '../utils/error-utils';

// import {VRDisplay} from '@luma.gl/experimental';
import {
  createDevice,
  createPresentationDevice,
  getCanvasContainer,
  getPreferredAvailableDeviceType,
  type DeviceType,
  useStore
} from '../store/device-store';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';
let isInfoBoxCollapsedByDefault = true;
const statsWidgetCollapsedStateByTitle: Record<string, boolean> = {};
let currentLumaExampleTask: Promise<void> = Promise.resolve();

// WORKAROUND FOR luma.gl VRDisplay
// if (!globalThis.navigator) {// eslint-disable-line
//   globalThis.navigator = {};// eslint-disable-line
// }

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.website = true;
}

const STYLES = {
  EXAMPLE_NOT_SUPPPORTED: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }
};

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

type StatFormatter = (stat: Stat) => string;
type FrameRateController = {
  formatFrameRate: StatFormatter;
  start: () => void;
  stop: () => void;
  update: () => void;
};

const FRAME_RATE_SAMPLE_COUNT = 60;

function getStatsTitle(stats: Stats): string {
  const title = stats.id;
  if (title === 'GPU Time and Memory') {
    return 'GPU Time & Memory';
  }
  return title;
}

function initializeGpuTimeAndMemoryStats() {
  return luma.stats.get('GPU Time and Memory');
}

function getStatsWidgetCollapsedState(statsWidget: StatsWidget): boolean {
  return statsWidget.title ? (statsWidgetCollapsedStateByTitle[statsWidget.title] ?? true) : true;
}

function storeStatsWidgetCollapsedState(statsWidget: StatsWidget): void {
  if (statsWidget.title) {
    statsWidgetCollapsedStateByTitle[statsWidget.title] = statsWidget.collapsed;
  }
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

function getGpuLabel(device: Device | null): string {
  return device?.info.gpu || 'unknown';
}

function getGpuTypeLabel(device: Device | null): string {
  return device?.info.gpuType || 'unknown';
}

function getGpuBackendLabel(device: Device | null): string {
  return device?.info.gpuBackend || 'unknown';
}

function getGpuTimeAndMemoryStatFormatters(
  device: Device | null,
  frameRateFormatter?: StatFormatter
): Record<string, string | StatFormatter> {
  return {
    'Frame Rate':
      frameRateFormatter || ((stat: Stat) => `${stat.name}: ${Math.round(stat.count)}fps`),
    ...GPU_TIME_AND_MEMORY_STATS_FORMATTERS,
    Adapter: () => `Adapter: ${getAdapterLabel(device)}`,
    GPU: () => `GPU: ${getGpuLabel(device)}`,
    'GPU Type': () => `GPU Type: ${getGpuTypeLabel(device)}`,
    'GPU Backend': () => `GPU Backend: ${getGpuBackendLabel(device)}`
  };
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
    if (sampleAverageTime > 0) {
      return sampleAverageTime;
    }

    return stat.getAverageTime();
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

type LumaExampleProps = React.PropsWithChildren<{
  className?: string;
  id?: string;
  title?: string;
  template: Function;
  config: unknown;
  directory?: string;
  sourceDirectory?: string;
  sourcePath?: string;
  style?: CSSProperties;
  container?: string;
  panel?: boolean;
  showHeader?: boolean;
  showStats?: boolean;
  devices?: DeviceTabSelection[];
  templateInfoPlacement?: 'header' | 'page';
  headerControls?: React.ReactNode;
}>;

const defaultProps = {
  name: 'luma-example'
};

const state = {
  supported: true,
  error: null
};

const EXAMPLE_CONTAINER_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - var(--ifm-navbar-height))',
  minHeight: 'calc(100vh - var(--ifm-navbar-height))'
};

const EXAMPLE_CANVAS_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%'
};

const EXAMPLE_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
  padding: '12px 20px',
  position: 'absolute',
  top: 0,
  right: 0,
  left: 0,
  zIndex: 20,
  pointerEvents: 'none'
};

const EXAMPLE_INFO_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderRadius: 12,
  color: '#111',
  width: 420,
  minWidth: 0,
  maxWidth: 'calc(100vw - 40px)',
  overflow: 'hidden',
  padding: '10px 16px',
  zIndex: 10
};

const INFO_BOX_DEFAULT_WIDTH = 420;
const INFO_BOX_MIN_WIDTH = 280;
const INFO_BOX_MIN_HEIGHT = 160;
const INFO_BOX_VIEWPORT_RIGHT_MARGIN = 20;
const INFO_BOX_VIEWPORT_BOTTOM_MARGIN = 12;
const INFO_BOX_KEYBOARD_RESIZE_STEP = 10;
const INFO_BOX_LARGE_KEYBOARD_RESIZE_STEP = 30;

type InfoBoxSize = {
  width: number;
  height: number;
};

type InfoBoxResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

type ExampleInfoProps = {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourcePath?: string;
  title?: string;
};

type InfoBoxProps = React.PropsWithChildren<
  ExampleInfoProps & {
    html?: string;
    panel?: Panel;
    style?: CSSProperties;
  }
>;

function getInfoBoxSizeBounds(infoBoxElement: HTMLElement): {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
} {
  const rect = infoBoxElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const maxWidth = Math.max(1, viewportWidth - rect.left - INFO_BOX_VIEWPORT_RIGHT_MARGIN);
  const maxHeight = Math.max(1, viewportHeight - rect.top - INFO_BOX_VIEWPORT_BOTTOM_MARGIN);

  return {
    minWidth: Math.min(INFO_BOX_MIN_WIDTH, maxWidth),
    minHeight: Math.min(INFO_BOX_MIN_HEIGHT, maxHeight),
    maxWidth,
    maxHeight
  };
}

function clampInfoBoxSize(
  infoBoxElement: HTMLElement,
  width: number,
  height: number
): InfoBoxSize {
  const {minWidth, minHeight, maxWidth, maxHeight} = getInfoBoxSizeBounds(infoBoxElement);
  return {
    width: Math.min(maxWidth, Math.max(minWidth, width)),
    height: Math.min(maxHeight, Math.max(minHeight, height))
  };
}

type ExamplePageProps = React.PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

type ExampleHeaderProps = React.PropsWithChildren<
  ExampleInfoProps & {
    devices?: DeviceTabSelection[];
    style?: CSSProperties;
  }
>;

type ReactExampleProps<P> = {
  component: React.ComponentType<P>;
  componentProps: P;
  className?: string;
  style?: CSSProperties;
  showStats?: boolean;
};

export const InfoBox: FC<InfoBoxProps> = (props: InfoBoxProps) => {
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/') ? siteConfig.baseUrl : `${siteConfig.baseUrl}/`;
  const sourceUrl = getExampleSourceUrl(props);
  const sourcePaths = React.useMemo(
    () => getExampleSourcePaths(props),
    [props.directory, props.id, props.sourceDirectory, props.sourcePath]
  );
  const sourcePathsKey = sourcePaths.join('|');
  const title = getExampleTitle(props.id, props.title);
  const [isCollapsed, setIsCollapsed] = useState(() => isInfoBoxCollapsedByDefault);
  const [activeTab, setActiveTab] = useState<'info' | 'source'>('info');
  const [infoBoxSize, setInfoBoxSize] = useState<InfoBoxSize | null>(null);
  const [sourceResult, setSourceResult] = useState<{
    key: string;
    path?: string;
    source?: string;
    error?: string;
  } | null>(null);
  const infoBoxRef = useRef<HTMLDivElement | null>(null);
  const panelHostRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<InfoBoxResizeState | null>(null);
  const toggleCollapsed = () => setIsCollapsed(value => !value);
  const currentSourceResult = sourceResult?.key === sourcePathsKey ? sourceResult : null;

  useEffect(() => {
    isInfoBoxCollapsedByDefault = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    if (activeTab !== 'source' || sourcePaths.length === 0 || currentSourceResult) {
      return;
    }

    const abortController = new AbortController();
    void fetchExampleSource(websiteBaseUrl, sourcePaths, abortController.signal)
      .then(({path, source}) => {
        setSourceResult({key: sourcePathsKey, path, source});
      })
      .catch(error => {
        if (!abortController.signal.aborted) {
          setSourceResult({
            key: sourcePathsKey,
            error: error instanceof Error ? error.message : 'Unable to load source code.'
          });
        }
      });

    return () => abortController.abort();
  }, [activeTab, currentSourceResult, sourcePaths, sourcePathsKey, websiteBaseUrl]);

  useEffect(() => {
    const panelHostElement = panelHostRef.current;
    if (!panelHostElement || !props.panel) {
      return;
    }

    configurePanelHostElement(panelHostElement);
    renderExamplePanel(panelHostElement, props.panel);
    return () => renderExamplePanel(panelHostElement, null);
  }, [props.panel]);

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    if (!infoBoxElement) {
      return;
    }

    const rect = infoBoxElement.getBoundingClientRect();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleResizePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    const resizeState = resizeStateRef.current;
    if (!infoBoxElement || !resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    setInfoBoxSize(
      clampInfoBoxSize(
        infoBoxElement,
        resizeState.startWidth + event.clientX - resizeState.startX,
        resizeState.startHeight + event.clientY - resizeState.startY
      )
    );
  };

  const finishResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (resizeStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    resizeStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    if (!infoBoxElement) {
      return;
    }

    const resizeStep = event.shiftKey
      ? INFO_BOX_LARGE_KEYBOARD_RESIZE_STEP
      : INFO_BOX_KEYBOARD_RESIZE_STEP;
    const widthDelta =
      event.key === 'ArrowLeft' ? -resizeStep : event.key === 'ArrowRight' ? resizeStep : 0;
    const heightDelta =
      event.key === 'ArrowUp' ? -resizeStep : event.key === 'ArrowDown' ? resizeStep : 0;
    if (widthDelta === 0 && heightDelta === 0) {
      return;
    }

    const rect = infoBoxElement.getBoundingClientRect();
    setInfoBoxSize(currentSize =>
      clampInfoBoxSize(
        infoBoxElement,
        (currentSize?.width ?? rect.width) + widthDelta,
        (currentSize?.height ?? rect.height) + heightDelta
      )
    );
    event.preventDefault();
  };

  return (
    <div
      ref={infoBoxRef}
      style={{
        ...EXAMPLE_INFO_STYLE,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: infoBoxSize?.width ?? INFO_BOX_DEFAULT_WIDTH,
        height: isCollapsed ? undefined : infoBoxSize?.height,
        maxHeight: isCollapsed ? undefined : 'calc(100vh - var(--ifm-navbar-height) - 24px)',
        ...props.style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
          onClick={toggleCollapsed}
          style={{
            minWidth: 0,
            flex: '1 1 auto',
            padding: 0,
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          {title ? <h3 style={{marginTop: 0, marginBottom: 0}}>{title}</h3> : null}
        </button>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0}}>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Source code
            </a>
          ) : null}
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
            onClick={toggleCollapsed}
            style={{
              flexShrink: 0,
              border: '1px solid #d0d7de',
              background: '#fff',
              borderRadius: 999,
              minWidth: 56,
              padding: '0 12px',
              height: 28,
              fontSize: 14,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {isCollapsed ? 'Info' : 'Hide'}
          </button>
        </div>
      </div>
      <div
        hidden={isCollapsed}
        aria-hidden={isCollapsed}
        style={{
          marginTop: isCollapsed ? 0 : 12,
          minWidth: 0,
          minHeight: 0,
          flex: '1 1 auto',
          display: isCollapsed ? 'none' : 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {sourcePaths.length > 0 ? (
          <div
            role="tablist"
            aria-label="Example information"
            style={{display: 'flex', gap: 4, marginBottom: 12}}
          >
            {(['info', 'source'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '4px 9px',
                  background: activeTab === tab ? '#e2e8f0' : '#fff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeTab === tab ? 700 : 500
                }}
              >
                {tab === 'info' ? 'Info' : 'Source'}
              </button>
            ))}
          </div>
        ) : null}
        <div
          hidden={activeTab !== 'info'}
          aria-hidden={activeTab !== 'info'}
          style={{minWidth: 0, minHeight: 0, flex: '1 1 auto', overflow: 'auto'}}
        >
          {props.html ? <div dangerouslySetInnerHTML={{__html: props.html}} /> : null}
          {props.children}
          {props.panel ? <div ref={panelHostRef} /> : null}
        </div>
        {sourcePaths.length > 0 ? (
          <div
            hidden={activeTab !== 'source'}
            aria-hidden={activeTab !== 'source'}
            style={{
              minWidth: 0,
              minHeight: 0,
              flex: '1 1 auto',
              maxWidth: '100%',
              overflow: 'auto',
              background: '#f6f8fa'
            }}
          >
            {currentSourceResult?.error ? (
              <p style={{margin: 0, color: '#b00020'}}>{currentSourceResult.error}</p>
            ) : (
              <CodeBlock
                language={currentSourceResult?.path?.endsWith('.tsx') ? 'tsx' : 'typescript'}
              >
                {currentSourceResult?.source ?? '// Loading source…'}
              </CodeBlock>
            )}
          </div>
        ) : null}
      </div>
      {!isCollapsed ? (
        <button
          type="button"
          aria-label="Resize info box"
          title="Resize info box"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
          onKeyDown={handleResizeKeyDown}
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            padding: 0,
            border: '1px solid #94a3b8',
            borderRadius: 6,
            background: '#e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)',
            color: '#334155',
            cursor: 'nwse-resize',
            fontSize: 19,
            lineHeight: 1,
            touchAction: 'none',
            userSelect: 'none'
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
            <path
              d="M4 14L14 4M9 14L14 9M13 14L14 13"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

export const ExamplePage: FC<ExamplePageProps> = (props: ExamplePageProps) => {
  return (
    <div
      className={props.className || 'luma-example-page'}
      style={{...EXAMPLE_CONTAINER_STYLE, ...props.style}}
    >
      {props.children}
    </div>
  );
};

export const ExampleHeader: FC<ExampleHeaderProps> = (props: ExampleHeaderProps) => {
  return (
    <div style={{...EXAMPLE_HEADER_STYLE, ...props.style}}>
      <InfoBox
        id={props.id}
        title={props.title}
        directory={props.directory}
        sourceDirectory={props.sourceDirectory}
        sourcePath={props.sourcePath}
        style={{pointerEvents: 'auto'}}
      >
        {props.children}
      </InfoBox>
      <DeviceTabs devices={props.devices} style={{flexShrink: 0, pointerEvents: 'auto'}} />
    </div>
  );
};

export function ReactExample<P>(props: ReactExampleProps<P>) {
  const Component = props.component;
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (props.showStats === false || !statsPanelRef.current) {
      return;
    }

    const resourceCounts = luma.stats.get('GPU Resource Counts');
    const gpuTimeAndMemoryStats = initializeGpuTimeAndMemoryStats();
    const frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
    statsPanelRef.current.replaceChildren();
    frameRateController.start();

    const statsWidgets = [
      new StatsWidget(gpuTimeAndMemoryStats, {
        title: getStatsTitle(gpuTimeAndMemoryStats),
        container: statsPanelRef.current,
        css: STAT_STYLES,
        formatters: getGpuTimeAndMemoryStatFormatters(null, frameRateController.formatFrameRate)
      }),
      new StatsWidget(resourceCounts, {
        title: getStatsTitle(resourceCounts),
        container: statsPanelRef.current,
        css: STAT_STYLES
      })
    ];

    for (const statsWidget of statsWidgets) {
      statsWidget.setCollapsed(getStatsWidgetCollapsedState(statsWidget));
    }

    const updateStatsWidget = () => {
      frameRateController.update();
      for (const statsWidget of statsWidgets) {
        statsWidget.update();
      }
    };

    updateStatsWidget();
    const statsIntervalId = window.setInterval(updateStatsWidget, 250);

    return () => {
      window.clearInterval(statsIntervalId);
      frameRateController.stop();
      for (const statsWidget of statsWidgets) {
        storeStatsWidgetCollapsedState(statsWidget);
        statsWidget.remove();
      }
      statsPanelRef.current?.replaceChildren();
    };
  }, [props.showStats]);

  return (
    <ExamplePage className={props.className} style={props.style}>
      {props.showStats !== false ? (
        <div
          ref={statsPanelRef}
          style={{
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
          }}
        />
      ) : null}
      <Component {...props.componentProps} />
    </ExamplePage>
  );
}

export const LumaExample: FC<LumaExampleProps> = (props: LumaExampleProps) => {
  const showStats = props.showStats !== false && props.panel !== false;
  const showHeader = props.showHeader !== false && props.panel !== false;
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/') ? siteConfig.baseUrl : `${siteConfig.baseUrl}/`;

  /** Each example maintains an animation loop */
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const statsContainerRef = useRef<HTMLDivElement | null>(null);
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  const device = useStore(store => store.device);
  const [effectiveDeviceType, setEffectiveDeviceType] = useState<DeviceType | undefined>();
  const [effectiveDevice, setEffectiveDevice] = useState<Device | undefined>();
  const requestedDeviceTypesKey = getRequestedDeviceTypes(props.devices)?.join('|') || '';

  useEffect(() => {
    let isCancelled = false;
    const requestedDeviceTypes = getRequestedDeviceTypes(props.devices);

    const selectEffectiveDevice = async () => {
      if (!deviceType || !device) {
        if (!isCancelled) {
          setEffectiveDeviceType(undefined);
          setEffectiveDevice(undefined);
        }
        return;
      }

      if (!requestedDeviceTypes || requestedDeviceTypes.includes(deviceType)) {
        if (!isCancelled) {
          setEffectiveDeviceType(deviceType);
          setEffectiveDevice(device);
        }
        return;
      }

      const fallbackDeviceType = await getPreferredAvailableDeviceType(requestedDeviceTypes);
      if (!fallbackDeviceType) {
        if (!isCancelled) {
          setEffectiveDeviceType(deviceType);
          setEffectiveDevice(device);
        }
        return;
      }

      const fallbackDevice = await createDevice(fallbackDeviceType);
      await createPresentationDevice(fallbackDeviceType);
      if (!isCancelled) {
        setEffectiveDeviceType(fallbackDeviceType);
        setEffectiveDevice(fallbackDevice);
      }
    };

    void selectEffectiveDevice();

    return () => {
      isCancelled = true;
    };
  }, [deviceType, device, requestedDeviceTypesKey]);

  useEffect(() => {
    if (!canvasContainerRef.current || !effectiveDeviceType || !effectiveDevice) {
      return;
    }

    let isCancelled = false;
    let animationLoop: AnimationLoop | null = null;
    let statsWidgets: StatsWidget[] = [];
    let statsIntervalId: number | null = null;
    let previousSwapChainTextureMemory = 0;
    const defaultCanvasContext = effectiveDevice.getDefaultCanvasContext();
    const deviceCanvas = defaultCanvasContext.canvas;
    let frameRateController: FrameRateController | null = null;
    const asyncCreateLoop = async () => {
      // Ensure the example can find its locally served assets before example construction starts.
      if (props.directory) {
        setPathPrefix(`${websiteBaseUrl}example-assets/${props.directory}/${props.id}/`);
      } else {
        setPathPrefix(`${websiteBaseUrl}images/`);
      }

      if (!(deviceCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Website examples require the shared device canvas to be an HTMLCanvasElement');
      }

      deviceCanvas.style.display = EXAMPLE_CANVAS_STYLE.display;
      deviceCanvas.style.width = EXAMPLE_CANVAS_STYLE.width;
      deviceCanvas.style.height = EXAMPLE_CANVAS_STYLE.height;
      canvasContainerRef.current?.replaceChildren(deviceCanvas);
      setActiveCpuHotspotProfilerDevice(effectiveDevice);

      animationLoop = makeAnimationLoop(props.template as unknown as typeof AnimationLoopTemplate, {
        stats: luma.stats.get('GPU Time and Memory'),
        device: effectiveDevice,
        autoResizeViewport: true,
        autoResizeDrawingBuffer: true
      });
      animationLoop.frameRate.setSampleSize(1);

      if (showStats && statsPanelRef.current) {
        const resourceCounts = luma.stats.get('GPU Resource Counts');
        const gpuTimeAndMemoryStats = initializeGpuTimeAndMemoryStats();
        const swapChainTextureStat = gpuTimeAndMemoryStats.get('Swap Chain Texture');
        const gpuMemoryStat = gpuTimeAndMemoryStats.get('GPU Memory');
        frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
        statsPanelRef.current.replaceChildren();
        frameRateController.start();

        const updateSwapChainTextureMemory = (nextSwapChainTextureMemory: number) => {
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

        if (effectiveDevice) {
          updateSwapChainTextureMemory(getDefaultCanvasColorTextureByteLength(effectiveDevice));
        }

        statsWidgets = [
          new StatsWidget(gpuTimeAndMemoryStats, {
            title: getStatsTitle(gpuTimeAndMemoryStats),
            container: statsPanelRef.current,
            css: STAT_STYLES,
            formatters: getGpuTimeAndMemoryStatFormatters(
              effectiveDevice,
              frameRateController.formatFrameRate
            )
          }),
          new StatsWidget(resourceCounts, {
            title: getStatsTitle(resourceCounts),
            container: statsPanelRef.current,
            css: STAT_STYLES
          })
        ];
        for (const statsWidget of statsWidgets) {
          statsWidget.setCollapsed(getStatsWidgetCollapsedState(statsWidget));
        }

        const updateStatsWidget = () => {
          if (effectiveDevice) {
            updateSwapChainTextureMemory(getDefaultCanvasColorTextureByteLength(effectiveDevice));
          }

          frameRateController?.update();

          for (const statsWidget of statsWidgets) {
            statsWidget.update();
          }
        };

        updateStatsWidget();
        statsIntervalId = window.setInterval(updateStatsWidget, 250);
      }

      if (animationLoop) {
        await animationLoop.start();
      }
    };

    currentLumaExampleTask = currentLumaExampleTask
      .then(() => {
        if (isCancelled) {
          return;
        }

        return asyncCreateLoop();
      })
      .catch(error => {
        if (!isCancelled) {
          logError(`Example startup failed for ${effectiveDeviceType}`, error);
        }
      });

    return () => {
      isCancelled = true;

      currentLumaExampleTask = currentLumaExampleTask
        .then(() => {
          if (statsIntervalId !== null) {
            window.clearInterval(statsIntervalId);
            statsIntervalId = null;
          }
          frameRateController?.stop();
          frameRateController = null;
          if (previousSwapChainTextureMemory > 0) {
            const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
            gpuTimeAndMemoryStats
              .get('Swap Chain Texture')
              .subtractCount(previousSwapChainTextureMemory);
            gpuTimeAndMemoryStats.get('GPU Memory').subtractCount(previousSwapChainTextureMemory);
            previousSwapChainTextureMemory = 0;
          }
          for (const statsWidget of statsWidgets) {
            storeStatsWidgetCollapsedState(statsWidget);
            statsWidget.remove();
          }
          statsPanelRef.current?.replaceChildren();
          statsWidgets = [];
          if (animationLoop) {
            if (!effectiveDevice.isLost) {
              effectiveDevice.submit();
            }
            animationLoop.destroy();
            animationLoop = null;
          }

          clearActiveCpuHotspotProfilerDevice(effectiveDevice);
          canvasContainerRef.current?.replaceChildren();
          getCanvasContainer().appendChild(deviceCanvas);
        })
        .catch(error => {
          logError(`Example cleanup failed for ${effectiveDeviceType}`, error);
        });
    };
  }, [
    effectiveDeviceType,
    effectiveDevice,
    showStats,
    props.template,
    props.directory,
    props.id,
    websiteBaseUrl,
    requestedDeviceTypesKey
  ]);

  // @ts-expect-error Intentionally accessing undeclared field info
  const info = props.template?.info;

  return (
    <ExamplePage
      className={props.className}
      style={{
        overflow: 'hidden',
        ...props.style
      }}
    >
      {showHeader ? (
        <ExampleHeader
          id={props.id}
          title={props.title}
          directory={props.directory}
          sourceDirectory={props.sourceDirectory}
          sourcePath={props.sourcePath}
          devices={props.devices}
        >
          {info && props.templateInfoPlacement !== 'page' ? (
            <div dangerouslySetInnerHTML={{__html: info}} />
          ) : null}
          {props.headerControls}
        </ExampleHeader>
      ) : null}
      {info && props.templateInfoPlacement === 'page' ? (
        <div
          style={{height: '100%', minHeight: 0, position: 'relative', zIndex: 1}}
          dangerouslySetInnerHTML={{__html: info}}
        />
      ) : null}
      <div ref={statsContainerRef} style={{minHeight: 0, position: 'absolute', inset: 0}}>
        {showStats ? (
          <div
            ref={statsPanelRef}
            style={{
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
            }}
          />
        ) : null}
        <div
          key={effectiveDeviceType || deviceType}
          ref={canvasContainerRef}
          style={{
            ...EXAMPLE_CANVAS_STYLE,
            pointerEvents: props.templateInfoPlacement === 'page' ? 'none' : undefined
          }}
        />
      </div>
    </ExamplePage>
  );
};

function getExampleSourceUrl(props: {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourcePath?: string;
}): string | null {
  if (props.sourcePath) {
    return `${GITHUB_TREE}/${props.sourcePath}`;
  }
  if (props.id && (props.sourceDirectory || props.directory)) {
    const sourceDirectory = props.sourceDirectory || props.directory;
    return `${GITHUB_TREE}/examples/${sourceDirectory}/${props.id}`;
  }
  return null;
}

function getExampleSourcePaths(props: {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourcePath?: string;
}): string[] {
  if (props.sourcePath) {
    const sourcePath = props.sourcePath.replace(/^\/?examples\//, '').replace(/^\//, '');
    if (/\.(?:[cm]?[jt]sx?)$/.test(sourcePath)) {
      return [sourcePath];
    }
    return [`${sourcePath}/app.ts`, `${sourcePath}/app.tsx`];
  }

  if (props.id && (props.sourceDirectory || props.directory)) {
    const sourceDirectory = props.sourceDirectory || props.directory;
    return [`${sourceDirectory}/${props.id}/app.ts`, `${sourceDirectory}/${props.id}/app.tsx`];
  }

  return [];
}

async function fetchExampleSource(
  websiteBaseUrl: string,
  sourcePaths: readonly string[],
  signal: AbortSignal
): Promise<{path: string; source: string}> {
  for (const sourcePath of sourcePaths) {
    const response = await fetch(`${websiteBaseUrl}example-assets/${sourcePath}`, {signal});
    if (response.ok) {
      return {path: sourcePath, source: await response.text()};
    }
  }

  throw new Error('Unable to load source code.');
}

function getRequestedDeviceTypes(
  devices?: DeviceTabSelection[]
): DeviceType[] | undefined {
  if (!devices) {
    return undefined;
  }

  const requestedDeviceTypes: DeviceType[] = [];
  for (const device of devices) {
    const mappedDeviceTypes =
      device === 'webgpu'
        ? (['webgpu-core', 'webgpu-max', 'webgpu-compatibility'] as const)
        : device === 'webgl2'
          ? (['webgl'] as const)
          : ([device] as const);

    for (const deviceType of mappedDeviceTypes) {
      if (!requestedDeviceTypes.includes(deviceType)) {
        requestedDeviceTypes.push(deviceType);
      }
    }
  }

  return requestedDeviceTypes;
}

function getExampleTitle(id?: string, title?: string): string {
  if (title) {
    return title;
  }
  if (id) {
    return capitalizeFirstLetters(id);
  }
  return '';
}

function capitalizeFirstLetters(string: string) {
  const strings = string.split('-');
  return strings.map(capitalizeFirstLetter).join(' ');
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
