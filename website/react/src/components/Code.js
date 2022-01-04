/* global window, global */
import React from 'react';
import Highlight, {defaultProps} from 'prism-react-renderer';
// import theme from 'prism-react-renderer/themes/duotoneLight';
import theme from './prism-themes/github';
import './code.css';

import './code.css';

// Install additional languages
import Prism from 'prism-react-renderer/prism';
(typeof global !== 'undefined' ? global : window).Prism = Prism;
require('prismjs/components/prism-http');

export default function Code({code, lang}) {
  return (
    <Highlight {...defaultProps} code={code} language={lang} theme={theme}>
      {({className, style, tokens, getLineProps, getTokenProps}) => (
        <div className="gatsby-highlight" data-language={lang}>
          <pre className={className} style={style}>
            {tokens.map((line, i) => (
              <div {...getLineProps({line, key: i})}>
                {line.map((token, key) => (
                  <span {...getTokenProps({token, key})} />
                ))}
              </div>
            ))}
          </pre>
        </div>
      )}
    </Highlight>
  );
}
