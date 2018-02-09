import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import Style from 'style';
import StyleCustomization from 'style/customization';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getSubdomain } from 'utilities/generic';
import { qs, getOrigin } from 'utilities/http';

import { t } from 'i18n';

import PublicCompaniesState from 'state/public-companies';
import PublicUsersState from 'state/public-users';

import Announcement from 'components/app/announcement';
import { HoverMixin } from 'components/common/hover';
import { LoadingContainer } from 'components/common/loading';
import { Box, ThinBox, BoxContent } from 'components/common/box';
import { Checkbox } from 'components/common/form/checkbox';
import { HoverableLink } from 'components/common/hover';
import { Info } from 'components/common/info';
import { Form, PasswordInput, EmailInput, SubmitButton, FieldHeader } from 'components/common/form';

import MYAGI_LOGO from 'img/logo.svg';

const styles = {
  container: {
    background: Style.vars.colors.get('white'),
    color: Style.vars.colors.get('softText'),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    paddingBottom: 30
  },
  checkboxLabel: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    marginLeft: 10
  },
  signInForm: {
    margin: '15px 0px',
    width: 300
  },
  signInButton: {
    height: 50,
    marginTop: 40,
    color: Style.vars.colors.get('white'),
    lineHeight: 2
  },
  signupText: {
    marginTop: 25,
    color: Style.vars.colors.get('xxxDarkGrey'),
    textAlign: 'center',
    fontSize: '1.2em'
  },
  logo: {
    height: 150,
    width: 220,
    marginTop: 40,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  input: {
    background: 'none',
    backgroundColor: Style.vars.colors.get('white'),
    borderStyle: 'none',
    color: Style.vars.colors.get('xxxDarkGrey'),
    marginTop: 20
  },
  hr: {
    marginTop: '-20px',
    borderTop: `1px solid ${Style.vars.colors.get('xDarkGrey')}`
  },
  socialButton: {
    marginTop: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingLeft: 11,
    background: 'none',
    border: '2px solid ',
    backgroundColor: Style.vars.colors.get('white')
  },
  socialButtonHover: {
    color: Style.vars.colors.get('white')
  },
  socialButtonsContainer: {
    padding: '0px 50px 20px 50px',
    textAlign: 'center'
  },
  socialLink: {
    padding: 12
  },
  bottomLink: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    margin: 10,
    display: 'block'
  },
  errorCode: {
    color: Style.vars.colors.get('errorRed'),
    textAlign: 'center'
  },
  forgotPassword: {
    color: Style.vars.colors.get('errorRed'),
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

@reactMixin.decorate(HoverMixin)
class SocialButton extends React.Component {
  render() {
    const primary = Style.vars.colors
      .get('primary')
      .toString()
      .startsWith('#ff')
      ? Style.vars.colors.get('darkPrimary')
      : Style.vars.colors.get('primary');
    let style = this.getHoverStyle(
      { ...styles.socialButton, color: primary, borderColor: primary },
      { ...styles.socialButtonHover, backgroundColor: primary }
    );
    style = Style.funcs.merge(style, this.props.style);
    return (
      <button
        {...this.getHoverProps()}
        style={style}
        onClick={this.props.onClick}
        onTouchEnd={this.props.onClick}
      >
        {this.props.children}
      </button>
    );
  }
}

class SocialLogin extends React.Component {
  render() {
    return (
      <div className="social-signin-btn" style={styles.socialButtonsContainer}>
        {/* Google login does not work for subdomains, so just hide it. */}
        {!this.props.subdomain && (
          <a href="/accounts/google/login/?process=login" style={styles.socialLink}>
            <SocialButton className="btn g-button">
              <i className="google plus icon" />
            </SocialButton>
          </a>
        )}
        <a href="/accounts/facebook/login/?process=login" style={styles.socialLink}>
          <SocialButton className="btn g-button">
            <i className="facebook icon" />
          </SocialButton>
        </a>
        <a href="/accounts/linkedin/login/?process=login" style={styles.socialLink}>
          <SocialButton className="btn g-button">
            <i className="linkedin icon" />
          </SocialButton>
        </a>
      </div>
    );
  }
}

class LoginPage extends React.Component {
  static data = {
    company: {
      required: false,
      fields: [
        'id',
        'url',
        'company_name',
        'company_logo',
        'companysettings.style_customization_enabled',
        'companysettings.nav_logo',
        'companysettings.nav_color',
        'companysettings.primary_color'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loginError: null,
      loading: false,
      incorrectPassword: false
    };
  }

  componentWillMount() {
    if (this.props.company) {
      StyleCustomization.setStylingForCompany(this.props.company);
      // Force body background to change
      document.body.style.backgroundColor = Style.vars.colors.get('mediumGrey');
    }
  }

  componentDidMount() {
    this.refs.loginForm.refs.email.focus();
  }

  onSubmitAndValid = data => {
    this.setState({ loading: true });
    PublicUsersState.ActionCreators.doListAction('login', data)
      .then(res => {
        const linkName = this.context.location.state && this.context.location.state.link;
        const channelId = this.context.location.state && this.context.location.state.firstChannelId;
        let next = res.body.tmp_new_home_page_enabled ? '/views/home/' : '/views/training/';
        if (linkName) {
          next = `/views/channel-content/${channelId}/${linkName}`;
        }
        const nextQS = qs('next');
        if (nextQS) {
          next = nextQS;
        }
        // page must be re-loaded to fetch new CSRF token
        window.location.href = getOrigin() + next;
      })
      .catch(err => {
        let error;
        // Default error code
        let errorCode = 403;
        if (err.response && err.response.status) {
          errorCode = err.response.status;
        }
        if (errorCode === 400) {
          this.setState({ incorrectPassword: true });
          error = 'invalid_email_or_password';
        }
        if (errorCode === 302) {
          window.location.href = `${getOrigin()}/views/join-or-create-company/`;
        }
        if (errorCode === 403) error = t('account_deactivated');
        this.setState({ loginError: error, loading: false });
      });
  };

  onInputChange = () => {
    this.setState({ loginError: null });
  };

  render() {
    let logoURL = MYAGI_LOGO;
    const companyLogo = this.props.company && this.props.company.get('company_logo');
    if (companyLogo) {
      logoURL = companyLogo;
    }
    const logo = <div style={{ ...styles.logo, backgroundImage: `url(${logoURL})` }} />;
    const primary = Style.vars.colors
      .get('primary')
      .toString()
      .startsWith('#ff')
      ? Style.vars.colors.get('darkPrimary')
      : Style.vars.colors.get('primary');
    return (
      <div>
        <Announcement />
        <div style={styles.container}>
          {logo}

          <Form onSubmitAndValid={this.onSubmitAndValid} style={styles.signInForm} ref="loginForm">
            <EmailInput
              name="email"
              ref="email"
              placeholder={t('email')}
              placeholderColor="darkGrey"
              style={styles.input}
              onChange={this.onInputChange}
              required
            />
            <hr style={styles.hr} />

            <PasswordInput
              name="password"
              placeholder={t('password')}
              placeholderColor="darkGrey"
              style={styles.input}
              onChange={this.onInputChange}
              ref="passwordInput"
              required
            />
            <hr style={styles.hr} />

            <div style={styles.errorCode}>
              {this.state.loginError ? <p>{t(this.state.loginError)}</p> : null}
              {this.state.incorrectPassword ? (
                <a
                  style={styles.forgotPassword}
                  href="/accounts/password-reset/"
                  onClick={this.onForgotPasswordClick}
                >
                  {t('forgot_your_password')}
                </a>
              ) : null}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Checkbox
                style={{ marginTop: 3 }}
                onChange={this.onInputChange}
                label={t('i_am_using_a_shared_computer')}
                name="publicComputer"
              />
              <span style={styles.checkboxLabel}>{t('i_am_using_a_shared_computer')}</span>
              <Info style={{ marginLeft: 3 }} content={t('you_will_be_logged_out')} />
            </div>

            <SubmitButton
              style={{ ...styles.signInButton, backgroundColor: primary }}
              text={t('log_in')}
              className="btn"
              loading={this.state.loading}
            />

            <div style={styles.signupText}>{t('or')}</div>
          </Form>
          <SocialLogin subdomain={this.props.subdomain} />
          <a
            style={styles.bottomLink}
            href="/accounts/password-reset/"
            onClick={this.onForgotPasswordClick}
          >
            {t('forgot_your_password')}
          </a>
          <a style={styles.bottomLink} href="/signup/user/">
            {_.capitalize(t('sign_up').toLowerCase())}
          </a>
        </div>
      </div>
    );
  }
}

class LoginPageContainer extends React.Component {
  static data = {
    company: $y.getData(LoginPage, 'company', { required: false })
  };

  render() {
    const sub = getSubdomain();
    if (sub) {
      return (
        <LoadingContainer
          spinnerProps={{
            containerStyle: { backgroundColor: Style.vars.colors.get('mediumGrey') }
          }}
          loadingProps={[this.props.company]}
          createComponent={() => <LoginPage {...this.props} subdomain={sub} />}
        />
      );
    }
    return <LoginPage {...this.props} />;
  }
}

export const Page = Marty.createContainer(LoginPageContainer, {
  listenTo: [PublicCompaniesState.Store],

  fetch: {
    companies() {
      const sub = getSubdomain();
      if (!sub) {
        return Im.List();
      }
      return PublicCompaniesState.Store.getItems({
        fields: $y.getFields(LoginPageContainer, 'company'),
        subdomain__iexact: sub
      });
    }
  },

  done(results) {
    const company = results.companies.first();
    return <LoginPageContainer {...this.props} {...results} company={company} />;
  },

  pending() {
    return containerUtils.defaultPending(this, LoginPageContainer);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, LoginPageContainer, errors);
  }
});
