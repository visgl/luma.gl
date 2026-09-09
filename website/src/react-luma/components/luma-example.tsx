import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {Device, luma, type DeviceLimits} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  makeAnimationLoop,
  setPathPrefix,
  type AnimationProps,
  type TemplateAnimationLoop
} from '@luma.gl/engine';
import {DeviceTabs, type DeviceTabSelection} from './device-tabs';
import {ExampleStats} from './example-stats';
import {InfoBox, type ExampleInfoProps, type InfoBoxAppearance} from './info-box';
import {
  clearActiveCpuHotspotProfilerDevice,
  setActiveCpuHotspotProfilerDevice
} from '../debug/luma-cpu-hotspot-profiler';
import {getErrorMessage, logError} from '../utils/error-utils';
import {
  HDRCanvasCaptureController,
  type HDRScreenshotCapture
} from '../utils/hdr-screenshot-capture';
import {getMobileExamplePixelRatio} from '../utils/mobile-example-pixel-ratio';
import {
  getExampleMobileQuality,
  getExampleMobileLabel,
  getExampleMobileUnsupportedReason,
  getExampleRuntimeEnvironment,
  type ExampleMobileMode,
  type ExampleMobileQualityProfile,
  type ExampleRuntimeEnvironment,
  type ExampleSupportDefinition
} from '../../../../examples/example-support';
import {getExampleSupportDefinition} from '../../../../examples/example-support-registry';
import {useExampleSupportDefinition} from '../example-support-context';
// import {VRDisplay} from '@luma.gl/experimental';
import {
  createDevice,
  createPresentationDevice,
  getCanvasContainer,
  getPreferredAvailableDeviceType,
  type CanvasContextProfile,
  type DeviceType,
  useStore
} from '../store/device-store';

let currentLumaExampleTask: Promise<void> = Promise.resolve();

export type {HDRScreenshotCapture} from '../utils/hdr-screenshot-capture';

type HDRScreenshotCapturable = AnimationLoopTemplate & {
  captureHDRScreenshot: () => Promise<HDRScreenshotCapture>;
};

export type HDRScreenshotCaptureFunction = (() => Promise<HDRScreenshotCapture>) & {
  deviceType: DeviceType;
};

declare global {
  interface Window {
    lumaCaptureHDRScreenshot?: HDRScreenshotCaptureFunction;
  }
}

// WORKAROUND FOR luma.gl VRDisplay
// if (!globalThis.navigator) {// eslint-disable-line
//   globalThis.navigator = {};// eslint-disable-line
// }

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.website = true;
}

export type ExampleDisplayProps = {
  className?: string;
  embedded?: boolean;
  embeddedHeight?: CSSProperties['height'];
  exampleId?: string;
  mobileMode?: ExampleMobileMode;
  mobileProfile?: ExampleMobileQualityProfile;
  mobileUnsupportedReason?: string;
  runtimeState?: ExampleRuntimeState;
  style?: CSSProperties;
};

export type ExampleRuntimeState = 'loading' | 'running' | 'unsupported' | 'failed';

export type LumaExampleTemplate = new (animationProps: AnimationProps) => AnimationLoopTemplate;
export type LumaExampleTemplateModule = {default: LumaExampleTemplate};
export type LumaExampleTemplateLoader = () => Promise<LumaExampleTemplateModule>;

export type LumaExampleProps = React.PropsWithChildren<
  ExampleDisplayProps & {
    id?: string;
    title?: string;
    subtitle?: string;
    /** Preloaded templates remain supported by existing embedded examples. */
    template?: LumaExampleTemplate;
    /** Lazily imports the example without changing shared-device ownership. */
    loadTemplate?: LumaExampleTemplateLoader;
    config: unknown;
    directory?: string;
    sourceDirectory?: string;
    sourceFiles?: string[];
    sourcePath?: string;
    stackBlitz?: boolean;
    infoBoxAppearance?: InfoBoxAppearance;
    container?: string;
    panel?: boolean;
    showHeader?: boolean;
    showStats?: boolean;
    devices?: DeviceTabSelection[];
    requiredDeviceLimits?: Partial<
      Pick<DeviceLimits, 'maxColorAttachments' | 'maxColorAttachmentBytesPerSample'>
    >;
    canvasContextProfile?: CanvasContextProfile;
    xrCompatible?: boolean;
    templateInfoPlacement?: 'header' | 'page';
    headerControls?: React.ReactNode;
  }
>;

const defaultProps = {
  name: 'luma-example'
};

const EXAMPLE_CONTAINER_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - var(--ifm-navbar-height))',
  minHeight: 'calc(100vh - var(--ifm-navbar-height))',
  overflow: 'hidden'
};

const EXAMPLE_CANVAS_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%'
};

const EXAMPLE_STARTUP_ERROR_STYLE: CSSProperties = {
  alignItems: 'center',
  background: 'rgba(2, 6, 23, 0.92)',
  color: '#e2e8f0',
  display: 'flex',
  inset: 0,
  justifyContent: 'center',
  padding: 24,
  position: 'absolute',
  textAlign: 'center',
  zIndex: 15
};

const EXAMPLE_MOBILE_BADGE_STYLE: CSSProperties = {
  border: '1px solid rgba(125, 211, 252, 0.34)',
  borderRadius: 999,
  color: '#bae6fd',
  display: 'inline-flex',
  fontSize: 11,
  fontWeight: 700,
  marginTop: 10,
  padding: '4px 8px'
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

export type ExamplePageProps = React.PropsWithChildren<ExampleDisplayProps>;

export type ExampleStageProps = React.PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

type ExampleHeaderProps = React.PropsWithChildren<
  ExampleInfoProps & {
    infoBoxAppearance?: InfoBoxAppearance;
    devices?: DeviceTabSelection[];
    style?: CSSProperties;
  }
>;

type ReactExampleProps<P> = {
  component: React.ComponentType<P>;
  componentProps: P;
  showStats?: boolean;
} & ExampleDisplayProps;

/** Bounds an explicitly composed example header and render surface as one visual stage. */
export const ExampleStage: FC<ExampleStageProps> = (props: ExampleStageProps) => (
  <div
    data-luma-example-page=""
    className={props.className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...props.style}}
  >
    {props.children}
  </div>
);

export const ExamplePage: FC<ExamplePageProps> = (props: ExamplePageProps) => {
  const [isImmersive, setIsImmersive] = useState(true);
  const supportDefinition = useResolvedExampleSupportDefinition(props);
  const runtimeEnvironment = useExampleRuntimeEnvironment();
  const mobileUnsupportedReason = getExampleMobileUnsupportedReason(
    supportDefinition,
    runtimeEnvironment
  );
  const runtimeState = mobileUnsupportedReason ? 'unsupported' : props.runtimeState || 'running';
  const embeddedHeight = props.embeddedHeight ?? 560;
  const embeddedStyle: CSSProperties | undefined = props.embedded
    ? {
        height: embeddedHeight,
        minHeight: embeddedHeight === 'auto' ? 0 : embeddedHeight
      }
    : undefined;

  return (
    <div
      data-luma-example-page=""
      data-luma-embedded-example={props.embedded ? '' : undefined}
      data-luma-example-immersive={props.embedded ? undefined : String(isImmersive)}
      data-luma-example-id={supportDefinition.id || undefined}
      data-luma-example-mobile-mode={supportDefinition.mobileMode}
      data-luma-example-quality-profile={supportDefinition.mobileProfile}
      data-luma-example-state={runtimeState}
      className={
        props.className || (props.embedded ? 'docs-embedded-example' : 'luma-example-page')
      }
      onWheelCapture={
        props.embedded
          ? event => {
              if (!event.ctrlKey && !event.metaKey) {
                event.stopPropagation();
              }
            }
          : undefined
      }
      style={{...EXAMPLE_CONTAINER_STYLE, ...embeddedStyle, ...props.style}}
    >
      {mobileUnsupportedReason ? (
        <ExampleStatusMessage
          embedded={props.embedded}
          message={mobileUnsupportedReason}
          state="unsupported"
        />
      ) : (
        props.children
      )}
      {!props.embedded ? (
        <button
          data-luma-example-fullscreen-toggle=""
          type="button"
          aria-label={isImmersive ? 'Exit fullscreen example' : 'Enter fullscreen example'}
          aria-pressed={isImmersive}
          title={isImmersive ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={() => setIsImmersive(previousValue => !previousValue)}
        >
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          >
            <path
              d={
                isImmersive
                  ? 'M8 3v5H3m13-5v5h5M8 21v-5H3m13 5v-5h5'
                  : 'M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5'
              }
            />
          </svg>
        </button>
      ) : null}
      {props.embedded ? (
        <div className="docs-embedded-example-interaction-hint" aria-hidden="true">
          Scroll page · Ctrl/⌘ + scroll to interact
        </div>
      ) : null}
      {runtimeEnvironment.handheld ? (
        <span
          data-luma-example-mobile-badge=""
          aria-label={`Mobile support: ${getExampleMobileLabel(supportDefinition.mobileMode)}`}
          style={{
            ...EXAMPLE_MOBILE_BADGE_STYLE,
            bottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
            left: `calc(8px + env(safe-area-inset-left, 0px))`,
            margin: 0,
            pointerEvents: 'none',
            position: 'absolute',
            zIndex: 24
          }}
        >
          {getExampleMobileLabel(supportDefinition.mobileMode)}
        </span>
      ) : null}
    </div>
  );
};

export const ExampleHeader: FC<ExampleHeaderProps> = (props: ExampleHeaderProps) => {
  return (
    <div data-luma-example-header="" style={{...EXAMPLE_HEADER_STYLE, ...props.style}}>
      <InfoBox
        id={props.id}
        title={props.title}
        subtitle={props.subtitle}
        directory={props.directory}
        sourceDirectory={props.sourceDirectory}
        sourceFiles={props.sourceFiles}
        sourcePath={props.sourcePath}
        stackBlitz={props.stackBlitz}
        appearance={props.infoBoxAppearance}
        style={{pointerEvents: 'auto'}}
      >
        {props.children}
      </InfoBox>
      <DeviceTabs
        appearance={props.infoBoxAppearance}
        devices={props.devices}
        style={{
          flexShrink: 1,
          maxWidth: '100%',
          overflowX: 'auto',
          pointerEvents: 'auto'
        }}
      />
    </div>
  );
};

export function ReactExample<P>(props: ReactExampleProps<P>) {
  const Component = props.component;

  return (
    <ExamplePage
      className={props.className}
      embedded={props.embedded}
      embeddedHeight={props.embeddedHeight}
      exampleId={props.exampleId}
      mobileMode={props.mobileMode}
      mobileProfile={props.mobileProfile}
      mobileUnsupportedReason={props.mobileUnsupportedReason}
      runtimeState={props.runtimeState}
      style={props.style}
    >
      {props.showStats !== false ? <ExampleStats /> : null}
      <Component {...props.componentProps} />
    </ExamplePage>
  );
}

export const LumaExample: FC<LumaExampleProps> = (props: LumaExampleProps) => {
  const showStats = props.showStats !== false && props.panel !== false;
  const showHeader = props.showHeader !== false && props.panel !== false;
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/')
    ? siteConfig.baseUrl
    : `${siteConfig.baseUrl}/`;
  const supportDefinition = useResolvedExampleSupportDefinition({
    exampleId: [props.directory, props.id].filter(Boolean).join('/'),
    mobileMode: props.mobileMode,
    mobileProfile: props.mobileProfile,
    mobileUnsupportedReason: props.mobileUnsupportedReason
  });
  const runtimeEnvironment = useExampleRuntimeEnvironment();
  const mobileUnsupportedReason = getExampleMobileUnsupportedReason(
    supportDefinition,
    runtimeEnvironment
  );

  /** Each example maintains an animation loop */
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  const device = useStore(store => store.device);
  const [effectiveDeviceType, setEffectiveDeviceType] = useState<DeviceType | undefined>();
  const [effectiveDevice, setEffectiveDevice] = useState<Device | undefined>();
  const [startupErrorMessage, setStartupErrorMessage] = useState<string | null>(null);
  const [capabilityUnsupportedMessage, setCapabilityUnsupportedMessage] = useState<string | null>(
    null
  );
  const [templateLoadErrorMessage, setTemplateLoadErrorMessage] = useState<string | null>(null);
  const [hasRendered, setHasRendered] = useState(false);
  const [deferredTemplate, setDeferredTemplate] = useState<{
    loader: LumaExampleTemplateLoader;
    template: LumaExampleTemplate;
  } | null>(null);
  const animationTemplate =
    props.template ||
    (deferredTemplate?.loader === props.loadTemplate ? deferredTemplate.template : undefined);
  const declaredDevices =
    props.devices ||
    (supportDefinition.requirements?.backends
      ? [...supportDefinition.requirements.backends]
      : undefined);
  const requestedDeviceTypesKey = getRequestedDeviceTypes(declaredDevices)?.join('|') || '';

  useEffect(() => {
    const loadTemplate = props.loadTemplate;
    if (mobileUnsupportedReason || props.template || !loadTemplate || !effectiveDevice) {
      setTemplateLoadErrorMessage(null);
      return;
    }

    let isCancelled = false;
    setTemplateLoadErrorMessage(null);
    void loadTemplate()
      .then(module => {
        if (!isCancelled) {
          setDeferredTemplate({loader: loadTemplate, template: module.default});
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setTemplateLoadErrorMessage(getErrorMessage(error));
          logError(`Failed to load ${props.id || 'GPU'} example`, error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [effectiveDevice, mobileUnsupportedReason, props.id, props.loadTemplate, props.template]);

  useEffect(() => {
    let isCancelled = false;
    const requestedDeviceTypes = getRequestedDeviceTypes(declaredDevices);

    const createExampleDevice = async (
      exampleDeviceType: DeviceType,
      sharedDevice?: Device
    ): Promise<Device> => {
      const requiresXRCompatibleDevice =
        props.xrCompatible === true && exampleDeviceType.startsWith('webgpu-');
      const usesCustomCanvasContext =
        props.canvasContextProfile !== undefined && props.canvasContextProfile !== 'default';

      if (!requiresXRCompatibleDevice && !usesCustomCanvasContext && sharedDevice) {
        return sharedDevice;
      }

      try {
        return await createDevice(exampleDeviceType, props.canvasContextProfile, {
          xrCompatible: requiresXRCompatibleDevice
        });
      } catch (error) {
        if (!requiresXRCompatibleDevice) {
          throw error;
        }

        logError('XR-compatible WebGPU unavailable; continuing with desktop preview', error);
        if (!usesCustomCanvasContext && sharedDevice) {
          return sharedDevice;
        }

        return await createDevice(exampleDeviceType, props.canvasContextProfile);
      }
    };

    const selectEffectiveDevice = async () => {
      if (mobileUnsupportedReason) {
        return;
      }
      if (!deviceType || !device) {
        if (!isCancelled) {
          setEffectiveDeviceType(undefined);
          setEffectiveDevice(undefined);
        }
        return;
      }

      if (!requestedDeviceTypes || requestedDeviceTypes.includes(deviceType)) {
        const exampleDevice = await createExampleDevice(deviceType, device);
        assertExampleDeviceLimits(exampleDevice, props.requiredDeviceLimits);
        if (!isCancelled) {
          setEffectiveDeviceType(deviceType);
          setEffectiveDevice(exampleDevice);
        }
        return;
      }

      const fallbackDeviceType = await getPreferredAvailableDeviceType(requestedDeviceTypes);
      if (!fallbackDeviceType) {
        throw new Error(
          `This example requires ${formatRequestedDeviceTypes(requestedDeviceTypes)}, but no compatible graphics backend is available in this browser.`
        );
      }

      const fallbackDevice = await createExampleDevice(fallbackDeviceType);
      assertExampleDeviceLimits(fallbackDevice, props.requiredDeviceLimits);
      await createPresentationDevice(fallbackDeviceType);
      if (!isCancelled) {
        setEffectiveDeviceType(fallbackDeviceType);
        setEffectiveDevice(fallbackDevice);
      }
    };

    setCapabilityUnsupportedMessage(null);
    void selectEffectiveDevice().catch(error => {
      if (!isCancelled) {
        setEffectiveDeviceType(undefined);
        setEffectiveDevice(undefined);
        setCapabilityUnsupportedMessage(getErrorMessage(error));
        logError('Example device selection failed', error);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    deviceType,
    device,
    props.canvasContextProfile,
    props.xrCompatible,
    props.requiredDeviceLimits?.maxColorAttachments,
    props.requiredDeviceLimits?.maxColorAttachmentBytesPerSample,
    requestedDeviceTypesKey,
    mobileUnsupportedReason
  ]);

  useEffect(() => {
    if (
      !canvasContainerRef.current ||
      !effectiveDeviceType ||
      !effectiveDevice ||
      !animationTemplate
    ) {
      return;
    }

    const canvasContainer = canvasContainerRef.current;
    let isCancelled = false;
    let animationLoop: TemplateAnimationLoop | null = null;
    let browserCaptureFunction: Window['lumaCaptureHDRScreenshot'];
    const defaultCanvasContext = effectiveDevice.getDefaultCanvasContext();
    const deviceCanvas = defaultCanvasContext.canvas;
    const previousUseDevicePixels = defaultCanvasContext.props.useDevicePixels;
    const exampleId = [props.directory, props.id].filter(Boolean).join('/');
    const captureController =
      props.canvasContextProfile === 'high-dynamic-range'
        ? new HDRCanvasCaptureController(exampleId, effectiveDevice, defaultCanvasContext)
        : null;
    setStartupErrorMessage(null);
    setHasRendered(false);

    const updateMobileDrawingBufferResolution = () => {
      const mobilePixelRatio = getMobileExamplePixelRatio({
        devicePixelRatio: window.devicePixelRatio || 1,
        height: canvasContainer.clientHeight || window.innerHeight,
        mobile: getExampleRuntimeEnvironment(window, navigator).handheld,
        width: canvasContainer.clientWidth || window.innerWidth
      });
      defaultCanvasContext.setProps({useDevicePixels: mobilePixelRatio});
      if (deviceCanvas instanceof HTMLCanvasElement) {
        deviceCanvas.dataset.lumaExamplePixelRatio =
          typeof mobilePixelRatio === 'number' ? mobilePixelRatio.toFixed(2) : 'native';
      }
    };

    const removeBrowserCaptureFunction = () => {
      if (window.lumaCaptureHDRScreenshot === browserCaptureFunction) {
        delete window.lumaCaptureHDRScreenshot;
      }
      browserCaptureFunction = undefined;
    };

    void effectiveDevice.lost.then(loss => {
      if (!isCancelled && loss.reason !== 'destroyed') {
        setStartupErrorMessage(
          loss.message || 'The graphics device was lost while this example was running.'
        );
        setHasRendered(false);
      }
    });

    const asyncCreateLoop = async () => {
      // Ensure the example can find its locally served assets before example construction starts.
      if (props.directory) {
        setPathPrefix(`${websiteBaseUrl}example-assets/${props.directory}/${props.id}/`);
      } else {
        setPathPrefix(`${websiteBaseUrl}images/`);
      }

      if (!(deviceCanvas instanceof HTMLCanvasElement)) {
        throw new Error(
          'Website examples require the shared device canvas to be an HTMLCanvasElement'
        );
      }

      deviceCanvas.style.display = 'block';
      deviceCanvas.style.width = '100%';
      deviceCanvas.style.height = '100%';
      canvasContainer.replaceChildren(deviceCanvas);
      window.addEventListener('resize', updateMobileDrawingBufferResolution);
      updateMobileDrawingBufferResolution();
      setActiveCpuHotspotProfilerDevice(effectiveDevice);

      animationLoop = makeAnimationLoop(
        animationTemplate as unknown as typeof AnimationLoopTemplate,
        {
          stats: luma.stats.get('GPU Time and Memory'),
          device: effectiveDevice,
          mobileQuality: getExampleMobileQuality(
            supportDefinition,
            getExampleRuntimeEnvironment(window, navigator)
          ),
          autoResizeViewport: true,
          autoResizeDrawingBuffer: true,
          onAfterRender: animationProps => {
            if (!isCancelled) {
              setHasRendered(true);
            }
            return captureController?.onAfterRender(animationProps);
          },
          onError: error => {
            if (!isCancelled) {
              setStartupErrorMessage(getErrorMessage(error));
              setHasRendered(false);
            }
            logError(`Example render failed for ${effectiveDeviceType}`, error);
          }
        }
      );
      animationLoop.frameRate.setSampleSize(1);

      if (animationLoop) {
        await animationLoop.start();
      }

      const animationLoopTemplate = animationLoop?.getAnimationLoopTemplate() || null;
      if (
        !isCancelled &&
        animationLoop &&
        (isHDRScreenshotCapturable(animationLoopTemplate) || captureController)
      ) {
        const activeAnimationLoop = animationLoop;
        browserCaptureFunction = Object.assign(
          isHDRScreenshotCapturable(animationLoopTemplate)
            ? () => animationLoopTemplate.captureHDRScreenshot()
            : () => captureController!.capture(activeAnimationLoop),
          {deviceType: effectiveDeviceType}
        );
        window.lumaCaptureHDRScreenshot = browserCaptureFunction;
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
          setStartupErrorMessage(getErrorMessage(error));
          setHasRendered(false);
          logError(`Example startup failed for ${effectiveDeviceType}`, error);
        }
      });

    return () => {
      isCancelled = true;
      captureController?.finalize();
      removeBrowserCaptureFunction();
      window.removeEventListener('resize', updateMobileDrawingBufferResolution);
      // Route transitions must stop displaying the outgoing example immediately, even when its
      // asynchronous initialization is still ahead of cleanup in the serialized task queue.
      canvasContainer.replaceChildren();

      currentLumaExampleTask = currentLumaExampleTask
        .then(() => {
          if (animationLoop) {
            // destroy() synchronously finalizes the template, so it must remain serialized after
            // animationLoop.start() and its asynchronous onInitialize() have settled.
            if (!effectiveDevice.isLost) {
              effectiveDevice.submit();
            }
            animationLoop.destroy();
            animationLoop = null;
          }

          clearActiveCpuHotspotProfilerDevice(effectiveDevice);
          defaultCanvasContext.setProps({useDevicePixels: previousUseDevicePixels});
          if (deviceCanvas instanceof HTMLCanvasElement) {
            delete deviceCanvas.dataset.lumaExamplePixelRatio;
          }
          getCanvasContainer().appendChild(deviceCanvas as HTMLCanvasElement);
        })
        .catch(error => {
          logError(`Example cleanup failed for ${effectiveDeviceType}`, error);
        });
    };
  }, [
    effectiveDeviceType,
    effectiveDevice,
    animationTemplate,
    props.directory,
    props.id,
    props.canvasContextProfile,
    websiteBaseUrl,
    requestedDeviceTypesKey
  ]);

  // @ts-expect-error Intentionally accessing undeclared field info
  const info = animationTemplate?.info;
  const exampleErrorMessage = startupErrorMessage || templateLoadErrorMessage;
  const runtimeState: ExampleRuntimeState = mobileUnsupportedReason
    ? 'unsupported'
    : capabilityUnsupportedMessage
      ? 'unsupported'
      : exampleErrorMessage
        ? 'failed'
        : hasRendered
          ? 'running'
          : 'loading';

  return (
    <ExamplePage
      className={props.className}
      embedded={props.embedded}
      embeddedHeight={props.embeddedHeight}
      exampleId={supportDefinition.id}
      mobileMode={supportDefinition.mobileMode}
      mobileProfile={supportDefinition.mobileProfile}
      mobileUnsupportedReason={supportDefinition.unsupportedReason}
      runtimeState={runtimeState}
      style={{
        overflow: 'hidden',
        ...props.style
      }}
    >
      {showHeader ? (
        <ExampleHeader
          id={props.id}
          title={props.title}
          subtitle={props.subtitle}
          directory={props.directory}
          sourceDirectory={props.sourceDirectory}
          sourceFiles={props.sourceFiles}
          sourcePath={props.sourcePath}
          stackBlitz={props.stackBlitz}
          infoBoxAppearance={props.infoBoxAppearance}
          devices={declaredDevices}
        >
          {props.children}
          {info && props.templateInfoPlacement !== 'page' ? (
            <div dangerouslySetInnerHTML={{__html: info}} />
          ) : null}
          {props.headerControls}
          <span data-luma-example-mobile-badge="" style={EXAMPLE_MOBILE_BADGE_STYLE}>
            {getExampleMobileLabel(supportDefinition.mobileMode)}
          </span>
        </ExampleHeader>
      ) : null}
      {info && props.templateInfoPlacement === 'page' ? (
        <div
          style={{
            height: '100%',
            minHeight: 0,
            position: 'relative',
            zIndex: 1
          }}
          dangerouslySetInnerHTML={{__html: info}}
        />
      ) : null}
      <div style={{minHeight: 0, position: 'absolute', inset: 0}}>
        {showStats ? (
          <ExampleStats
            appearance={props.infoBoxAppearance}
            device={effectiveDevice}
            trackSwapChainTextureMemory
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
      {exampleErrorMessage ? (
        <ExampleStatusMessage
          embedded={props.embedded}
          message={exampleErrorMessage}
          state="failed"
        />
      ) : null}
      {capabilityUnsupportedMessage ? (
        <ExampleStatusMessage
          embedded={props.embedded}
          message={capabilityUnsupportedMessage}
          state="unsupported"
        />
      ) : null}
    </ExamplePage>
  );
};

function isHDRScreenshotCapturable(
  animationLoopTemplate: AnimationLoopTemplate | null
): animationLoopTemplate is HDRScreenshotCapturable {
  return (
    animationLoopTemplate !== null &&
    'captureHDRScreenshot' in animationLoopTemplate &&
    typeof animationLoopTemplate.captureHDRScreenshot === 'function'
  );
}

function getRequestedDeviceTypes(devices?: DeviceTabSelection[]): DeviceType[] | undefined {
  if (!devices) {
    return undefined;
  }

  const requestedDeviceTypes: DeviceType[] = [];
  for (const device of devices) {
    const mappedDeviceTypes =
      device === 'webgpu'
        ? (['webgpu-max', 'webgpu-core', 'webgpu-compatibility'] as const)
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

function assertExampleDeviceLimits(
  device: Device,
  requiredLimits: LumaExampleProps['requiredDeviceLimits']
): void {
  const requiredColorAttachments = requiredLimits?.maxColorAttachments;
  if (
    requiredColorAttachments !== undefined &&
    device.limits.maxColorAttachments < requiredColorAttachments
  ) {
    throw new Error(
      `This example requires ${requiredColorAttachments} color attachments, but the selected GPU supports ${device.limits.maxColorAttachments}.`
    );
  }

  const requiredAttachmentBytes = requiredLimits?.maxColorAttachmentBytesPerSample;
  if (
    requiredAttachmentBytes !== undefined &&
    device.limits.maxColorAttachmentBytesPerSample < requiredAttachmentBytes
  ) {
    throw new Error(
      `This example requires ${requiredAttachmentBytes} color-attachment bytes per sample, but the selected GPU supports ${device.limits.maxColorAttachmentBytesPerSample}.`
    );
  }
}

function formatRequestedDeviceTypes(deviceTypes: DeviceType[]): string {
  const backends = new Set(deviceTypes.map(type => (type === 'webgl' ? 'WebGL2' : 'WebGPU')));
  return [...backends].join(' or ');
}

function useResolvedExampleSupportDefinition(
  props: Pick<
    ExampleDisplayProps,
    'exampleId' | 'mobileMode' | 'mobileProfile' | 'mobileUnsupportedReason'
  >
): ExampleSupportDefinition {
  const pageDefinition = useExampleSupportDefinition();
  const registryDefinition = getExampleSupportDefinition(props.exampleId || pageDefinition?.id || '');
  const baseDefinition = pageDefinition || registryDefinition;
  return {
    id: props.exampleId || baseDefinition?.id || '',
    mobileMode: props.mobileMode || baseDefinition?.mobileMode || 'reduced',
    mobileProfile: props.mobileProfile || baseDefinition?.mobileProfile || 'standard',
    unsupportedReason: props.mobileUnsupportedReason || baseDefinition?.unsupportedReason,
    requirements: baseDefinition?.requirements
  };
}

function useExampleRuntimeEnvironment(): ExampleRuntimeEnvironment {
  const getEnvironment = () =>
    typeof window === 'undefined'
      ? {
          compactViewport: false,
          handheld: false,
          coarsePointer: false,
          maxTouchPoints: 0,
          viewportWidth: 1,
          viewportHeight: 1,
          devicePixelRatio: 1
        }
      : getExampleRuntimeEnvironment(window, navigator);
  const [environment, setEnvironment] = useState<ExampleRuntimeEnvironment>({
    compactViewport: false,
    handheld: false,
    coarsePointer: false,
    maxTouchPoints: 0,
    viewportWidth: 1,
    viewportHeight: 1,
    devicePixelRatio: 1
  });

  useEffect(() => {
    const updateEnvironment = () => setEnvironment(getEnvironment());
    window.addEventListener('resize', updateEnvironment);
    updateEnvironment();
    return () => window.removeEventListener('resize', updateEnvironment);
  }, []);

  return environment;
}

function ExampleStatusMessage({
  embedded,
  message,
  state
}: {
  embedded?: boolean;
  message: string;
  state: 'failed' | 'unsupported';
}): React.JSX.Element {
  return (
    <div
      data-luma-example-status={state}
      role="alert"
      style={
        embedded
          ? {
              background: 'var(--ifm-background-surface-color, #0f172a)',
              border: '1px solid var(--ifm-color-emphasis-300, #334155)',
              borderRadius: 10,
              color: 'var(--ifm-font-color-base, #e2e8f0)',
              margin: 16,
              padding: 20
            }
          : EXAMPLE_STARTUP_ERROR_STYLE
      }
    >
      <div style={{maxWidth: 620}}>
        <strong style={{display: 'block', fontSize: 18, marginBottom: 8}}>
          {state === 'unsupported'
            ? 'This example does not support this mobile device.'
            : 'This example could not start on the selected GPU.'}
        </strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
