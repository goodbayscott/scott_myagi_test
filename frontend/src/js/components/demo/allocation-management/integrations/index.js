import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import { Panel } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { CardCollection } from 'components/common/cards';
import { Card } from 'components/common/cards';
import { TickCircle } from 'components/common/tick-circle';

const ENROLLMENT = 'Enrollment';
const PRIORITIZATION = 'Prioritization';
const USER_MANAGEMENT = 'User Management';
const ASSESSMENT = 'Assessment';

export const HR_INTEGRATION = {
  name: 'HR Information System',
  roles: [ENROLLMENT, USER_MANAGEMENT],
  status: 'Last sync 43 minutes ago'
};

export const PIM_INTEGRATION = {
  name: 'Product Information System',
  roles: [ENROLLMENT, PRIORITIZATION],
  status: 'Last sync 109 minutes ago'
};

export const FEEDBACK_DB = {
  name: 'Feedback Database',
  roles: [PRIORITIZATION, ASSESSMENT],
  status: 'Last sync 12 minutes ago'
};

export const STORE_ANALYTICS = {
  name: 'In-Store Analytics',
  roles: [PRIORITIZATION, ASSESSMENT],
  status: 'Last sync 32 minutes ago'
};

export const WEB_ANALYTICS = {
  name: 'Google Analytics',
  roles: [PRIORITIZATION],
  status: 'Last sync 127 minutes ago'
};

const styles = {
  pageContainer: {
    marginBottom: 40,
    backgroundColor: Style.vars.colors.get('xLightGrey'),
    padding: 100,
    minHeight: 'calc(100vh - 80px)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    display: 'flex'
  },
  pageHeading: {
    textAlign: 'center',
    marginBottom: 10
  },
  cardsContainer: {
    marginTop: 0
  },
  card: {
    width: 320,
    padding: 20,
    ...Style.common.cardBorder
  },
  cardHeading: {
    fontWeight: 'normal',
    marginTop: 10,
    marginBottom: 10
  },
  rolesContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexDirection: 'center'
  },
  role: {
    padding: 10,
    color: 'white',
    marginRight: 10,
    borderRadius: 3
  },
  statusContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 25,
    color: Style.vars.colors.get('fadedGreen')
  },
  tickContainer: {
    height: 60,
    width: 60,
    borderRadius: 30,
    border: `1px solid ${Style.vars.colors.get('fadedGreen')}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tick: {
    fontSize: 18,
    marginRight: 0
  },
  status: {
    marginLeft: 20,
    maxWidth: 100,
    textAlign: 'center'
  },
  [ENROLLMENT]: {
    backgroundColor: Style.vars.colors.get('fadedRed')
  },
  [PRIORITIZATION]: {
    backgroundColor: Style.vars.colors.get('skyBlue')
  },
  [USER_MANAGEMENT]: {
    backgroundColor: Style.vars.colors.get('fadedYellow')
  },
  [ASSESSMENT]: {
    backgroundColor: Style.vars.colors.get('blue')
  }
};

export class IntegrationCards {
  render() {
    return (
      <CardCollection
        entities={this.props.integrations}
        createCard={i => (
          <Card style={styles.card} onClick={() => {}}>
            <h3 style={styles.cardHeading}>{i.get('name')}</h3>
            <div style={styles.statusContainer}>
              <div style={styles.tickContainer}>
                <i className="ui checkmark icon" style={styles.tick} />
              </div>
              <p style={styles.status}>{i.get('status')}</p>
            </div>
            <div style={styles.rolesContainer}>
              {i
                .get('roles')
                .map(r => <div style={Style.funcs.merge(styles.role, styles[r])}>{r}</div>)}
            </div>
          </Card>
        )}
      />
    );
  }
}

class Page extends React.Component {
  render() {
    return (
      <Panel innerStyle={styles.pageContainer}>
        <LoadingContainer
          loadingProps={[this.props.integrations]}
          createComponent={() => (
            <div style={styles.cardsContainer}>
              <IntegrationCards integrations={this.props.integrations} />
            </div>
          )}
        />
      </Panel>
    );
  }
}

export default Marty.createContainer(Page, {
  fetch: {
    integrations() {
      return Im.fromJS([
        HR_INTEGRATION,
        PIM_INTEGRATION,
        FEEDBACK_DB,
        STORE_ANALYTICS,
        WEB_ANALYTICS
      ]);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
