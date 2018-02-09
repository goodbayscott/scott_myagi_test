import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import { PrimaryButton } from 'components/common/buttons';
import { BuyLicence } from './buy-licence';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  numberRows: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  numberRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 10
  },
  number: {
    fontSize: '3.5rem',
    lineHeight: '3.5rem'
  },
  numberTitle: {
    fontSize: '1.3rem',
    lineHeight: '1.3rem'
  },
  buyButton: {
    marginTop: 30,
    marginBottom: 20,
    marginLeft: 0,
    width: 200
  },
  aboutContainer: {
    maxWidth: 600,
    marginBottom: 50
  }
};

@Radium
export class LicenceTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showBuyLicence: false
    };
  }

  totalSubscriptions = () => this.props.channelLicences.reduce((v, cl) => cl.get('quantity') + v, 0);

  render() {
    const licenceQuantity = this.props.ownCompanyConnection.get('licence_quantity') || 0;
    const licencesUsed = this.props.ownCompanyConnection.get('total_licences_used');
    const licencesRemaining = licenceQuantity - licencesUsed;
    return (
      <div style={styles.container}>
        <div style={styles.container}>
          <div style={styles.numberRows}>
            <div style={styles.numberRow}>
              <div style={styles.number}>{licenceQuantity}</div>
              <div style={styles.numberTitle}>{t('licences_purchased')}</div>
            </div>

            <div style={styles.numberRow}>
              <div style={styles.number}>{licencesUsed}</div>
              <div style={styles.numberTitle}>{t('licences_used')}</div>
            </div>

            <div style={styles.numberRow}>
              <div style={styles.number}>{licencesRemaining}</div>
              <div style={styles.numberTitle}>{t('licences_remaining')}</div>
            </div>
          </div>
          {!this.state.showBuyLicence && (
            <PrimaryButton
              onClick={() =>
                this.setState({ ...this.state, showBuyLicence: !this.state.showBuyLicence })
              }
              style={styles.buyButton}
            >
              {t('purchase_licences')}
            </PrimaryButton>
          )}
          {this.state.showBuyLicence && (
            <div>
              <BuyLicence
                ownCompanyConnection={this.props.ownCompanyConnection}
                channel={this.props.channel}
              />
            </div>
          )}

          <h3>{t('how_licences_work')}</h3>
          <p style={styles.aboutContainer}>{t('how_licences_work_info')}</p>
        </div>
      </div>
    );
  }
}
