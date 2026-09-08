// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';

export type MultiCanvasLayoutProps = {
  animatedNoiseDescription: string;
  animatedNoiseTitle: string;
  canvasHeight: number;
  canvasRefs: readonly React.RefObject<HTMLCanvasElement>[];
  canvasWidth: number;
  concentricWavesDescription: string;
  concentricWavesTitle: string;
  initializationError: string | null;
  isReady: boolean;
};

/** Keeps the JSX presentation separate from the shared-device render loop. */
export function makeMultiCanvasLayout(props: MultiCanvasLayoutProps): React.ReactNode {
  return (
    <div className="multi-canvas-example">
      {props.initializationError ? (
        <p style={{color: '#b00020', margin: 0}}>{props.initializationError}</p>
      ) : null}
      <div className="multi-canvas-example-grid">
        <ExamplePane
          canvasRef={props.canvasRefs[0]}
          description={props.concentricWavesDescription}
          isReady={props.isReady}
          title={props.concentricWavesTitle}
          canvasWidth={props.canvasWidth}
          canvasHeight={props.canvasHeight}
        />
        <ExamplePane
          canvasRef={props.canvasRefs[1]}
          description={props.animatedNoiseDescription}
          isReady={props.isReady}
          title={props.animatedNoiseTitle}
          canvasWidth={props.canvasWidth}
          canvasHeight={props.canvasHeight}
        />
      </div>
    </div>
  );
}

function ExamplePane(props: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  description: string;
  isReady: boolean;
  title: string;
  canvasWidth: number;
  canvasHeight: number;
}): React.ReactNode {
  const {canvasRef, description, isReady, title, canvasWidth, canvasHeight} = props;

  return (
    <div style={{minWidth: 0, width: '100%'}}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          paddingBottom: 2
        }}
      >
        <h3 style={{marginTop: 0, marginBottom: 6}}>{title}</h3>
        <p style={{margin: 0, lineHeight: 1.45}}>{description}</p>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          border: '1px solid #1f192c',
          background: '#000',
          opacity: isReady ? 1 : 0.5
        }}
      />
    </div>
  );
}
