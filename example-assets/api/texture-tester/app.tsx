// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {type Device, luma} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

import {createModel} from './components/compressed-texture';
import {TextureTesterUI} from './texture-tester-ui';

export type DeviceType = 'webgl' | 'webgpu';

type AppProps = {
  compact?: boolean;
  deviceType?: DeviceType;
  device?: Device | null;
  presentationDevice?: Device | null;
};

type AppState = {
  device: Device | null;
  model: Model | null;
  initializationError: string | null;
};

export default class App extends React.PureComponent<AppProps, AppState> {
  static defaultProps = {
    deviceType: 'webgl' as DeviceType
  };

  private isComponentMounted = false;
  private initializationGeneration = 0;
  private ownsDevice = false;

  constructor(props: AppProps) {
    super(props);

    this.state = {
      device: null,
      model: null,
      initializationError: null
    };
  }

  async componentDidMount() {
    this.isComponentMounted = true;
    await this.initializeDevice();
  }

  async componentDidUpdate(previousProps: AppProps) {
    if (
      previousProps.device !== this.props.device ||
      previousProps.presentationDevice !== this.props.presentationDevice ||
      (!this.props.device &&
        !this.props.presentationDevice &&
        previousProps.deviceType !== this.props.deviceType)
    ) {
      await this.initializeDevice();
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    this.initializationGeneration++;
    this.destroyResources();
  }

  async initializeDevice(): Promise<void> {
    const {deviceType = 'webgl'} = this.props;
    const initializationGeneration = ++this.initializationGeneration;
    this.destroyResources();
    this.setState({device: null, model: null, initializationError: null});

    try {
      const externalDevice = this.props.device || this.props.presentationDevice;
      const device = externalDevice ? externalDevice : await this.createOwnedDevice(deviceType);
      const model = createModel(device);

      if (
        !this.isComponentMounted ||
        this.initializationGeneration !== initializationGeneration ||
        this.props.deviceType !== deviceType ||
        (this.props.device !== externalDevice && this.props.presentationDevice !== externalDevice)
      ) {
        model.destroy();
        if (!externalDevice) {
          device.destroy();
        }
        return;
      }

      this.ownsDevice = !externalDevice;
      this.setState({device, model, initializationError: null});
    } catch (error) {
      if (this.isComponentMounted && this.initializationGeneration === initializationGeneration) {
        this.setState({
          initializationError: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  destroyResources(): void {
    this.state.model?.destroy();
    if (this.ownsDevice) {
      this.state.device?.destroy();
    }
    this.ownsDevice = false;
  }

  async createOwnedDevice(deviceType: DeviceType): Promise<Device> {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('Texture tester requires OffscreenCanvas support');
    }

    const offscreenCanvas = new OffscreenCanvas(256, 256);
    return await luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      type: deviceType,
      createCanvasContext: {
        canvas: offscreenCanvas,
        width: 256,
        height: 256,
        autoResize: false,
        useDevicePixels: false
      }
    });
  }

  render() {
    const {device, model, initializationError} = this.state;
    const {compact = false} = this.props;
    return (
      <TextureTesterUI
        compact={compact}
        device={device}
        model={model}
        initializationError={initializationError}
      />
    );
  }
}

export function renderToDOM(
  container: HTMLElement,
  props: {deviceType?: DeviceType; device?: Device | null; presentationDevice?: Device | null} = {}
): () => void {
  const root: Root = createRoot(container);
  root.render(<App {...props} />);

  return () => {
    root.unmount();
  };
}
