import React, {useState, useEffect} from 'react';
import {luma, Device, DeviceInfo, DeviceLimits, TextureFormat, cast} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '@luma.gl/webgl';
// import '@luma.gl/webgpu';

let cachedDevice;

async function createDevice(): Promise<Device> {
  cachedDevice = cachedDevice || luma.createDevice({height: 0});
  return await cachedDevice;
}

function getInfo(device: Device, feature: keyof DeviceInfo): string {
  // @ts-expect-error
  return device ? device.info[feature] : 'N/A';
}

function getLimit(device: Device, feature: keyof DeviceLimits): string {
  return device ? device.limits[feature] ? String(device.limits[feature]) : '0 ❌' : 'N/A';
}

function getFeature(device: Device, feature: string): string {
  return device ? device.features.has(feature) ? '✅' : '❌' : 'N/A';
}

function getFormat(device: Device, format: TextureFormat): string {
  const isSupported = device && device.isTextureFormatSupported(format);
  console.log(format, isSupported);
  return device ? isSupported ? '✅' : '❌' : 'N/A';
}

function getFiltering(device: Device, format: TextureFormat): string {
  const isSupported = device && device.isTextureFormatSupported(format) && device.isLinearFilteringSupported(format);
  return device ? isSupported ? '✅' : '❌' : 'N/A';
}

/** DeviceInfo field */
export const Info = ({f}) => {
  const [device, setDevice] = useState<Device>(null);
  useEffect(() => {
     const getDevice = async () => setDevice(await createDevice());
     getDevice();
  })
  return <code style={{color: 'darkgreen'}} >{getInfo(device, f)}</code>;
}

/** Device.limits field */
export const Limit = ({f}) => {
  const [device, setDevice] = useState<Device>(null);
  useEffect(() => {
     const getDevice = async () => setDevice(await createDevice());
     getDevice();
  })
  return <code style={{color: 'darkgreen'}} >{getLimit(device, f)}</code>;
}

export const Feature = ({f}) => {
  const [device, setDevice] = useState<Device>(null);
  useEffect(() => {
     async function getDevice() {
         setDevice(await createDevice());
     }
     getDevice();
  })
  return <span>{getFeature(device, f)}</span>;
}

export const Format = ({f}) => {
  const [device, setDevice] = useState(null);
  useEffect(() => {
     async function getDevice() {
         const device = await createDevice();
         setDevice(device);
     }
     getDevice();
  })
  return <span key={f}>{getFormat(device, f)}</span>;
}

export const Filter = ({f}) => {
  const [device, setDevice] = useState(null);
  useEffect(() => {
     async function getDevice() {
         const device = await createDevice();
         setDevice(device);
     }
     getDevice();
  })
  return <span>{getFiltering(device, f)}</span>;
}

// WebGL

function getWebGLLimit(device_: Device, feature: string): string {
  const device = cast<WebGLDevice>(device_)
  return device ? device.webglLimits[feature] ? String(device.webglLimits[feature]) : '0 ❌' : 'N/A';
}

/** Device.webglLimits field */
export const WebGLLimit = ({f}) => {
  const [device, setDevice] = useState<Device>(null);
  useEffect(() => {
     const getDevice = async () => setDevice(await createDevice());
     getDevice();
  })
  return <code style={{color: 'darkgreen'}} >{getWebGLLimit(device, GL[f])}</code>;
}

/** Device.webglLimits field */
export const WebGLExtensions = ({f}) => {
  const [device, setDevice] = useState<Device>(null);
  useEffect(() => {
     const getDevice = async () => setDevice(await createDevice());
     getDevice();
  })

  const webglDevice = cast<WebGLDevice>(device);
  const extensions = webglDevice ? webglDevice.gl.getSupportedExtensions() : [];

  return (
    <ul>
      { extensions.map(extension => (<li style={{color: 'darkgreen'}} > {extension} </li>)) }
    </ul>
  );
}
