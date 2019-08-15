import GL from '@luma.gl/constants';
import {getPassthroughFS} from '@luma.gl/shadertools';
import BufferTransform from './buffer-transform';
import TextureTransform from './texture-transform';

import {
  isWebGL2,
  getShaderVersion
} from '@luma.gl/webgl';
import {assert, isObjectEmpty} from '../../utils';
import Model from '../model';


// takes source and target buffers/textures and setsup the pipeline
export default class Transform {

  static isSupported(gl) {
    // TODO : differentiate writting to buffer vs not.
    return isWebGL2(gl);
  }
  constructor(gl, props = {}) {

    this.gl = gl;
    this.model = null;
    this.elementCount = 0;
    this.resourceTransforms = [];
    this.elementIDBuffer = null;
    this.initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  delete() {
    this.model.delete();
    for (const resourceTransform of this.resourceTransforms) {
      resourceTransform.delete();
    }
  }

  // Run one transform loop.
  run(opts = {}) {
    const {clearRenderTarget = true} = opts;

    const updatedOpts = this.updateDrawOptions(opts);

    if (clearRenderTarget && updatedOpts.framebuffer) {
      updatedOpts.framebuffer.clear({color: true});
    }

    this.model.transform(updatedOpts);
  }

  // swap resources if a map is provided
  swap() {
    let swapped = false;
    for (const resourceTransform of this.resourceTransforms) {
      swapped = swapped || resourceTransform.swap();
    }
    assert(swapped, 'Nothing to swap');
  }

  // Return Buffer object for given varying name.
  getBuffer(varyingName = null) {
    for (const resourceTransform of this.resourceTransforms) {
      const buffer  = resourceTransform.getBuffer && resourceTransform.getBuffer(varyingName);
      if (buffer) {
        return buffer;
      }
    }
    return null;
  }

  // Return data either from Buffer or from Texture
  getData(opts = {}) {
    for (const resourceTransform of this.resourceTransforms) {
      const data  = resourceTransform.getData(opts);
      if (data) {
        return data;
      }
    }
    return null;
  }

  // Return framebuffer object if rendering to textures
  getFramebuffer() {
    for (const resourceTransform of this.resourceTransforms) {
      const fb  = resourceTransform.getFramebuffer();
      if (fb) {
        return fb;
      }
    }
    return null;
  }

  // Update some or all buffer/texture bindings.
  update(opts = {}) {
    if (opts.elementCount) {
      this.model.setVertexCount(opts.elementCount);
    }
    for (const resourceTransform of this.resourceTransforms) {
      resourceTransform.update(opts);
    }
  }


  // Private

  initialize(props = {}) {
    const {gl} = this;
    this.resourceTransforms = this.buildResourceTransforms(gl, props);
    assert(this.resourceTransforms.length > 0, 'must provide source/feedback buffers or source/target textures');

    props = this.getModelProps(props);
    this.model = new Model(gl,
      Object.assign({}, props, {
        fs: props.fs || getPassthroughFS({version: getShaderVersion(props.vs)}),
        id: props.id || 'transform-model',
        drawMode: props.drawMode || GL.POINTS,
        vertexCount: props.elementCount
      })
    );

    for (const resourceTransform of this.resourceTransforms) {
      resourceTransform.setupResources({model: this.model});
    }
  }

  getModelProps(props) {
    let updatedProps = Object.assign({}, props);
    for (const resourceTransform of this.resourceTransforms) {
      updatedProps = resourceTransform.getModelProps(updatedProps);
    }
    return updatedProps;
  }

  buildResourceTransforms(gl, props) {
    const transforms = [];
    if (this.canCreateBufferTransform(props)) {
      transforms.push(new BufferTransform(gl, props));
    }
    if (this.canCreateTextureTransform(props)) {
      transforms.push(new TextureTransform(gl, props));
    }
    return transforms;
  }

  canCreateBufferTransform(props) {
    if (!isObjectEmpty(props.sourceBuffers)) {
      return true;
    }
    if (!isObjectEmpty(props.feedbackBuffers)) {
      return true;
    }
    return false;
  }

  canCreateTextureTransform(props) {
    if (!isObjectEmpty(props._sourceTextures)) {
      return true;
    }
    if (props._targetTexture) {
      return true;
    }

    return false;
  }

  updateDrawOptions(opts) {

    let updatedOpts = Object.assign({}, opts);
    for (const resourceTransform of this.resourceTransforms) {
      updatedOpts  = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
    }

    return updatedOpts;
  }


}
