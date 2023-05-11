import type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';

function cast<T>(value: unknown): T {
  return value as T;
}

type CopyBufferToBufferCommand = {
  name: 'copy-buffer-to-buffer';
  options: CopyBufferToBufferOptions;
};

type CopyBufferToTextureCommand = {
  name: 'copy-buffer-to-texture';
  options: CopyBufferToTextureOptions;
};

type CopyTextureToBufferCommand = {
  name: 'copy-texture-to-buffer';
  options: CopyTextureToBufferOptions;
};

type CopyTextureToTextureCommand = {
  name: 'copy-texture-to-texture';
  options: CopyTextureToTextureOptions;
};

type Command =
  | CopyBufferToBufferCommand
  | CopyBufferToTextureCommand
  | CopyTextureToBufferCommand
  | CopyTextureToTextureCommand;

export class CommandBuffer {
  commands: Command[] = [];
}

export function submitCommands(device: WebGLDevice, commands: Command[] = []) {
  for (const command of commands) {
    switch (command.name) {
      case 'copy-buffer-to-buffer':
        _copyBufferToBuffer(device, command.options);
        break;
      case 'copy-buffer-to-texture':
        _copyBufferToTexture(device, command.options);
        break;
      case 'copy-texture-to-buffer':
        _copyTextureToBuffer(device, command.options);
        break;
      case 'copy-texture-to-texture':
        _copyTextureToTexture(device, command.options);
        break;
    }
  }
}

function _copyBufferToBuffer(device: WebGLDevice, options: CopyBufferToBufferOptions): void {
  const source = cast<WEBGLBuffer>(options.source);
  const destination = cast<WEBGLBuffer>(options.destination);

  const {gl2} = device;
  if (gl2) {
    // In WebGL2 we can perform the copy on the GPU
    // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
    gl2.bindBuffer(GL.COPY_READ_BUFFER, source.handle);
    gl2.bindBuffer(GL.COPY_WRITE_BUFFER, destination.handle);
    gl2.copyBufferSubData(
      GL.COPY_READ_BUFFER,
      GL.COPY_WRITE_BUFFER,
      options.sourceOffset ?? 0,
      options.destinationOffset ?? 0,
      options.size
    );
    gl2.bindBuffer(GL.COPY_READ_BUFFER, null);
    gl2.bindBuffer(GL.COPY_WRITE_BUFFER, null);
  } else {
    // TODO - in WebGL1 we would have to read back to CPU
    // read / write buffer from / to CPU
    throw new Error('copyBufferToBuffer not implemented in WebGL1');
  }
}

function _copyBufferToTexture(device: WebGLDevice, options: CopyBufferToTextureOptions): void {}

function _copyTextureToBuffer(device: WebGLDevice, options: CopyTextureToBufferOptions): void {}

function _copyTextureToTexture(device: WebGLDevice, options: CopyTextureToTextureOptions): void {}
