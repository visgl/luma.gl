import React from 'react';
import {Tabs, Tab} from './tabs';
import {useStore} from '../store/device-store';

export const DeviceTabs = props => {
  const deviceType = useStore(state => state.deviceType);
  const deviceError = useStore(state => state.deviceError);
  const setDeviceType = useStore(state => state.setDeviceType);

  return (
    <Tabs selectedItem={deviceType} setSelectedItem={setDeviceType}>
      <Tab key="WebGL2" title="WebGL2" tag='webgl2'>
        {/* <img height="80" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/webgl2.jpg" />*/}
        {deviceError}
      </Tab>
      { /*
      <Tab key="WebGL" title="WebGL" tag='webgl1'>
        {/* <img height="80" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/webgl2.jpg" /> }
        {deviceError}
      </Tab>
      <Tab key="WebGPU" title="WebGPU" tag='webgpu'>
        {/* <img height="80" src="https://raw.githubusercontent.com/gpuweb/gpuweb/3b3a1632ff1ad6a573330a58710e341bb9d65576/logo/webgpu-horizontal.svg" />}
        {deviceError}
      </Tab>
      */ }
    </Tabs>
  );
};
