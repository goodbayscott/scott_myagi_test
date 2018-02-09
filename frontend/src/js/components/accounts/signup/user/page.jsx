import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import Style from 'style';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getSubdomain } from 'utilities/generic';
import { qs, getOrigin } from 'utilities/http';

import { t, getCurrentLocale } from 'i18n';

import PublicCompaniesState from 'state/public-companies';
import PublicUsersState from 'state/public-users';

import { PublicTeamSearchableSelect } from 'components/common/team-searchable-select';
import { HoverMixin } from 'components/common/hover';
import { LoadingContainer } from 'components/common/loading';
import { HoverableLink } from 'components/common/hover';
import {
  Form,
  PasswordInput,
  EmailInput,
  TextInput,
  SubmitButton,
  FieldHeader
} from 'components/common/form';
import { Checkbox } from 'components/common/form/checkbox';
import { PublicStyling, FallbackLogo } from 'components/common/public-styling';
import { Image } from 'components/common/image';
import { ANALYTICS_EVENTS } from 'core/constants';

import trophyImg from 'img/trophy.svg';
import computerImg from 'img/computer.svg';
import messagesImg from 'img/messages.png';
import logoImg from 'img/logo.svg';

const LOGIN_PATH = '/accounts/login/';

const styles = {
  container: {
    color: Style.vars.colors.get('softText'),
    display: 'flex',
    justifyContent: 'center',
    margin: '0 auto',
    paddingTop: 150,
    width: '60%',
    [Style.vars.media.get('xTablet')]: {
      width: '80%'
    },
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column',
      width: '100%',
      paddingTop: 0
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
  headerText: {
    fontSize: '30px !important',
    maxWidth: 500,
    marginBottom: 50,
    fontWeight: 300,
    color: Style.vars.colors.get('primary'),
    display: 'flex',
    justifyContent: 'center',
    [Style.vars.media.get('mobile')]: {
      margin: '20px 0'
    }
  },
  headerTextInner: {
    maxWidth: 450,
    textAlign: 'center',
    lineHeight: 1
  },
  signupFormContainer: {
    maxWidth: 500,
    margin: '10px auto auto auto',
    borderRadius: 5,
    [Style.vars.media.get('mobile')]: {
      margin: '20px auto auto auto'
    }
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
  input: {
    marginTop: '3vh',
    background: 'none',
    borderStyle: 'none',
    color: Style.vars.colors.get('xxxDarkGrey')
  },
  checkbox: {
    color: 'white'
  },
  checkboxLabel: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    marginLeft: 10
  },
  linkHover: {
    textDecoration: 'underline'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    display: 'block'
  },
  whatIsMyagiLink: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 30,
    display: 'block'
  },
  forwardIcon: {
    margin: '0, 0, 15px, 0'
  },
  hr: {
    marginTop: '-20px',
    border: '1px solid ',
    borderColor: Style.vars.colors.get('mediumGrey')
  },
  socialSpan: {
    display: 'inline-block',
    width: 5
  },
  socialButton: {
    marginTop: 10,
    minWidth: 50,
    maxWidth: 50,
    minHeight: 50,
    maxHeight: 60,
    borderRadius: 25,
    color: '#fff',
    paddingLeft: 17,
    background: 'none',
    border: '1px solid white',
    opacity: 0.4
  },
  socialButtonHover: {
    backgroundColor: '#abb2b5'
  },
  socialButtonsContainer: {
    padding: '0px 50px 20px 50px'
  },
  formHeader: {
    textAlign: 'center',
    height: 100,
    borderRadius: '5px 5px 0px 0px'
  },
  redirect: {
    fontSize: '1.1em',
    marginTop: 10
  },
  errorCode: {
    color: Style.vars.colors.get('errorRed'),
    textAlign: 'center'
  },
  infoHalf: {
    background: Style.vars.colors.get('white'),
    flex: '10%',
    order: 1,
    marginTop: 20,
    position: 'relative',
    [Style.vars.media.get('mobile')]: {
      flex: '100%',
      order: '2',
      marginTop: 50,
      maxWidth: '100%'
    }
  },
  sliderContainer: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    width: '100%',
    paddingBottom: 30,
    [Style.vars.media.get('mobile')]: {
      marginTop: 0
    }
  },
  sliderTitle: {
    fontSize: 25,
    [Style.vars.media.get('mobile')]: {
      fontSize: 24
    }
  },
  sliderInfo: {
    fontSize: 15,
    lineHeight: 1.5,
    textAlign: 'left'
  },
  formContainer: {
    flex: '50%',
    order: '2',
    backgroundColor: Style.vars.colors.get('white'),
    [Style.vars.media.get('mobile')]: {
      flex: '100%',
      order: '1',
      paddingTop: 100
    }
  },
  errorMsg: {
    color: Style.vars.colors.get('errorRed')
  },
  sliderImg: {
    height: 110,
    backgroundColor: 'none',
    margin: '0 auto 25px auto',
    [Style.vars.media.get('mobile')]: {
      marginTop: '100px !important'
    }
  },
  companyLogo: {
    height: 120,
    width: 200,
    margin: '5rem auto 0 auto',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    [Style.vars.media.get('mobile')]: {
      margin: '2rem auto 0 auto'
    },
    [Style.vars.media.get('xSmall')]: {
      margin: '1.5rem auto 0 auto'
    }
  },
  descText: {
    color: '#637280'
  }
};

@Radium
export class Carousel extends React.Component {
  // Only way I could fix the carousel bug caused upon initialization
  componentDidMount() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  }

  render() {
    const settings = {
      dots: false,
      arrows: false,
      infinite: false,
      autoplay: false,
      autoplaySpeed: 11000,
      pauseOnHover: false,
      swipeToSlide: false
    };

    const slides = [
      {
        img: messagesImg,
        title: t('transform_your_frontline_staff'),
        text: t('myagis_learning_network')
      }
    ];
    return (
      <div style={styles.sliderContainer}>
        <div style={{ width: '100%' }}>
          <img src={messagesImg} style={styles.sliderImg} />
          <ul style={styles.sliderInfo}>
            <span style={{ color: 'rgba(250, 115, 70, 1)', marginLeft: -20 }}>
              {t('with_myagi_you_can')}
            </span>
            <li style={{ marginTop: 20, marginBottom: 20, color: 'rgba(250, 115, 70, 1)' }}>
              <span style={styles.descText}>{t('educate_your_team')}</span>
            </li>
            <li style={{ marginBottom: 20, color: 'rgba(250, 115, 70, 1)' }}>
              <span style={styles.descText}>{t('connect_to_key_partners')}</span>
            </li>
            <li style={{ marginBottom: 20, color: 'rgba(250, 115, 70, 1)' }}>
              <span style={styles.descText}>{t('keep_your_whole_team')}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

@Radium
class UserSignupPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loginError: null,
      loading: false,
      accessCodeError: false
    };
  }

  onSubmitAndValid = data => {
    this.setState({ loading: true });
    const sid = qs('sid');
    data.subscribe = !!data.subscribe;
    const nameParts = data.name.split(' ');
    const company = this.props.subdomainCompany;
    let companyURL;
    if (company && !sid) companyURL = company.get('url');
    const groups = [];
    analytics.track(ANALYTICS_EVENTS.CREATE_USER);
    PublicUsersState.ActionCreators.doListAction('create_and_login', {
      first_name: nameParts[0],
      last_name: nameParts[1],
      email: data.email.toLowerCase(),
      password: data.password,
      invite_id: sid,
      access_code: data.access_code,
      learner_group: data.teamURL,
      subscribe: data.subscribe,
      groups,
      // This will be set by navigator locale or querystring
      locale: getCurrentLocale(),
      company: companyURL
    })
      .then(res => {
        // get invitation sid from querystring
        if (sid || company) {
          window.location.href = `${getOrigin()}/views/training/`;
        } else if (this.context.location.state) {
          const linkName = this.context.location.state && this.context.location.state.link;
          this.context.router.push({
            pathname: `/signup/company/${linkName}`,
            state: { link: linkName }
          });
        } else {
          this.context.router.push(`/signup/company/${window.location.search}`);
        }
      })
      .catch(err => {
        let error;
        this.setState({ loading: false });
        let errorCode = 403;
        if (err.response && err.response.status) {
          errorCode = err.response.status;
        }
        if (errorCode === 400) {
          this.setState({ loading: false, accessCodeError: true });
        }
        if (errorCode === 404) {
          error = t('invitation_link_incorrect');
        }
        if (errorCode === 403) error = t('error_creating_account');
        if (error) this.setState({ loginError: error });
      });
  };

  clearAccessCodeError = () => {
    this.setState({ accessCodeError: false });
  };

  checkEmailIsUnique(val) {
    const p = new Promise((pResolve, reject) => {
      PublicUsersState.ActionCreators.doListAction('check_email_is_unique', { email: val }).then(res => {
        pResolve(res.body.is_unique);
      });
    });
    return p;
  }

  onInputChange = () => {
    this.setState({ loginError: null });
  };

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
    const companyLogo =
      this.props.subdomainCompany && this.props.subdomainCompany.get('company_logo');
    const loginURL = this.getLoginURL();
    const sid = qs('sid');
    let hasAccessCode;
    if (this.props.subdomainCompany && !sid) {
      hasAccessCode = this.props.subdomainCompany.get('has_access_code');
    }
    let ueml = qs('ueml');
    if (ueml) {
      ueml = decodeURIComponent(ueml);
    }
    let prefillEmail = ueml || '';
    if (!prefillEmail && this.context.location.state) {
      prefillEmail = this.context.location.state.email;
    }

    const message = this.props.subdomainCompany
      ? t('sign_up_to_join_your_companyname', {
        companyName: this.props.subdomainCompany.get('company_name')
      })
      : this.props.linkCompany
        ? t('sign_up_to_start_viewing_training', {
          companyName: this.props.linkCompany.get('company_name')
        })
        : t('get_your_free_myagi_account');

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
          {companyLogo && (
            <div style={{ ...styles.companyLogo, backgroundImage: `url(${companyLogo})` }} />
          )}

          <div style={styles.signupFormContainer}>
            <div style={styles.headerText}>
              <div style={styles.headerTextInner}>{message}</div>
            </div>
            <Form
              onSubmitAndValid={this.onSubmitAndValid}
              style={styles.signupForm}
              ref="userSignupForm"
            >
              {hasAccessCode ? (
                <div>
                  <TextInput
                    style={styles.input}
                    name="access_code"
                    placeholder={t('company_access_code')}
                    placeholderColor="faded"
                    required
                    errorMsgStyle={styles.errorMsg}
                    onChange={this.clearAccessCodeError}
                  />
                  <hr style={styles.hr} />
                </div>
              ) : null}
              {this.state.accessCodeError && (
                <p style={styles.errorCode}>{t('access_code_incorrect')}</p>
              )}
              <TextInput
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
                name="email"
                placeholder={t('email')}
                initialValue={prefillEmail}
                initialIsAcceptable
                isUnique={this.checkEmailIsUnique}
                placeholderColor="faded"
                style={styles.input}
                onChange={this.onInputChange}
                errorMsgStyle={styles.errorMsg}
                required
              />
              <hr style={styles.hr} />

              <PasswordInput
                name="password"
                placeholder={t('password')}
                placeholderColor="faded"
                style={styles.input}
                onChange={this.onInputChange}
                errorMsgStyle={styles.errorMsg}
                required
              />
              <hr style={styles.hr} />

              {this.props.subdomainCompany && !sid ? (
                <div>
                  <PublicTeamSearchableSelect
                    company={this.props.subdomainCompany}
                    style={styles.input}
                    selectStyle={styles.input}
                    name="teamURL"
                    required
                  />
                  <hr style={styles.hr} />
                </div>
              ) : null}

              <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 35 }}>
                <Checkbox
                  notify={this.onInputChange}
                  label={t('tick_this_box_to_receive_updates')}
                  initialValue={false}
                  name="subscribe"
                />
                <span style={styles.checkboxLabel}>{t('tick_this_box_to_receive_updates')}</span>
              </div>

              {this.state.loginError ? (
                <div style={styles.errorCode}>
                  <p>{this.state.loginError}</p>
                </div>
              ) : null}

              <SubmitButton
                style={styles.signupButton}
                invalidStyle={styles.signupButtonInvalid}
                text={t('next')}
                className="btn"
                loading={this.state.loading}
              />
            </Form>
          </div>
        </div>
      </div>
    );
  }
}

export class Page extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    analytics.track(ANALYTICS_EVENTS.VISIT_SIGNUP);
  }

  render() {
    return (
      <PublicStyling>
        <UserSignupPage />
      </PublicStyling>
    );
  }
}
