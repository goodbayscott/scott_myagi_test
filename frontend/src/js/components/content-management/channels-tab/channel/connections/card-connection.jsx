import React from 'react';
import Im from 'immutable';
import Style from 'style';
import { t } from 'i18n';
import Radium from 'radium';
import PLACEHOLDER_IMAGE from 'img/placeholder-square.svg';
import { Modal } from 'components/common/modal';
import ChannelSharesState from 'state/channel-shares';
import { Info } from 'components/common/info';
import { CONTENT_SELLER } from 'core/constants';

const styles = {
  container: {
    margin: 15,
    width: 230,
    display: 'flex',
    flexDirection: 'column'
  },
  image: {
    height: 230,
    width: '100%',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
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
export class ConnectionCard extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  delete = () => {
    ChannelSharesState.ActionCreators.delete(this.props.connection.get('id'));
  };

  render() {
    const company = this.props.connection.get('company');
    return (
      <div style={styles.container}>
        <div style={styles.cancelContainer}>
          <div style={styles.cancel} onClick={() => this.deleteModal.show()}>
            <i className="ui icon remove" />
          </div>
        </div>
        <div
          style={{
            ...styles.image,
            backgroundImage: `url(${company.company_logo || PLACEHOLDER_IMAGE})`
          }}
        />
        <div style={styles.companyName}>{company.company_name}</div>
        <div>
          <Info key="users" content={t('total_number_of_users')}>
            <div>
              <i className="ui icon users" />
              {company.user_count}
            </div>
          </Info>
          {this.props.channel.get('price') &&
            this.context.currentUser.get('learner').company.company_type == CONTENT_SELLER && (
              <Info key="licences" content={t('licences_used_vs_licences_purchased')}>
                <div style={{ marginLeft: 10 }}>
                  <i className="ui icon ticket" />
                  {this.props.connection.get('total_licences_used')}/
                  {this.props.connection.get('licence_quantity') || 0}
                </div>
              </Info>
            )}
        </div>

        <Modal
          ref={c => (this.deleteModal = c)}
          header={t('are_you_sure_archive_connection')}
          content={t('company_will_no_longer_have_access_to_content', {
            company: company.company_name
          })}
          onConfirm={this.delete}
          basic
        />
      </div>
    );
  }
}
