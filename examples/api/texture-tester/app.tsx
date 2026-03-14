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

    const {deviceType = 'webgl'} = this.props;

    try {
      if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('Texture tester requires OffscreenCanvas support');
      }

      const offscreenCanvas = new OffscreenCanvas(256, 256);
      const device = await luma.createDevice({
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
      const model = createModel(device);
      if (!this.isComponentMounted) {
        model.destroy();
        device.destroy();
        return;
      }
      this.setState({device, model, initializationError: null});
    } catch (error) {
      if (this.isComponentMounted) {
        this.setState({
          initializationError: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    this.state.model?.destroy();
    this.state.device?.destroy();
  }

  render() {
    const {device, model, initializationError} = this.state;
    if (initializationError) {
      return <div>{initializationError}</div>;
    }
    if (!device || !model) {
      return <div />;
    }
    return (
      <div>
        <Description />
        <TextureUploaderCard device={device} model={model} />
        <TexturesBlocks device={device} model={model} />
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
        <TexturesList device={device} model={model} images={imagesData.images} />
        <TexturesDescription imagesData={imagesData} />
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
    <div>
      {description && (
        <p>
          <b>{'Description: '}</b>
          {description}
        </p>
      )}
      {availability && (
        <p>
          <b>{'Availability: '}</b>
          {availability}
        </p>
      )}
      {codeSample && (
        <div>
          <p>
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

function Description() {
  return (
    <div>
      <p>
        This example loads images and compressed textures using <code>@loaders.gl/textures</code>{' '}
        and renders them using luma.gl on both WebGL and WebGPU. You can use this page to check
        which compressed texture formats your current browser and GPU can render.
      </p>
      <p style={{marginBottom: 4, fontStyle: 'italic'}}>Notes:</p>
      <ul style={{marginTop: 0, fontStyle: 'italic'}}>
        <li>
          Some compressed texture formats are expected to be unsupported, depending on the GPU you
          are using to view this page.
        </li>
        <li>
          This example uses a single shared luma.gl <code>Device</code> rendering into multiple
          canvases managed by <code>PresentationContext</code>s.
        </li>
      </ul>
    </div>
  );
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
      <div>
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

export function renderToDOM(
  container: HTMLElement,
  props: {deviceType?: DeviceType} = {}
): () => void {
  const root: Root = createRoot(container);
  root.render(<App {...props} />);
  return () => {
    queueMicrotask(() => root.unmount());
  };
}
