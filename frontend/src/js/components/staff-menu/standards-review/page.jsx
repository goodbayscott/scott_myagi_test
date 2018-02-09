import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { Link } from 'react-router';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';
import createPaginatedStateContainer from 'state/pagination';

import NavbarState from 'components/navbar/component-state';
import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { ScrollableDataTable } from 'components/common/table';
import { PositiveMessage, NegativeMessage } from 'components/common/message';
import { nowInISO } from 'utilities/time';
import moment from 'moment-timezone';

import CompanyState from 'state/companies';
import UsersState from 'state/users';

class CompanyLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      src: props.src,
      dimensions: {}
    };
    this.onImgLoad = this.onImgLoad.bind(this);
  }

  onImgLoad({ target: img }) {
    this.setState({
      dimensions: {
        height: img.naturalHeight,
        width: img.naturalWidth
      }
    });
  }

  render() {
    return (
      <div>
        <img onLoad={this.onImgLoad} src={this.props.src} style={{ width: '10em' }} />
        {this.props.src ? (
          <div>
            <p>width: {this.state.dimensions.width}px</p>
            <p>height: {this.state.dimensions.height}px</p>
          </div>
        ) : (
          <p>No Logo</p>
        )}
      </div>
    );
  }
}

class ChangeCompany extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: props.url,
      isLoading: false
    };
  }

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  changeCompany = () => {
    this.setState({ isLoading: true });
    UsersState.ActionCreators.doDetailAction(
      this.context.currentUser.get('id'),
      'change_user_to_new_company',
      {
        company_url: this.props.url
      }
    )
      .then(res => {
        this.setState({ isLoading: false });
        this.context.displayTempPositiveMessage({
          heading: 'Success',
          body: 'You have switched companies!'
        });
      })
      .catch(err => {
        console.log(err);
        this.context.displayTempNegativeMessage({
          heading: "Oh nooooo, it didn't work",
          body: 'Try again...'
        });
      });
  };

  render() {
    return (
      <div>
        <button
          className="ui button"
          onClick={this.changeCompany}
          style={{ marginBottom: 50, background: '#FF3A05', color: 'white' }}
        >
          Change me into this company
        </button>
      </div>
    );
  }
}

class BackToMyagi extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  resetYourself = () => {
    const origin = window.location.origin;
    const coURL = `${origin}/api/v1/companies/1584/`;

    UsersState.ActionCreators.doDetailAction(
      this.context.currentUser.get('id'),
      'change_user_to_new_company',
      {
        company_url: coURL
      }
    )
      .then(res => {
        this.context.displayTempPositiveMessage({
          heading: 'Success',
          body: 'You have changed back to Myagi! Woo!'
        });
      })
      .catch(err => {
        console.log(err);
        this.context.displayTempNegativeMessage({
          heading: "Oh nooooo, it didn't work",
          body: 'Try again...'
        });
      });
  };

  render() {
    return (
      <button
        className="ui button"
        onClick={this.resetYourself}
        style={{
          marginBottom: 50,
          background: '#FF3A05',
          color: 'white',
          float: 'right'
        }}
      >
        <i className="pied piper alternate icon" /> Back to Myagi!!
      </button>
    );
  }
}

class Deactivate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.id
    };
    this.deactivateCompany = this.deactivateCompany.bind(this);
  }

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  deactivateCompany = data => {
    const companyId = this.props.id;
    CompanyState.ActionCreators.update(companyId, { deactivated: nowInISO() })
      .then(() => {
        this.context.displayTempPositiveMessage({
          heading: 'Success',
          body: 'You have deactivated this company'
        });
      })
      .catch(err => {
        console.log(err);
        this.context.displayTempNegativeMessage({
          heading: "Oh nooooo, it didn't work",
          body: 'Try again...'
        });
      });
  };

  render() {
    return (
      <button
        className="ui button"
        onClick={this.deactivateCompany}
        style={{ marginBottom: 50, background: '#2185D0', color: 'white' }}
      >
        Deactivate
      </button>
    );
  }
}

export class StandardsReview extends React.Component {
  static data = {
    company: {
      required: true,
      fields: [
        'company_logo',
        'url',
        'company_name',
        'num_external_teams_connected_to_content',
        'num_publicly_viewable_channels',
        'deactivated',
        'created_at',
        'latest_module_attempt'
      ]
    }
  };

  static propTypes = {
    company: React.PropTypes.instanceOf(Im.List).isRequired
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static tableDataMapping = {
    Company: (u, cxt) => <div>{u.get('company_name')}</div>,
    Logo: (u, cxt) => <CompanyLogo src={u.get('company_logo')} />,
    'Date Created': (u, cxt) => <div>{moment(u.get('created_at')).format('DD MMMM YYYY')}</div>,
    'Teams Connected': (u, cxt) => <div>{u.get('num_external_teams_connected_to_content')}</div>,
    'Public Channels': (u, cxt) => <div>{u.get('num_publicly_viewable_channels')}</div>,
    'Latest Module Attempt': (u, cxt) => (
      <div>
        {u.get('latest_module_attempt') ? (
          <div>{moment(u.get('latest_module_attempt')).format('DD MMMM YYYY')}</div>
        ) : (
          <p>No Module Attempts</p>
        )}
      </div>
    ),
    Actions: (u, cxt) => (
      <div>
        <ChangeCompany url={u.get('url')} />
        <Deactivate id={u.get('id')} />
      </div>
    )
  };

  getDataMapping() {
    return StandardsReview.tableDataMapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    return this.props.company.map(u => Im.List(funcs.map(f => f(u, this))));
  }

  render() {
    return (
      <Panel>
        <BoxHeader>
          <h1>Standards Review</h1>
        </BoxHeader>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="ui blue message" style={{ width: '50%' }}>
            <p>
              <b>What is this tool used for?</b>
              <br />
              <p>
                Use this tool to easily find companies that aren't being used, or have been setup
                incorrectly and deactivate them. <br />
                You can also change your user into the company in question by clicking the red
                button. This will allow you to make changes to the company as if you were an admin
                of that company. Once you click the red button, visit this link:{' '}
                <a href="https://myagi.com/views/settings/">
                  <u>https://myagi.com/views/settings/</u>
                </a>
              </p>
            </p>
          </div>
        </div>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.company]}
            createComponent={() => (
              <div>
                <BackToMyagi />
                <InfiniteScroll
                  style={{ marginTop: 20 }}
                  loadMore={this.props.loadMore}
                  moreAvailable={this.props.moreAvailable}
                  isLoading={this.props.isLoading}
                >
                  <ScrollableDataTable
                    headers={this.getHeaders()}
                    rows={this.getRows()}
                    bodyHeight={null}
                    sortDisabled
                    style={{ textAlign: 'center' }}
                  />
                </InfiniteScroll>
              </div>
            )}
          />
        </BoxContent>
      </Panel>
    );
  }
}

export const Page = createPaginatedStateContainer(StandardsReview, {
  listenTo: [CompanyState.Store],
  paginate: {
    store: CompanyState.Store,
    propName: 'company',
    getQuery() {
      return {
        limit: 30,
        ordering: ('deactivated', 'company_name'),
        fields: [
          'company_logo',
          'url',
          'company_name',
          'num_external_teams_connected_to_content',
          'num_publicly_viewable_channels',
          'deactivated',
          'created_at',
          'latest_module_attempt'
        ]
      };
    }
  },
  pending() {
    return containerUtils.defaultPending(this, StandardsReview);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, StandardsReview, errors);
  }
});
