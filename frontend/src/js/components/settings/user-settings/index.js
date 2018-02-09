import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import { t } from 'i18n';

import { Form, TextInput, SubmitButton, ImageCropper, EmailInput } from 'components/common/form';
import { DropdownSelect } from 'components/common/form/select';
import { AVAILABLE_LOCALES } from 'i18n/constants';
import { ANALYTICS_EVENTS } from 'core/constants';

import { BoxContent } from 'components/common/box';

import UsersState from 'state/users';
import LearnersState from 'state/learners';

const NOTIFICATION_FREQ_OPTS = {
  Daily: 1,
  Weekly: 7,
  Monthly: 31,
  Never: 0
};

const styles = {
  submitButton: {
    borderRadius: 3,
    width: 150,
    height: 50,
    paddingTop: 18,
    float: 'left'
  },
  profilePhotoCropModal: {
    minHeight: 500
  },
  photoContainer: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  photo: {
    margin: '0 50px 30px 10px'
  }
};

const minLength = (min, val) => {
  if (!val) return true;
  return val && val.length && val.length >= min;
};

const isPasswordValid = _.partial(minLength, 7);

class UserSettingsForm extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      formNotChanged: true,
      passwordFormNotChanged: true
    };
  }

  isConfirmPasswordValid(val) {
    if (!val) return true;
    return isPasswordValid(val) && val === this.state.new_password;
  }

  handlePasswordChange(e) {
    this.setState({
      new_password: e.target.value,
      passwordFormNotChanged: false
    });
  }

  imageChanged() {
    window.onbeforeunload = () => `${t('you_uploaded_a_new_profile_image')}`;
  }

  inputChanged = () => {
    this.setState({ formNotChanged: false });
  };

  handleDetailsSubmit = data => {
    const userData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email
    };

    const learner = {
      job_title: data.job_title,
      phone_number: data.phone_number,
      profile_photo: data.profilePhoto,
      locale: data.locale
    };

    const userId = this.props.currentUser.get('id');
    analytics.track(ANALYTICS_EVENTS.EDIT_USER_DATA, {
      'new email': userData.email,
      'old email': this.props.currentUser.get('email')
    });
    UsersState.ActionCreators.update(userId, userData)
      .then(() =>
        LearnersState.ActionCreators.update(this.props.currentUser.get('learner').id, learner))
      .then(() => {
        this.context.displayTempPositiveMessage({
          heading: 'success',
          body: 'profile_details_saved'
        });
        this.setState({ formNotChanged: true });
      })
      .catch(err => {
        this.context.displayTempNegativeMessage({
          heading: 'error',
          body: 'update_failed'
        });
      })
      .then(() => {
        if (data.locale !== this.props.currentUser.get('learner').locale) {
          window.location.reload();
        }
      });
  };

  handlePasswordSubmit(data) {
    const userId = this.props.currentUser.get('id');
    const form = this.refs.passwordForm;
    const new_password = data.new_password;
    const confirm_password = data.confirm_password;
    const current_password = data.current_password;

    UsersState.ActionCreators.update(userId, data)
      .then(() => {
        if (
          new_password &&
          new_password.length &&
          current_password &&
          current_password.length &&
          confirm_password &&
          confirm_password.length
        ) {
          UsersState.ActionCreators.doDetailAction(userId, 'reset_password', {
            new_password,
            current_password,
            confirm_password
          })
            .then(() => {
              form.refs.new_password.setState({ value: '' });
              form.refs.confirm_password.setState({ value: '' });
            })
            .then(() => {
              this.context.displayTempPositiveMessage({
                heading: 'success',
                body: 'your_password_has_been_updated'
              });
            })
            .catch(err => {
              this.context.displayTempNegativeMessage({
                heading: 'error',
                body: 'password_entered_was_incorrect'
              });
            });
        }
      })
      .then(() => {
        // Always clear out password fields
        form.refs.current_password.setState({ value: '' });
        form.refs.new_password.setState({ value: '' });
        form.refs.confirm_password.setState({ value: '' });
      });
  }

  render() {
    const localeOptions = _.map(AVAILABLE_LOCALES, (v, k) => ({
      value: k,
      label: v
    }));
    const perfNotiOptions = _.map(NOTIFICATION_FREQ_OPTS, (v, k) => ({
      value: v,
      label: t(k)
    }));

    return (
      <div>
        <Form onSubmitAndValid={this.handleDetailsSubmit} ref="form">
          <div style={styles.photoContainer}>
            <div style={styles.photo}>
              <h3>{t('profile_photo')}</h3>
              <ImageCropper
                name="profilePhoto"
                aspectRatio={1}
                onChange={this.inputChanged}
                height={200}
                width={200}
                initialValue={this.props.photoUrl}
              />
            </div>
          </div>

          <div className="ui grid stackable">
            <div className="column six wide">
              <h3>{t('edit_details')}</h3>

              <TextInput
                placeholder={t('first_name')}
                initialValue={this.props.currentUser.get('first_name')}
                name="first_name"
                onChange={this.inputChanged}
                initialIsAcceptable
                required
              />

              <TextInput
                name="last_name"
                placeholder={t('last_name')}
                initialValue={this.props.currentUser.get('last_name')}
                onChange={this.inputChanged}
                initialIsAcceptable
              />

              <EmailInput
                name="email"
                placeholder={t('email')}
                initialValue={this.props.currentUser.get('email')}
                onChange={this.inputChanged}
                initialIsAcceptable
                required
              />

              <TextInput
                name="phone_number"
                placeholder={t('mobile_number')}
                onChange={this.inputChanged}
                initialValue={this.props.currentUser.get('learner').phone_number}
                initialIsAcceptable
              />

              <TextInput
                name="job_title"
                placeholder={t('job_title')}
                onChange={this.inputChanged}
                initialValue={this.props.currentUser.get('learner').job_title}
                initialIsAcceptable
              />
            </div>

            <div className="column six wide">
              <h3>{t('language')}</h3>
              <DropdownSelect
                name="locale"
                options={localeOptions}
                placeholder={t('language')}
                onChange={this.inputChanged}
                initialSelection={this.props.currentUser.get('learner').locale}
                initialIsAcceptable
              />
            </div>
          </div>

          <div className="ui grid stackable" style={{ marginTop: -25 }}>
            <div className="column six wide">
              <SubmitButton
                text={t('update_details')}
                style={styles.submitButton}
                disabled={this.state.formNotChanged}
              />
            </div>
          </div>
        </Form>

        <Form onSubmitAndValid={this.handlePasswordSubmit.bind(this)} ref="passwordForm">
          <div className="ui grid stackable" style={{ marginTop: 50 }}>
            <div className="column six wide">
              <h3>{t('change_password')}</h3>

              <TextInput
                name="current_password"
                ref="current_password"
                placeholder={t('current_password')}
                type="password"
                required={false}
                initialIsAcceptable
              />

              <TextInput
                name="new_password"
                ref="new_password"
                placeholder={t('new_password')}
                type="password"
                required={false}
                onChange={this.handlePasswordChange.bind(this)}
                isValid={isPasswordValid}
                initialIsAcceptable
              />

              <TextInput
                name="confirm_password"
                ref="confirm_password"
                placeholder={t('confirm_password')}
                type="password"
                required={false}
                isValid={this.isConfirmPasswordValid.bind(this)}
                initialIsAcceptable
              />

              <SubmitButton
                text={t('update_password')}
                style={styles.submitButton}
                disabled={this.state.passwordFormNotChanged}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

export class UserSettingsTabContent extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const photoUrl = this.props.currentUser.get('learner').profile_photo;

    return (
      <div>
        <BoxContent>
          <UserSettingsForm
            photoUrl={photoUrl}
            ref="userSettingsForm"
            currentUser={this.props.currentUser}
          />
        </BoxContent>
      </div>
    );
  }
}
