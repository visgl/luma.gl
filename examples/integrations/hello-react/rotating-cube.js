// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { useEffect, useRef } from 'react';
import { luma, log } from '@luma.gl/core';
import { makeAnimationLoop } from '@luma.gl/engine';
import { webgl2Adapter } from '@luma.gl/webgl';
import { CubeAnimationLoopTemplate } from './cube-animation';
/**
 * React component that renders a spinning cube using luma.gl
 */
export function RotatingCube() {
    const canvasRef = useRef(null);
    const animationLoopRef = useRef(null);
    const deviceRef = useRef(null);
    useEffect(() => {
        if (!canvasRef.current)
            return;
        let animationLoop = null;
        let device = null;
        const init = async () => {
            try {
                device = await luma.createDevice({
                    adapters: [webgl2Adapter],
                    // Enable _reuseDevices to handle React StrictMode double-mounting
                    // This is what deck.gl also does (core/src/lib/deck.ts)
                    _reuseDevices: true,
                    createCanvasContext: {
                        canvas: canvasRef.current
                    }
                });
                deviceRef.current = device;
                // Create animation loop
                animationLoop = makeAnimationLoop(CubeAnimationLoopTemplate, {
                    device
                });
                animationLoopRef.current = animationLoop;
                // Start rendering
                animationLoop.start();
            }
            catch (error) {
                log.error(`Failed to initialize cube: ${error}`)();
            }
        };
        init();
        // Cleanup on unmount
        return () => {
            if (animationLoop) {
                animationLoop.destroy();
                animationLoopRef.current = null;
            }
            if (device) {
                device.destroy();
                deviceRef.current = null;
            }
        };
    }, []);
    return (React.createElement("canvas", { ref: canvasRef, style: {
            width: '100%',
            height: '600px',
            display: 'block'
        } }));
}
