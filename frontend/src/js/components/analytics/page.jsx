import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';

import Style from 'style';

import { ANALYTICS_EVENTS } from 'core/constants';

import { getDefaultFilter } from './common';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';
import UsersState from 'state/users';
import { BoxHeader, BoxContent, Panel } from 'components/common/box';
import { DateRangePicker } from 'components/common/date-range-picker.jsx';
import { Modal } from 'components/common/modal';
import { PrimaryButton } from 'components/common/buttons';
import { Tabs, TabsMixin } from 'components/common/tabs';
import { Dropdown } from 'components/common/dropdown';
import { PivotTablesTab } from './pivot-tables-tab';
import { TabContent as ReportsTabContent } from './reports-tab';
import { TabContent as MetabaseReportsTabContent } from './metabase-reports-tab';
import IntercomContactButton from 'components/common/intercom-contact-button';
import { momentToISO } from 'utilities/time.js';

const STANDARD_DOWNLOAD_PARAMS = {
  rename_id: 'Attempt ID',
  rename_user: 'User ID',
  rename_user__first_name: 'First Name',
  rename_user__last_name: 'Last Name',
  rename_user__full_name: 'Full Name',
  rename_user__learner__last_activity: 'Last User Activity',
  rename_training_unit__name: 'Channel Name',
  rename_user__date_joined: 'Date User Joined',
  rename_module: 'Lesson ID',
  rename_module__name: 'Lesson Name',
  rename_percentage_score: 'Percentage Score',
  rename_is_complete: 'Is Complete',
  rename_is_successful: 'Is Successful',
  rename_training_plan__name: 'Plan Name',
  rename_module__categories: 'Category ID',
  rename_module__categories__name: 'Category Name',
  rename_user__learner__learnergroups__name: 'Team Name',
  rename_start_time: 'Start Time',
  rename_end_time: 'End Time',
  rename_is_failed: 'Is Failed',
  rename_is_incomplete: 'Is Incomplete',
  rename_user__id: 'User ID',
  rename_user__learner__company__company_name: 'Company Name',
  rename_user__learner__learnergroups__areas__id: 'Area ID',
  rename_user__learner__learnergroups__areas__name: 'Area Name',
  rename_total_count: 'Count',
  rename_total_time_in_seconds: 'Total Time in Seconds',
  download_as: `Myagi Attempt Data (${moment().format('YYYY-MM-DD')}).csv`
};

const DOWNLOAD_CSV_ENDPOINT = 'email_csv_to_current_user';

import salesImg from 'img/salesdata.png';
import blurImage from 'img/analytics-dash-blur.jpg';

class SalesAnalysis extends React.Component {
  /*
    Temporarily showing a sales data graph for CBA demo. Will remove this soon.
  */

  render() {
    return (
      <div style={{ height: 500, textAlign: 'center', paddingTop: 120 }}>
        {this.props.currentUser && this.props.currentUser.get('learner').company.id === 6839 ? (
          <img src={salesImg} style={{ marginTop: -100 }} width="100%" />
        ) : (
          <IntercomContactButton
            btnText="Connect your sales data"
            message="I understand that you're interested in connecting your company's sales
                   data with Myagi. This is a feature that we're currently building in Myagi,
                   although we can analyse your sales data offline. If this is something you're
                   interested in then you can line up a call to discuss it here
                   https://app.hubspot.com/meetings/sam-parsons/connect-sales-data"
            modalHeader="Connect your sales data to Myagi to see how training impacts sales"
            currentUser={this.props.currentUser}
          />
        )}
      </div>
    );
  }
}

class DownloadAttemptDataModal extends React.Component {
  static propTypes = {
    fetchParams: React.PropTypes.object,
    fetchURL: React.PropTypes.string.isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  show = () => {
    console.log('DownloadAttemptDataModal');
    this.confirmModal.show();
  };

  onConfirmDownload = () => {
    // var result = ReactDOM.findDOMNode(this.refs.csvForm).submit();
    this.confirmModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Data processing',
      body: 'Your data is being fetched. You will receive an email when it is finished processing.'
    });
    const url = ModuleAttemptsDataframeState.Store.getDataframeURL({
      list_route: 'to_pivot_table'
    });
    const dlParams = _.extend(
      { list_route: DOWNLOAD_CSV_ENDPOINT },
      STANDARD_DOWNLOAD_PARAMS,
      this.props.fetchParams
    );
    ModuleAttemptsDataframeState.Store.getDataframe(dlParams);
    this.confirmModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Data processing',
      body: 'Your data is being fetched. You will receive an email when it is finished processing.'
    });
  };

  render() {
    const csvURL = this.props.fetchURL;
    const dlParams = _.extend({}, STANDARD_DOWNLOAD_PARAMS, this.props.fetchParams);
    const formInputs = _.map(dlParams, (v, k) => (
      <input type="hidden" name={k} value={v} key={k} />
    ));
    return (
      <Modal
        ref={confirmModal => (this.confirmModal = confirmModal)}
        onConfirm={this.onConfirmDownload}
        header="Export attempt data"
        basic
      >
        <div className="content">
          Would you like to download lesson attempt data for your company in CSV format? You will
          receive an email with a file attachment when we finish processing your data.
          <form ref="csvForm" method="get" action={csvURL}>
            {formInputs}
          </form>
        </div>
      </Modal>
    );
  }
}

class DownloadUserDataModal extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  show = () => {
    this.confirmModal.show();
  };

  onConfirmDownload = () => {
    UsersState.ActionCreators.doListAction(DOWNLOAD_CSV_ENDPOINT);
    this.confirmModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Data processing',
      body: 'Your data is being fetched. You will receive an email when it is finished processing.'
    });
  };

  render() {
    return (
      <Modal
        ref={confirmModal => (this.confirmModal = confirmModal)}
        onConfirm={this.onConfirmDownload}
        headerText="Export user data"
        basic
      >
        <div className="content">
          Would you like to download user data for your company in CSV format? You will receive an
          email with a file attachment when we finish processing your data.
        </div>
      </Modal>
    );
  }
}

class AttemptDateExportModal extends React.Component {
  static propTypes = {
    fetchParams: React.PropTypes.object,
    fetchURL: React.PropTypes.string.isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      dateRange: {
        start_time__gte: momentToISO(moment().subtract(30, 'days')),
        start_time__lt: momentToISO(moment())
      }
    };
  }

  show = () => {
    this.modal.show();
  };

  onDatePickerChange = data => {
    const params = {};
    params.start_time__gte = momentToISO(data.startDate);
    params.start_time__lt = momentToISO(data.endDate);
    this.setState({
      dateRange: params
    });
  };

  onConfirmDownload = () => {
    this.modal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Processing data',
      body: 'Your data is being fetched. You will receive an email when it is finished processing.'
    });

    const url = ModuleAttemptsDataframeState.Store.getDataframeURL({
      list_route: 'to_pivot_table'
    });
    const dlParams = _.extend(
      { list_route: DOWNLOAD_CSV_ENDPOINT },
      STANDARD_DOWNLOAD_PARAMS,
      this.props.fetchParams,
      this.state.dateRange
    );
    ModuleAttemptsDataframeState.Store.getDataframe(dlParams);
    this.modal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Processing data',
      body: 'Your data is being fetched. You will receive an email when it is finished processing.'
    });
  };

  render() {
    const csvURL = this.props.fetchURL;
    const dlParams = _.extend(
      {},
      STANDARD_DOWNLOAD_PARAMS,
      this.props.fetchParams,
      this.state.dateRange
    );
    const formInputs = _.map(dlParams, (v, k) => (
      <input type="hidden" name={k} value={v} key={k} />
    ));

    return (
      <Modal
        ref={modal => (this.modal = modal)}
        style={{ marginTop: -200, width: 760 }}
        headerText="Export attempt data"
      >
        <div className="content" style={{ textAlign: 'center' }}>
          <p>Choose a date range:</p>
          <div>
            <DateRangePicker
              containerStyle={{
                display: 'inline-block',
                float: 'left',
                paddingLeft: 40
              }}
              initStartDate={moment().subtract(30, 'days')}
              initEndDate={moment()}
              onChange={this.onDatePickerChange}
            />
            <PrimaryButton
              style={{ display: 'inline-block', width: 100, marginLeft: -20 }}
              onClick={this.onConfirmDownload}
            >
              Download
            </PrimaryButton>
          </div>
          <form ref="downloadForm" method="get" action={csvURL}>
            {formInputs}
          </form>

          <div className="ui horizontal divider">Or</div>
          <PrimaryButton style={{ display: 'inline-block' }} onClick={this.props.downloadAll}>
            Download All
          </PrimaryButton>
        </div>
      </Modal>
    );
  }
}

const pageStyle = {
  activeTabContent: {
    display: 'block'
  },
  inactiveTabContent: {
    display: 'none'
  },
  dropdown: {
    float: 'right',
    top: '0.62em',
    [Style.vars.media.get('mobile')]: {
      float: 'right',
      top: '1.4em'
    }
  },
  headingContainer: {
    paddingBottom: 0,
    // Overflow visible and minHeight required for
    // export dropdown to be visible.
    overflow: 'visible',
    minHeight: '4.6em'
  },
  heading: {
    display: 'none'
  }
};

@Radium
@reactMixin.decorate(TabsMixin)
export class Page extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  static propTypes = {
    // Route params
    location: React.PropTypes.object
  };

  static defaultProps = function () {
    return {
      isLoading: _.noop
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      downloadFetchParams: {},
      downloadFetchURL: ModuleAttemptsDataframeState.Store.getDataframeURL()
    };
  }

  componentDidMount() {
    analytics.track(ANALYTICS_EVENTS.VIEWED_ANALYTICS);
  }

  showDownloadAttemptDataModal = useTabFetchParams => {
    if (useTabFetchParams) {
      const activeTab = this.getActiveTabRef();
      this.setState({
        downloadFetchParams: activeTab.getCurrentFetchParams(),
        downloadFetchURL: activeTab.getFetchURL()
      });
    } else {
      this.setState({
        downloadFetchParams: getDefaultFilter(this.props.currentUser),
        downloadFetchURL: ModuleAttemptsDataframeState.Store.getDataframeURL()
      });
    }
    this.attemptDataModal.show();
  };

  showDownloadUserDataModal = () => {
    this.userDataModal.show();
  };

  getActiveTabRef = () => this.refs[`${this.getActiveTabName()}TabContent`];

  getTabContentMap = () => {
    const { currentUser } = this.props;
    let tabs = {
      Attempts: <PivotTablesTab ref="Tabular" currentUser={this.props.currentUser} />
    };
    if (currentUser.get('learner').is_company_admin) {
      tabs = {
        Reports: !currentUser.get('learner').is_internal_user ? (
          <ReportsTabContent ref="Reports" currentUser={currentUser} />
        ) : (
          <MetabaseReportsTabContent ref="Reports" currentUser={currentUser} />
        ),
        Reports: <MetabaseReportsTabContent ref="Reports" currentUser={currentUser} />,
        Attempts: tabs.Attempts
      };
    }
    return tabs;
  };

  showAttemptDateExportModal = () => {
    this.attemptDateExportModal.show();
  };

  render() {
    const isAdmin = this.props.currentUser.get('learner').is_company_admin;
    const initialSelection = this.context.location.query.tab;
    const analyticsEnabled = this.props.currentUser.get('learner').company.subscription
      .analytics_enabled;
    const descriptionText =
      'Myagi’s analytics suite helps identify the content, people, and management practises that are going to give you the greatest lift in sales and service performance.';
    return (
      <div>
        <Panel innerStyle={{ maxWidth: '100%' }}>
          <BoxHeader headingStyle={pageStyle.heading} containerStyle={pageStyle.headingContainer}>
            <Tabs
              {...this.getTabsProps()}
              initialSelection={initialSelection}
              containerStyle={{ width: 'auto', float: 'left' }}
            />
            {isAdmin && (
              <Dropdown
                className="ui top right pointing dropdown"
                style={pageStyle.dropdown}
                dropdownOpts={{
                  action: 'hide'
                }}
              >
                <div className="text">Export</div>
                <i className="dropdown icon" />
                <div className="menu">
                  <div className="item" onClick={this.showAttemptDateExportModal}>
                    All attempt data
                  </div>
                  <div className="item" onClick={this.showDownloadUserDataModal}>
                    All user data
                  </div>
                </div>
              </Dropdown>
            )}
          </BoxHeader>
          <BoxContent>{this.getTabContent({ renderWhenActive: true })}</BoxContent>
          <DownloadAttemptDataModal
            ref={attemptDataModal => (this.attemptDataModal = attemptDataModal)}
            fetchParams={this.state.downloadFetchParams}
            fetchURL={this.state.downloadFetchURL}
          />
          <DownloadUserDataModal
            ref={userDataModal => (this.userDataModal = userDataModal)}
            currentUser={this.props.currentUser}
          />
          <AttemptDateExportModal
            ref={attemptDateExportModal => (this.attemptDateExportModal = attemptDateExportModal)}
            fetchParams={this.state.downloadFetchParams}
            fetchURL={this.state.downloadFetchURL}
            downloadAll={_.partial(this.showDownloadAttemptDataModal, false)}
          />
        </Panel>
      </div>
    );
  }
}
