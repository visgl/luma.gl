import React, {CSSProperties, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

import {Tabs, Tab} from './tabs';
import {canCreateDeviceType, type DeviceType, useStore} from '../store/device-store';
import {applyExampleTheme, type ExampleThemeAppearance} from '../../../../examples/example-theme';

export type DeviceTabSelection =
  | 'webgl2'
  | 'webgpu'
  | 'webgpu-core'
  | 'webgpu-max'
  | 'webgpu-compatibility';

interface DeviceTabsProps {
  appearance?: ExampleThemeAppearance;
  devices?: DeviceTabSelection[];
  style?: CSSProperties;
}

const DEFAULT_DEVICE_TYPES: DeviceType[] = [
  'webgpu-max',
  'webgpu-core',
  'webgpu-compatibility',
  'webgl'
];

const WEBGPU_DEVICE_TYPES: DeviceType[] = ['webgpu-max', 'webgpu-core', 'webgpu-compatibility'];

const DEVICE_TAB_LABELS: Record<DeviceType, string> = {
  'webgpu-core': 'WebGPU',
  'webgpu-max': 'WebGPU',
  'webgpu-compatibility': 'WebGPU',
  webgl: 'WebGL2'
};

const DEVICE_TAB_BADGES: Partial<Record<DeviceType, string>> = {
  'webgpu-core': 'CORE',
  'webgpu-max': 'MAX',
  'webgpu-compatibility': 'COMPAT'
};

export const DeviceTabsPriv = (props: DeviceTabsProps = {}) => {
  const appearance = props.appearance ?? 'cinematic';
  const devices = getDeviceTypes(props.devices);
  const deviceAvailabilityKey = devices.join('|');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [deviceAvailability, setDeviceAvailability] = useState<
    Partial<Record<DeviceType, boolean>>
  >({});
  const deviceType = useStore(state => state.deviceType);
  const deviceError = useStore(state => state.deviceError);
  const setDeviceType = useStore(state => state.setDeviceType);
  const selectedDeviceType = useMemo(
    () => (deviceType && devices.includes(deviceType) ? deviceType : undefined),
    [deviceType, deviceAvailabilityKey]
  );
  const setDeviceTabsElement = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        applyExampleTheme(element, appearance);
      }
    },
    [appearance]
  );

  useEffect(() => {
    let isCancelled = false;
    setDeviceAvailability({});

    for (const type of devices) {
      void canCreateDeviceType(type).then(isAvailable => {
        if (!isCancelled) {
          setDeviceAvailability(previousAvailability => ({
            ...previousAvailability,
            [type]: isAvailable
          }));
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [deviceAvailabilityKey]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>(
      '[data-luma-backend-option][aria-checked="true"]:not(:disabled)'
    );
    (selectedOption || menuRef.current?.querySelector<HTMLButtonElement>('[data-luma-backend-option]:not(:disabled)'))?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isMenuOpen]);

  const selectDeviceType = async (nextDeviceType: DeviceType): Promise<void> => {
    if (deviceAvailability[nextDeviceType] === false) {
      return;
    }
    await setDeviceType(nextDeviceType);
  };

  return (
    <div
      ref={setDeviceTabsElement}
      data-luma-device-selector=""
      data-luma-example-appearance={appearance}
      style={props.style}
    >
      <div data-luma-device-tabs="">
        <Tabs
          label="Graphics backend"
          selectedItem={selectedDeviceType}
          setSelectedItem={selectDeviceType}
        >
          {devices.map(type => (
            <Tab
              key={type}
              title={DEVICE_TAB_LABELS[type]}
              tag={type}
              badge={DEVICE_TAB_BADGES[type]}
              unavailableBadge={deviceAvailability[type] === false ? 'N/A' : undefined}
              disabled={deviceAvailability[type] === false}
            >
              {type === deviceType ? deviceError : null}
            </Tab>
          ))}
        </Tabs>
      </div>
      <div
        ref={menuRef}
        data-luma-backend-dropdown=""
        onBlur={event => {
          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
            setIsMenuOpen(false);
          }
        }}
        onKeyDown={event => {
          if (!isMenuOpen || event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          setIsMenuOpen(false);
          menuRef.current?.querySelector<HTMLButtonElement>('[data-luma-backend-trigger]')?.focus();
        }}
      >
        <button
          type="button"
          data-luma-backend-trigger=""
          aria-label="Graphics backend"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(open => !open)}
        >
          <span data-luma-backend-indicator="" aria-hidden="true" />
          <span>{DEVICE_TAB_LABELS[selectedDeviceType ?? devices[0]]}</span>
          {DEVICE_TAB_BADGES[selectedDeviceType ?? devices[0]] ? (
            <span data-luma-backend-badge="">{DEVICE_TAB_BADGES[selectedDeviceType ?? devices[0]]}</span>
          ) : null}
          <span data-luma-backend-caret="" aria-hidden="true" />
        </button>
        {isMenuOpen ? (
          <div
            data-luma-backend-options=""
            role="menu"
            aria-label="Graphics backend options"
            onKeyDown={event => {
              if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
              event.preventDefault();
              const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
              if (!options.length) return;
              const current = options.findIndex(option => option === document.activeElement);
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
                (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
              options[next]?.focus();
            }}
          >
            {devices.map(type => (
              <button
                key={type}
                type="button"
                role="menuitemradio"
                aria-checked={type === selectedDeviceType}
                data-luma-backend-option={type}
                disabled={deviceAvailability[type] === false}
                onClick={() => {
                  setIsMenuOpen(false);
                  menuRef.current?.querySelector<HTMLButtonElement>('[data-luma-backend-trigger]')?.focus();
                  void selectDeviceType(type);
                }}
              >
                <span data-luma-backend-indicator="" aria-hidden="true" />
                <span>{DEVICE_TAB_LABELS[type]}</span>
                {DEVICE_TAB_BADGES[type] ? <span data-luma-backend-badge="">{DEVICE_TAB_BADGES[type]}</span> : null}
                {deviceAvailability[type] === false ? <span data-luma-backend-unavailable="">N/A</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <label data-luma-device-menu="">
        <span data-luma-device-menu-indicator="" aria-hidden="true" />
        <select
          aria-label="Graphics backend"
          data-luma-device-select=""
          value={selectedDeviceType ?? devices[0] ?? ''}
          onChange={event => void selectDeviceType(event.currentTarget.value as DeviceType)}
        >
          {devices.map(type => (
            <option
              key={type}
              value={type}
              disabled={deviceAvailability[type] === false}
            >
              {getDeviceOptionLabel(type)}{deviceAvailability[type] === false ? ' (N/A)' : ''}
            </option>
          ))}
        </select>
      </label>
      {deviceError ? <div role="alert">{deviceError}</div> : null}
    </div>
  );
};

export const DeviceTabs = (props?: DeviceTabsProps) => (
  <BrowserOnly>{() => <DeviceTabsPriv {...props} />}</BrowserOnly>
);

function getDeviceTypes(devices?: DeviceTabsProps['devices']): DeviceType[] {
  if (!devices) {
    return DEFAULT_DEVICE_TYPES;
  }

  const deviceTypes: DeviceType[] = [];
  for (const device of devices) {
    const mappedTypes =
      device === 'webgpu'
        ? WEBGPU_DEVICE_TYPES
        : device === 'webgl2'
          ? (['webgl'] as const)
          : ([device] as const);

    for (const mappedType of mappedTypes) {
      if (!deviceTypes.includes(mappedType)) {
        deviceTypes.push(mappedType);
      }
    }
  }

  return deviceTypes;
}

function getDeviceOptionLabel(deviceType: DeviceType): string {
  const badge = DEVICE_TAB_BADGES[deviceType];
  return badge ? `${DEVICE_TAB_LABELS[deviceType]} ${badge}` : DEVICE_TAB_LABELS[deviceType];
}
