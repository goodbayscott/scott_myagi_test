import React from 'react';
import Im from 'immutable';
import Style from 'style';
import Radium from 'radium';
import { t } from 'i18n';

import ChannelShareRequestsState from 'state/channel-share-requests';
import PLACEHOLDER_IMAGE from 'img/placeholder-square.svg';
import { Modal } from 'components/common/modal';
import { LoadingSpinner } from 'components/common/loading';
import { PrimaryButton } from 'components/common/buttons';
import { Info } from 'components/common/info';

const DECIDER_IS_PRODUCER = 2;

const styles = {
  container: {
    margin: 15,
    width: 230,
    display: 'flex',
    flexDirection: 'column'
  },
  image: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 230,
    width: '100%',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: `4px solid ${Style.vars.colors.get('primary')}`,
    borderRadius: 4
  },
  acceptButton: {
    marginBottom: 10,
    boxShadow: 'rgba(255,255,255,0.7) 0px 0px 10px',
    lineHeight: '6px',
    height: 27
  },
  accepted: {
    marginBottom: 10
  },
  cancelContainer: {
    height: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  cancel: {
    zIndex: 10,
    marginTop: 3,
    height: 10,
    color: '#888',
    cursor: 'pointer',
    ':hover': {
      color: Style.vars.colors.get('red')
    }
  },
  companyName: {
    marginTop: 5,
    fontSize: '1.1rem'
  }
};

@Radium
export class RequestCard extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      accepted: false
    };
  }

  accept = () => {
    this.setState({ ...this.state, loading: true });
    ChannelShareRequestsState.ActionCreators.doDetailAction(
      this.props.request.get('id'),
      'accept'
    ).then(() => {
      this.setState({ ...this.state, loading: false, accepted: true });
    });
  };

  delete = () => {
    ChannelShareRequestsState.ActionCreators.delete(this.props.request.get('id')).then(() => {
      this.setState({ ...this.state, loading: false });
    });
  };

  getCompanyNameText(actionable, deciderIsProducer) {
    const company = this.props.request.get('company');
    let companyText = company.company_name;

    if (actionable && deciderIsProducer) {
      companyText = t('new_request_from_company', {
        company: `<b>${company.company_name}</b>`
      });
    } else if (actionable && !deciderIsProducer) {
      companyText = t('waiting_to_be_accepted_by_company', {
        company: `<b>${company.company_name}</b>`
      });
    }

    return <div style={styles.companyName} dangerouslySetInnerHTML={{ __html: companyText }} />;
  }

  render() {
    const company = this.props.request.get('company');
    const actionable = !this.state.loading && !this.state.accepted;
    const deciderIsProducer = this.props.request.get('direction') == DECIDER_IS_PRODUCER;

    return (
      <div style={styles.container}>
        {actionable && (
          <div style={styles.cancelContainer}>
            <div style={styles.cancel} onClick={() => this.deleteModal.show()}>
              <i className="ui icon remove" />
            </div>
          </div>
        )}
        <div
          style={{
            ...styles.image,
            backgroundImage: `url(${company.company_logo || PLACEHOLDER_IMAGE})`
          }}
        >
          {deciderIsProducer &&
            actionable && (
              <PrimaryButton style={styles.acceptButton} onClick={this.accept}>
                Accept
              </PrimaryButton>
            )}
          {this.state.accepted && (
            <div style={styles.accepted} className="ui green message">
              Accepted
            </div>
          )}
          {this.state.loading && <LoadingSpinner />}
        </div>

        {this.getCompanyNameText(actionable, deciderIsProducer)}

        <div>
          <Info key={company.id} content={t('total_number_of_users')}>
            <div>
              <i className="ui icon users" />
              {company.user_count}
            </div>
          </Info>
        </div>

        <Modal
          ref={c => (this.deleteModal = c)}
          header={t('are_you_sure_request')}
          content={t('company_will_no_long_be_able_to_access_channel', {
            company: company.company_name
          })}
          onConfirm={this.delete}
          basic
        />
      </div>
    );
  }
}
