import React from 'react';
import reactMixin from 'react-mixin';

import { Panel, BoxHeaderTabs, BoxContent } from 'components/common/box';
import { HeaderTabs, TabsMixin } from 'components/common/tabs';

import LessonTabContent from './lessons';
import TriggerTabContent from './triggers';
import LessonReviewTabContent from '../lesson-approval';
import IntegrationsTabContent from './integrations';
import PrioritizationTabContent from './prioritization';

@reactMixin.decorate(TabsMixin)
export class Page extends React.Component {
  getTabContentMap() {
    const tabs = {
      Prioritization: <PrioritizationTabContent currentUser={this.props.currentUser} />,
      Integrations: <IntegrationsTabContent currentUser={this.props.currentUser} />
      // Lessons: <LessonTabContent currentUser={this.props.currentUser} />,
      // Triggers: <TriggerTabContent currentUser={this.props.currentUser} />,
      // Review: <LessonReviewTabContent currentUser={this.props.currentUser} />,
    };
    return tabs;
  }

  render() {
    return (
      <Panel>
        <BoxHeaderTabs heading="" containerStyle={{ minHeight: '4.6em' }}>
          <HeaderTabs {...this.getTabsProps()} containerStyle={{ marginLeft: 20 }} />
        </BoxHeaderTabs>
        {this.getTabContent()}
      </Panel>
    );
  }
}
