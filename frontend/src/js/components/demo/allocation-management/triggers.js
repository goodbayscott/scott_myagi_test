import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import TeamsState from 'state/teams';

import { Box, BoxContent } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import TriggerCards from './trigger-cards';

import fakeTriggerData from './fake-trigger-data';

const DEMO_PRODUCT = 'DEMO_PRODUCT';
const DEMO_BRAND = 'DEMO_BRAND';

const styles = {
  pageContainer: {
    marginBottom: 40
  },
  pageHeading: {
    textAlign: 'center',
    marginBottom: 10
  },
  cardsContainer: {
    marginTop: 0
  }
};

class Page extends React.Component {
  static data = {
    triggers: $y.getData(TriggerCards, 'triggers', { required: false })
  };

  constructor(props) {
    super();
    this.state = {
      triggers: this.getTriggersForProps(props)
    };
  }
  componentWillReceiveProps(newProps) {
    this.setState({ triggers: this.getTriggersForProps(newProps) });
  }

  getTriggersForProps(props) {
    if (!props.teams) return null;
    const co = props.currentUser.get('learner').company;
    let triggerData = JSON.stringify(fakeTriggerData);
    props.teams.forEach((t, i) => (triggerData = triggerData.replace(new RegExp(`Team ${i + 1}`, 'g'), t.get('name'))));
    triggerData = triggerData.replace(new RegExp(DEMO_PRODUCT, 'g'), co.demo_product_name);
    triggerData = triggerData.replace(new RegExp(DEMO_BRAND, 'g'), co.demo_brand_name);
    return Im.fromJS(JSON.parse(triggerData));
  }

  renderContent = () => (
    <div style={styles.cardsContainer}>
      <TriggerCards triggers={this.state.triggers} />
    </div>
  );

  render() {
    return (
      <Box>
        <BoxContent style={styles.pageContainer}>
          <LoadingContainer
            loadingProps={[this.props.teams]}
            createComponent={this.renderContent}
          />
        </BoxContent>
      </Box>
    );
  }
}

export default Marty.createContainer(Page, {
  listenTo: [TeamsState.Store],

  fetch: {
    teams() {
      return TeamsState.Store.getItems({
        limit: 10,
        ordering: 'id',
        fields: ['name']
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
