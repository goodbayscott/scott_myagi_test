import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';
import ReactStyleTransitionGroup from 'react-style-transition-group';
import Radium from 'radium';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { momentToISO } from 'utilities/time';

import Style from 'style';

import ModulesState from 'state/modules';

import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { ModuleCard } from './module-card';

const styles = {};

@Radium
class Page extends React.Component {
  static data = {
    modules: {
      fields: [$y.getFields(ModuleCard, 'module')]
    }
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  renderModule = mod => <ModuleCard module={mod} currentUser={this.context.currentUser} />;

  renderContent = () => {
    const mods = this.props.modules;
    return (
      <div className="ui cards" style={{ justifyContent: 'center' }}>
        {mods.map(this.renderModule).toArray()}
      </div>
    );
  };

  render() {
    return (
      <Panel>
        {/* <BoxHeader heading="Lesson Review" /> */}
        <BoxContent style={styles.container}>
          <LoadingContainer
            loadingProps={[this.props.modules]}
            createComponent={this.renderContent}
            noDataText="There are no lessons currently awaiting review"
          />
        </BoxContent>
      </Panel>
    );
  }
}

export default Marty.createContainer(Page, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [ModulesState.Store],
  fetch: {
    modules() {
      // Set this once, or else it will continually update
      if (!this.hourAgo) this.hourAgo = momentToISO(moment().subtract(1, 'hour'));
      return ModulesState.Store.getItems({
        limit: 10,
        created__gt: this.hourAgo,
        created_by__learner__company: this.context.currentUser.get('learner').company.id,
        ordering: '-id',
        fields: $y.getFields(Page, 'modules')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
