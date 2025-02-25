// luma.gl
import React from 'react';
import type {Device, DeviceFeature, DeviceLimits, TextureFormat, VertexFormat} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '@luma.gl/webgl';

import {useStore} from '../store/device-store';

function getLimit(device: Device, feature: keyof DeviceLimits): string {
  return device ? device.limits[feature] ? String(device.limits[feature]) : '0 ❌' : 'N/A';
}

function getFeature(device: Device, feature: string): string {
  return device ? device.features.has(feature as DeviceFeature) ? '✅' : '❌' : 'N/A';
}

function getVertexFormat(device: Device, format: VertexFormat): string {
  try {
    const isSupported = device && device.isVertexFormatSupported(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

function getFormat(device: Device, format: TextureFormat): string {
  try {
    const isSupported = device && device.isTextureFormatSupported(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

function getFiltering(device: Device, format: TextureFormat): string {
  try {
    const isSupported = device && device.isTextureFormatSupported(format) && device.isTextureFormatFilterable(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

/** DeviceInfo field */
export const Info = ({f}) => {
  const device = useStore(state => state.device);
  const info = device ? device.info[f] : 'N/A';
  return <code style={{color: 'darkgreen'}} >{info}</code>;
}

/** Device.limits field */
export const Limit = ({f}) => {
  const device = useStore(state => state.device);
  return <code style={{color: 'darkgreen'}} >{getLimit(device, f)}</code>;
}

export const Feature = ({f}) => {
  const device = useStore(state => state.device);
  return <span>{getFeature(device, f)}</span>;
}

export const VFormat = ({f}) => {
  const device = useStore(state => state.device);
  return <span key={f}>{getVertexFormat(device, f)}</span>;
}

export const Format = ({f}) => {
  const device = useStore(state => state.device);
  return <span key={f}>{getFormat(device, f)}</span>;
}

export const Filter = ({f}) => {
  const device = useStore(state => state.device);
  return <span>{getFiltering(device, f)}</span>;
}

export const Render = ({f}) => {
  const device = useStore(state => state.device);
  const format = f as TextureFormat;
  try {
    const isSupported = device && device.isTextureFormatSupported(format) && device.isTextureFormatRenderable(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

// WebGL

/** Device.webglLimits field */
export const WebGLLimit = ({f}) => {
  const device = useStore(state => state.device);
  const webglDevice = device instanceof WebGLDevice ? device as WebGLDevice: null;

  const limit = webglDevice ? webglDevice.webglLimits[GL[f]] ? String(webglDevice.webglLimits[GL[f]]) : '0 ❌' : 'N/A';

  return <code style={{color: 'darkgreen'}} >{limit}</code>;
}

/** Device.webglLimits field */
export const WebGLExtensions = ({f}) => {
  const device = useStore(state => state.device);
  const webglDevice = device instanceof WebGLDevice ? device as WebGLDevice: null;

  const extensions = webglDevice ? webglDevice.gl.getSupportedExtensions() : [];

  return (
    <ul>
      { extensions.map(extension => (
        <li key={extension} style={{color: 'darkgreen'}} >
          <a href={"https://www.khronos.org/registry/webgl/extensions/" + extension} target="_blank">
            {extension}
          </a>
        </li>
      )) }
    </ul>
  );
}
