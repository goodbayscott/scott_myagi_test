import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import Style from 'style';

import { getSubdomain } from 'utilities/generic';
import { qs, getOrigin } from 'utilities/http';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { t, getCurrentLocale } from 'i18n';

import PublicUsersState from 'state/public-users';
import PublicCompaniesState from 'state/public-companies';
import TeamsState from 'state/teams';
import UsersState from 'state/users';

import { PublicStyling } from 'components/common/public-styling';
import PoweredByMyagi from 'components/app/powered-by';
import { HoverableLink } from 'components/common/hover';
import {
  Form,
  PasswordInput,
  EmailInput,
  TextInput,
  SubmitButton,
  FieldHeader
} from 'components/common/form';
import { DropdownSelect, AsyncSearchableSelect } from 'components/common/form/select';
import { Modal } from 'components/common/modal';
import { PrimaryButton } from 'components/common/buttons';
import { PublicTeamSearchableSelect } from 'components/common/team-searchable-select';
import { ExistingCompanyModal } from '../company/page';
import PageState from '../company/page-state';

import BACKGROUND from 'img/nike-react-background.jpg';
import NIKE_REACT_LOGO from 'img/nike-react-logo.png';

const LOGIN_PATH = '/accounts/login/';
const RETAILERS_ID_LIST = [
  11744,
  6362,
  11485,
  44,
  11753,
  12010,
  10766,
  12014,
  7512,
  12015,
  6360,
  10460,
  11755,
  11056,
  6987,
  11745,
  12016,
  12017,
  12018,
  12019,
  12020,
  7164,
  9809,
  2936
];

const ROLES = {
  sales_associate: 'sales_associate',
  store_manager: 'store_manager',
  training_manager: 'training_manager',
  department_manager: 'department_manager',
  head_office_staff: 'head_office_staff'
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '30px 0',
    minHeight: '100vh',
    backgroundImage: `url(${BACKGROUND})`,
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    backgroundSize: 'cover'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    display: 'block',
    marginBottom: 20
  },
  formContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '42vw',
    backgroundColor: Style.vars.colors.get('white'),
    boxShadow: 'rgba(0,0,0,.2) 0 1px 12px',
    [Style.vars.media.get('mobile')]: {
      width: '85vw'
    }
  },
  formLogo: {
    width: '15vw',
    height: '15vw',
    backgroundImage: `url(${NIKE_REACT_LOGO})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    [Style.vars.media.get('mobile')]: {
      width: '20vw',
      height: '20vw'
    }
  },
  headerText: {
    fontSize: 30,
    maxWidth: '90%',
    marginBottom: 20,
    fontWeight: 300,
    color: Style.vars.colors.get('textBlack'),
    display: 'flex',
    justifyContent: 'center',
    [Style.vars.media.get('mobile')]: {
      fontSize: 26
    }
  },
  headerTextInner: {
    maxWidth: '90%',
    textAlign: 'center',
    lineHeight: 1.2,
    textTransform: 'uppercase'
  },
  form: {
    width: '75%'
  },
  input: {
    marginTop: 10,
    background: 'none',
    borderStyle: 'none',
    color: Style.vars.colors.get('xxxDarkGrey')
  },
  errorMsg: {
    color: Style.vars.colors.get('errorRed')
  },
  hr: {
    marginTop: '-20px',
    border: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  signupButton: {
    height: 50,
    background: Style.vars.colors.get('primary'),
    borderRadius: 0,
    width: '100%',
    margin: '20px 0',
    lineHeight: 2,
    color: Style.vars.colors.get('white')
  },
  submitButton: {
    background: Style.vars.colors.get('primary'),
    borderRadius: 0,
    width: '100%',
    margin: '20px 0',
    color: Style.vars.colors.get('white')
  },
  submitButtonInvalid: {
    background: Style.vars.colors.get('fadedPrimary'),
    cursor: 'not-allowed'
  },
  button: {
    marginLeft: 0
  },
  dropdown: {
    container: {
      margin: '10px 0'
    }
  },
  linkHover: {
    textDecoration: 'underline'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    display: 'block',
    marginBottom: 20
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    [Style.vars.media.get('mobile')]: {
      padding: '1rem'
    }
  }
};

@Radium
class JoinCompanyModal extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedCompany: false,
      newCompany: null,
      loading: false
    };
  }

  onSubmitAndValid = data => {
    const loading = data.company && data.teamURL && data.teamURL !== 'create a team';
    this.setState({ loading }, () => {
      this.props.joinOrCreateCompany(data, null);
    });
  };

  render() {
    return (
      <Modal ref={x => (this.joinCompanyModal = x)}>
        <div style={styles.modalContent} className="nike-custom-font">
          <h3 style={{ textAlign: 'center' }}>{t('select_retailer')}</h3>
          <Form
            onSubmitAndValid={this.onSubmitAndValid}
            className="nike-custom-font"
            ref={x => (this.modalForm = x)}
          >
            <AsyncSearchableSelect
              {...this.props}
              placeholder={`${t('search_retailer')}...`}
              initialValue={this.state.newCompany}
              fetch={this.props.fetch}
              makeOption={this.props.makeOption}
              name="company"
              // breaks if ref isn't a string
              ref="searchableCompany"
              required
              onSearchInputChange={input => {
                if (input !== this.state.newCompany) {
                  this.setState({ newCompany: input });
                }
              }}
              onChange={val => {
                if (val) {
                  const teams = val.get('learnergroups')
                    ? _.map(val.get('learnergroups'), t => ({
                      value: t.url,
                      label: t.name
                    }))
                    : {};
                  this.setState({ selectedCompany: val });
                } else if (this.state.selectedCompany) {
                  this.setState({ selectedCompany: false });
                }
              }}
            />
            <p style={{ textAlign: 'center' }}>{t('search_and_select_retailer')}</p>

            {this.state.selectedCompany && (
              <div>
                <PublicTeamSearchableSelect
                  company={this.state.selectedCompany}
                  style={styles.input}
                  selectStyle={styles.input}
                  placeholder={t('select_your_store')}
                  name="teamURL"
                  allowNoneOpt
                  required={false}
                />
                <p style={{ textAlign: 'center' }}>{t('if_store_not_listed')}</p>
              </div>
            )}
            <SubmitButton
              style={styles.submitButton}
              invalidStyle={styles.submitButtonInvalid}
              text={t('join')}
              loading={this.state.loading}
              className="btn"
            />
          </Form>
          <h3 style={{ margin: '25px 0 15px 0', textAlign: 'center' }}>{t('or_add_retailer')}</h3>
          <PrimaryButton
            onClick={() => {
              this.props.joinOrCreateCompany(null, null);
            }}
            style={styles.button}
          >
            {t('add_my_retailer')}
          </PrimaryButton>
        </div>
      </Modal>
    );
  }
}

@Radium
class CreateTeamModal extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false
    };
  }

  onSubmitAndValid = data => {
    this.setState({ loading: true }, () => {
      this.props.submitAndHideModal({ newTeam: data.name, loading: true }, null, false);
    });
  };

  render() {
    return (
      <Modal ref={x => (this.createTeamModal = x)} header={t('add_store')}>
        <div style={styles.modalContent} className="nike-custom-font">
          <Form
            onSubmitAndValid={this.onSubmitAndValid}
            className="nike-custom-font"
            ref={x => (this.createTeamForm = x)}
          >
            <TextInput
              className="nike-custom-font"
              name="name"
              placeholder={t('input_your_store')}
              placeholderColor="faded"
              style={styles.input}
              onChange={this.onInputChange}
              errorMsgStyle={styles.errorMsg}
              required
            />
            <hr style={styles.hr} />
            <SubmitButton
              style={styles.submitButton}
              invalidStyle={styles.submitButtonInvalid}
              text={t('add')}
              loading={this.state.loading}
              className="btn"
            />
          </Form>
        </div>
      </Modal>
    );
  }
}

@Radium
class CustomSignUpPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loginError: null,
      loading: false,
      creatingNewCompany: false,
      selectedCompany: false,
      teams: {},
      selectedTeam: null,
      newCompany: null,
      newTeam: null
    };
  }

  fetch = search => {
    if (!search) return null;
    return PublicCompaniesState.Store.getItems({
      limit: 0,
      search,
      id__in: RETAILERS_ID_LIST,
      ordering: '-search_rank',
      fields: [
        'url',
        'id',
        'company_name',
        'learnergroups',
        'learnergroups.name',
        'learnergroups.url',
        'companysettings',
        'companysettings.allow_signups_to_create_teams'
      ]
    });
  };

  makeOption = u => {
    const label = u.get('company_name');
    return {
      value: u,
      label
    };
  };

  onInputChange = () => {
    this.setState({ loginError: null });
  };

  checkEmailIsUnique(val) {
    const p = new Promise((pResolve, reject) => {
      PublicUsersState.ActionCreators.doListAction('check_email_is_unique', { email: val }).then(res => {
        pResolve(res.body.is_unique);
      });
    });
    return p;
  }

  onSubmitAndValid = data => {
    if (!data.company && !this.state.creatingNewCompany) {
      if (this.state.newCompany && this.props.existingCompany) {
        this.existingCompanyModal.show();
        return;
      }
      this.joinCompanyContainer.joinCompanyModal.show();
      return;
    }
    if (data.company) {
      if (
        (!data.teamURL || data.teamURL === 'create a team') &&
        data.company.get('companysettings').allow_signups_to_create_teams &&
        (!this.state.selectedTeam || this.state.selectedTeam === 'create a team') &&
        !this.state.newTeam
      ) {
        this.createTeamContainer.createTeamModal.show();
        return;
      }
    }
    this.createAccount(data);
  };

  getDetails = data => {
    const groups = [];
    let companyURL;
    if (!this.state.creatingNewCompany && !this.state.newCompany) {
      companyURL = data.company.get('url');
    }
    const nameParts = data.name.split(' ');
    const teamURL = this.state.selectedTeam ? this.state.selectedTeam : data.teamURL;
    const details = {
      first_name: nameParts[0],
      last_name: nameParts[1],
      learner__role: data.role,
      email: data.email.toLowerCase(),
      password: data.password,
      subscribe: false,
      groups,
      locale: getCurrentLocale(),
      company: companyURL
    };
    if (teamURL && teamURL !== 'create a team') {
      details.learner_group = teamURL;
    }
    return details;
  };

  getChannelViewUrl = () => {
    const channel = this.props.link.get('channels')[0];
    const firstChannelId = this.props.link.get('initial_channel')
      ? this.props.link.get('initial_channel').id
      : channel.id;
    return `${getOrigin()}/views/channel-content/${firstChannelId}/${this.props.link.get('name')}`;
  };

  createTeam = (companyID, userID) => {
    const newTeamData = {
      name: this.state.newTeam,
      description: '',
      auto_enroll_plans: [],
      company: `http://localhost:8000/api/v1/companies/${companyID}/`
    };
    TeamsState.ActionCreators.create(newTeamData)
      .then(res => {
        const newTeamUrl = res.body.url;
        UsersState.ActionCreators.doDetailAction(userID, 'set_learner_group', {
          learner_group: newTeamUrl
        })
          .then(res => {
            window.location.href = this.getChannelViewUrl();
          })
          .catch(err => {
            console.log(err);
          });
      })
      .catch(err => {
        console.log(err);
      });
  };

  createAccount = data => {
    const details = this.getDetails(data);
    this.setState({ loading: true });
    PublicUsersState.ActionCreators.doListAction('create_and_login', details)
      .then(res => {
        const userID = res.body.id;
        if (
          details.company &&
          !(
            (!details.learner_group || details.learner_group === 'create a team') &&
            this.state.newTeam
          )
        ) {
          window.location.href = this.getChannelViewUrl();
        } else if (
          (!details.learner_group || details.learner_group === 'create a team') &&
          this.state.newTeam
        ) {
          this.createTeam(data.company.get('id'), userID);
        } else {
          this.context.router.push({
            pathname: `/signup/company/${this.props.link.get('name')}`,
            state: { newCompanyName: this.state.newCompany, link: this.props.link.get('name') }
          });
        }
      })
      .catch(err => {
        this.setState({ loading: false });
        console.log(err);
      });
  };

  submitAndHideModal = (newState, modal, company) => {
    if (company) {
      this.customSignupForm.refs.searchableCompany.state.value = company;
    }
    if (modal) {
      modal.hide();
    }
    this.setState(newState, () => {
      this.customSignupForm.onSubmit();
    });
  };

  joinOrCreateCompany = (data, modal) => {
    if (data) {
      this.submitAndHideModal(
        { newCompany: null, creatingNewCompany: false, selectedTeam: data.teamURL },
        modal,
        data.company
      );
    } else {
      this.submitAndHideModal({ creatingNewCompany: true }, modal, data);
    }
  };

  goToLogIn = () => {
    const firstChannel = this.props.link.get('channels')[0].id;
    this.context.router.push({
      pathname: LOGIN_PATH,
      state: { link: this.props.link.get('name'), firstChannelId: firstChannel }
    });
  };

  render() {
    const roleOptions = _.map(ROLES, (v, k) => ({
      value: k,
      label: t(v)
    }));
    return (
      <div style={styles.container} className="nike-custom-font">
        <JoinCompanyModal
          ref={x => (this.joinCompanyContainer = x)}
          fetch={this.fetch}
          makeOption={this.makeOption}
          joinOrCreateCompany={this.joinOrCreateCompany}
        />
        <CreateTeamModal
          ref={x => (this.createTeamContainer = x)}
          submitAndHideModal={this.submitAndHideModal}
        />
        {this.props.existingCompany && (
          <ExistingCompanyModal
            ref={x => (this.existingCompanyModal = x)}
            existingCompany={this.props.existingCompany}
            createCompany={() => {
              this.joinOrCreateCompany(null, this.joinCompanyContainer.joinCompanyModal);
            }}
            onJoinCompanyFormSubmit={data => {
              this.joinOrCreateCompany(
                { teamURL: data.teamURL, company: this.props.existingCompany },
                this.joinCompanyContainer.joinCompanyModal
              );
            }}
            createNewCompanyOpt
          />
        )}
        <div style={styles.formContainer}>
          <div style={styles.formLogo} />
          <div style={styles.headerText}>
            <div style={styles.headerTextInner} className="nike-custom-font">
              {t('access_react_training')}
            </div>
          </div>
          <Form
            onSubmitAndValid={this.onSubmitAndValid}
            style={styles.form}
            ref={x => (this.customSignupForm = x)}
            className="nike-custom-font"
          >
            <TextInput
              className="nike-custom-font"
              name="name"
              placeholder={t('full_name')}
              placeholderColor="faded"
              style={styles.input}
              onChange={this.onInputChange}
              errorMsgStyle={styles.errorMsg}
              required
            />
            <hr style={styles.hr} />

            <EmailInput
              className="nike-custom-font"
              name="email"
              placeholder={t('email')}
              isUnique={this.checkEmailIsUnique}
              placeholderColor="faded"
              style={styles.input}
              onChange={this.onInputChange}
              errorMsgStyle={styles.errorMsg}
              required
            />
            <hr style={styles.hr} />

            <PasswordInput
              className="nike-custom-font"
              name="password"
              placeholder={t('password')}
              placeholderColor="faded"
              style={styles.input}
              onChange={this.onInputChange}
              errorMsgStyle={styles.errorMsg}
              required
            />
            <hr style={styles.hr} />
            <DropdownSelect
              className="nike-custom-font"
              name="role"
              style={styles.dropdown}
              options={roleOptions}
              placeholder={t('role')}
              onChange={this.inputChanged}
              noSelectionText={`${t('select_role')}...`}
              required
            />
            <AsyncSearchableSelect
              {...this.props}
              className="nike-custom-font"
              placeholder={`${t('search_retailer')}...`}
              initialValue={this.state.newCompany}
              fetch={this.fetch}
              makeOption={this.makeOption}
              // breaks if ref isn't a string
              ref="searchableCompany"
              name="company"
              onSearchInputChange={input => {
                if (input !== this.state.newCompany) {
                  PageState.ActionCreators.setSearch(input);
                  this.setState({ newCompany: input });
                }
              }}
              onChange={val => {
                if (val) {
                  const teams = val.get('learnergroups')
                    ? _.map(val.get('learnergroups'), t => ({
                      value: t.url,
                      label: t.name
                    }))
                    : {};
                  this.setState({ selectedCompany: val, teams, newCompany: null });
                } else if (this.state.selectedCompany) {
                  this.setState({ selectedCompany: false });
                }
              }}
            />
            <p style={{ textAlign: 'center' }}>{t('search_and_select_retailer')}</p>

            {this.state.selectedCompany && (
              <div>
                <PublicTeamSearchableSelect
                  className="nike-custom-font"
                  company={this.state.selectedCompany}
                  style={styles.input}
                  placeholder={t('select_your_store')}
                  selectStyle={styles.input}
                  name="teamURL"
                  allowNoneOpt
                  required={false}
                />
                <p style={{ textAlign: 'center' }}>{t('if_store_not_listed')}</p>
              </div>
            )}

            <SubmitButton
              style={styles.signupButton}
              invalidStyle={styles.submitButtonInvalid}
              text={t('sign_up')}
              className="btn nike-custom-font"
              loading={this.state.loading}
            />
          </Form>
          <HoverableLink
            hoverStyle={styles.linkHover}
            style={styles.existingAccountLink}
            onClick={this.goToLogIn}
            className="nike-custom-font"
          >
            {t('i_already_have_an_account')}
            <i className="angle right icon" />
          </HoverableLink>
        </div>
        <PoweredByMyagi />
      </div>
    );
  }
}

const PageInner = Marty.createContainer(CustomSignUpPage, {
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
        ordering: '-search_rank',
        id__in: RETAILERS_ID_LIST,
        fields: [
          $y.getFields(ExistingCompanyModal, 'existingCompany'),
          'companysettings',
          'companysettings.allow_signups_to_create_teams'
        ]
      });
    }
  },

  done(results) {
    const { existingCompanies } = results;
    let existingCompany;
    if (existingCompanies) existingCompany = existingCompanies.get(0);
    return <CustomSignUpPage {...this.props} existingCompany={existingCompany} />;
  },

  pending() {
    return containerUtils.defaultPending(this, CustomSignUpPage, {
      isFetching: true
    });
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CustomSignUpPage, errors);
  }
});

export class Page extends React.Component {
  render() {
    return (
      <PublicStyling>
        <PageInner />
      </PublicStyling>
    );
  }
}
