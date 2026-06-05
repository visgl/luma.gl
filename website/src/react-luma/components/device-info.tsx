// luma.gl
import React, {useEffect, useState} from 'react';
import type {
  Device,
  DeviceFeature,
  DeviceInfo,
  DeviceLimits,
  TextureFormat,
  VertexFormat
} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';
import {WebGLDevice} from '@luma.gl/webgl';

import {createDevice, type DeviceType, useStore} from '../store/device-store';

export type DocumentationDeviceType = Extract<
  DeviceType,
  'webgpu-max' | 'webgpu-core' | 'webgl'
>;

const BYTE_LIMITS = new Set<keyof DeviceLimits>([
  'maxUniformBufferBindingSize',
  'maxStorageBufferBindingSize',
  'maxBufferSize',
  'minUniformBufferOffsetAlignment',
  'minStorageBufferOffsetAlignment',
  'maxColorAttachmentBytesPerSample',
  'maxComputeWorkgroupStorageSize'
]);

function getLimit(device: Device | undefined, feature: keyof DeviceLimits): string {
  if (!device) {
    return 'N/A';
  }

  const limit = device.limits[feature];
  if (!limit) {
    return '0 ❌';
  }
  if (limit === Number.MAX_SAFE_INTEGER) {
    return 'MAX_SAFE_INTEGER';
  }
  if (BYTE_LIMITS.has(feature)) {
    return formatByteLimit(limit);
  }

  return String(limit);
}

function formatByteLimit(limit: number): string {
  if (limit < 1024) {
    return `${limit} B`;
  }

  const divisor = limit >= 1024 ** 2 ? 1024 ** 2 : 1024;
  const unit = divisor === 1024 ** 2 ? 'MB' : 'KB';
  const value = Math.round(limit / divisor);

  return `${value} ${unit}`;
}

function getFeature(device: Device | undefined, feature: string): string {
  return device ? device.features.has(feature as DeviceFeature) ? '✅' : '❌' : 'N/A';
}

function getVertexFormat(device: Device | undefined, format: VertexFormat): string {
  try {
    const isSupported = device && device.isVertexFormatSupported(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

function getFormat(device: Device | undefined, format: TextureFormat): string {
  try {
    const isSupported = device && device.isTextureFormatSupported(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

function getFiltering(device: Device | undefined, format: TextureFormat): string {
  try {
    const isSupported = device && device.isTextureFormatSupported(format) && device.isTextureFormatFilterable(format);
    return device ? isSupported ? '✅' : '❌' : 'N/A';
  } catch {
    return '❌';
  }
}

type DeviceProfileProps = {
  d?: DocumentationDeviceType;
};

/** DeviceInfo field */
export const Info = ({f, d}: {f: keyof DeviceInfo} & DeviceProfileProps) => {
  const device = useDevice(d);
  const info = device ? (device.info[f] ?? 'N/A') : 'N/A';
  return <code style={{color: 'darkgreen'}} >{info}</code>;
}

/** Device.limits field */
export const Limit = ({f, d}: {f: keyof DeviceLimits} & DeviceProfileProps) => {
  const device = useDevice(d);
  return <code style={{color: 'darkgreen'}} >{getLimit(device, f)}</code>;
}

export const Feature = ({f, d}: {f: string} & DeviceProfileProps) => {
  const device = useDevice(d);
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

function useDevice(deviceType?: DocumentationDeviceType): Device | undefined {
  const selectedDevice = useStore(state => state.device);
  const [documentationDevice, setDocumentationDevice] = useState<Device>();

  useEffect(() => {
    let isCancelled = false;
    if (!deviceType) {
      setDocumentationDevice(undefined);
      return;
    }

    void createDevice(deviceType)
      .then(device => {
        if (!isCancelled) {
          setDocumentationDevice(device);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setDocumentationDevice(undefined);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [deviceType]);

  return deviceType ? documentationDevice : selectedDevice;
}
