// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import type {Device} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {CompressedTexture} from './components/compressed-texture';
import {IMAGES_DATA, type TextureFormatsInfo} from './textures-data';

export function TextureTesterUI(props: {
  compact: boolean;
  device: Device | null;
  model: Model | null;
  initializationError: string | null;
}): React.ReactNode {
  const {compact, device, model, initializationError} = props;
  return (
    <div className={compact ? 'texture-tester-compact' : undefined}>
      {initializationError ? <div>{initializationError}</div> : null}
      {!initializationError && !device ? <div>Initializing device...</div> : null}
      {device && model ? (
        <>
          <TexturesBlocks compact={compact} device={device} model={model} />
          {!compact ? <TextureUploaderCard device={device} model={model} /> : null}
        </>
      ) : null}
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
  state: TextureUploaderCardState = {uploadedImage: null};

  handleLoadFile(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.setState({uploadedImage: file});
    }
  }

  render(): React.ReactNode {
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
              Drag&amp;Drop texture
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

const COMPACT_TEXTURE_SOURCES = new Set([
  'kodim20.basis',
  'kodim23.ktx2',
  'shannon-dxt5.dds',
  'shannon-astc-4x4.pvr',
  'shannon-etc1.pvr'
]);

function TexturesBlocks(props: {compact: boolean; device: Device; model: Model}): React.ReactNode {
  const {compact, device, model} = props;
  const imageGroups = compact
    ? IMAGES_DATA.map(imagesData => ({
        ...imagesData,
        images: imagesData.images.filter(image => COMPACT_TEXTURE_SOURCES.has(image.src))
      })).filter(imagesData => imagesData.images.length > 0)
    : IMAGES_DATA;

  return (
    <div className={compact ? 'texture-format-grid' : undefined}>
      {imageGroups.map(imagesData => (
        <section key={imagesData.formatName}>
          <TexturesHeader imagesData={imagesData} />
          <TexturesDescription imagesData={imagesData} />
          <TexturesList
            compact={compact}
            device={device}
            model={model}
            images={imagesData.images}
          />
        </section>
      ))}
    </div>
  );
}

function TexturesHeader({imagesData}: {imagesData: TextureFormatsInfo}): React.ReactNode {
  const {formatName, link} = imagesData;
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

function TexturesDescription({imagesData}: {imagesData: TextureFormatsInfo}): React.ReactNode {
  const {description, codeSample, availability} = imagesData;
  return (
    <div style={{marginBottom: 8, lineHeight: 1.2}}>
      {description ? (
        <p style={{margin: '4px 0'}}>
          <b>Description: </b>
          {description}
        </p>
      ) : null}
      {availability ? (
        <p style={{margin: '4px 0'}}>
          <b>Availability: </b>
          {availability}
        </p>
      ) : null}
      {codeSample ? (
        <div style={{marginTop: 4}}>
          <p style={{margin: 0}}>
            <b>Loader: </b>
            <code>{codeSample}</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TexturesList(props: {
  compact?: boolean;
  device: Device;
  model: Model;
  images: TextureFormatsInfo['images'];
}): React.ReactNode {
  const {compact = false, device, model, images} = props;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
      {images.map((image, index) => (
        <CompressedTexture
          key={index}
          image={image}
          device={device}
          model={model}
          size={compact ? 192 : undefined}
        />
      ))}
    </div>
  );
}
