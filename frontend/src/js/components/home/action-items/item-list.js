import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { styles as commonStyles } from '../common';

import NextPlanItem from './types/next-plan';
import LatestPlanItem from './types/latest-plan';
import NewPostItem from './types/new-post';
import NewCommentsItem from './types/new-comments';

const TYPES_TO_COMPONENTS = {
  nextplanitem: NextPlanItem,
  latestplanitem: LatestPlanItem,
  newpostitem: NewPostItem,
  newcommentsitem: NewCommentsItem
};

const styles = {};

@Radium
export default class ItemList extends React.Component {
  render() {
    return (
      <div>
        {this.props.items.map(i => {
          const Component = TYPES_TO_COMPONENTS[i.get('type')];
          if (!Component) {
            throw new Error('Could not find component for action item type');
          }
          return <Component key={i.get('id')} item={i} />;
        })}
      </div>
    );
  }
}
