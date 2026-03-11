// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useState} from 'react';
import {RotatingCube} from './rotating-cube';

/**
 * Main app component
 */
export default function App() {
  const [showCube, setShowCube] = useState(true);
  const [mountCount, setMountCount] = useState(0);

  const toggleCube = () => {
    setShowCube(prev => !prev);
    if (!showCube) {
      setMountCount(prev => prev + 1);
    }
  };

  return (
    <div style={{fontFamily: 'sans-serif', padding: '20px'}}>
      <div style={{marginBottom: '20px'}}>
        <h1 style={{margin: '0 0 20px 0'}}>Hello React</h1>
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

      {showCube && <RotatingCube />}
    </div>
  );
}
