import Marty from 'marty';
import Im from 'immutable';
import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { t } from 'i18n';

import UsersState from 'state/users';
import PublicUsersState from 'state/public-users';

import { PublicStyling } from 'components/common/public-styling';
import { HoverableLink } from 'components/common/hover';
import { Form, EmailInput, SubmitButton } from 'components/common/form';
import { PrimaryButton } from 'components/common/buttons';
import { Image } from 'components/common/image';
import PoweredByMyagi from 'components/app/powered-by';

const LOGIN_PATH = '/accounts/login/';
import MYAGI_LOGO from 'img/logo.svg';

const styles = {
  container: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    width: '80%',
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    minHeight: '100vh',
    [Style.vars.media.get('computer')]: {
      width: '75%'
    },
    [Style.vars.media.get('mobile')]: {
      width: '90%'
    }
  },
  logo: {
    height: '13vh',
    width: '50%',
    margin: '0 auto 3vh auto'
  },
  heading: {
    fontSize: '2.5rem',
    marginBottom: '3rem',
    fontWeight: '400',
    [Style.vars.media.get('mobile')]: {
      fontSize: '2rem'
    },
    [Style.vars.media.get('xSmall')]: {
      fontSize: '1.5rem',
      marginBottom: '1.75rem'
    }
  },
  signUpHeading: {
    paddingBottom: '1rem',
    fontWeight: '400',
    [Style.vars.media.get('mobile')]: {
      paddingBottom: '0.75rem',
      fontSize: '1.2rem'
    }
  },
  emailInputContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  emailInput: {
    border: `1px solid ${Style.vars.colors.get('xDarkGrey')}`,
    width: '40%',
    margin: 0,
    [Style.vars.media.get('xSmall')]: {
      width: '60%'
    }
  },
  signUpButton: {
    height: 37,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('white'),
    margin: '0 0 0 5px'
  },
  signupButtonInvalid: {
    background: Style.vars.colors.get('fadedPrimary'),
    cursor: 'not-allowed'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('primary'),
    textAlign: 'center',
    margin: '10px 0',
    display: 'block',
    fontSize: 15,
    cursor: 'pointer',
    [Style.vars.media.get('xSmall')]: {
      fontSize: 13
    }
  },
  linkHover: {
    color: Style.vars.colors.get('primary'),
    textDecoration: 'underline'
  },
  cardContainer: {
    boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.2)'
  },
  continue: {
    paddingTop: '1.5vh',
    marginBottom: 20
  }
};

@Radium
class SignUp extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loginError: null,
      email: null,
      loading: false
    };
  }

  checkEmailIsUnique(val) {
    const p = new Promise((pResolve, reject) => {
      PublicUsersState.ActionCreators.doListAction('check_email_is_unique', { email: val }).then(res => {
        pResolve(res.body.is_unique);
      });
    });
    return p;
  }

  onEmailChange = e => {
    this.setState({ email: e.target.value, loginError: null });
  };

  onSubmitAndValid = () => {
    this.context.router.push({
      pathname: `/signup/user/${this.props.linkName}`,
      state: { email: this.state.email, link: this.props.linkName }
    });
  };

  goToLogIn = () => {
    this.context.router.push(LOGIN_PATH);
  };

  render() {
    return (
      <div>
        <h3 style={styles.signUpHeading}>{t('to_access_other_content_sign_up_below')}</h3>
        <Form
          onSubmitAndValid={this.onSubmitAndValid}
          style={styles.emailInputContainer}
          ref="sharelinkForm"
        >
          <EmailInput
            name="email"
            type="email"
            style={styles.emailInput}
            placeholder={t('email')}
            onChange={this.onEmailChange}
            isUnique={this.checkEmailIsUnique}
            placeholderColor="gray"
            required
          />
          <SubmitButton
            style={styles.signUpButton}
            invalidStyle={styles.signupButtonInvalid}
            text={t('sign_up')}
            loading={this.state.loading}
          />
        </Form>
        <HoverableLink
          hoverStyle={styles.linkHover}
          style={styles.existingAccountLink}
          onClick={this.goToLogIn}
        >
          {t('i_already_have_an_account')}
          <i style={styles.forwardIcon} className="angle right icon" />
        </HoverableLink>
      </div>
    );
  }
}

class Continue extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  continue = () => {
    this.context.router.push('/views/training/');
  };

  render() {
    return (
      <div style={styles.continue}>
        <PrimaryButton onClick={this.continue}>{t('continue_to_myagi')}</PrimaryButton>
      </div>
    );
  }
}

@Radium
class UnavailableSharelink extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <Image src={MYAGI_LOGO} style={styles.logo} />
        <h1 style={styles.heading}>{t('sharelink_unavailable')}</h1>
        {this.props.currentUser ? (
          <Continue />
        ) : (
          <div>
            <SignUp />
            <PoweredByMyagi />
          </div>
        )}
      </div>
    );
  }
}

class UnavailableSharelinkContainer extends React.Component {
  render() {
    return (
      <PublicStyling>
        <UnavailableSharelink currentUser={this.props.currentUser} />
      </PublicStyling>
    );
  }
}

export const Page = Marty.createContainer(UnavailableSharelinkContainer, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [UsersState.Store],

  fetch: {
    currentUser() {
      const fetch = UsersState.Store.getCurrent();
      return fetch;
    }
  },

  done(results) {
    return (
      <UnavailableSharelinkContainer {...results}>
        {this.props.children}
      </UnavailableSharelinkContainer>
    );
  },

  pending() {
    return containerUtils.defaultPending(this, UnavailableSharelinkContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, UnavailableSharelinkContainer, errors);
  }
});
