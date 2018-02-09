import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import _ from 'lodash';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';
import Style from 'style/index';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { t } from 'i18n';

import PublicCompaniesState from 'state/public-companies';
import PublicUsersState from 'state/public-users';

import { ThinBox } from 'components/common/box';
import { Form, EmailInput } from 'components/common/form';

import MYAGI_LOGO from 'img/logo.svg';

const styles = {
  container: {
    background: Style.vars.colors.get('white'),
    color: Style.vars.colors.get('xxxDarkGrey'),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    minHeight: 650,
    width: '100vw'
  },
  formTitle: {
    fontSize: 15,
    marginTop: 0,
    color: Style.vars.colors.get('xxxDarkGrey'),
    opacity: 0.4,
    textAlign: 'center'
  },
  formContainer: {
    maxWidth: 400,
    width: '100%',
    margin: 'auto',
    marginTop: 0,
    borderRadius: 5
  },
  form: {
    paddingLeft: 50,
    paddingRight: 50,
    marginTop: 30,
    marginBottom: 17
  },
  submitButton: {
    height: 50,
    background: Style.vars.colors.get('primary'),
    border: `2px solid ${Style.vars.colors.get('primary')}`,
    borderRadius: 0,
    width: '100%',
    marginTop: 30,
    color: Style.vars.colors.get('white')
  },
  logo: {
    margin: '12vh auto 15px auto',
    height: 150,
    width: 220,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  input: {
    height: 46,
    background: 'none',
    borderStyle: 'none',
    color: Style.vars.colors.get('xxxDarkGrey')
  },
  hr: {
    marginTop: '-20px',
    border: 0,
    borderTop: `1px solid ${Style.vars.colors.get('xDarkGrey')}`
  },
  resetContainer: {
    textAlign: 'center',
    color: Style.vars.colors.get('xxxDarkGrey')
  },
  resetHeader: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    fontSize: 20
  },
  errorCode: {
    color: Style.vars.colors.get('errorRed'),
    textAlign: 'center'
  }
};

export class PasswordPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      resetRequested: false,
      resetError: null,
      createPasswordPage: false
    };
  }

  componentDidMount() {
    if (window.location.pathname.indexOf('create-password') > -1) {
      this.setState({ createPasswordPage: true });
    }
  }

  onSubmitAndValid = data => {
    const form = this.refs.passwordResetForm;

    PublicUsersState.ActionCreators.doListAction('reset_password', {
      email: data.email
    })
      .then(res => {
        this.setState({ resetRequested: true });
      })
      .catch(err => {
        const notFound = t('email_address_not_found');
        this.setState({ resetError: notFound });
      });
  };

  onEmailChange = () => {
    this.setState({ resetError: null });
  };

  render() {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.logo, backgroundImage: `url(${MYAGI_LOGO})` }} />

        <div style={styles.formTitle}>
          <h3>
            {this.state.createPasswordPage ? t('to_use_apps_create_password') : t('password_reset')}
          </h3>
        </div>
        <br />
        <div style={styles.formContainer}>
          {this.state.resetRequested ? (
            <div style={styles.resetContainer}>
              <p>
                {t('we_have_sent_you_an_email')}. <br />
                {t('please_contact_us_if_you_dont')}.
              </p>
            </div>
          ) : (
            <Form
              onSubmitAndValid={this.onSubmitAndValid}
              style={styles.form}
              ref="passwordResetForm"
            >
              <EmailInput
                className="form-control"
                name="email"
                placeholder={t('email')}
                placeholderColor="gray"
                style={styles.input}
                onChange={this.onEmailChange}
                required
              />
              <hr style={styles.hr} />
              {this.state.resetError ? (
                <div style={styles.errorCode}>
                  <p>{this.state.resetError}</p>
                </div>
              ) : null}
              <button style={styles.submitButton} className="btn">
                {this.state.createPasswordPage ? t('create') : t('reset')}
              </button>
            </Form>
          )}
        </div>
      </div>
    );
  }
}

export class Page extends React.Component {
  render() {
    return (
      <ThinBox style={styles.container}>
        <PasswordPage />
      </ThinBox>
    );
  }
}
