import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import { KEY_CODES } from 'core/constants';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import createPaginatedStateContainer, { NUM_PAGED } from 'state/pagination';

import PublicCompaniesState from 'state/public-companies';
import CompaniesState from 'state/companies';
import CompanyConnectionRequestsState from 'state/company-connection-requests';
import ChannelShareRequestsState from 'state/channel-share-requests';
import ContactsState from 'state/contacts';
import ComponentState from './state';

import { LoadingContainer } from 'components/common/loading';
import { Panel, BoxContent, InfoHeader, HeaderWithLineThrough } from 'components/common/box';
import { Link } from 'react-router';
import { FinishedSelectingButton } from 'components/common/buttons';
import { Form, TextInput } from 'components/common/form';
import { Title, Description, ListItem } from 'components/common/list-items';
import { Image } from 'components/common/image';
import { Modal } from 'components/common/modal';
import { CardCollection, DimmableCardImage, Card } from 'components/common/cards';
import PageMenuContainer from 'components/common/page-menu-container';
import { PrimaryButton } from 'components/common/buttons';
import { ASYNC_SEARCH_THROTTLE_TIME } from 'components/common/form/select';
import ConnectionRequestDetailsModal from './connection-request-details-modal';
import CompanyConnectionRequestsList from './company-connection-request-list';

import { isFromRetailerOrHospo, getUserCompanyType } from './utils';

import { RETAILER, BRAND } from 'core/constants';

const styles = {
  header: {
    width: '100%',
    // backgroundColor: Style.vars.colors.get('mediumGrey'),
    textAlign: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
  },
  headerWithLine: { marginTop: 100, marginBottom: 10 },
  infoHeader: {
    color: Style.vars.colors.get('green'),
    marginTop: 60
  },
  textInput: {
    container: _.extend(
      {
        maxWidth: 500,
        margin: '20px auto'
        // Add translation to account for the "Add" button
      },
      Style.funcs.makeTransform('translateX(-25px)')
    )
  },
  submitBtn: {
    backgroundColor: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor')
  },
  addedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    zINdex: 999,
    backgroundColor: 'rgba(170, 190, 90, 0.9)',
    color: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    fontSize: 16
  }
};

function AddedOverlay() {
  return <div style={styles.addedOverlay}>ADDED</div>;
}

class SuggestedCompaniesList extends React.Component {
  static data = {
    suggestedCompanies: {
      many: true,
      fields: ['url', 'company_name', 'company_logo']
    },
    connectionRequests: {
      many: true,
      fields: ['to_company.url']
    }
  };

  renderCompany = company => {
    const co = company.toJS();
    const isAdded = Boolean(this.props.connectionRequests.find(coReq => coReq.get('to_company').url === co.url));
    return (
      <Card style={styles.requestCard} key={co.id} onClick={() => this.props.selectCompany(co.id)}>
        <DimmableCardImage
          src={co.company_logo}
          containerStyle={{ cursor: 'default' }}
          imageStyle={{ height: '6em' }}
        >
          <PrimaryButton>Add</PrimaryButton>
        </DimmableCardImage>
        <div className="content">
          <div className="header" style={{ fontSize: 14 }}>
            {co.company_name}
          </div>
        </div>
        {isAdded && <AddedOverlay />}
      </Card>
    );
  };

  render() {
    return (
      <CardCollection
        style={{ justifyContent: 'center' }}
        createCard={this.renderCompany}
        entities={this.props.suggestedCompanies}
      />
    );
  }
}

class ExistingCompaniesModal extends React.Component {
  static data = {
    existingCompanies: {
      many: true,
      fields: [
        'id',
        'url',
        'company_name',
        'company_url',
        'company_logo',
        'user_count',
        'subdomain',
        'search_rank',
        'region'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(ExistingCompaniesModal);

  show() {
    this.refs.mainModal.show();
  }

  render() {
    const { existingCompanies } = this.props;
    return (
      <div>
        <Modal
          ref="mainModal"
          onHidden={this.props.onHidden}
          header="Did you mean one of these companies?"
        >
          <div className="content">
            {existingCompanies.map(existingCompany => {
              const selectFunc = () => {
                this.refs.mainModal.hide();
                this.props.selectCompany(existingCompany.get('id'));
              };
              return (
                <ListItem style={styles.existingCoContainer} onClick={selectFunc}>
                  <div className="ui grid">
                    <div className="ui four wide column">
                      <Image src={existingCompany.get('company_logo')} style={{ height: '3em' }} />
                    </div>
                    <div className="ui twelve wide column">
                      <Title>{existingCompany.get('company_name')}</Title>
                      <Description>{existingCompany.get('user_count')} users</Description>
                      <Description>{existingCompany.get('region')}</Description>
                      <Description>{existingCompany.get('company_url')}</Description>
                    </div>
                  </div>
                </ListItem>
              );
            })}
          </div>
          <div className="actions">
            <div className="two fluid ui inverted buttons">
              <div
                id="modal-cancel"
                className="ui button"
                onClick={() => {
                  this.refs.mainModal.hide();
                  this.props.createCompany();
                }}
              >
                No I meant '{this.props.enteredName}'
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

class Page extends React.Component {
  static data = {
    existingCompanies: {
      many: true,
      fields: [$y.getFields(ExistingCompaniesModal, 'existingCompanies')]
    },
    connectionRequests: {
      many: true,
      fields: [
        'from_company',
        'created_by',
        'to_company.url',
        'to_company.id',
        $y.getFields(CompanyConnectionRequestsList, 'connectionRequests'),
        $y.getFields(SuggestedCompaniesList, 'connectionRequests')
      ]
    },
    suggestedCompanies: {
      many: true,
      fields: [$y.getFields(SuggestedCompaniesList, 'suggestedCompanies')]
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    // Throttle search to prevent excessive fetching
    const throttledExecFetch = _.throttle(
      ComponentState.ActionCreators.setSearch.bind(ComponentState.ActionCreators),
      ASYNC_SEARCH_THROTTLE_TIME,
      { leading: false, trailing: true }
    );
    this.state = {
      submissionData: null,
      execSearch: throttledExecFetch,
      newlySelected: Im.List()
    };
  }

  componentDidUpdate(prevProps) {
    // Ensures that we wait until similar companies have been fetched before
    // submitting
    if (!this.props.isFetching && this.state.submissionData) {
      this.handleSubmissionData();
    }
  }

  onFormSubmit = data => {
    if (!data.coName) return;
    this.setState({ submissionData: data });
  };

  onKeyDown = evt => {
    if (event.which === KEY_CODES.ENTER || event.keyCode === KEY_CODES.ENTER) {
      this.doSumit();
    }
  };

  onInputChange = (evt, val) => {
    this.state.execSearch(val);
    // Reset submission data or else modal will show if
    // user has submitted once
    this.setState({ submissionData: null });
  };

  onExistingCoModalHidden = () => {
    this.reset();
  };

  curCompany() {
    // If you try moving this to a prop which is set by the outer Marty container,
    // then for some reason it bugs out when fetches are pending. This seems to
    // be due to the the throttling of the existing company search
    return Im.Map(this.props.currentUser.get('learner').company);
  }

  triggerSubmit = () => {
    this.refs.form.onSubmit();
  };

  handleSubmissionData() {
    // Actual submission happens here,
    // as this method is only called when we are not fetching `existingCompanies`
    // and there is actual `submissionData` ready.
    if (this.props.existingCompanies && this.props.existingCompanies.count() > 0) {
      // Show existing companies modal
      this.refs.existingCompaniesModal.show();
    } else {
      // Create new company using submission data
      this.createNewCompany();
    }
  }

  createNewCompany = () => {
    // Create new company and 'connect' it with this one.
    CompaniesState.ActionCreators.create({
      company_name: _.capitalize(this.state.submissionData.coName),
      subdomain: null,
      unclaimed: true,
      company_type: isFromRetailerOrHospo(this.props.currentUser) ? BRAND : RETAILER
    }).then(res => {
      this.selectCompany(res.body.id);
    });
    this.reset();
  };

  selectCompany = coId => {
    // Update current company and connect it with the selected company
    const url = PublicCompaniesState.Store.getURLForItemWithID(coId);
    const curUrl = PublicCompaniesState.Store.getURLForItemWithID(this.curCompany().get('id'));
    const data = {
      from_company: curUrl,
      to_company: url,
      created_by: this.props.currentUser.get('url')
    };
    if (!this.props.connectionRequests.find(req => req.get('to_company').url === url)) {
      CompanyConnectionRequestsState.ActionCreators.create(data, {
        query: {
          fields: $y.getFields(Page, 'connectionRequests')
        }
      }).then(res => {
        // Use this to display the modal for this request, regardless of which page of requests
        // we are on
        this.setState({
          newestRequest: Im.Map(res.body)
        });
      });
      this.context.displayTempPositiveMessage({
        heading: 'Connection created'
      });
    }
    this.reset();
  };

  reset() {
    this.setState({ submissionData: null });
    this.refs.form.refs.input.reset();
  }

  renderMessage() {
    return isFromRetailerOrHospo(this.props.currentUser) ? (
      <span>
        Tell us which brands you would like content from. <br /> We can then work with them to
        produce lessons for your company.
      </span>
    ) : (
      <span>
        Tell us which retailers you would like to connect your content to. <br /> We can then make
        them a part of the Myagi network and connect them to your content.
      </span>
    );
  }

  renderPlaceholder() {
    return isFromRetailerOrHospo(this.props.currentUser)
      ? 'Enter a company name (e.g. Nike)'
      : 'Enter a company name (e.g. Best Buy)';
  }

  render() {
    // Do not showSuggestions if we already have a long list of connections.
    // Assume that user no longer needs them.
    // NOTE: Have disabled these while company connections is just an internal tool.
    const showSuggestions = this.props.numAvailablePages <= 1 && false;
    return (
      <Panel>
        <BoxContent>
          <Link to="training">
            <FinishedSelectingButton />
          </Link>
          <br />
          <InfoHeader style={styles.infoHeader}>
            You are part of the {this.props.currentUser.get('learner').company.company_name}{' '}
            company.
            <br />
            {this.renderMessage()}
          </InfoHeader>

          <Form ref="form" onSubmitAndValid={this.onFormSubmit}>
            <TextInput
              name="coName"
              ref="input"
              onChange={this.onInputChange}
              onKeyDown={this.onKeyDown}
              style={styles.textInput}
              placeholder={this.renderPlaceholder()}
              actionComponent={
                <button style={styles.submitBtn} className="ui button" onClick={this.triggerSubmit}>
                  Add
                </button>
              }
            />
          </Form>
          <HeaderWithLineThrough style={styles.headerWithLine}>
            Existing Requests
          </HeaderWithLineThrough>
          <PageMenuContainer
            currentPage={this.props.currentPage}
            numAvailablePages={this.props.numAvailablePages}
            goToPage={this.props.goToPage}
          >
            <LoadingContainer
              loadingProps={[this.props.connectionRequests]}
              noDataText="You have not asked to connect with any companies"
              createComponent={() => (
                <CompanyConnectionRequestsList
                  connectionRequests={this.props.connectionRequests}
                  currentUser={this.props.currentUser}
                />
              )}
            />
          </PageMenuContainer>
          {showSuggestions && (
            <HeaderWithLineThrough style={styles.headerWithLine}>Suggestions</HeaderWithLineThrough>
          )}
          {showSuggestions && (
            <LoadingContainer
              loadingProps={[this.props.suggestedCompanies, this.props.connectionRequests]}
              createComponent={() => (
                <SuggestedCompaniesList
                  suggestedCompanies={this.props.suggestedCompanies}
                  connectionRequests={this.props.connectionRequests}
                  selectCompany={this.selectCompany}
                />
              )}
            />
          )}
        </BoxContent>
        {this.props.existingCompanies &&
          this.state.submissionData && (
            <ExistingCompaniesModal
              ref="existingCompaniesModal"
              existingCompanies={this.props.existingCompanies}
              enteredName={this.state.submissionData.coName}
              createCompany={this.createNewCompany}
              selectCompany={this.selectCompany}
              onHidden={this.onExistingCoModalHidden}
            />
          )}
        {this.state.newestRequest && (
          <ConnectionRequestDetailsModal
            key={this.state.newestRequest.get('id')}
            connectionRequest={this.state.newestRequest}
            currentUser={this.props.currentUser}
            showOnInit
          />
        )}
      </Panel>
    );
  }
}

export default createPaginatedStateContainer(Page, {
  listenTo: [
    ComponentState.Store,
    CompanyConnectionRequestsState.Store,
    ChannelShareRequestsState.Store,
    PublicCompaniesState.Store,
    ContactsState.Store
  ],

  paginate: {
    store: CompanyConnectionRequestsState.Store,
    propName: 'connectionRequests',
    limit: 20,
    paginationType: NUM_PAGED,
    storeOpts: {
      // Add dependency, because we may update public company details
      // via the UnclaimedCompanyDetailsModal, in which case we need
      // to refresh the data which is displayed.
      dependantOn: [
        PublicCompaniesState.Store,
        ChannelShareRequestsState.Store,
        ContactsState.Store
      ]
    },
    getQuery() {
      return {
        fields: $y.getFields(Page, 'connectionRequests'),
        from_company: this.props.currentUser.get('learner').company.id,
        ordering: 'to_company__company_name'
      };
    }
  },

  fetch: {
    suggestedCompanies() {
      return PublicCompaniesState.Store.getItems({
        fields: $y.getFields(Page, 'suggestedCompanies'),
        order_as_connection_suggestions_for_company: this.props.currentUser.get('learner').company
          .id,
        company_type: isFromRetailerOrHospo(this.props.currentUser) ? BRAND : RETAILER,
        limit: 40
      });
    },
    existingCompanies() {
      const search = ComponentState.Store.getSearch();
      if (!search) return null;
      return PublicCompaniesState.Store.getItems({
        limit: 5,
        fields: $y.getFields(Page, 'existingCompanies'),
        search,
        ordering: '-search_rank',
        // Do not filter by type...a lot of brands are mislabelled as
        // retailers at the moment
        // company_type: BRAND,

        // This filter helps to deal with regional issues. If there is an existing company that
        // does not exist in the current region then we do not want to show it. Instead, we want to generate
        // a new, unclaimed, global version of the brand then do what we can to get a public
        // channel for the current company's region.
        // See https://docs.google.com/document/d/1AoC3aYkd3YfzHAK5D4wMF5X4gBTw427TD0nURZvFDkI/edit?ts=59a5d2f8
        // for an explanation of this process.
        includes_region: this.props.currentUser.get('learner').company.region
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page, { isFetching: true });
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
