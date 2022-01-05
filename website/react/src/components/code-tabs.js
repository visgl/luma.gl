import React, {Children, cloneElement} from 'react';
import create from 'zustand';
import Tabs, {Tab} from './tabs';
import Code from './code';

const CODE_LANGS = {
  // FRONT END
  js: {
    title: 'JavaScript',
    lang: 'typescript'
  },
  jupyter: {
    title: 'Python (Jupyter)',
    lang: 'python'
  },
  // BACK END
  python: {
    title: 'Python',
    lang: 'python'
  },
  http: {
    title: 'HTTP',
    lang: 'http'
  },
  cli: {
    title: 'CLI',
    lang: 'bash'
  }
};

const useStore = create(set => ({
  selectedLang: undefined,
  setSelectedLang: selectedLang => set(state => ({selectedLang}))
}));

export const CodeTabs = props => {
  const selectedLang = useStore(state => state.selectedLang);
  const setSelectedLang = useStore(state => state.setSelectedLang);
  const {children} = props;
  return (
    <Tabs selectedItem={selectedLang} setSelectedItem={setSelectedLang}>
      {Children.map(children, tab => {
        const {lang} = tab.props;
        const spec = CODE_LANGS[lang];
        return cloneElement(tab, {
          title: spec?.title || lang,
          lang: spec?.lang || lang
        });
      })}
    </Tabs>
  );
};

export const CodeTab = props => {
  const {lang, title, code, notYetSupported} = props;
  return (
    <Tab title={title}>
      <Code lang={lang} code={!notYetSupported ? code : 'Not yet supported. Coming soon.'} />
    </Tab>
  );
};

export default CodeTabs;
