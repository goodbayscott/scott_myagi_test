import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { GroupSizeSwitch, Activity } from './common';

const styles = {};

export default class JoinCompanyActivity extends React.Component {
  renderOne = act => (
    <Activity
      {...this.props}
      activity={act}
      activityTxt={t('joined_company', {
        company: act
          .get('object')
          .get('company')
          .get('company_name')
      })}
    />
  );
  render() {
    return <GroupSizeSwitch activityGroup={this.props.activityGroup} renderOne={this.renderOne} />;
  }
}
