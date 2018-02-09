import React from 'react';
import Marty from 'marty';
import moment from 'moment-timezone';

import PublicReportsState from 'state/public-reports';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer, NoData } from 'components/common/loading';

import { CardCollection, Card } from 'components/common/cards';
import { DropdownSelect } from 'components/common/form/select';
import { SecondaryButton } from 'components/common/buttons';
import { Report } from './reports-tab/report';

const styles = {
  pageContainer: {
    backgroundColor: Style.vars.colors.get('lightGrey'),
    padding: 40,
    paddingTop: 5
  },
  topBar: {
    position: 'relative',
    height: 60,
    backgroundColor: Style.vars.colors.get('navBackground'),
    borderRadius: 0,
    marginBottom: 0,
    width: '100%'
  },
  topTitle: {
    fontSize: 24,
    marginTop: 18,
    marginLeft: 20,
    color: 'white'
  }
};

class SharedReport extends React.Component {
  static data = {
    reports: {
      required: false,
      fields: ['name', $y.getFields(Report, 'report')]
    }
  };

  render() {
    return (
      <div>
        <LoadingContainer
          spinnerProps={{
            containerStyle: { backgroundColor: Style.vars.colors.get('accountsBackground') }
          }}
          loadingProps={[this.props.reports]}
          createComponent={() => {
            const rep = this.props.reports.first();
            if (!rep) return <NoData>This report does not exist.</NoData>;
            return (
              <div>
                <div
                  className="ui top menu"
                  style={styles.topBar}
                  onClick={this.props.hideInboxSidebar}
                >
                  <div style={styles.topTitle}>{rep.get('name')}</div>
                </div>
                <div style={styles.pageContainer}>
                  <Report report={rep} />
                </div>
              </div>
            );
          }}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(SharedReport, {
  listenTo: [PublicReportsState.Store],

  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  fetch: {
    reports() {
      const token = this.context.routeParams.token;
      if (!token) return null;
      return PublicReportsState.Store.getItems({
        fields: $y.getFields(SharedReport, 'reports'),
        share_token: token,
        ordering: '-id',
        limit: 1
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, SharedReport);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, SharedReport, errors);
  }
});
