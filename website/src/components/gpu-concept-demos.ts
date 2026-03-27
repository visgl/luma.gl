export type GPUConceptDemoController = {
  startAnimation: () => void;
  stopAnimation: () => void;
  destroyResources: () => void;
};

type GraphicsContext = WebGLRenderingContext | WebGL2RenderingContext;

type InstancingExtension = {
  drawArraysInstancedANGLE: (
    mode: number,
    first: number,
    count: number,
    primcount: number
  ) => void;
  vertexAttribDivisorANGLE: (index: number, divisor: number) => void;
};

type InstancingController = {
  drawArraysInstanced: (mode: number, first: number, count: number, instanceCount: number) => void;
  vertexAttribDivisor: (index: number, divisor: number) => void;
};

type RenderTarget = {
  framebuffer: WebGLFramebuffer;
  height: number;
  texture: WebGLTexture;
  width: number;
};

const FULLSCREEN_QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

function createGraphicsContext(canvas: HTMLCanvasElement): GraphicsContext {
  const contextAttributes: WebGLContextAttributes = {
    alpha: false,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    stencil: false
  };

  const graphicsContext =
    (canvas.getContext('webgl2', contextAttributes) as GraphicsContext | null) ||
    (canvas.getContext('webgl', contextAttributes) as GraphicsContext | null);

  if (!graphicsContext) {
    throw new Error('WebGL is not available in this browser.');
  }

  return graphicsContext;
}

function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  graphicsContext: GraphicsContext
): void {
  const devicePixelRatio =
    typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = Math.max(1, Math.round((canvas.clientWidth || 240) * devicePixelRatio));
  const displayHeight = Math.max(1, Math.round((canvas.clientHeight || 80) * devicePixelRatio));

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  graphicsContext.viewport(0, 0, canvas.width, canvas.height);
}

function createShader(
  graphicsContext: GraphicsContext,
  shaderType: number,
  shaderSource: string
): WebGLShader {
  const shader = graphicsContext.createShader(shaderType);

  if (!shader) {
    throw new Error('Could not create shader.');
  }

  graphicsContext.shaderSource(shader, shaderSource);
  graphicsContext.compileShader(shader);

  if (!graphicsContext.getShaderParameter(shader, graphicsContext.COMPILE_STATUS)) {
    const compilerMessage = graphicsContext.getShaderInfoLog(shader) || 'Unknown shader error.';
    graphicsContext.deleteShader(shader);
    throw new Error(compilerMessage);
  }

  return shader;
}

function createProgram(
  graphicsContext: GraphicsContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = createShader(
    graphicsContext,
    graphicsContext.VERTEX_SHADER,
    vertexShaderSource
  );
  const fragmentShader = createShader(
    graphicsContext,
    graphicsContext.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  const shaderProgram = graphicsContext.createProgram();

  if (!shaderProgram) {
    graphicsContext.deleteShader(vertexShader);
    graphicsContext.deleteShader(fragmentShader);
    throw new Error('Could not create shader program.');
  }

  graphicsContext.attachShader(shaderProgram, vertexShader);
  graphicsContext.attachShader(shaderProgram, fragmentShader);
  graphicsContext.linkProgram(shaderProgram);
  graphicsContext.deleteShader(vertexShader);
  graphicsContext.deleteShader(fragmentShader);

  if (!graphicsContext.getProgramParameter(shaderProgram, graphicsContext.LINK_STATUS)) {
    const linkMessage = graphicsContext.getProgramInfoLog(shaderProgram) || 'Unknown link error.';
    graphicsContext.deleteProgram(shaderProgram);
    throw new Error(linkMessage);
  }

  return shaderProgram;
}

function createArrayBuffer(
  graphicsContext: GraphicsContext,
  data: Float32Array
): WebGLBuffer {
  const arrayBuffer = graphicsContext.createBuffer();

  if (!arrayBuffer) {
    throw new Error('Could not create array buffer.');
  }

  graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, arrayBuffer);
  graphicsContext.bufferData(graphicsContext.ARRAY_BUFFER, data, graphicsContext.STATIC_DRAW);
  graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);

  return arrayBuffer;
}

function getInstancingController(graphicsContext: GraphicsContext): InstancingController {
  if ('drawArraysInstanced' in graphicsContext && 'vertexAttribDivisor' in graphicsContext) {
    const webGL2Context = graphicsContext as WebGL2RenderingContext;

    return {
      drawArraysInstanced: (mode, first, count, instanceCount): void => {
        webGL2Context.drawArraysInstanced(mode, first, count, instanceCount);
      },
      vertexAttribDivisor: (index, divisor): void => {
        webGL2Context.vertexAttribDivisor(index, divisor);
      }
    };
  }

  const instancingExtension = graphicsContext.getExtension(
    'ANGLE_instanced_arrays'
  ) as InstancingExtension | null;

  if (!instancingExtension) {
    throw new Error('Instancing requires WebGL2 or ANGLE_instanced_arrays support.');
  }

  return {
    drawArraysInstanced: (mode, first, count, instanceCount): void => {
      instancingExtension.drawArraysInstancedANGLE(mode, first, count, instanceCount);
    },
    vertexAttribDivisor: (index, divisor): void => {
      instancingExtension.vertexAttribDivisorANGLE(index, divisor);
    }
  };
}

function createRenderTarget(
  graphicsContext: GraphicsContext,
  width: number,
  height: number
): RenderTarget {
  const texture = graphicsContext.createTexture();
  const framebuffer = graphicsContext.createFramebuffer();

  if (!texture || !framebuffer) {
    if (texture) {
      graphicsContext.deleteTexture(texture);
    }

    if (framebuffer) {
      graphicsContext.deleteFramebuffer(framebuffer);
    }

    throw new Error('Could not create render target.');
  }

  const renderTarget = {framebuffer, height, texture, width};
  resizeRenderTarget(graphicsContext, renderTarget, width, height);

  return renderTarget;
}

function resizeRenderTarget(
  graphicsContext: GraphicsContext,
  renderTarget: RenderTarget,
  width: number,
  height: number
): void {
  renderTarget.width = width;
  renderTarget.height = height;

  graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, renderTarget.texture);
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_MIN_FILTER,
    graphicsContext.LINEAR
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_MAG_FILTER,
    graphicsContext.LINEAR
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_WRAP_S,
    graphicsContext.CLAMP_TO_EDGE
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_WRAP_T,
    graphicsContext.CLAMP_TO_EDGE
  );
  graphicsContext.texImage2D(
    graphicsContext.TEXTURE_2D,
    0,
    graphicsContext.RGBA,
    width,
    height,
    0,
    graphicsContext.RGBA,
    graphicsContext.UNSIGNED_BYTE,
    null
  );

  graphicsContext.bindFramebuffer(graphicsContext.FRAMEBUFFER, renderTarget.framebuffer);
  graphicsContext.framebufferTexture2D(
    graphicsContext.FRAMEBUFFER,
    graphicsContext.COLOR_ATTACHMENT0,
    graphicsContext.TEXTURE_2D,
    renderTarget.texture,
    0
  );
  graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, null);
  graphicsContext.bindFramebuffer(graphicsContext.FRAMEBUFFER, null);
}

function createAnimationController(
  renderFrame: (timeMilliseconds: number) => void,
  destroyGraphicsResources: () => void
): GPUConceptDemoController {
  let animationFrameIdentifier: number | null = null;

  const animateFrame = (timeMilliseconds: number): void => {
    renderFrame(timeMilliseconds);
    animationFrameIdentifier = window.requestAnimationFrame(animateFrame);
  };

  return {
    startAnimation: (): void => {
      if (animationFrameIdentifier !== null) {
        return;
      }

      animateFrame(typeof performance === 'undefined' ? 0 : performance.now());
    },
    stopAnimation: (): void => {
      if (animationFrameIdentifier === null) {
        return;
      }

      window.cancelAnimationFrame(animationFrameIdentifier);
      animationFrameIdentifier = null;
    },
    destroyResources: (): void => {
      if (animationFrameIdentifier !== null) {
        window.cancelAnimationFrame(animationFrameIdentifier);
        animationFrameIdentifier = null;
      }

      destroyGraphicsResources();
    }
  };
}

function createFullscreenVertexShaderSource(): string {
  return `
    attribute vec2 clipSpacePosition;
    varying vec2 textureCoordinates;

    void main(void) {
      textureCoordinates = clipSpacePosition * 0.5 + 0.5;
      gl_Position = vec4(clipSpacePosition, 0.0, 1.0);
    }
  `;
}

export function createBuffersDemo(canvas: HTMLCanvasElement): GPUConceptDemoController {
  const graphicsContext = createGraphicsContext(canvas);
  const vertexShaderSource = `
    attribute vec2 sampleState;
    uniform float timeMilliseconds;
    varying float waveStrength;

    void main(void) {
      float waveHeight =
        sin(timeMilliseconds * 0.0017 + sampleState.y * 6.2831) * 0.30 +
        cos(timeMilliseconds * 0.0011 + sampleState.x * 7.0) * 0.08;

      gl_Position = vec4(sampleState.x, waveHeight, 0.0, 1.0);
      gl_PointSize = 3.2 + 1.6 * (0.5 + 0.5 * sin(timeMilliseconds * 0.002 + sampleState.y * 8.0));
      waveStrength = 0.5 + 0.5 * sin(timeMilliseconds * 0.002 + sampleState.y * 5.0);
    }
  `;
  const fragmentShaderSource = `
    precision mediump float;
    varying float waveStrength;

    void main(void) {
      vec2 centeredPointCoordinates = gl_PointCoord - 0.5;
      float pointDistance = length(centeredPointCoordinates);
      float pointMask = smoothstep(0.55, 0.10, pointDistance);
      vec3 lineColor = mix(
        vec3(0.20, 0.48, 1.00),
        vec3(0.58, 0.78, 1.00),
        waveStrength
      );

      float alpha = gl_PointCoord.x == 0.0 && gl_PointCoord.y == 0.0 ? 1.0 : max(pointMask, 0.95);
      gl_FragColor = vec4(lineColor, alpha);
    }
  `;
  const shaderProgram = createProgram(graphicsContext, vertexShaderSource, fragmentShaderSource);
  const sampleCount = 40;
  const sampleData = new Float32Array(sampleCount * 2);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const sampleOffset = sampleIndex * 2;
    const sampleRatio = sampleIndex / (sampleCount - 1);

    sampleData[sampleOffset + 0] = -0.95 + sampleRatio * 1.9;
    sampleData[sampleOffset + 1] = sampleRatio;
  }

  const sampleBuffer = createArrayBuffer(graphicsContext, sampleData);
  const sampleStateLocation = graphicsContext.getAttribLocation(shaderProgram, 'sampleState');
  const timeMillisecondsLocation = graphicsContext.getUniformLocation(
    shaderProgram,
    'timeMilliseconds'
  );

  if (sampleStateLocation < 0 || !timeMillisecondsLocation) {
    throw new Error('Could not resolve buffer demo shader locations.');
  }

  graphicsContext.enable(graphicsContext.BLEND);
  graphicsContext.blendFunc(graphicsContext.SRC_ALPHA, graphicsContext.ONE_MINUS_SRC_ALPHA);

  return createAnimationController(
    timeMilliseconds => {
      resizeCanvasToDisplaySize(canvas, graphicsContext);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(shaderProgram);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, sampleBuffer);
      graphicsContext.enableVertexAttribArray(sampleStateLocation);
      graphicsContext.vertexAttribPointer(sampleStateLocation, 2, graphicsContext.FLOAT, false, 0, 0);
      graphicsContext.uniform1f(timeMillisecondsLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.LINE_STRIP, 0, sampleCount);
      graphicsContext.drawArrays(graphicsContext.POINTS, 0, sampleCount);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);
    },
    () => {
      graphicsContext.deleteBuffer(sampleBuffer);
      graphicsContext.deleteProgram(shaderProgram);
    }
  );
}

export function createComputeDemo(canvas: HTMLCanvasElement): GPUConceptDemoController {
  const graphicsContext = createGraphicsContext(canvas);
  const vertexShaderSource = `
    attribute vec3 particleState;
    uniform float timeMilliseconds;
    varying float particleIntensity;

    void main(void) {
      float particleAngle = timeMilliseconds * 0.0012 + particleState.z * 3.0;
      vec2 animatedPosition = particleState.xy +
        vec2(cos(particleAngle), sin(particleAngle * 1.35)) * 0.08;

      gl_Position = vec4(animatedPosition, 0.0, 1.0);
      gl_PointSize = 4.0 + 2.5 * (0.5 + 0.5 * sin(particleAngle * 1.7));
      particleIntensity = 0.45 + 0.55 * sin(particleAngle + particleState.z * 2.0);
    }
  `;
  const fragmentShaderSource = `
    precision mediump float;
    varying float particleIntensity;

    void main(void) {
      vec2 centeredPointCoordinates = gl_PointCoord - 0.5;
      float pointDistance = length(centeredPointCoordinates);
      float particleMask = smoothstep(0.5, 0.08, pointDistance);
      vec3 particleColor = mix(
        vec3(0.20, 0.48, 1.00),
        vec3(0.70, 0.36, 1.00),
        particleIntensity
      );

      gl_FragColor = vec4(particleColor, particleMask);
    }
  `;
  const shaderProgram = createProgram(graphicsContext, vertexShaderSource, fragmentShaderSource);
  const particleCount = 72;
  const particleData = new Float32Array(particleCount * 3);

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    const columnIndex = particleIndex % 12;
    const rowIndex = Math.floor(particleIndex / 12);
    const particleOffset = particleIndex * 3;

    particleData[particleOffset + 0] = -0.88 + columnIndex * 0.16 + (Math.random() - 0.5) * 0.05;
    particleData[particleOffset + 1] = -0.62 + rowIndex * 0.24 + (Math.random() - 0.5) * 0.05;
    particleData[particleOffset + 2] = Math.random() * Math.PI * 2;
  }

  const particleBuffer = createArrayBuffer(graphicsContext, particleData);
  const particleStateLocation = graphicsContext.getAttribLocation(shaderProgram, 'particleState');
  const timeMillisecondsLocation = graphicsContext.getUniformLocation(
    shaderProgram,
    'timeMilliseconds'
  );

  if (particleStateLocation < 0 || !timeMillisecondsLocation) {
    throw new Error('Could not resolve compute demo shader locations.');
  }

  graphicsContext.enable(graphicsContext.BLEND);
  graphicsContext.blendFunc(graphicsContext.SRC_ALPHA, graphicsContext.ONE);

  return createAnimationController(
    timeMilliseconds => {
      resizeCanvasToDisplaySize(canvas, graphicsContext);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(shaderProgram);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, particleBuffer);
      graphicsContext.enableVertexAttribArray(particleStateLocation);
      graphicsContext.vertexAttribPointer(particleStateLocation, 3, graphicsContext.FLOAT, false, 0, 0);
      graphicsContext.uniform1f(timeMillisecondsLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.POINTS, 0, particleCount);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);
    },
    () => {
      graphicsContext.deleteBuffer(particleBuffer);
      graphicsContext.deleteProgram(shaderProgram);
    }
  );
}

export function createTexturesDemo(canvas: HTMLCanvasElement): GPUConceptDemoController {
  const graphicsContext = createGraphicsContext(canvas);
  const shaderProgram = createProgram(
    graphicsContext,
    createFullscreenVertexShaderSource(),
    `
      precision mediump float;
      varying vec2 textureCoordinates;
      uniform sampler2D sampleTexture;
      uniform float timeMilliseconds;

      void main(void) {
        vec2 tiledCoordinates = textureCoordinates * vec2(5.0, 2.6);
        vec2 animatedOffset = vec2(
          0.08 * sin(timeMilliseconds * 0.0015),
          0.12 * cos(timeMilliseconds * 0.0011)
        );
        vec2 shiftedCoordinates = fract(tiledCoordinates + animatedOffset);
        vec3 sampledColor = texture2D(sampleTexture, shiftedCoordinates).rgb;
        vec2 cellCoordinates = fract(tiledCoordinates);
        float gridLine = step(0.95, cellCoordinates.x) + step(0.95, cellCoordinates.y);
        float shimmer = 0.5 + 0.5 * sin(
          (textureCoordinates.x + textureCoordinates.y) * 10.0 + timeMilliseconds * 0.002
        );
        vec3 outputColor = mix(sampledColor, vec3(0.32, 0.40, 0.95), 0.18 * shimmer);

        outputColor += min(gridLine, 1.0) * vec3(0.10, 0.15, 0.28);
        gl_FragColor = vec4(outputColor, 1.0);
      }
    `
  );
  const quadBuffer = createArrayBuffer(graphicsContext, FULLSCREEN_QUAD_POSITIONS);
  const clipSpacePositionLocation = graphicsContext.getAttribLocation(
    shaderProgram,
    'clipSpacePosition'
  );
  const timeMillisecondsLocation = graphicsContext.getUniformLocation(
    shaderProgram,
    'timeMilliseconds'
  );
  const sampleTextureLocation = graphicsContext.getUniformLocation(shaderProgram, 'sampleTexture');
  const textureSize = 64;
  const textureData = new Uint8Array(textureSize * textureSize * 4);

  for (let rowIndex = 0; rowIndex < textureSize; rowIndex++) {
    for (let columnIndex = 0; columnIndex < textureSize; columnIndex++) {
      const blockColumn = Math.floor(columnIndex / 8);
      const blockRow = Math.floor(rowIndex / 8);
      const colorIndex = (rowIndex * textureSize + columnIndex) * 4;
      const isBrightBlock = (blockColumn + blockRow) % 2 === 0;

      textureData[colorIndex + 0] = isBrightBlock ? 72 + blockColumn * 12 : 20 + blockRow * 6;
      textureData[colorIndex + 1] = isBrightBlock ? 110 + blockRow * 10 : 32 + blockColumn * 8;
      textureData[colorIndex + 2] = isBrightBlock ? 190 + blockColumn * 6 : 120 + blockRow * 7;
      textureData[colorIndex + 3] = 255;
    }
  }

  const sampleTexture = graphicsContext.createTexture();

  if (!sampleTexture) {
    throw new Error('Could not create texture demo texture.');
  }

  if (clipSpacePositionLocation < 0 || !timeMillisecondsLocation || !sampleTextureLocation) {
    throw new Error('Could not resolve texture demo shader locations.');
  }

  graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, sampleTexture);
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_MIN_FILTER,
    graphicsContext.LINEAR
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_MAG_FILTER,
    graphicsContext.LINEAR
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_WRAP_S,
    graphicsContext.REPEAT
  );
  graphicsContext.texParameteri(
    graphicsContext.TEXTURE_2D,
    graphicsContext.TEXTURE_WRAP_T,
    graphicsContext.REPEAT
  );
  graphicsContext.texImage2D(
    graphicsContext.TEXTURE_2D,
    0,
    graphicsContext.RGBA,
    textureSize,
    textureSize,
    0,
    graphicsContext.RGBA,
    graphicsContext.UNSIGNED_BYTE,
    textureData
  );
  graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, null);

  return createAnimationController(
    timeMilliseconds => {
      resizeCanvasToDisplaySize(canvas, graphicsContext);
      graphicsContext.disable(graphicsContext.BLEND);
      graphicsContext.clearColor(0.03, 0.04, 0.08, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(shaderProgram);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, quadBuffer);
      graphicsContext.enableVertexAttribArray(clipSpacePositionLocation);
      graphicsContext.vertexAttribPointer(
        clipSpacePositionLocation,
        2,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      graphicsContext.activeTexture(graphicsContext.TEXTURE0);
      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, sampleTexture);
      graphicsContext.uniform1i(sampleTextureLocation, 0);
      graphicsContext.uniform1f(timeMillisecondsLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.TRIANGLE_STRIP, 0, 4);
      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, null);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);
    },
    () => {
      graphicsContext.deleteTexture(sampleTexture);
      graphicsContext.deleteBuffer(quadBuffer);
      graphicsContext.deleteProgram(shaderProgram);
    }
  );
}

export function createInstancingDemo(canvas: HTMLCanvasElement): GPUConceptDemoController {
  const graphicsContext = createGraphicsContext(canvas);
  const instancingController = getInstancingController(graphicsContext);
  const shaderProgram = createProgram(
    graphicsContext,
    `
      attribute vec2 geometryPosition;
      attribute vec3 instanceTransform;
      attribute vec3 instanceColor;
      uniform float timeMilliseconds;
      varying vec3 fragmentColor;

      void main(void) {
        float travel = sin(timeMilliseconds * 0.0015 + instanceTransform.z * 6.2831);
        float rise = cos(timeMilliseconds * 0.0012 + instanceTransform.z * 7.5) * 0.07;
        float widthScale = 0.9 + 0.25 * sin(timeMilliseconds * 0.001 + instanceTransform.z * 5.0);
        vec2 scaledGeometry = vec2(
          geometryPosition.x * instanceTransform.y * widthScale,
          geometryPosition.y * (0.42 + 0.35 * (0.5 + 0.5 * travel))
        );
        vec2 translatedPosition = scaledGeometry + vec2(instanceTransform.x, rise);

        gl_Position = vec4(translatedPosition, 0.0, 1.0);
        fragmentColor = instanceColor;
      }
    `,
    `
      precision mediump float;
      varying vec3 fragmentColor;

      void main(void) {
        gl_FragColor = vec4(fragmentColor, 1.0);
      }
    `
  );
  const geometryBuffer = createArrayBuffer(
    graphicsContext,
    new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5])
  );
  const instanceCount = 14;
  const instanceTransformData = new Float32Array(instanceCount * 3);
  const instanceColorData = new Float32Array(instanceCount * 3);

  for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
    const offset = instanceIndex * 3;
    const ratio = instanceIndex / (instanceCount - 1);

    instanceTransformData[offset + 0] = -0.9 + ratio * 1.8;
    instanceTransformData[offset + 1] = 0.08 + (instanceIndex % 4) * 0.018;
    instanceTransformData[offset + 2] = ratio;

    instanceColorData[offset + 0] = 0.18 + ratio * 0.32;
    instanceColorData[offset + 1] = 0.36 + (1 - ratio) * 0.28;
    instanceColorData[offset + 2] = 0.86 + Math.sin(ratio * Math.PI) * 0.12;
  }

  const instanceTransformBuffer = createArrayBuffer(graphicsContext, instanceTransformData);
  const instanceColorBuffer = createArrayBuffer(graphicsContext, instanceColorData);
  const geometryPositionLocation = graphicsContext.getAttribLocation(
    shaderProgram,
    'geometryPosition'
  );
  const instanceTransformLocation = graphicsContext.getAttribLocation(
    shaderProgram,
    'instanceTransform'
  );
  const instanceColorLocation = graphicsContext.getAttribLocation(shaderProgram, 'instanceColor');
  const timeMillisecondsLocation = graphicsContext.getUniformLocation(
    shaderProgram,
    'timeMilliseconds'
  );

  if (
    geometryPositionLocation < 0 ||
    instanceTransformLocation < 0 ||
    instanceColorLocation < 0 ||
    !timeMillisecondsLocation
  ) {
    throw new Error('Could not resolve instancing demo shader locations.');
  }

  return createAnimationController(
    timeMilliseconds => {
      resizeCanvasToDisplaySize(canvas, graphicsContext);
      graphicsContext.disable(graphicsContext.BLEND);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(shaderProgram);

      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, geometryBuffer);
      graphicsContext.enableVertexAttribArray(geometryPositionLocation);
      graphicsContext.vertexAttribPointer(
        geometryPositionLocation,
        2,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      instancingController.vertexAttribDivisor(geometryPositionLocation, 0);

      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, instanceTransformBuffer);
      graphicsContext.enableVertexAttribArray(instanceTransformLocation);
      graphicsContext.vertexAttribPointer(
        instanceTransformLocation,
        3,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      instancingController.vertexAttribDivisor(instanceTransformLocation, 1);

      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, instanceColorBuffer);
      graphicsContext.enableVertexAttribArray(instanceColorLocation);
      graphicsContext.vertexAttribPointer(
        instanceColorLocation,
        3,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      instancingController.vertexAttribDivisor(instanceColorLocation, 1);

      graphicsContext.uniform1f(timeMillisecondsLocation, timeMilliseconds);
      instancingController.drawArraysInstanced(graphicsContext.TRIANGLES, 0, 6, instanceCount);

      instancingController.vertexAttribDivisor(instanceTransformLocation, 0);
      instancingController.vertexAttribDivisor(instanceColorLocation, 0);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);
    },
    () => {
      graphicsContext.deleteBuffer(geometryBuffer);
      graphicsContext.deleteBuffer(instanceTransformBuffer);
      graphicsContext.deleteBuffer(instanceColorBuffer);
      graphicsContext.deleteProgram(shaderProgram);
    }
  );
}

export function createPipelinesDemo(canvas: HTMLCanvasElement): GPUConceptDemoController {
  const graphicsContext = createGraphicsContext(canvas);
  const fullscreenVertexShaderSource = createFullscreenVertexShaderSource();
  const firstStageProgram = createProgram(
    graphicsContext,
    fullscreenVertexShaderSource,
    `
      precision mediump float;
      varying vec2 textureCoordinates;
      uniform float timeMilliseconds;

      void main(void) {
        vec2 centeredCoordinates = textureCoordinates * 2.0 - 1.0;
        float radialWave = 0.5 + 0.5 * sin(
          7.0 * length(centeredCoordinates) - timeMilliseconds * 0.004
        );
        float diagonalSweep = 0.5 + 0.5 * cos(
          (centeredCoordinates.x - centeredCoordinates.y) * 8.0 + timeMilliseconds * 0.002
        );
        vec3 baseColor = mix(
          vec3(0.05, 0.12, 0.28),
          vec3(0.12, 0.62, 1.00),
          radialWave
        );

        baseColor += diagonalSweep * vec3(0.08, 0.00, 0.18);
        gl_FragColor = vec4(baseColor, 1.0);
      }
    `
  );
  const secondStageProgram = createProgram(
    graphicsContext,
    fullscreenVertexShaderSource,
    `
      precision mediump float;
      varying vec2 textureCoordinates;
      uniform sampler2D firstStageTexture;
      uniform float timeMilliseconds;

      void main(void) {
        vec2 displacedCoordinates = textureCoordinates +
          vec2(0.05 * sin(timeMilliseconds * 0.0018), 0.0);
        vec3 firstStageColor = texture2D(firstStageTexture, displacedCoordinates).rgb;
        float luminance = dot(firstStageColor, vec3(0.299, 0.587, 0.114));
        vec3 transformedColor = vec3(
          firstStageColor.r * 0.35 + luminance * 0.65,
          firstStageColor.g * 0.25 + 0.18,
          firstStageColor.b * 0.75 + 0.35 * (1.0 - firstStageColor.r)
        );

        transformedColor = mix(
          transformedColor,
          vec3(0.82, 0.34, 1.00),
          0.28 * smoothstep(0.35, 0.95, luminance)
        );
        gl_FragColor = vec4(transformedColor, 1.0);
      }
    `
  );
  const presentationProgram = createProgram(
    graphicsContext,
    fullscreenVertexShaderSource,
    `
      precision mediump float;
      varying vec2 textureCoordinates;
      uniform sampler2D firstStageTexture;
      uniform sampler2D secondStageTexture;
      uniform float timeMilliseconds;

      void main(void) {
        vec2 stageCoordinates = vec2(fract(textureCoordinates.x * 3.0), textureCoordinates.y);
        vec3 firstStageColor = texture2D(firstStageTexture, stageCoordinates).rgb;
        vec3 secondStageColor = texture2D(secondStageTexture, stageCoordinates).rgb;
        float pulse = 0.5 + 0.5 * sin(timeMilliseconds * 0.002 + stageCoordinates.x * 6.2831);
        vec3 finalStageColor = mix(
          secondStageColor,
          vec3(
            secondStageColor.b,
            0.35 + secondStageColor.r * 0.7,
            1.0 - secondStageColor.g * 0.45
          ),
          0.45 + 0.15 * pulse
        );
        vec3 outputColor = firstStageColor;

        if (textureCoordinates.x >= 1.0 / 3.0 && textureCoordinates.x < 2.0 / 3.0) {
          outputColor = secondStageColor;
        } else if (textureCoordinates.x >= 2.0 / 3.0) {
          outputColor = finalStageColor;
        }

        float firstDivider = smoothstep(0.015, 0.0, abs(textureCoordinates.x - 1.0 / 3.0));
        float secondDivider = smoothstep(0.015, 0.0, abs(textureCoordinates.x - 2.0 / 3.0));
        float flowBand = exp(-120.0 * pow(textureCoordinates.y - 0.18, 2.0));
        float firstFlowSegment = smoothstep(0.12, 0.18, textureCoordinates.x) *
          (1.0 - smoothstep(0.26, 0.31, textureCoordinates.x));
        float secondFlowSegment = smoothstep(0.45, 0.51, textureCoordinates.x) *
          (1.0 - smoothstep(0.59, 0.64, textureCoordinates.x));

        outputColor += (firstDivider + secondDivider) * vec3(0.14, 0.20, 0.52);
        outputColor += flowBand * (firstFlowSegment + secondFlowSegment) * vec3(0.10, 0.18, 0.44);
        gl_FragColor = vec4(outputColor, 1.0);
      }
    `
  );
  const quadBuffer = createArrayBuffer(graphicsContext, FULLSCREEN_QUAD_POSITIONS);
  const firstStagePositionLocation = graphicsContext.getAttribLocation(
    firstStageProgram,
    'clipSpacePosition'
  );
  const secondStagePositionLocation = graphicsContext.getAttribLocation(
    secondStageProgram,
    'clipSpacePosition'
  );
  const presentationPositionLocation = graphicsContext.getAttribLocation(
    presentationProgram,
    'clipSpacePosition'
  );
  const firstStageTimeLocation = graphicsContext.getUniformLocation(
    firstStageProgram,
    'timeMilliseconds'
  );
  const secondStageTextureLocation = graphicsContext.getUniformLocation(
    secondStageProgram,
    'firstStageTexture'
  );
  const secondStageTimeLocation = graphicsContext.getUniformLocation(
    secondStageProgram,
    'timeMilliseconds'
  );
  const presentationFirstStageTextureLocation = graphicsContext.getUniformLocation(
    presentationProgram,
    'firstStageTexture'
  );
  const presentationSecondStageTextureLocation = graphicsContext.getUniformLocation(
    presentationProgram,
    'secondStageTexture'
  );
  const presentationTimeLocation = graphicsContext.getUniformLocation(
    presentationProgram,
    'timeMilliseconds'
  );

  if (
    firstStagePositionLocation < 0 ||
    secondStagePositionLocation < 0 ||
    presentationPositionLocation < 0 ||
    !firstStageTimeLocation ||
    !secondStageTextureLocation ||
    !secondStageTimeLocation ||
    !presentationFirstStageTextureLocation ||
    !presentationSecondStageTextureLocation ||
    !presentationTimeLocation
  ) {
    throw new Error('Could not resolve pipeline demo shader locations.');
  }

  const firstRenderTarget = createRenderTarget(graphicsContext, 1, 1);
  const secondRenderTarget = createRenderTarget(graphicsContext, 1, 1);

  return createAnimationController(
    timeMilliseconds => {
      resizeCanvasToDisplaySize(canvas, graphicsContext);

      if (
        firstRenderTarget.width !== canvas.width ||
        firstRenderTarget.height !== canvas.height ||
        secondRenderTarget.width !== canvas.width ||
        secondRenderTarget.height !== canvas.height
      ) {
        resizeRenderTarget(graphicsContext, firstRenderTarget, canvas.width, canvas.height);
        resizeRenderTarget(graphicsContext, secondRenderTarget, canvas.width, canvas.height);
      }

      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, quadBuffer);
      graphicsContext.disable(graphicsContext.BLEND);

      graphicsContext.bindFramebuffer(graphicsContext.FRAMEBUFFER, firstRenderTarget.framebuffer);
      graphicsContext.viewport(0, 0, firstRenderTarget.width, firstRenderTarget.height);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(firstStageProgram);
      graphicsContext.enableVertexAttribArray(firstStagePositionLocation);
      graphicsContext.vertexAttribPointer(
        firstStagePositionLocation,
        2,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      graphicsContext.uniform1f(firstStageTimeLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.TRIANGLE_STRIP, 0, 4);

      graphicsContext.bindFramebuffer(graphicsContext.FRAMEBUFFER, secondRenderTarget.framebuffer);
      graphicsContext.viewport(0, 0, secondRenderTarget.width, secondRenderTarget.height);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(secondStageProgram);
      graphicsContext.enableVertexAttribArray(secondStagePositionLocation);
      graphicsContext.vertexAttribPointer(
        secondStagePositionLocation,
        2,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      graphicsContext.activeTexture(graphicsContext.TEXTURE0);
      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, firstRenderTarget.texture);
      graphicsContext.uniform1i(secondStageTextureLocation, 0);
      graphicsContext.uniform1f(secondStageTimeLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.TRIANGLE_STRIP, 0, 4);

      graphicsContext.bindFramebuffer(graphicsContext.FRAMEBUFFER, null);
      graphicsContext.viewport(0, 0, canvas.width, canvas.height);
      graphicsContext.clearColor(0.03, 0.05, 0.10, 1);
      graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);
      graphicsContext.useProgram(presentationProgram);
      graphicsContext.enableVertexAttribArray(presentationPositionLocation);
      graphicsContext.vertexAttribPointer(
        presentationPositionLocation,
        2,
        graphicsContext.FLOAT,
        false,
        0,
        0
      );
      graphicsContext.activeTexture(graphicsContext.TEXTURE0);
      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, firstRenderTarget.texture);
      graphicsContext.uniform1i(presentationFirstStageTextureLocation, 0);
      graphicsContext.activeTexture(graphicsContext.TEXTURE1);
      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, secondRenderTarget.texture);
      graphicsContext.uniform1i(presentationSecondStageTextureLocation, 1);
      graphicsContext.uniform1f(presentationTimeLocation, timeMilliseconds);
      graphicsContext.drawArrays(graphicsContext.TRIANGLE_STRIP, 0, 4);

      graphicsContext.bindTexture(graphicsContext.TEXTURE_2D, null);
      graphicsContext.bindBuffer(graphicsContext.ARRAY_BUFFER, null);
    },
    () => {
      graphicsContext.deleteFramebuffer(firstRenderTarget.framebuffer);
      graphicsContext.deleteFramebuffer(secondRenderTarget.framebuffer);
      graphicsContext.deleteTexture(firstRenderTarget.texture);
      graphicsContext.deleteTexture(secondRenderTarget.texture);
      graphicsContext.deleteBuffer(quadBuffer);
      graphicsContext.deleteProgram(firstStageProgram);
      graphicsContext.deleteProgram(secondStageProgram);
      graphicsContext.deleteProgram(presentationProgram);
    }
  );
}
