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
import {TextureUploader} from './components/textures-uploader';

export type DeviceType = 'webgl' | 'webgpu';

type AppProps = {
  deviceType?: DeviceType;
};

type AppState = {
  canvas: HTMLCanvasElement;
  device: Device | null;
  model: Model | null;
};

export default class App extends React.PureComponent<AppProps, AppState> {
  static defaultProps = {
    deviceType: 'webgl' as DeviceType
  };

  constructor(props: AppProps) {
    super(props);

    this.state = {
      canvas: document.createElement('canvas'),
      device: null,
      model: null
    };
  }

  async componentDidMount() {
    const {deviceType = 'webgl'} = this.props;
    const {canvas} = this.state;
    canvas.width = 256;
    canvas.height = 256;

    const device = await luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      type: deviceType,
      createCanvasContext: {
        canvas,
        width: 256,
        height: 256,
        autoResize: false,
        useDevicePixels: false
      }
    });
    const model = createModel(device);
    this.setState({canvas, device, model});
  }

  componentWillUnmount() {
    this.state.model?.destroy();
    this.state.device?.destroy();
  }

  render() {
    const {device, canvas, model} = this.state;
    if (!device || !canvas || !model) {
      return <div />;
    }
    return (
      <div>
        <Description />
        <TextureUploader canvas={canvas} device={device} model={model} />
        <TexturesBlocks canvas={canvas} device={device} model={model} />
      </div>
    );
  }
}

function TexturesBlocks(props: {device: Device; canvas: HTMLCanvasElement; model: Model}) {
  const {device, canvas, model} = props;

  return IMAGES_DATA.map((imagesData, index) => {
    return (
      <div key={index}>
        <TexturesHeader imagesData={imagesData} />
        <TexturesList device={device} canvas={canvas} model={model} images={imagesData.images} />
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

function TexturesList(props: {
  device: Device;
  canvas: HTMLCanvasElement;
  model: Model;
  images: TextureFormatsInfo['images'];
}) {
  const {device, canvas, model, images} = props;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
      {images.map((image, index) => (
        <CompressedTexture
          key={index}
          image={image}
          device={device}
          canvas={canvas}
          model={model}
        />
      ))}
    </div>
  );
}

function Description() {
  return (
    <div>
      <p>
        This page compares image and compressed texture uploads across WebGL and WebGPU. Some
        compressed formats can appear to work on WebGL at non-block-aligned sizes because the driver
        pads storage internally, while WebGPU requires the application to create and upload an
        explicitly block-aligned backing texture. As a result, &quot;format supported&quot; does not
        always mean &quot;every logical size can be created directly&quot; on both backends.
      </p>
      <p>
        This page tests which compressed texture formats your current browser and GPU can render. It
        uses <code>@loaders.gl/textures</code> to decode standard and compressed image assets, then
        creates and draws the resulting textures with{' '}
        <a href="https://luma.gl">
          <b>luma.gl</b>
        </a>
        . You can also drag and drop a local texture to test it.
      </p>
      <p>
        <i>
          Some compressed texture formats are expected to be unsupported, depending on the GPU in
          the device you are using to view this page.
        </i>
      </p>
      <p>
        <i>
          Inspired by toji&apos;s <a href="http://toji.github.io/texture-tester">texture-tester</a>
        </i>
      </p>
    </div>
  );
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
