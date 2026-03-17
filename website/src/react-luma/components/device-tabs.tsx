import React, {CSSProperties} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

import {Tabs, Tab} from './tabs';
import {useStore} from '../store/device-store';

interface DeviceTabsProps {
  devices?: ('webgl2' | 'webgpu')[];
  style?: CSSProperties;
}

const DEFAULT_DEVICE_TYPES: ('webgl2' | 'webgpu')[] = ['webgl2', 'webgpu'];

export const DeviceTabsPriv = (props: DeviceTabsProps = {}) => {
  const devices = props.devices ?? DEFAULT_DEVICE_TYPES;
  const deviceType = useStore(state => state.deviceType);
  const deviceError = useStore(state => state.deviceError);
  const setDeviceType = useStore(state => state.setDeviceType);

  return (
    <div style={props.style}>
      <Tabs selectedItem={deviceType} setSelectedItem={setDeviceType}>
        {devices.includes('webgpu') && (
          <Tab key="WebGPU" title="WebGPU" tag="webgpu">
            {/* <img height="80" src="https://raw.githubusercontent.com/gpuweb/gpuweb/3b3a1632ff1ad6a573330a58710e341bb9d65576/logo/webgpu-horizontal.svg" /> */}
            {deviceError}
          </Tab>
        )}

        {devices.includes('webgl2') && (
          <Tab key="WebGL2" title="WebGL2" tag="webgl">
            {/* <img height="80" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/webgl2.jpg" />*/}
            {deviceError}
          </Tab>
        )}

      </Tabs>
    </div>
  );
};

export const DeviceTabs = (props?: DeviceTabsProps) => (
  <BrowserOnly>{() => <DeviceTabsPriv {...props} />}</BrowserOnly>
);
