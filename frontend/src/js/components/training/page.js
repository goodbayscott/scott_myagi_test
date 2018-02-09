import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';

import Style from 'style';
import { ANALYTICS_EVENTS } from 'core/constants';
import ModuleTrainingPlansState from 'state/module-training-plans';

import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers.js';
import { qs } from 'utilities/http';
import { getIdFromApiUrl } from 'utilities/generic';
import { BoxHeaderTabs } from 'components/common/box';
import { TabsMixin, Tabs, HeaderTabs } from 'components/common/tabs';
import CoverPhoto from 'components/common/cover-photo';

import { StatsBox } from './stats-box';

import { Page as TrainingPlansTabContent } from './plans/page';
import { TodayTabContent } from './today';
import { Page as ChannelsTabContent } from './channels/channels-tab';

const pageStyle = {
  headingContainer: {
    overflow: 'visible',
    border: 'none'
  },
  plansBoxContainer: {
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  plansBox: {
    width: '100%',
    maxWidth: `${Style.vars.widths.get('mainContentMaxWidth')}px !important`,
    padding: '0 20px',
    minHeight: 500
  }
};

@Radium
@reactMixin.decorate(TabsMixin)
export class TrainingPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    this.trackViewedTab(this.getInitialActiveTab());
  }

  getTabContentMap() {
    const tabs = {
      Channels: <ChannelsTabContent {...this.props} />,
      Plans: <TrainingPlansTabContent {...this.props} />,
      Today: <TodayTabContent {...this.props} />
    };
    if (this.props.currentUser.get('learner').tmp_new_home_page_enabled) delete tabs.Today;
    return tabs;
  }

  trackViewedTab = tab => {
    analytics.track(ANALYTICS_EVENTS.VIEWED_TRAINING_TAB, {
      Tab: tab
    });
  };

  onTabSelect = tab => {
    this.onTabChange.bind(this)(tab);
    this.trackViewedTab(tab);
  };

  render() {
    if (!this.props.currentUser) return <div />;
    const isUsingNewHome = this.props.currentUser.get('learner').tmp_new_home_page_enabled;
    return (
      <div>
        {!isUsingNewHome && <CoverPhoto user={this.props.currentUser} edit />}
        {!isUsingNewHome && <StatsBox currentUser={this.props.currentUser} />}
        <div style={pageStyle.plansBoxContainer}>
          <div style={pageStyle.plansBox}>
            <BoxHeaderTabs style={pageStyle.headingContainer}>
              <HeaderTabs {...this.getTabsProps({ onChange: this.onTabSelect })} />
            </BoxHeaderTabs>
            {this.getTabContent({ renderWhenActive: true })}
          </div>
        </div>
      </div>
    );
  }
}

export const Page = Marty.createContainer(TrainingPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  },

  componentWillMount() {
    // Some emails are still using old urls, need to make sure they are being
    // redirected to their plans. Can remove this once all the emails are updated.
    const planId = qs('plans');
    if (planId) {
      try {
        ModuleTrainingPlansState.Store.getItems({
          ordering: 'order,module__name',
          training_plan: planId,
          module_is_attemptable: true,
          module__deactivated__isnull: true,
          limit: 0,
          fields: ['order', 'module', 'module__url', 'module__name']
        })
          .toPromise()
          .then(mods => {
            if (mods.size) {
              const modUrl = mods.get(0).get('module');
              const modId = getIdFromApiUrl(modUrl);
              this.context.router.push(resolve('new-module-attempt', {
                moduleId: modId,
                trainingPlanId: planId
              }));
            }
          });
      } catch (err) {
        // Fail silently
      }
    } else if (this.context.currentUser && !this.context.currentUser.get('learner').company) {
      // redirect to join or create company if user has no company
      this.context.router.push(resolve('join-or-create-company'));
    }
  },

  fetch: {},

  pending() {
    return containerUtils.defaultPending(this, TrainingPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPage, errors);
  }
});
