// The MIT License (MIT) Copyright (c) 2017 Tarek Sherif
// @ts-nocheck

(function () {
  let translateMat;
  let rotateXMat;
  let rotateYMat;
  let rotateZMat;
  let scaleMat;

  if (window.mat4) {
    translateMat = mat4.create();
    rotateXMat = mat4.create();
    rotateYMat = mat4.create();
    rotateZMat = mat4.create();
    scaleMat = mat4.create();
  }

  let zeros = [0, 0, 0];
  let ones = [1, 1, 1];

  const NUM_TIMING_SAMPLES = 60;

  let cpuTimeSum = 0;
  let gpuTimeSum = 0;
  let timeSampleCount = NUM_TIMING_SAMPLES - 1;

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
  function pvrtc2bppSize(width, height) {
    width = Math.max(width, 16);
    height = Math.max(height, 8);

    return (width * height) / 4;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
  function pvrtc4bppSize(width, height) {
    width = Math.max(width, 8);
    height = Math.max(height, 8);

    return (width * height) / 2;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
  // Size for:
  // COMPRESSED_RGB_S3TC_DXT1_EXT
  // COMPRESSED_R11_EAC
  // COMPRESSED_SIGNED_R11_EAC
  // COMPRESSED_RGB8_ETC2
  // COMPRESSED_SRGB8_ETC2
  // COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2
  // COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2
  function dxtEtcSmallSize(width, height) {
    return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  // Size for:
  // COMPRESSED_RGBA_S3TC_DXT3_EXT
  // COMPRESSED_RGBA_S3TC_DXT5_EXT
  // COMPRESSED_RG11_EAC
  // COMPRESSED_SIGNED_RG11_EAC
  // COMPRESSED_RGBA8_ETC2_EAC
  // COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
  // COMPRESSED_RGBA_ASTC_4x4_KHR
  function dxtEtcAstcBigSize(width, height) {
    return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc5x4Size(width, height) {
    return Math.floor((width + 4) / 5) * Math.floor((height + 3) / 4) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc5x5Size(width, height) {
    return Math.floor((width + 4) / 5) * Math.floor((height + 4) / 5) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc6x5Size(width, height) {
    return Math.floor((width + 5) / 6) * Math.floor((height + 4) / 5) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc6x6Size(width, height) {
    return Math.floor((width + 5) / 6) * Math.floor((height + 5) / 6) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc8x5Size(width, height) {
    return Math.floor((width + 7) / 8) * Math.floor((height + 4) / 5) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc8x6Size(width, height) {
    return Math.floor((width + 7) / 8) * Math.floor((height + 5) / 6) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc8x8Size(width, height) {
    return Math.floor((width + 7) / 8) * Math.floor((height + 7) / 8) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc10x5Size(width, height) {
    return Math.floor((width + 9) / 10) * Math.floor((height + 4) / 5) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc10x6Size(width, height) {
    return Math.floor((width + 9) / 10) * Math.floor((height + 5) / 6) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc10x8Size(width, height) {
    return Math.floor((width + 9) / 10) * Math.floor((height + 7) / 8) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc10x10Size(width, height) {
    return Math.floor((width + 9) / 10) * Math.floor((height + 9) / 10) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc12x10Size(width, height) {
    return Math.floor((width + 11) / 12) * Math.floor((height + 9) / 10) * 16;
  }

  // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
  function atc12x12Size(width, height) {
    return Math.floor((width + 11) / 12) * Math.floor((height + 11) / 12) * 16;
  }

  const PVR_CONSTANTS = {
    MAGIC_NUMBER: 0x03525650,
    HEADER_LENGTH: 13,
    HEADER_SIZE: 52,
    MAGIC_NUMBER_INDEX: 0,
    PIXEL_FORMAT_INDEX: 2,
    HEIGHT_INDEX: 6,
    WIDTH_INDEX: 7,
    MIPMAPCOUNT_INDEX: 11,
    METADATA_SIZE_INDEX: 12,
    FORMATS: {
      0: 'COMPRESSED_RGB_PVRTC_2BPPV1_IMG',
      1: 'COMPRESSED_RGBA_PVRTC_2BPPV1_IMG',
      2: 'COMPRESSED_RGB_PVRTC_4BPPV1_IMG',
      3: 'COMPRESSED_RGBA_PVRTC_4BPPV1_IMG',
      6: 'COMPRESSED_RGB8_ETC2',
      7: 'COMPRESSED_RGB_S3TC_DXT1_EXT',
      9: 'COMPRESSED_RGBA_S3TC_DXT3_EXT',
      11: 'COMPRESSED_RGBA_S3TC_DXT5_EXT',
      22: 'COMPRESSED_RGB8_ETC2',
      23: 'COMPRESSED_RGBA8_ETC2_EAC',
      24: 'COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2',
      25: 'COMPRESSED_R11_EAC',
      26: 'COMPRESSED_RG11_EAC',
      27: 'COMPRESSED_RGBA_ASTC_4x4_KHR',
      28: 'COMPRESSED_RGBA_ASTC_5x4_KHR',
      29: 'COMPRESSED_RGBA_ASTC_5x5_KHR',
      30: 'COMPRESSED_RGBA_ASTC_6x5_KHR',
      31: 'COMPRESSED_RGBA_ASTC_6x6_KHR',
      32: 'COMPRESSED_RGBA_ASTC_8x5_KHR',
      33: 'COMPRESSED_RGBA_ASTC_8x6_KHR',
      34: 'COMPRESSED_RGBA_ASTC_8x8_KHR',
      35: 'COMPRESSED_RGBA_ASTC_10x5_KHR',
      36: 'COMPRESSED_RGBA_ASTC_10x6_KHR',
      37: 'COMPRESSED_RGBA_ASTC_10x8_KHR',
      38: 'COMPRESSED_RGBA_ASTC_10x10_KHR',
      39: 'COMPRESSED_RGBA_ASTC_12x10_KHR',
      40: 'COMPRESSED_RGBA_ASTC_12x12_KHR'
    },
    SIZE_FUNCTIONS: {
      0: pvrtc2bppSize,
      1: pvrtc2bppSize,
      2: pvrtc4bppSize,
      3: pvrtc4bppSize,
      6: dxtEtcSmallSize,
      7: dxtEtcSmallSize,
      9: dxtEtcAstcBigSize,
      11: dxtEtcAstcBigSize,
      22: dxtEtcSmallSize,
      23: dxtEtcAstcBigSize,
      24: dxtEtcSmallSize,
      25: dxtEtcSmallSize,
      26: dxtEtcAstcBigSize,
      27: dxtEtcAstcBigSize,
      28: atc5x4Size,
      29: atc5x5Size,
      30: atc6x5Size,
      31: atc6x6Size,
      32: atc8x5Size,
      33: atc8x6Size,
      34: atc8x8Size,
      35: atc10x5Size,
      36: atc10x6Size,
      37: atc10x8Size,
      38: atc10x10Size,
      39: atc12x10Size,
      40: atc12x12Size
    }
  };

  window.utils = {
    xformMatrix(xform, translate, rotate, scale) {
      translate = translate || zeros;
      rotate = rotate || zeros;
      scale = scale || ones;

      mat4.fromTranslation(translateMat, translate);
      mat4.fromXRotation(rotateXMat, rotate[0]);
      mat4.fromYRotation(rotateYMat, rotate[1]);
      mat4.fromZRotation(rotateZMat, rotate[2]);
      mat4.fromScaling(scaleMat, scale);

      mat4.multiply(xform, rotateXMat, scaleMat);
      mat4.multiply(xform, rotateYMat, xform);
      mat4.multiply(xform, rotateZMat, xform);
      mat4.multiply(xform, translateMat, xform);
    },

    loadImages(urls) {
      return new Promise((resolve) => {
        let numImages = urls.length;

        let images = new Array(numImages);

        function onload() {
          if (--numImages === 0) {
            resolve(images);
          }
        }

        for (let i = 0; i < numImages; ++i) {
          images[i] = new Image();
          images[i].onload = onload;
          images[i].src = urls[i];
        }
      });
    },

    loadImageArray(urls) {
      return this.loadImages(urls).then((images) => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let width = images[0].width;
        let height = images[0].height;
        canvas.width = width;
        canvas.height = height * images.length;

        for (let i = 0, len = images.length; i < len; ++i) {
          ctx.drawImage(images[i], 0, i * height);
        }

        return new Promise((resolve) => {
          let image = new Image();
          image.onload = () => {
            resolve({
              data: image,
              width: width,
              height: height,
              length: images.length
            });
          };
          image.src = canvas.toDataURL();
        });
      });
    },

    createBox(options) {
      options = options || {};

      let dimensions = options.dimensions || [1, 1, 1];
      let position = options.position || [
        -dimensions[0] / 2,
        -dimensions[1] / 2,
        -dimensions[2] / 2
      ];
      let x = position[0];
      let y = position[1];
      let z = position[2];
      let width = dimensions[0];
      let height = dimensions[1];
      let depth = dimensions[2];

      let fbl = {x: x, y: y, z: z + depth};
      let fbr = {x: x + width, y: y, z: z + depth};
      let ftl = {x: x, y: y + height, z: z + depth};
      let ftr = {x: x + width, y: y + height, z: z + depth};
      let bbl = {x: x, y: y, z: z};
      let bbr = {x: x + width, y: y, z: z};
      let btl = {x: x, y: y + height, z: z};
      let btr = {x: x + width, y: y + height, z: z};

      let positions = new Float32Array([
        //front
        fbl.x,
        fbl.y,
        fbl.z,
        fbr.x,
        fbr.y,
        fbr.z,
        ftl.x,
        ftl.y,
        ftl.z,
        ftl.x,
        ftl.y,
        ftl.z,
        fbr.x,
        fbr.y,
        fbr.z,
        ftr.x,
        ftr.y,
        ftr.z,

        //right
        fbr.x,
        fbr.y,
        fbr.z,
        bbr.x,
        bbr.y,
        bbr.z,
        ftr.x,
        ftr.y,
        ftr.z,
        ftr.x,
        ftr.y,
        ftr.z,
        bbr.x,
        bbr.y,
        bbr.z,
        btr.x,
        btr.y,
        btr.z,

        //back
        fbr.x,
        bbr.y,
        bbr.z,
        bbl.x,
        bbl.y,
        bbl.z,
        btr.x,
        btr.y,
        btr.z,
        btr.x,
        btr.y,
        btr.z,
        bbl.x,
        bbl.y,
        bbl.z,
        btl.x,
        btl.y,
        btl.z,

        //left
        bbl.x,
        bbl.y,
        bbl.z,
        fbl.x,
        fbl.y,
        fbl.z,
        btl.x,
        btl.y,
        btl.z,
        btl.x,
        btl.y,
        btl.z,
        fbl.x,
        fbl.y,
        fbl.z,
        ftl.x,
        ftl.y,
        ftl.z,

        //top
        ftl.x,
        ftl.y,
        ftl.z,
        ftr.x,
        ftr.y,
        ftr.z,
        btl.x,
        btl.y,
        btl.z,
        btl.x,
        btl.y,
        btl.z,
        ftr.x,
        ftr.y,
        ftr.z,
        btr.x,
        btr.y,
        btr.z,

        //bottom
        bbl.x,
        bbl.y,
        bbl.z,
        bbr.x,
        bbr.y,
        bbr.z,
        fbl.x,
        fbl.y,
        fbl.z,
        fbl.x,
        fbl.y,
        fbl.z,
        bbr.x,
        bbr.y,
        bbr.z,
        fbr.x,
        fbr.y,
        fbr.z
      ]);

      let uvs = new Float32Array([
        //front
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

        //right
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

        //back
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

        //left
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

        //top
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

        //bottom
        0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1
      ]);

      let normals = new Float32Array([
        // front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // left
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

        // top
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
      ]);

      return {
        positions: positions,
        normals: normals,
        uvs: uvs
      };
    },

    createSphere(options) {
      options = options || {};

      let longBands = options.longBands || 32;
      let latBands = options.latBands || 32;
      let radius = options.radius || 1;
      let lat_step = Math.PI / latBands;
      let long_step = (2 * Math.PI) / longBands;
      let num_positions = longBands * latBands * 4;
      let num_indices = longBands * latBands * 6;
      let lat_angle, long_angle;
      let positions = new Float32Array(num_positions * 3);
      let normals = new Float32Array(num_positions * 3);
      let uvs = new Float32Array(num_positions * 2);
      let indices = new Uint16Array(num_indices);
      let x1, x2, x3, x4, y1, y2, z1, z2, z3, z4, u1, u2, v1, v2;
      let i, j;
      let k = 0,
        l = 0;
      let vi, ti;

      for (i = 0; i < latBands; i++) {
        lat_angle = i * lat_step;
        y1 = Math.cos(lat_angle);
        y2 = Math.cos(lat_angle + lat_step);
        for (j = 0; j < longBands; j++) {
          long_angle = j * long_step;
          x1 = Math.sin(lat_angle) * Math.cos(long_angle);
          x2 = Math.sin(lat_angle) * Math.cos(long_angle + long_step);
          x3 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle);
          x4 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle + long_step);
          z1 = Math.sin(lat_angle) * Math.sin(long_angle);
          z2 = Math.sin(lat_angle) * Math.sin(long_angle + long_step);
          z3 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle);
          z4 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle + long_step);
          u1 = 1 - j / longBands;
          u2 = 1 - (j + 1) / longBands;
          v1 = 1 - i / latBands;
          v2 = 1 - (i + 1) / latBands;
          vi = k * 3;
          ti = k * 2;

          positions[vi] = x1 * radius;
          positions[vi + 1] = y1 * radius;
          positions[vi + 2] = z1 * radius; //v0

          positions[vi + 3] = x2 * radius;
          positions[vi + 4] = y1 * radius;
          positions[vi + 5] = z2 * radius; //v1

          positions[vi + 6] = x3 * radius;
          positions[vi + 7] = y2 * radius;
          positions[vi + 8] = z3 * radius; // v2

          positions[vi + 9] = x4 * radius;
          positions[vi + 10] = y2 * radius;
          positions[vi + 11] = z4 * radius; // v3

          normals[vi] = x1;
          normals[vi + 1] = y1;
          normals[vi + 2] = z1;

          normals[vi + 3] = x2;
          normals[vi + 4] = y1;
          normals[vi + 5] = z2;

          normals[vi + 6] = x3;
          normals[vi + 7] = y2;
          normals[vi + 8] = z3;

          normals[vi + 9] = x4;
          normals[vi + 10] = y2;
          normals[vi + 11] = z4;

          uvs[ti] = u1;
          uvs[ti + 1] = v1;

          uvs[ti + 2] = u2;
          uvs[ti + 3] = v1;

          uvs[ti + 4] = u1;
          uvs[ti + 5] = v2;

          uvs[ti + 6] = u2;
          uvs[ti + 7] = v2;

          indices[l] = k;
          indices[l + 1] = k + 1;
          indices[l + 2] = k + 2;
          indices[l + 3] = k + 2;
          indices[l + 4] = k + 1;
          indices[l + 5] = k + 3;

          k += 4;
          l += 6;
        }
      }

      return {
        positions: positions,
        normals: normals,
        uvs: uvs,
        indices: indices
      };
    },

    computeBoundingBox(position, options) {
      options = options || {};
      let buildGeometry = options.buildGeometry || false;

      let boundary = {
        min: vec3.create(),
        max: vec3.create()
      };
      vec3.set(
        boundary.min,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
      );
      vec3.set(
        boundary.max,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY
      );
      for (let i = 0, len = position.length; i < len; i += 3) {
        boundary.min[0] = Math.min(position[i], boundary.min[0]);
        boundary.max[0] = Math.max(position[i], boundary.max[0]);
        boundary.min[1] = Math.min(position[i + 1], boundary.min[1]);
        boundary.max[1] = Math.max(position[i + 1], boundary.max[1]);
        boundary.min[2] = Math.min(position[i + 2], boundary.min[2]);
        boundary.max[2] = Math.max(position[i + 2], boundary.max[2]);
      }

      if (buildGeometry) {
        let size = vec3.create();
        vec3.subtract(size, boundary.max, boundary.min);
        boundary.geometry = utils.createBox({
          position: boundary.min,
          dimensions: size
        });
      }

      return boundary;
    },

    addTimerElement() {
      this.timerDiv = document.createElement('div');
      this.timerDiv.id = 'timer';
      this.cpuTimeElement = document.createElement('div');
      this.gpuTimeElement = document.createElement('div');
      this.timerDiv.appendChild(this.cpuTimeElement);
      this.timerDiv.appendChild(this.gpuTimeElement);
      document.body.appendChild(this.timerDiv);
    },

    updateTimerElement(cpuTime, gpuTime) {
      cpuTimeSum += cpuTime;
      gpuTimeSum += gpuTime;
      ++timeSampleCount;

      if (timeSampleCount === NUM_TIMING_SAMPLES) {
        let cpuTimeAve = cpuTimeSum / NUM_TIMING_SAMPLES;
        let gpuTimeAve = gpuTimeSum / NUM_TIMING_SAMPLES;
        this.cpuTimeElement.innerText = 'CPU time: ' + cpuTimeAve.toFixed(3) + 'ms';
        if (gpuTimeAve > 0) {
          this.gpuTimeElement.innerText = 'GPU time: ' + gpuTimeAve.toFixed(3) + 'ms';
        } else {
          this.gpuTimeElement.innerText = 'GPU time: (Unavailable)';
        }

        cpuTimeSum = 0;
        gpuTimeSum = 0;
        timeSampleCount = 0;
      }
    },

    loadBinary(url) {
      return new Promise((resolve) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function () {
          resolve(xhr.response);
        };

        xhr.send(null);
      });
    },

    loadBinaries(urls) {
      return Promise.all(urls.map((url) => this.loadBinary(url)));
    },

    // http://cdn.imgtec.com/sdk-documentation/PVR+File+Format.Specification.pdf
    parsePVR(data) {
      let header = new Uint32Array(data, 0, PVR_CONSTANTS.HEADER_LENGTH);

      let pvrFormat = header[PVR_CONSTANTS.PIXEL_FORMAT_INDEX];

      let formatEnum = PVR_CONSTANTS.FORMATS[pvrFormat];
      let sizeFunction = PVR_CONSTANTS.SIZE_FUNCTIONS[pvrFormat];

      let mipMapLevels = header[PVR_CONSTANTS.MIPMAPCOUNT_INDEX];

      let width = header[PVR_CONSTANTS.WIDTH_INDEX];
      let height = header[PVR_CONSTANTS.HEIGHT_INDEX];

      let dataOffset = PVR_CONSTANTS.HEADER_SIZE + header[PVR_CONSTANTS.METADATA_SIZE_INDEX];

      let image = new Uint8Array(data, dataOffset);

      let levels = new Array(mipMapLevels);
      let levelWidth = width;
      let levelHeight = height;
      let offset = 0;

      for (let i = 0; i < mipMapLevels; ++i) {
        let levelSize = sizeFunction(levelWidth, levelHeight);
        levels[i] = new Uint8Array(image.buffer, image.byteOffset + offset, levelSize);

        levelWidth = Math.max(1, levelWidth >> 1);
        levelHeight = Math.max(1, levelHeight >> 1);

        offset += levelSize;
      }

      return {
        data: levels,
        width: width,
        height: height,
        format: formatEnum
      };
    }
  };
})();
