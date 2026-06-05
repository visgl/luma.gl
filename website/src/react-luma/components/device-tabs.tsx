import React, {CSSProperties, useEffect, useMemo, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

import {Tabs, Tab} from './tabs';
import {canCreateDeviceType, type DeviceType, useStore} from '../store/device-store';

export type DeviceTabSelection =
  | 'webgl2'
  | 'webgpu'
  | 'webgpu-core'
  | 'webgpu-max';

interface DeviceTabsProps {
  devices?: DeviceTabSelection[];
  style?: CSSProperties;
}

const DEFAULT_DEVICE_TYPES: DeviceType[] = ['webgpu-core', 'webgpu-max', 'webgl'];

const WEBGPU_DEVICE_TYPES: DeviceType[] = ['webgpu-core', 'webgpu-max'];

const DEVICE_TAB_LABELS: Record<DeviceType, string> = {
  'webgpu-core': 'WebGPU',
  'webgpu-max': 'WebGPU',
  webgl: 'WebGL2'
};

const DEVICE_TAB_BADGES: Partial<Record<DeviceType, string>> = {
  'webgpu-core': 'CORE',
  'webgpu-max': 'MAX'
};

export const DeviceTabsPriv = (props: DeviceTabsProps = {}) => {
  const devices = getDeviceTypes(props.devices);
  const deviceAvailabilityKey = devices.join('|');
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

  const selectDeviceType = async (nextDeviceType: DeviceType): Promise<void> => {
    if (deviceAvailability[nextDeviceType] === false) {
      return;
    }
    await setDeviceType(nextDeviceType);
  };

  return (
    <div style={props.style}>
      <Tabs selectedItem={selectedDeviceType} setSelectedItem={selectDeviceType}>
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
