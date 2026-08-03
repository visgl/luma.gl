import React, {Children, useState} from 'react';
import clsx from 'clsx';
import {getNextKeyboardTab} from './tab-navigation';
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

  const handleKeyboardNavigation = event => {
    const nextTab = getNextKeyboardTab(event.currentTarget, event.key);
    if (!nextTab) {
      return;
    }
    nextTab.focus();
    nextTab.click();
    event.preventDefault();
  };

  return (
    <>
      <div className={styles.header} role="tablist" aria-label={props.label || 'Example views'}>
        {tabs.map(tab => {
          const tabIdentifier = tab.props.tag || tab.props.title;
          const isSelected = tabIdentifier === selected;

          return (
            <button
              type="button"
              role="tab"
              className={clsx(styles.headerItem, {
                [styles.disabled]: tab.props.disabled,
                [styles.selected]: isSelected
              })}
              key={tabIdentifier}
              data-luma-device-tab={tabIdentifier}
              data-luma-device-tab-selected={isSelected ? 'true' : undefined}
              aria-selected={isSelected}
              aria-disabled={tab.props.disabled || undefined}
              disabled={tab.props.disabled}
              onClick={() => {
                if (!tab.props.disabled) {
                  setSelected(tabIdentifier);
                }
              }}
              onKeyDown={handleKeyboardNavigation}
            >
              <span className={styles.backendIndicator} aria-hidden="true" />
              <span className={styles.label}>{tab.props.label || tab.props.title}</span>
              {tab.props.unavailableBadge ? (
                <span className={clsx(styles.badge, styles.unavailableBadge)}>
                  {tab.props.unavailableBadge}
                </span>
              ) : null}
              {tab.props.badge ? <span className={styles.badge}>{tab.props.badge}</span> : null}
            </button>
          );
        })}
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
