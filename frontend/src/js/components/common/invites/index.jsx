import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Clipboard from 'react-clipboard.js';

import TeamsState from 'state/teams';
import EnrollmentGroupsState from 'state/enrollment-groups';
import InvitationsState from 'state/invitations';
import TrainingPlansState from 'state/training-plans';

import Style from 'style/index';

import containerUtils from 'utilities/containers';
import { validateEmail } from 'utilities/validators';
import { getOrigin } from 'utilities/http';

import { t } from 'i18n';

import { Modal } from 'components/common/modal';
import {
  Form,
  TextArea,
  SearchableSelect,
  ButtonToggle,
  SubmitButton
} from 'components/common/form';
import { EnrollmentGroupSearchableMultiSelect } from 'components/common/searchable-multiselect';
import { MultiSelect } from 'components/common/form/select';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';

import { ANALYTICS_EVENTS } from 'core/constants';

const COMPANY_TO_USER_INVITE = 1;
const NO = 'No';
const YES = 'Yes';
const VIA_EMAIL = 'Via Email';
const VIA_LINK = 'Via Link';

const styles = {
  heading: {
    display: 'block',
    float: 'none',
    textAlign: 'left',
    color: Style.vars.colors.get('textBlack')
  },
  content: {},
  methodToggle: {
    container: {
      marginBottom: 30,
      marginLeft: '50%',
      ...Style.funcs.makeTransform('translateX(-50%)')
    },
    button: {
      width: '10em'
    }
  },
  inviteLinkTxt: {
    textAlign: 'center',
    fontWeight: '800'
  },
  linkModalDesc: {
    textAlign: 'center',
    fontWeight: '800'
  },
  linkModal: {
    textAlign: 'center',
    margin: 20
  },
  copyBtn: {
    margin: '0 auto',
    display: 'flex'
  },
  groupsAndAreasFeaturesStyle: {
    marginTop: 25
  }
};

class InviteLinkModal extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <Modal ref="modal" showOnInit onHidden={this.props.onHidden} header="Invite Link">
        <div className="content" style={styles.content}>
          <div style={styles.linkModalDesc}>
            Anyone who follows this link will be able to sign up and join you on Myagi
          </div>
          <div style={styles.linkModal}>{this.props.inviteLink}</div>
          <Clipboard
            component="div"
            data-clipboard-text={this.props.inviteLink}
            onSuccess={() =>
              this.context.displayTempPositiveMessage({
                body: 'Link copied to clipboard'
              })
            }
          >
            <button className="ui button basic" style={styles.copyBtn}>
              <i className="ui icon linkify" />Copy link
            </button>
          </Clipboard>
        </div>
      </Modal>
    );
  }
}

export class InviteUsersModal extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    // Only required if teams not specified
    team: React.PropTypes.instanceOf(Im.Map),
    // Only required if team not specified
    teams: React.PropTypes.instanceOf(Im.List),
    trainingPlans: React.PropTypes.instanceOf(Im.List).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      method: VIA_EMAIL,
      renderKey: 0
    };
  }

  cleanEmails = emails => {
    emails = _.trim(emails, ',');
    emails = emails.split(',');
    emails = emails.map(email => _.trim(email, ' \n'));
    return emails;
  };

  cleanBtnToggleVal = val => val === YES;

  isEmailsValid = emails => {
    if (this.state.method === VIA_LINK) return true;
    let allEmailsValid = true;
    emails.forEach(email => {
      // Ensure each email has one and only one @ symbol to determine
      // validity
      if (!validateEmail(email)) {
        allEmailsValid = false;
      }
    });
    return allEmailsValid;
  };

  onFormSubmitAndValid = data => {
    const baseInviteData = {
      welcome_message: data.welcome_message,
      company: this.props.currentUser.get('learner').company.url,
      // id for learner_group instead of url. This is due to invitation
      // model quirk.
      learner_group: data.learner_group_id || this.props.team.get('id'),
      inviter: this.props.currentUser.get('email'),
      invite_type: COMPANY_TO_USER_INVITE,
      invite_training_plans: data.training_plans || [],
      invite_enrollment_groups: data.enrollment_groups,
      as_company_admin: data.as_company_admin,
      as_team_manager: data.as_team_manager
    };

    if (this.state.method === VIA_EMAIL) {
      const emails = data.registered_emails;
      // Create a new object for every email. Interim solution before
      // re-doing Invitation model.
      emails.forEach(email => {
        const inviteData = _.merge({}, baseInviteData, {
          registered_emails: email
        });
        InvitationsState.ActionCreators.create(inviteData).catch(err => {
          this.context.displayGenericRequestFailureMessage('send invitations', err);
          // Log error so that it can be retrieved via Full Story
          console.error(err);
          // Rethrow so that error is passed through to Raven
          throw err;
        });
      });

      // Show message optimistically
      this.context.displayTempPositiveMessage({
        heading: 'Invitations sent'
      });
      if (this.inviteUsersModal) {
        this.inviteUsersModal.hide();
      }
    } else {
      InvitationsState.ActionCreators.create(baseInviteData).then(res => {
        this.setState({ inviteLink: `${getOrigin()}/signup/user/?sid=${res.body.invite_id}` });
      });
    }

    analytics.track(ANALYTICS_EVENTS.INVITE_USERS_TO_JOIN_MYAGI, {
      inviter: this.props.currentUser.get('email')
    });
  };

  show = () => {
    this.inviteUsersModal.show();
  };

  resetModal = () => {
    this.setState({ renderKey: this.state.renderKey + 1 });
  };

  renderTeamSelect = () => {
    // Do not allow selection of team if one has been passed
    // in as a prop
    if (this.props.team || !this.props.teams) return null;
    const opts = this.props.teams
      .map(t => ({
        value: t.get('id'),
        label: t.get('name')
      }))
      .toJSON();
    return (
      <div style={{ marginTop: 20 }}>
        <h3 style={styles.heading}>{t('team')}</h3>
        <SearchableSelect
          name="learner_group_id"
          noSelectionText="Choose a team"
          options={opts}
          required
        />
      </div>
    );
  };

  renderBtnToggle(txt, name) {
    return (
      <div style={{ marginTop: 20 }}>
        <h3 style={styles.heading}>{txt}</h3>
        <ButtonToggle name={name} leftLabel={NO} rightLabel={YES} clean={this.cleanBtnToggleVal} />
      </div>
    );
  }

  renderCompanyAdminToggle() {
    if (!this.props.currentUser.get('learner').is_company_admin) return null;
    return this.renderBtnToggle('Make Company Admin', 'as_company_admin');
  }

  renderTeamManagerToggle() {
    const l = this.props.currentUser.get('learner');
    if (!l.is_company_admin && !l.is_learner_group_admin && !l.is_area_manager) return null;
    return this.renderBtnToggle('Make Team Manager', 'as_team_manager');
  }

  setMethod = method => {
    this.setState({ method });
  };

  render() {
    let trainingPlanSelect;
    const options = this.props.trainingPlans
      .map(tp => ({
        value: tp.get('url'),
        label: tp.get('name')
      }))
      .toJSON();

    let enrollmentGroupsSelect;
    const enrollmentGroupOptions = this.props.enrollmentGroups
      .map(group => ({
        value: group.get('url'),
        label: group.get('name')
      }))
      .toJSON();

    enrollmentGroupOptions.length
      ? (enrollmentGroupsSelect = (
        <EnrollmentGroupSearchableMultiSelect
          style={{ label: { fontWeight: 'normal' } }}
          label="Users will be added to the selected groups when
        they sign up."
          name="enrollment_groups"
          noSelectionText="Choose an group"
        />
      ))
      : (enrollmentGroupsSelect = <h4>No groups available.</h4>);
    const teamSelect = this.renderTeamSelect();

    const subscription = this.props.currentUser.get('learner').company.subscription;

    const groupsAndAreasFeatures = (
      <div style={styles.groupsAndAreasFeaturesStyle}>
        <h3 style={styles.heading}>
          {t('groups')} <small>({t('optional')})</small>
        </h3>
        {enrollmentGroupsSelect}
        {this.renderCompanyAdminToggle()}
        {this.renderTeamManagerToggle()}
      </div>
    );

    return (
      <Modal
        ref={inviteUsersModal => (this.inviteUsersModal = inviteUsersModal)}
        onHidden={this.resetModal}
        key={this.state.renderKey}
        closeOnDimmerClick
        header={t('invite_users')}
      >
        <div className="content" style={styles.content}>
          <Form ref="form" onSubmitAndValid={this.onFormSubmitAndValid}>
            <ButtonToggle
              onChange={this.setMethod}
              initialValue={this.state.method || VIA_EMAIL}
              leftLabel={VIA_EMAIL}
              rightLabel={VIA_LINK}
              style={styles.methodToggle}
            />
            {this.state.method === VIA_EMAIL ? (
              <TextArea
                name="registered_emails"
                label={t('enter_emails_of_users')}
                required
                isValid={this.isEmailsValid}
                clean={this.cleanEmails}
                showError
                style={{
                  label: { fontWeight: 'normal' }
                }}
                initialIsAcceptable
              />
            ) : (
              <div style={styles.inviteLinkTxt}>{t('just_fill_out_the_details')}</div>
            )}

            {this.state.method === VIA_EMAIL ? (
              <div>
                <h3 style={styles.heading}>{t('personal_message')}</h3>
                <TextArea
                  name="welcome_message"
                  initialValue={t('you_have_been_invited')}
                  initialIsAcceptable
                />
              </div>
            ) : null}

            {teamSelect}
            <h3 style={styles.heading}>
              {t('plans')} <small>({t('optional')})</small>
            </h3>
            <MultiSelect
              ref="planMultiSelect"
              name="training_plans"
              options={options}
              label={t('users_will_be_enrolled')}
              placeholder="Select plans..."
              noResultsText="No plans available"
              onChange={this.onTrainingPlansChange}
            />
            {subscription.groups_and_areas_enabled ? groupsAndAreasFeatures : null}
            <SubmitButton />
          </Form>
        </div>
        {this.state.inviteLink && (
          <InviteLinkModal
            inviteLink={this.state.inviteLink}
            onHidden={() => this.setState({ inviteLink: null })}
          />
        )}
      </Modal>
    );
  }
}

export const InviteUsersModalContainer = Marty.createContainer(InviteUsersModal, {
  listenTo: [TrainingPlansState.Store, TeamsState.Store, EnrollmentGroupsState.Store],

  fetch: {
    trainingPlans() {
      return TrainingPlansState.Store.getItems({
        ordering: 'name',
        fields: ['name', 'id', 'url'],
        has_modules: true,
        is_published: true,
        deactivated__isnull: true,
        limit: 0
      });
    },

    teams() {
      if (this.props.team) {
        return undefined;
      }
      return TeamsState.Store.getItems({
        ordering: 'name',
        fields: ['name', 'id', 'url'],
        limit: 0
      });
    },

    enrollmentGroups() {
      return EnrollmentGroupsState.Store.getItems({
        ordering: 'name',
        fields: ['name', 'id', 'url'],
        limit: 0
      });
    }
  },

  getDefaultProps() {
    return {
      trainingPlans: Im.List(),
      enrollmentGroups: Im.List()
    };
  },

  done(results) {
    return <InviteUsersModal {...this.props} {...results} ref="modal" />;
  },

  pending() {
    return containerUtils.defaultPending(this, InviteUsersModal);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, InviteUsersModal, errors);
  },

  show() {
    if (!this.refs.modal) return;
    this.refs.modal.show();
  },

  hide() {
    if (!this.refs.modal) return;
    this.refs.modal.hide();
  }
});

export class InviteUsersButton extends React.Component {
  showModal = () => {
    this.refs.inviteModal.show();
  };

  render() {
    return (
      <div>
        <PrimaryButton style={this.props.btnStyle} onClick={this.showModal}>
          {t('invite_users')}
        </PrimaryButton>
        <InviteUsersModalContainer
          ref="inviteModal"
          currentUser={this.props.currentUser}
          team={this.props.team}
        />
      </div>
    );
  }
}

export class BasicInviteUsersButton extends React.Component {
  showModal = () => {
    this.refs.inviteModal.show();
  };

  render() {
    return (
      <div>
        <SecondaryButton style={this.props.btnStyle} onClick={this.showModal}>
          {t('invite_users')}
        </SecondaryButton>
        <InviteUsersModalContainer
          ref="inviteModal"
          currentUser={this.props.currentUser}
          team={this.props.team}
        />
      </div>
    );
  }
}
