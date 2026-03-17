// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {type Device, luma} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

import {IMAGES_DATA, TextureFormatsInfo} from './textures-data';
import {CompressedTexture, createModel} from './components/compressed-texture';

export type DeviceType = 'webgl' | 'webgpu';

type AppProps = {
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
    return (
      <div>
        {initializationError ? <div>{initializationError}</div> : null}
        {!initializationError && !device ? <div>Initializing device...</div> : null}
        {device && model ? (
          <>
            <TexturesBlocks device={device} model={model} />
            <TextureUploaderCard device={device} model={model} />
          </>
        ) : null}
      </div>
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

type TextureUploaderCardProps = {
  device: Device;
  model: Model;
};

type TextureUploaderCardState = {
  uploadedImage: File | null;
};

class TextureUploaderCard extends React.PureComponent<
  TextureUploaderCardProps,
  TextureUploaderCardState
> {
  constructor(props: TextureUploaderCardProps) {
    super(props);

    this.state = {
      uploadedImage: null
    };
  }

  handleLoadFile(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.setState({uploadedImage: file});
    }
  }

  render() {
    const {device, model} = this.props;
    const {uploadedImage} = this.state;

    return (
      <div style={{marginTop: 24}}>
        <h2 style={{borderBottom: '1px solid black', marginBottom: 12}}>Upload Your Own Texture</h2>
        {!uploadedImage ? (
          <div style={{display: 'flex', flexFlow: 'column nowrap'}}>
            <div
              style={{
                display: 'flex',
                width: 256,
                height: 256,
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed black'
              }}
              onDrop={event => this.handleLoadFile(event)}
              onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
            >
              Drag&Drop texture
            </div>
          </div>
        ) : null}
        {uploadedImage ? (
          <div
            style={{
              display: 'flex',
              flexFlow: 'column nowrap',
              alignItems: 'center',
              width: 270
            }}
          >
            <CompressedTexture image={uploadedImage} device={device} model={model} />
            <button onClick={() => this.setState({uploadedImage: null})}>Clean</button>
          </div>
        ) : null}
      </div>
    );
  }
}

function TexturesBlocks(props: {device: Device; model: Model}) {
  const {device, model} = props;

  return IMAGES_DATA.map((imagesData, index) => {
    return (
      <div key={index}>
        <TexturesHeader imagesData={imagesData} />
        <TexturesDescription imagesData={imagesData} />
        <TexturesList device={device} model={model} images={imagesData.images} />
      </div>
    );
  });
}

function TexturesHeader(props: {imagesData: TextureFormatsInfo}) {
  const {formatName, link} = props.imagesData;

  return (
    <div style={{display: 'flex', flexFlow: 'column'}}>
      <h2 style={{borderBottom: '1px solid black', marginBottom: 0}}>
        {link ? (
          <a style={{textDecoration: 'none'}} href={link}>
            {formatName}
          </a>
        ) : (
          formatName
        )}
      </h2>
    </div>
  );
}

function TexturesDescription(props: {imagesData: TextureFormatsInfo}) {
  const {description, codeSample, availability} = props.imagesData;
  return (
    <div style={{marginBottom: 8, lineHeight: 1.2}}>
      {description && (
        <p style={{margin: '4px 0'}}>
          <b>{'Description: '}</b>
          {description}
        </p>
      )}
      {availability && (
        <p style={{margin: '4px 0'}}>
          <b>{'Availability: '}</b>
          {availability}
        </p>
      )}
      {codeSample && (
        <div style={{marginTop: 4}}>
          <p style={{margin: 0}}>
            <b>{'Loader: '}</b>
            <code>{codeSample}</code>
          </p>
        </div>
      )}
    </div>
  );
}

function TexturesList(props: {device: Device; model: Model; images: TextureFormatsInfo['images']}) {
  const {device, model, images} = props;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
      {images.map((image, index) => (
        <CompressedTexture key={index} image={image} device={device} model={model} />
      ))}
    </div>
  );
}
