// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RotatingCube} from './rotating-cube';
import {HelloReactUI, type HelloReactUIProps} from './app-ui';

type AppProps = Omit<HelloReactUIProps, 'cube'>;

/**
 * Main app component
 */
export default function App(props: AppProps) {
  return <HelloReactUI {...props} cube={<RotatingCube />} />;
}
