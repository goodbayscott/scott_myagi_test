import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';

import UsersState from 'state/users';

import { Modal } from 'components/common/modal';
import { Form, SubmitButton } from 'components/common/form';
import { PublicTeamSearchableSelect } from 'components/common/team-searchable-select';

export class TeamSelectionModal extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false
    };
  }

  onSubmitAndValid = data => {
    this.setState({ loading: true });
    UsersState.ActionCreators.doDetailAction(
      this.props.currentUser.get('id'),
      'set_learner_group',
      {
        learner_group: data.team
      }
    ).then(() => {
      // Refresh page to update team
      window.location.reload();
    });
  };

  render() {
    return (
      <Modal
        ref="modal"
        closeable={false}
        showOnInit={this.props.showOnInit}
        header={t('select_your_team')}
      >
        <div className="content">
          <Form onSubmitAndValid={this.onSubmitAndValid}>
            <h3>{t('select_your_team_desc')}</h3>
            <PublicTeamSearchableSelect
              name="team"
              company={Im.Map(this.props.currentUser.get('learner').company)}
            />
            <SubmitButton loading={this.state.loading} />
          </Form>
        </div>
      </Modal>
    );
  }
}
