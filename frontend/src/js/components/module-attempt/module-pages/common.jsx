import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Style from 'style';
import { t } from 'i18n';
import cx from 'classnames';
import Radium from 'radium';

import ModuleAttemptPageState from '../state';

export const styles = {
  nextBtn: {
    marginTop: '10px',
    marginLeft: 0,
    width: 150,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    [Style.vars.media.get('mobile')]: {
      width: '100%'
    }
  }
};

@Radium
export class NextPageButton extends React.Component {
  static propTypes = {
    module: React.PropTypes.instanceOf(Im.Map).isRequired,
    page: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  };

  next = () => {
    if (this.clicked) return;
    this.clicked = true;
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    this.props.goToNextPage();
  };

  _isLastPage() {
    const last = _.last(this.props.module.get('pages'));
    return last.id === this.props.page.get('id');
  }

  render() {
    const { page } = this.props;
    let nextBtnText;
    if (this._isLastPage()) {
      nextBtnText = t('finish');
    } else {
      nextBtnText = t('next');
    }
    const btnClass = cx(
      'ui',
      'right',
      'floated',
      { disabled: this.props.disabled },
      'button',
      'next-btn'
    );
    return (
      <button className={btnClass} style={styles.nextBtn} onClick={this.next}>
        {nextBtnText}
      </button>
    );
  }
}
