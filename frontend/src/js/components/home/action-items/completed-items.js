import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import ActionItemsState from 'state/action-items';

import { styles as commonStyles } from '../common';
import { LoadingContainer, NoData } from 'components/common/loading';

import { Modal } from 'components/common/modal/index';
import ItemList from './item-list';

const styles = {
  container: {
    ...commonStyles.sidePanel
  }
};

@Radium
class CompletedItems extends React.Component {
  show() {
    this.modal.show();
  }
  render() {
    return (
      <Modal ref={el => (this.modal = el)} header={t('completed_action_items')}>
        <LoadingContainer
          loadingProps={[this.props.items]}
          createComponent={() => <ItemList items={this.props.items} />}
          createNoDataComponent={standardStyling => (
            <NoData style={{ ...standardStyling, ...styles.noData }}>{t('no_action_items')}</NoData>
          )}
        />
      </Modal>
    );
  }
}

export default Marty.createContainer(CompletedItems, {
  listenTo: [ActionItemsState.Store],

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  show() {
    this.refs.innerComponent.show();
  },

  fetch: {
    items() {
      return ActionItemsState.Store.getItems({
        completed__isnull: false,
        deactivated__isnull: true,
        ordering: '-id',
        limit: 20
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CompletedItems);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompletedItems, errors);
  }
});
