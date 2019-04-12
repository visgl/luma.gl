import React, {PureComponent, PropTypes} from 'react';
import marked from 'marked';
import {markdownFiles} from '../utils/page-path-utils';

/**
 * This map allows you to rewrite urls present in the markdown files
 * to be rewritted to point to other targets. It is useful so that
 * links can works both by browsing the docs using the Github explorer
 * and on the website.
 *
 * If you specify a value of false, it will transform the link to a simple
 * text, in case you don't want this link to point to anything.
 */

const urlRewrites = [
  {
    /*
     * Look for urls in the form of
     * `/docs/path/to/file.md#header`
     * and convert to
     * `#/documentation/path/to/page?section=header`
     */
    test: /^\/(docs\/.+?\.md)(#.*)?$/,
    rewrite: match => {
      const filepath = match[1];
      const hash = match[2] ? match[2].slice(1) : '';
      const route = markdownFiles[filepath];
      if (!route) {
        console.warn('Cannot find linked doc: ', filepath);
      }
      return `#/documentation${route}${hash ? '?section=' : ''}${hash}`;
    }
  }
];

/**
 * Same as above, but for image src's
 */
const imageRewrites = {};

export default class MarkdownPage extends PureComponent {

  render() {
    const {content} = this.props;

    if (!content) {
      return null;
    }

    marked.setOptions({
      highlight(code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    });

    const renderer = new marked.Renderer();

    renderer.link = (href, title, text) => {
      let to = href;

      urlRewrites.forEach(rule => {
        if (to && rule.test.test(to)) {
          to = rule.rewrite(to.match(rule.test));
        }
      });

      return to ? `<a href=${to}>${text}</a>` :
        `<span>${text}</span>`;
    };

    renderer.image = (href, title, text) => {
      const src = imageRewrites[href] || href;
      return `<img src=${src} title=${title} alt=${text} />`;
    };

    // Since some images are embedded as html, it won't be processed by
    // the renderer image override. So hard replace it globally.
    const __html = marked(content, {renderer})
      .replace(/\/demo\/src\/static\/images/g, 'images');

    /* eslint-disable react/no-danger */
    return (
      <div className="markdown">
        <div className="markdown-body" dangerouslySetInnerHTML={{__html}} />
      </div>
    );
    /* eslint-enable react/no-danger */

  }
}

MarkdownPage.propTypes = {
  content: PropTypes.string
};
