import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import moment from 'moment-timezone';

import Style from 'style';

import SubscriptionsState from 'state/subscriptions';
import CompaniesState from 'state/companies';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer } from 'components/common/loading';

import { DatetimeInput, SlideToggle, ButtonToggle } from 'components/common/form';
import Select from 'react-select';

const BRAND = 'brand';
const RETAILER = 'retailer';
const CONTENT_SELLER = 'content_seller'

const pageStyle = {
  table: {
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  dateInput: {
    width: 175,
    marginBottom: 15
  },
  editIcon: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    display: 'inline',
    fontSize: '18px',
    marginLeft: '0.5em',
    verticalAlign: 'text-bottom'
  },
  cell: {
    border: '1px solid black'
  },
  newPlanButton: {
    marginBottom: 20,
    borderRadius: '3px 3px 3px 3px',
    backgroundColor: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    padding: '10px',
    width: 200,
    border: 'none',
    height: '2.5em',
    float: 'right'
  },
  addBonusPointsBtn: {
    marginBottom: 20,
    borderRadius: '3px 3px 3px 3px',
    backgroundColor: Style.vars.colors.get('blue'),
    color: Style.vars.colors.get('white'),
    padding: '10px',
    width: 200,
    border: 'none',
    height: '2.5em'
  },
  container: {
    marginBottom: 100
  },
  stat: {
    fontWeight: 'bold'
  },
  slideToggle: {
    verticalAlign: 'bottom',
    marginLeft: 10
  },
  toggleContainer: {
    display: 'block',
    marginBottom: 10
  }
};

class SubscriptionsManagementPageContent extends React.Component {
  static data = {
    company: {
      required: true,
      fields: ['num_external_teams_connected_to_content', 'company_type', 'id']
    },
    subscription: {
      required: false,
      fields: [
        'id',
        'url',
        'paused',
        'pause_on_date',
        'groups_and_areas_enabled',
        'analytics_enabled',
        'shared_content_enabled',
        'company.company_name',
        'company.id'
      ]
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    const subscription = props.company.get('subscription');
    this.state = {
      renderKey: 0,
      pause_on_date: subscription.pause_on_date,
      companyType: props.company.get('company_type'),
    };
  }

  onPauseOnDateChange = (field, val) => {
    let newVal;
    if (moment.isMoment(val)) {
      newVal = val.toJSON();
    } else {
      newVal = null;
    }
    this.setState({ [field]: newVal });
    SubscriptionsState.ActionCreators.update(this.props.company.get('subscription').id, {
      [field]: newVal
    }).then(() => {
      this.context.displayTempPositiveMessage({
        heading: 'Pause date updated'
      });
    });
  };

  onChangeCompanyType = data => {
    const companyId = this.props.company.get('id');
    console.log(data)
    this.setState({...this.state, companyType: data.value})
    CompaniesState.ActionCreators.update(
      companyId,
      { company_type: data.value },
      { fields: $y.getFields(SubscriptionsManagementPageContent, 'company') }
    ).then(() => {
      this.context.displayTempPositiveMessage({
        heading: 'Great Success!',
        body: 'Company details saved'
      });
    });
  };

  onToggleSubscriptionOpt = opt => {
    const subscription = this.props.company.get('subscription');
    const data = {};
    data[opt] = !subscription[opt];
    SubscriptionsState.ActionCreators.update(this.props.company.get('subscription').id, data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    });
  };

  render() {
    const subscription = this.props.company.get('subscription');
    const enableAnalytics = subscription.analytics_enabled;
    const enableGroupsAndAreas = subscription.groups_and_areas_enabled;
    const enableSharedContent = subscription.shared_content_enabled;
    return (
      <div key={`${this.state.renderKey}-container-render`}>
        <h3>Subscription status</h3>

        <p>
          <span style={pageStyle.stat}>
            Number of external teams connected to content:{' '}
            {this.props.company.get('num_external_teams_connected_to_content')}
          </span>
          <br />
          <span>
            This figure represents the number of external (out of company) teams that have users
            enrolled in plans created by this company.
          </span>
        </p>

        <p>
          <span style={pageStyle.stat}>Pause on date:</span>
          <br />
          <span>
            Schedule a future subscription pause date. If set, the subscription will be paused on
            the this date. Clear field to cancel pause on date.
          </span>
        </p>
        <DatetimeInput
          style={pageStyle.dateInput}
          onChange={this.onPauseOnDateChange.bind(this, 'pause_on_date')}
          initialValue={moment(this.state.pause_on_date).utc()}
          isValidDate={this.isValidPauseOnDate}
        />

        <div style={pageStyle.toggleContainer}>
          <span style={pageStyle.stat}>Enable analytics:</span>
          <SlideToggle
            initialValue={enableAnalytics}
            style={pageStyle.slideToggle}
            onChange={() => this.onToggleSubscriptionOpt('analytics_enabled')}
          />
        </div>

        <div style={pageStyle.toggleContainer}>
          <span style={pageStyle.stat}>Enable team / area / group creation:</span>
          <SlideToggle
            initialValue={enableGroupsAndAreas}
            style={pageStyle.slideToggle}
            onChange={() => this.onToggleSubscriptionOpt('groups_and_areas_enabled')}
          />
        </div>

        <div style={pageStyle.toggleContainer}>
          <span style={pageStyle.stat}>Enable shared content:</span>
          <SlideToggle
            initialValue={enableSharedContent}
            style={pageStyle.slideToggle}
            onChange={() => this.onToggleSubscriptionOpt('shared_content_enabled')}
          />
        </div>

        <h3>Company type</h3>
        <Select
          name="company_type"
          value={this.state.companyType}
          clearable={false}
          options={[
            { value: BRAND, label: 'Brand' },
            { value: RETAILER, label: 'Retailer' },
            { value: CONTENT_SELLER, label: 'Content seller' },
          ]}
          valueRenderer={(o) => <div><b style={{color: '#000'}}>{o.label}</b></div>}
          onChange={this.onChangeCompanyType}
        />
      </div>
    );
  }
}

class SubscriptionsManagementPage extends React.Component {
  render() {
    return (
      <div style={pageStyle.container}>
        <LoadingContainer
          loadingProps={{
            company: this.props.company
          }}
          createComponent={() => <SubscriptionsManagementPageContent {...this.props} />}
          createLoadingComponent={() => <p>Select a company from the dropdown above</p>}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(SubscriptionsManagementPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [CompaniesState.Store, SubscriptionsState.Store],

  fetch: {
    company() {
      const companyId = this.props.companyId;
      if (companyId) {
        return CompaniesState.Store.getItem(companyId, {
          fields: [
            $y.getFields(SubscriptionsManagementPageContent, 'subscription', 'subscription'),
            $y.getFields(SubscriptionsManagementPageContent, 'company')
          ]
        });
      }
    }
  },

  pending() {
    return containerUtils.defaultPending(this, SubscriptionsManagementPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, SubscriptionsManagementPage, errors);
  }
});
