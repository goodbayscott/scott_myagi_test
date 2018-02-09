import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getIdFromApiUrl } from 'utilities/generic';

import NotificationSettingsState from 'state/notification-settings';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxContent } from 'components/common/box';

import { DescriptionBox } from '../common';
import { ButtonToggle } from 'components/common/form';

const YES = 'Yes';
const NO = 'No';

const styles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 25,
    flexWrap: 'wrap',
    maxWidth: 800
  }
};

const TOGGLES = [
  {
    name: 'performance_notifications_enabled',
    title: 'performance_notifications',
    info: 'performance_notifications_info',
    show: user => true
  },
  {
    name: 'digest_notifications_enabled',
    title: 'digest_notifications',
    info: 'digest_notifications_info',
    show: user => true
  },
  {
    name: 'training_notifications_enabled',
    title: 'training_notifications',
    info: 'training_notifications_info',
    show: user => true
  },
  {
    name: 'admin_enrollment_notifications_enabled',
    title: 'admin_enrollment_notifications',
    info: 'admin_enrollment_notifications_info',
    show: user => user.get('groups').company_admins
  },
  {
    name: 'channel_notifications_enabled',
    title: 'channel_notifications',
    info: 'channel_notifications_info',
    show: user => user.get('groups').company_admins
  },
  {
    name: 'module_feedback_survey_results_enabled',
    title: 'lesson_feedback_notifications',
    info: 'lesson_feedback_notifications_info',
    show: user => user.get('groups').company_admins
  },
  {
    name: 'important_notifications_enabled',
    title: 'important_notifications',
    info: 'important_notifications_info',
    show: user => user.get('groups').company_admins
  },
  {
    name: 'invitation_notifications_enabled',
    title: 'invitation_notifications',
    info: 'invitation_notifications_info',
    show: user => user.get('groups').company_admins
  }
];

class NotificationSettingsTabInner extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  onChange({ value, field }) {
    const id = this.props.notificationSettings.get('id');
    const data = { [field.name]: value };

    NotificationSettingsState.ActionCreators.update(id, data).then(() => {
      this.context.displayTempPositiveMessage({
        body: `${field.title} ${value ? 'enabled' : 'disabled'}`
      });
    });
  }

  static data = {
    notificationSettings: {
      required: true,
      fields: [
        'id',
        'inbox_notifications_enabled',
        'training_notifications_enabled',
        'channel_notifications_enabled',
        'module_feedback_survey_results_enabled',
        'invitation_notifications_enabled',
        'admin_enrollment_notifications_enabled',
        'performance_notification_frequency'
      ]
    }
  };

  render() {
    return (
      <div>
        <BoxContent>
          {TOGGLES.filter(field => field.show(this.props.currentUser)).map(field => (
            <div key={field.name} style={styles.row}>
              <div>
                <DescriptionBox title={t(field.title)} info={t(field.info)} />
              </div>
              <div>
                <ButtonToggle
                  name={field.name}
                  leftLabel={YES}
                  rightLabel={NO}
                  initialValue={this.props.notificationSettings.get(field.name) ? YES : NO}
                  initialIsAcceptable
                  onChange={value =>
                    this.onChange({
                      value: value === YES,
                      field
                    })
                  }
                />
              </div>
            </div>
          ))}
        </BoxContent>
      </div>
    );
  }
}

export class NotificationSettingsTab extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.notificationSettings]}
          createComponent={() => <NotificationSettingsTabInner {...this.props} />}
        />
      </div>
    );
  }
}

export const NotificationSettingsTabContent = Marty.createContainer(NotificationSettingsTab, {
  listenTo: [NotificationSettingsState.Store],

  fetch: {
    notificationSettings() {
      const url = this.props.currentUser.get('notification_settings');
      return NotificationSettingsState.Store.getItem(getIdFromApiUrl(url), {
        fields: [$y.getFields(NotificationSettingsTabInner, 'notificationSettings')]
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, NotificationSettingsTab);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, NotificationSettingsTab, errors);
  }
});
