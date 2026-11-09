// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  WGSL_BINDABLE_VARIABLE_PATTERN,
  MODULE_WGSL_BINDING_DECLARATION_REGEXES,
  WGSL_BINDING_DECLARATION_REGEXES,
  WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES,
  type WGSLBindingDeclarationMatch,
  maskWGSLComments,
  getWGSLBindingDeclarationMatches,
  replaceWGSLBindingDeclarationMatches,
  hasWGSLAutoBinding,
  getFirstWGSLAutoBindingDeclarationMatch
} from '@luma.gl/shaders/wgsl';
