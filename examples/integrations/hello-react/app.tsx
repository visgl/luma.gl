// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useState} from 'react';
import {RotatingCube} from './rotating-cube';

type AppProps = {
  showControls?: boolean;
  showCube?: boolean;
  mountCount?: number;
  onToggleCube?: () => void;
};

/**
 * Main app component
 */
export default function App(props: AppProps) {
  const [internalShowCube, setInternalShowCube] = useState(true);
  const [internalMountCount, setInternalMountCount] = useState(0);

  const showControls = props.showControls ?? true;
  const isControlled =
    typeof props.showCube === 'boolean' && typeof props.onToggleCube === 'function';
  const showCube = isControlled ? props.showCube : internalShowCube;
  const mountCount = isControlled ? (props.mountCount ?? 0) : internalMountCount;

  const toggleCube = () => {
    if (isControlled) {
      props.onToggleCube?.();
      return;
    }

    setInternalShowCube(previousValue => {
      if (!previousValue) {
        setInternalMountCount(previousCount => previousCount + 1);
      }
      return !previousValue;
    });
  };

  return (
    <div style={{fontFamily: 'sans-serif', padding: '20px'}}>
      {showControls ? (
        <div style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button
              onClick={toggleCube}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: showCube ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {showCube ? 'Hide Cube' : 'Show Cube'}
            </button>
            <span style={{color: '#666'}}>
              Mount count: <strong>{mountCount}</strong>
            </span>
          </div>
        </div>
      ) : null}

      {showCube ? <RotatingCube /> : null}
    </div>
  );
}
