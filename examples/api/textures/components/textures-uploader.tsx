// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {type DragEvent} from 'react';
import {CompressedTexture} from './compressed-texture';
import {type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

type TextureUploaderProps = {
  canvas: HTMLCanvasElement;
  device: Device;
  model: Model;
};

type TextureUploaderState = {
  uploadedImage: File | null;
};

export class TextureUploader extends React.PureComponent<
  TextureUploaderProps,
  TextureUploaderState
> {
  constructor(props: TextureUploaderProps) {
    super(props);

    this.state = {
      uploadedImage: null
    };

    this.handleLoadFile = this.handleLoadFile.bind(this);
    this.handleCleanTexture = this.handleCleanTexture.bind(this);
  }

  handleLoadFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.setState({uploadedImage: file});
    }
  }

  handleCleanTexture() {
    this.setState({uploadedImage: null});
  }

  render() {
    const {canvas, device, model} = this.props;
    const {uploadedImage} = this.state;

    return (
      <div>
        {!uploadedImage && (
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
              onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
            >
              Drag&Drop texture
            </div>
            <input style={{display: 'none'}} type="file" id="fileInput" />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexFlow: 'column nowrap',
            alignItems: 'center',
            width: 270
          }}
        >
          {uploadedImage && (
            <CompressedTexture
              image={uploadedImage}
              canvas={canvas}
              device={device}
              model={model}
            />
          )}
          {uploadedImage && <button onClick={() => this.handleCleanTexture()}>Clean</button>}
        </div>
      </div>
    );
  }
}
