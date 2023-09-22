// import test from 'tape-promise/tape';
import {checkType} from '@luma.gl/test-utils';

import {dirlightMaterial, ShaderModule} from '@luma.gl/shadertools';

checkType<ShaderModule>(dirlightMaterial);
