import React from 'react';

import Style from 'style';

import { LoadingSpinner } from 'components/common/loading';

const styles = {
  submitBtn: {
    ...Style.funcs.makeTransform('translateX(calc(-100% - 5px))'),
    ...Style.funcs.makeTransitionAll(),
    marginTop: 10,
    color: Style.vars.colors.get('xDarkGrey'),
    cursor: 'pointer'
  },
  submitBtnValid: {
    color: Style.vars.colors.get('textBlack')
  },
  spinnerContainer: {
    height: 'initial'
  },
  spinner: {
    width: 20,
    height: 20
  }
};

export function SendButton(props) {
  return (
    <div
      style={Style.funcs.mergeIf(props.valid, styles.submitBtn, styles.submitBtnValid)}
      onClick={props.onClick}
    >
      {!props.loading ? (
        <i className="ui icon send outline" />
      ) : (
        <LoadingSpinner containerStyle={styles.spinnerContainer} spinnerStyle={styles.spinner} />
      )}
    </div>
  );
}
