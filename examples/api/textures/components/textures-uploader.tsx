// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import styled from 'styled-components';
import {CompressedTexture} from './compressed-texture';
import {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TextureFrame = styled.div`
  display: flex;
  width: 256px;
  height: 256px;
  align-items: center;
  justify-content: center;
  border: 1px dashed black;
`;

const ImageContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  width: 270px;
`;

type TextureUploaderProps = {
  canvas: HTMLCanvasElement | null;
  device: Device;
  model: Model | null;
};

export class TextureUploader extends React.PureComponent<TextureUploaderProps> {
  static defaultProps = {
    canvas: null,
    model: null
  };

  constructor(props) {
    super(props);

    this.state = {
      uploadedImage: null
    };

    this.handleLoadFile = this.handleLoadFile.bind(this);
    this.handleCleanTexture = this.handleCleanTexture.bind(this);
  }

  handleLoadFile(event) {
    const file = event.dataTransfer.files[0];
    this.setState({uploadedImage: file});
    event.preventDefault();
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
          <Container>
            <TextureFrame
              onDrop={event => this.handleLoadFile(event)}
              onDragOver={event => event.preventDefault()}
            >
              Drag&Drop texture
            </TextureFrame>
            <input style={{display: 'none'}} type="file" id="fileInput" />
          </Container>
        )}
        <ImageContainer>
          {uploadedImage && (
            <CompressedTexture
              image={uploadedImage}
              canvas={canvas}
              device={device}
              model={model}
            />
          )}
          {uploadedImage && <button onClick={() => this.handleCleanTexture()}>Clean</button>}
        </ImageContainer>
      </div>
    );
  }
}
