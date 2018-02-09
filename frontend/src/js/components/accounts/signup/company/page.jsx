import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import { resolve } from 'react-router-named-routes';

import _ from 'lodash';
import Style from 'style/index';

import { ANALYTICS_EVENTS } from 'core/constants';
import { getSubdomain } from 'utilities/generic';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { qs, getOrigin } from 'utilities/http';

import { t } from 'i18n';

import CompaniesState from 'state/companies';
import PublicCompaniesState from 'state/public-companies';
import PageState from './page-state';

import { Carousel } from '../user/page';
import { Title, Description, ListItem } from 'components/common/list-items';
import { PublicTeamSearchableSelect } from 'components/common/team-searchable-select';
import { Image } from 'components/common/image';
import { Modal } from 'components/common/modal';
import { HoverableLink } from 'components/common/hover';
import {
  Form,
  URLInput,
  NumberInput,
  TextInput,
  SubmitButton,
  FieldHeader
} from 'components/common/form';
import { DropdownSelect, RegionDropdownSelect } from 'components/common/form/select';
import { PublicStyling } from 'components/common/public-styling';
import { RETAILER, BRAND, HOSPO_COMPANY, CONTENT_SELLER, OTHER } from 'core/constants';

import logoImg from 'img/logo.svg';

const LOGIN_PATH = '/accounts/login/';
const CLEARBIT_LOGO_URL = 'http://logo.clearbit.com/';
const MIN_SEARCH_LENGTH = 3;

const COMPANY_TYPES = [
  { value: RETAILER, label: 'We are a retailer' },
  { value: BRAND, label: 'We are a brand' },
  { value: HOSPO_COMPANY, label: 'We are a hospitality company' },
  { value: CONTENT_SELLER, label: 'We sell content' },
  { value: OTHER, label: 'Other' }
];

const styles = {
  container: {
    color: Style.vars.colors.get('softText'),
    display: 'flex',
    justifyContent: 'center',
    margin: '0 auto',
    width: '60%',
    alignItems: 'center',
    // [Style.vars.media.get('tablet')]: {
    //   width: '80%',
    // },
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column',
      width: '100%',
      margin: '0 auto'
    }
  },
  header: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    zIndex: 1,
    boxShadow: 'rgba(0,0,0,.2) 0 1px 3px',
    padding: '10px 10px 10px 25px',
    [Style.vars.media.get('mobile')]: {
      padding: 10
    }
  },
  headerRight: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    padding: 10,
    top: 0,
    right: 0,
    height: '100%'
  },
  logo: {
    height: 50
  },
  formTitle: {
    fontSize: 30,
    marginTop: 150,
    color: Style.vars.colors.get('primary'),
    textAlign: 'center',
    padding: '0 2.5rem',
    fontWeight: 300,
    [Style.vars.media.get('mobile')]: {
      marginTop: 100
    }
  },
  signupFormContainer: {
    maxWidth: 550,
    margin: '10px auto auto auto',
    borderRadius: 5
  },
  signupForm: {
    paddingLeft: 50,
    paddingRight: 50,
    marginTop: 10,
    marginBottom: 17
  },
  signupButton: {
    height: 50,
    background: Style.vars.colors.get('primary'),
    borderRadius: 0,
    width: '100%',
    marginTop: 30,
    lineHeight: 2,
    color: Style.vars.colors.get('white')
  },
  signupButtonInvalid: {
    background: Style.vars.colors.get('fadedPrimary'),
    cursor: 'not-allowed'
  },
  clearbitImage: {
    marginTop: 20
  },
  input: {
    marginTop: 0,
    background: 'none',
    borderStyle: 'none',
    color: Style.vars.colors.get('xxxDarkGrey'),
    container: {
      marginTop: 40
    },
    innerContainer: {
      flexDirection: 'column'
    }
  },
  inputLabel: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    fontWeight: 'normal',
    fontSize: 16,
    marginBottom: 10
  },
  hr: {
    marginTop: '-20px',
    border: '1px solid ',
    borderColor: Style.vars.colors.get('mediumGrey')
  },
  formHeader: {
    textAlign: 'center',
    height: 120,
    borderRadius: '5px 5px 0px 0px'
  },
  redirect: {
    fontSize: '1.1em',
    marginTop: 10
  },
  errorCode: {
    color: Style.vars.colors.get('white'),
    marginBottom: 10,
    textAlign: 'center'
  },
  remove: {
    cursor: 'pointer'
  },
  removeLogo: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20
  },
  existingCoContainer: {
    margin: 10
  },
  selectType: {
    background: 'none',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 20
  },
  dropdown: {
    container: {
      marginTop: 40
    }
  },
  infoHalf: {
    background: Style.vars.colors.get('white'),
    flex: '10%',
    marginTop: 100,
    order: '1',
    position: 'relative',
    [Style.vars.media.get('mobile')]: {
      flex: '100%',
      order: '2',
      maxWidth: '100%'
    }
  },
  formContainer: {
    flex: '50%',
    order: '2',
    backgroundColor: Style.vars.colors.get('white'),
    [Style.vars.media.get('mobile')]: {
      flex: '100%',
      order: '1',
      paddingTop: '3vh'
    }
  },
  errorMsg: {
    color: Style.vars.colors.get('errorRed')
  },
  linkHover: {
    textDecoration: 'underline'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    display: 'block'
  }
};

// Copy text input label styling to dropdown label
styles.dropdown.label = styles.inputLabel;

export class ExistingCompanyModal extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  static data = {
    existingCompany: {
      fields: [
        'id',
        'url',
        'company_name',
        'company_url',
        'company_logo',
        'user_count',
        'subdomain',
        'has_access_code',
        'deactivated'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(ExistingCompanyModal);

  constructor() {
    super();
    this.state = {};
  }

  show() {
    this.refs.mainModal.show();
  }

  onJoinCompanySelect = () => {
    const { existingCompany } = this.props;

    if (existingCompany.get('subdomain') || existingCompany.get('has_access_code')) {
      this.refs.joinCompanyModal.show();
    } else {
      this.refs.inviteModal.show();
    }
  };

  onJoinCompanyFormSubmit = data => {
    this.setState({ loading: true });
    PublicCompaniesState.ActionCreators.doDetailAction(
      this.props.existingCompany.get('id'),
      'add_to_company',
      {
        company: this.props.existingCompany.get('url'),
        team: data.teamURL,
        access_code: data.access_code
      }
    )
      .then(() => {
        let next = '/views/training/';
        if (this.context.location.state && this.context.location.state.link) {
          const channel = this.props.link.get('channels')[0];
          const firstChannelId = this.props.link.get('initial_channel')
            ? this.props.link.get('initial_channel').id
            : channel.id;
          next = `/views/channel-content/${firstChannelId}/${this.context.location.state.link}`;
        }
        window.location.href = next;
      })
      .catch(err => {
        this.setState({ loading: false });
        if (err && err.response && err.response.body && err.response.body.access_code) {
          this.setState({ accessCodeError: true });
        } else {
          throw err;
        }
      });
  };

  clearAccessCodeError = () => {
    this.setState({ accessCodeError: false });
  };

  // WILL BE FIXING THIS UP, ONLY A SHORT TERM FIX
  customJoinCompanySubmit = data => {
    this.setState({ loading: true }, this.props.onJoinCompanyFormSubmit(data));
  };

  render() {
    const { existingCompany } = this.props;
    const hasAccessCode = existingCompany.get('has_access_code');
    const createNewCompanyOpt = this.props.createNewCompanyOpt;
    return (
      <div>
        <Modal ref="mainModal" header={t('existing_company')}>
          <div className="content">
            {createNewCompanyOpt ? t('are_you_trying_to_join_this') : null}
            <ListItem style={styles.existingCoContainer}>
              <div className="ui grid">
                <div className="ui four wide column">
                  <Image src={existingCompany.get('company_logo')} style={{ height: '3em' }} />
                </div>
                <div className="ui twelve wide column">
                  <Title>{existingCompany.get('company_name')}</Title>
                  <Description>
                    {existingCompany.get('user_count')} {t('users')}
                  </Description>
                  <Description>{existingCompany.get('company_url')}</Description>
                </div>
              </div>
            </ListItem>
          </div>
          <div className="actions">
            <div className="two fluid ui inverted buttons">
              {createNewCompanyOpt ? (
                <div
                  id="modal-cancel"
                  className="ui button"
                  onClick={() => {
                    this.refs.mainModal.hide();
                    this.props.createCompany();
                  }}
                >
                  {t('no_i_want_to_create_a')}
                </div>
              ) : null}

              <div
                id="modal-confirm"
                className="ui green button"
                onClick={this.onJoinCompanySelect}
              >
                {t('yes_i_want_to_join')}
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          ref="inviteModal"
          header="Invite required"
          content={`
              You need to be invited to join ${existingCompany.get('company_name')}.
              Please ask somebody within ${existingCompany.get('company_name')}
              who is already using Myagi to invite you, then follow the link in
              the invite email to sign up. If you are having trouble, please
              get in contact with support using the chat icon in the bottom right hand
              corner of the screen.
            `}
          basic
          message
        />

        <Modal
          ref="joinCompanyModal"
          header={`${t('join')} ${existingCompany.get('company_name')}`}
        >
          <div className="content">
            <Form
              onSubmitAndValid={
                this.props.onJoinCompanyFormSubmit
                  ? this.customJoinCompanySubmit
                  : this.onJoinCompanyFormSubmit
              }
              ref="joinForm"
            >
              {hasAccessCode && (
                <div>
                  <FieldHeader required>{t('company_access_code')}</FieldHeader>
                  <TextInput
                    style={styles.formInput}
                    name="access_code"
                    required
                    onChange={this.clearAccessCodeError}
                  />
                </div>
              )}
              {this.state.accessCodeError && (
                <p style={styles.errorCode}>{t('access_code_incorrect')}</p>
              )}
              <FieldHeader required>{t('team')} (required)</FieldHeader>
              <PublicTeamSearchableSelect company={existingCompany} name="teamURL" required />
              <SubmitButton text={t('join')} loading={this.state.loading} />
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}

@Radium
class CompanySignupPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  static data = {
    existingCompany: {
      required: false,
      fields: [$y.getFields(ExistingCompanyModal, 'existingCompany')]
    }
  };

  static propTypes = $y.propTypesFromData(CompanySignupPage, {
    isFetching: React.PropTypes.bool
  });

  constructor() {
    super();
    this.state = {
      createError: null,
      loading: false,
      logoURL: null,
      logoValid: false,
      companyType: null
    };
  }

  onSubmitAndValid = data => {
    if (this.props.isFetching) return;
    this.setState({ submissionData: data });
    if (this.refs.existingCompanyModal) {
      // Show existing company popup
      this.refs.existingCompanyModal.show();
    } else {
      _.defer(this.createCompany);
    }
  };

  createCompany = () => {
    const data = this.state.submissionData;
    this.setState({ loading: true });
    analytics.track(ANALYTICS_EVENTS.CREATE_COMPANY);
    CompaniesState.ActionCreators.doListAction('create_and_add_to_company', {
      company_name: data.companyName,
      company_url: data.companyURL,
      company_type: this.state.companyType,
      region: data.region,
      logo_url: this.state.logoURL,
      num_stores_est: data.num_stores_est,
      num_people_per_store_est: data.num_people_per_store_est
    }).then(res => {
      if (this.props.link && this.props.link.get('channels').length > 0) {
        const channel = this.props.link.get('channels')[0];
        const firstChannelId = this.props.link.get('initial_channel')
          ? this.props.link.get('initial_channel').id
          : channel.id;
        const linkName = this.context.location.state
          ? this.context.location.state.link
          : this.props.link.get('name');
        window.location.href = `/views/channel-content/${firstChannelId}/${linkName}`;
      } else if (window.location.search) {
        window.location.href = `${getOrigin()}/views/training/`;
      } else {
        let showDiscovery = true;
        const co = res.body;
        // If company signed up via link with join attributes, and that link
        // contained channels, then take them straight to training so they can
        // see that content. They can always revisit the discovery page later.
        if (co.join_attributes) {
          if (co.join_attributes.channels && co.join_attributes.channels.length) {
            showDiscovery = false;
          }
        }
        if (showDiscovery) {
          this.context.router.push(resolve('channel-discovery'));
        } else {
          this.context.router.push(resolve('training'));
        }
      }
    });
  };

  onInputChange = () => {
    this.setState({ createError: null });
  };

  onNameInputChange = (evt, val) => {
    if (val.length >= MIN_SEARCH_LENGTH) {
      PageState.ActionCreators.setSearch(val);
    }
    this.onInputChange();
  };

  onURLChange = evt => {
    this.onInputChange();
    // don't do anything if URL is invalid
    if (!this.refs.companySignupForm.refs.companyURL.isValid() || evt.target.value.length < 4) {
      return;
    }
    // if logo has already been validated, don't try to find another logo
    // unless the user invalidates.
    if (this.state.logoValid) return;

    // else, run clearbit query
    const companyDomain = evt.target.value;
    const clearbitLogoURL = CLEARBIT_LOGO_URL + companyDomain;

    CompaniesState.ActionCreators.doListAction('logo_query', {
      logo_url: clearbitLogoURL
    })
      .then(res => {
        this.setState({ logoValid: true });
        this.setState({ logoURL: clearbitLogoURL });
      })
      .catch(() => {
        this.setState({ logoURL: null });
      });
  };

  invalidateLogo = () => {
    this.setState({ logoURL: null, logoValid: false });
  };

  onTypeSelect = val => {
    this.setState({ companyType: val });
  };

  renderExistingCompanyModal() {
    const { existingCompany } = this.props;
    if (!existingCompany) return;
    return (
      <ExistingCompanyModal
        ref="existingCompanyModal"
        existingCompany={this.props.existingCompany}
        createCompany={this.createCompany}
        link={this.props.link}
        createNewCompanyOpt
      />
    );
  }

  getLoginURL() {
    const parts = location.hostname.split('.');
    // if parts.length === 1, there is no subdomain.
    if (parts.length === 1) return getOrigin() + LOGIN_PATH;
    if (parts[0] !== 'myagi' && parts[0] !== 'staging-web') parts.shift();

    let subdomain = getSubdomain();
    subdomain = subdomain ? `${subdomain}.` : '';
    const upperLevelDomain = parts.join('.');
    const port = location.port ? `:${location.port}` : '';
    const loginURL = `${
      window.location.protocol
    }//${subdomain}${upperLevelDomain}${port}${LOGIN_PATH}`;
    return loginURL;
  }

  render() {
    const loginURL = this.getLoginURL();
    // Allows the new company's name to be determined from the previous page (user sign up or custom sign up) via the 'company' field
    const newCompanyName =
      this.context.location.state && this.context.location.state.newCompanyName;
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={logoImg} style={styles.logo} />
          <div style={styles.headerRight}>
            <HoverableLink
              hoverStyle={styles.linkHover}
              style={styles.existingAccountLink}
              href={loginURL}
            >
              {t('already_using_myagi')}{' '}
              <i style={styles.forwardIcon} className="angle right icon" />
            </HoverableLink>
          </div>
        </div>
        <div style={styles.infoHalf}>
          <Carousel />
        </div>
        <div style={styles.formContainer}>
          <div style={styles.formTitle}>{t('your_companys_details')}</div>
          <br />
          <div style={styles.signupFormContainer}>
            <Form
              onSubmitAndValid={this.onSubmitAndValid}
              style={styles.signupForm}
              ref="companySignupForm"
            >
              <TextInput
                label={t('company_name')}
                name="companyName"
                placeholder={t('your_company_name')}
                initialValue={newCompanyName || undefined}
                initialIsAcceptable={!!newCompanyName}
                fadeInitial={false}
                placeholderColor="faded"
                style={styles.input}
                labelStyle={styles.inputLabel}
                onChange={this.onNameInputChange}
                errorMsgStyle={styles.errorMsg}
                required
              />

              <hr style={styles.hr} />

              <RegionDropdownSelect
                label="Region"
                name="region"
                noSelectionText="Select the most relevant region for your company..."
                required
                style={styles.dropdown}
                errorMsgStyle={styles.errorMsg}
              />

              <URLInput
                label={t('company_website_url_optional')}
                labelStyle={styles.inputLabel}
                placeholder="yourcompany.com"
                name="companyURL"
                ref="companyURL"
                placeholderColor="faded"
                onChange={this.onURLChange}
                required={false}
                style={styles.input}
                errorMsgStyle={styles.errorMsg}
              />
              <hr style={styles.hr} />

              {this.state.logoValid ? (
                <div>
                  <Image
                    ref="clearbitImage"
                    src={this.state.logoURL}
                    style={styles.clearbitImage}
                  />
                  <div style={styles.removeLogo}>
                    {t('not_your_logo')}&nbsp;
                    <strong style={styles.remove} onClick={this.invalidateLogo}>
                      {t('remove_it')}
                    </strong>
                    <br />
                    {t('you_can_upload_your_own_after')}.
                  </div>
                </div>
              ) : null}

              <DropdownSelect
                onChange={this.onTypeSelect}
                options={COMPANY_TYPES}
                label="Company Type"
                name="company_type"
                noSelectionText="Select a company type..."
                required
                style={styles.dropdown}
                errorMsgStyle={styles.errorMsg}
              />

              {this.state.companyType === RETAILER || this.state.companyType === HOSPO_COMPANY ? (
                <div>
                  <NumberInput
                    label={t('approx_num_stores')}
                    labelStyle={styles.inputLabel}
                    placeholder="e.g. 50"
                    name="num_stores_est"
                    placeholderColor="faded"
                    required
                    style={styles.input}
                  />
                  <hr style={styles.hr} />

                  <NumberInput
                    label={t('approx_num_people')}
                    labelStyle={styles.inputLabel}
                    placeholder="e.g. 10"
                    name="num_people_per_store_est"
                    placeholderColor="faded"
                    required
                    style={styles.input}
                  />
                  <hr style={styles.hr} />
                </div>
              ) : null}

              {this.state.createError ? (
                <div style={styles.errorCode}>
                  <p>{this.state.createError}</p>
                </div>
              ) : null}

              <SubmitButton
                style={styles.signupButton}
                invalidStyle={styles.signupButtonInvalid}
                text={t('next')}
                className="btn"
                loading={this.state.loading || this.props.isFetching}
              />
            </Form>

            {this.renderExistingCompanyModal()}
          </div>
        </div>
      </div>
    );
  }
}

const PageInner = Marty.createContainer(CompanySignupPage, {
  listenTo: [PublicCompaniesState.Store, PageState.Store],

  fetch: {
    existingCompanies() {
      const search = PageState.Store.getSearch();
      if (!search.length) {
        return null;
      }
      return PublicCompaniesState.Store.getItems({
        search,
        deactivated__isnull: true,
        limit: 1,
        // order_by_user_count: true,
        ordering: '-search_rank',
        fields: $y.getFields(CompanySignupPage, 'existingCompany')
      });
    }
  },

  done(results) {
    const { existingCompanies } = results;
    let existingCompany;
    if (existingCompanies) existingCompany = existingCompanies.get(0);
    return <CompanySignupPage {...this.props} existingCompany={existingCompany} />;
  },

  pending() {
    return containerUtils.defaultPending(this, CompanySignupPage, {
      isFetching: true
    });
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompanySignupPage, errors);
  }
});

export class Page extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  render() {
    return (
      <PublicStyling>
        <PageInner />
      </PublicStyling>
    );
  }
}
