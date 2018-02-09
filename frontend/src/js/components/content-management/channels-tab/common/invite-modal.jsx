import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';

import ChannelShareRequestsState from 'state/channel-share-requests';
import InvitationsState from 'state/invitations.js';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';

import {
  Form,
  InfiniteInputs,
  SubmitButton,
  HiddenTextInput,
  ButtonToggle
} from 'components/common/form';

import { ViewSequence, View } from 'components/common/view-sequence/index.jsx';
import { CompanySearchableSelect } from 'components/common/company-searchable-select.jsx';

const CATEGORY_TO_COMPANY_INVITE = 5;

const formStyle = {
  textAlign: 'center'
};

const submitBtnStyle = { marginTop: '2em' };

class InviteForm extends React.Component {
  static propTypes = {
    channel: React.PropTypes.instanceOf(Im.Map).isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    hide: React.PropTypes.func.isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  onToggle = (label, index) => {
    this.refs.viewSequence.goTo(index);
  };

  onSubmitAndValidExistingForm = data => {
    /* Create a connection request for an existing company */
    const companies = _.unique(_.values(data));
    companies.forEach(companyURL => {
      ChannelShareRequestsState.ActionCreators.create({
        company: companyURL,
        training_unit: this.props.channel.get('url'),
        requester: this.props.currentUser.get('url')
      }).catch(err => {
        this.props.displayTempNegativeMessage({
          heading: 'Invitation failed',
          body:
            'Failed to create invitation either because one for that company already exists or company has already subscribed.'
        });
      });
    });
    if (companies.length > 0) {
      this.props.displayTempPositiveMessage({
        heading: 'Invitations sent',
        body: 'You will be notified when they have been responded to.'
      });
    }
    this.props.hide();
  };

  onSubmitAndValidNewForm = data => {
    /* Create a new invitation */
    const inviteData = {
      registered_emails: [data.email],
      invitee_company_name: data.companyName,
      company: this.props.currentUser.get('learner').company.url,
      inviter: this.props.currentUser.get('email'),
      invite_type: CATEGORY_TO_COMPANY_INVITE,
      // ID required instead of URL due to Invite model quirk
      training_category: [this.props.channel.get('id').toString()]
    };
    InvitationsState.ActionCreators.create(inviteData);
    this.props.displayTempPositiveMessage({
      heading: 'Invitation sent',
      body: 'You will be notified when the company is set up.'
    });
    this.props.hide();
  };

  render() {
    return (
      <div style={formStyle}>
        <h3 style={{ textAlign: 'left' }}>{t('select_companies')}</h3>
        <p style={{ textAlign: 'left' }}>{t('select_companies_info')}</p>
        <ButtonToggle
          name="inviteTypeSwitch"
          leftLabel="Existing"
          rightLabel="New"
          onChange={this.onToggle}
          style={{
            button: { width: '8em' },
            container: { marginBottom: 20 }
          }}
        />
        <ViewSequence ref="viewSequence">
          <View>
            <div>
              <Form onSubmitAndValid={this.onSubmitAndValidExistingForm}>
                {/* Prevents autofocus on SearchableSelect */}
                <HiddenTextInput />
                <InfiniteInputs initialNumInputs={1} name="companyURL" required>
                  <CompanySearchableSelect style={{ container: { marginBottom: '1em' } }} />
                </InfiniteInputs>
                <SubmitButton text={t('invite')} style={submitBtnStyle} />
              </Form>
            </div>
          </View>
          <View>
            <div>
              <div>{t('no_myagi_send_sharelink')}</div>

              <PrimaryButton
                onClick={() => {
                  this.props.hide();
                  this.context.router.push('/views/content/channels/sharelinks/');
                }}
                style={{ display: 'inline-block', marginTop: 10 }}
              >
                {t('create_sharelink')}
              </PrimaryButton>
            </div>
          </View>
        </ViewSequence>
      </div>
    );
  }
}

export class InviteModal extends React.Component {
  static propTypes = {
    companies: React.PropTypes.instanceOf(Im.List),
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  hide = () => {
    this.refs.modal.hide();
  };

  show = () => {
    this.refs.modal.show();
  };

  render() {
    return (
      <Modal ref="modal" header={t('invite_companies_to_subscribe')} closeOnDimmerClick>
        <div className="content">
          <InviteForm
            hide={this.hide}
            channel={this.props.channel}
            currentUser={this.props.currentUser}
            displayTempPositiveMessage={this.context.displayTempPositiveMessage}
            displayTempNegativeMessage={this.context.displayTempNegativeMessage}
          />
        </div>
      </Modal>
    );
  }
}
