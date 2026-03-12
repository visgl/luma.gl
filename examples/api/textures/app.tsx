// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';

import {luma} from '@luma.gl/core';
import {webgl2Adapter, WebGLDevice} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import {IMAGES_DATA, TextureFormatsInfo} from './textures-data';
import {CompressedTexture, createModel} from './components/compressed-texture';
import {TextureUploader} from './components/textures-uploader';

type AppProps = Record<string, never>;

type AppState = {
  canvas: HTMLCanvasElement | null;
  device: WebGLDevice | null;
  model: Model | null;
};

export default class App extends React.PureComponent<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      canvas: null,
      device: null,
      model: null
    };
  }

  async componentDidMount() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const device = (await luma.createDevice({
      adapters: [webgl2Adapter],
      type: 'webgl',
      createCanvasContext: {canvas}
    })) as WebGLDevice;
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
      <div style={{margin: 30}}>
        <Description />
        <TextureUploader canvas={canvas} device={device} model={model} />
        <TexturesBlocks canvas={canvas} device={device} model={model} />
      </div>
    );
  }
}

function TexturesBlocks(props: {device: WebGLDevice; canvas: HTMLCanvasElement; model: Model}) {
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
  device: WebGLDevice;
  canvas: HTMLCanvasElement;
  model: Model;
  images: TextureFormatsInfo['images'];
}) {
  const {device, canvas, model, images} = props;
  return images.map((image, index) => (
    <CompressedTexture key={index} image={image} device={device} canvas={canvas} model={model} />
  ));
}

function Description() {
  return (
    <div>
      <h1>Texture Loaders</h1>
      <p>
        This page loads every &nbsp;
        <a href="https://loaders.gl/modules/textures/docs/using-compressed-textures">
          texture format
        </a>{' '}
        &nbsp; supported by loaders.gl and attempts to display them in WebGL using the{' '}
        <a href="https://luma.gl">
          <b>luma.gl</b>
        </a>{' '}
        texture APIs.
      </p>
      <p>
        The <code>@loaders.gl/textures</code> &nbsp; module provides loaders for compressed textures
        stored in <b>KTX</b>, <b>DDS</b> and <b>PVR</b> container files, plus <b>CRN</b> (Crunch),
        and <b>Basis</b> supercompressed textures.
      </p>
      <p>This page also shows which compressed texture types your device and browser supports.</p>
      <p>
        <i>
          Note that multiple textures on this page will fail to display due to lack of GPU support
          (reported via WebGL extensions). For example: DXT formats are usually only supported on
          Desktops while PVRTC is typically only available on mobile devices with PowerVR chipsets.
        </i>
      </p>
      <p>
        <i>
          Inspired by toji's awesome{' '}
          <a href="http://toji.github.io/texture-tester">texture-tester</a>
        </i>
      </p>
    </div>
  );
}

export function renderToDOM(container: HTMLElement): () => void {
  const root: Root = createRoot(container);
  root.render(<App />);
  return () => root.unmount();
}
