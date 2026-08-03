import React, {Children, useState} from 'react';
import clsx from 'clsx';
import styles from './tabs.module.css';

export const Tabs = props => {
  const {children} = props;
  const tabs = Children.toArray(children);
  const [selectedItem, setSelectedItem] = useState(tabs[0]?.props.tag || tabs[0]?.props.title);
  let selected = props.selectedItem !== undefined ? props.selectedItem : selectedItem;
  const setSelected = props.setSelectedItem !== undefined ? props.setSelectedItem : setSelectedItem;
  // check if the selected tab even exists in the list
  if (!tabs.some(e => (e.props.tag || e.props.title) === selected)) {
    selected = selectedItem;
  }
  return (
    <>
      <div className={styles.header}>
        {tabs.map(tab => (
          <div
            className={clsx(styles.headerItem, {
              [styles.disabled]: tab.props.disabled,
              [styles.selected]: (tab.props.tag || tab.props.title) === selected
            })}
            key={tab.props.tag || tab.props.title}
            data-luma-device-tab={tab.props.tag || tab.props.title}
            data-luma-device-tab-selected={
              (tab.props.tag || tab.props.title) === selected ? 'true' : undefined
            }
            aria-disabled={tab.props.disabled || undefined}
            onClick={() => {
              if (!tab.props.disabled) {
                setSelected(tab.props.tag || tab.props.title);
              }
            }}
          >
            {tab.props.label || tab.props.title}
            {tab.props.unavailableBadge ? (
              <span
                style={{
                  position: 'absolute',
                  left: 5,
                  bottom: 2,
                  padding: '1px 4px',
                  borderRadius: 4,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: 9,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: 0
                }}
              >
                {tab.props.unavailableBadge}
              </span>
            ) : null}
            {tab.props.badge ? (
              <span
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 2,
                  padding: '1px 4px',
                  borderRadius: 4,
                  background: '#eef4ff',
                  color: '#276ef1',
                  fontSize: 9,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: 0
                }}
              >
                {tab.props.badge}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className={styles.body}>
        {tabs.find(tab => (tab.props.tag || tab.props.title) === selected)}
      </div>
    </>
  );
};

export const Tab = props => {
  const {children} = props;
  return <>{children}</>;
};
