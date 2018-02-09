import React from 'react';
import Style from 'style/index.js';
import Radium from 'radium';
import { LoadingSpinner } from 'components/common/loading';
import ChannelLicencesState from 'state/channel-licences';
import { t } from 'i18n';
import { Modal } from 'components/common/modal/index';
import { PrimaryButton } from 'components/common/buttons';
import { Input } from 'semantic-ui-react';

const styles = {
  container: {
    margin: '40px 0px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 0px 70px #0003',
    border: '1px solid #0001',
    padding: '30px 40px'
  },
  title: {
    fontSize: '2.2rem',
    margin: '10px 0'
  },
  fieldTitle: {
    margin: '20px 0px 5px',
    fontWeight: 600,
    fontSize: '1.1rem'
  },
  costConainer: {
    margin: '20px 0',
    fontSize: '1.2rem'
  },
  costRow: {
    width: 220,
    margin: '20px 0',
    display: 'flex',
    justifyContent: 'space-between'
  },
  buyButton: {
    margin: '10px 0px',
    display: 'block',
    width: 100
  },
  purchaseComplete: {
    margin: '30px 20px',
    maxWidth: 340
  },
  purchaseCompleteTitle: {
    color: Style.vars.colors.get('green'),
    fontSize: '2.5rem',
    lineHeight: '2.5rem',
    fontWeight: 200,
    marginBottom: 20
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
};

@Radium
export class BuyLicence extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      quantity: "",
      volumeMatrix: null,
      loading: true,
      purchaseComplete: false
    };
  }

  componentDidMount() {
    ChannelLicencesState.ActionCreators.doListAction('volume_discount_matrix').then(r => {
      this.setState({ ...this.state, loading: false, volumeMatrix: r.body });
    });
  }

  onQuantityChange = e => {
    const REGEX = /^\d{0,5}$/;
    const value = e.target.value;

    const regexResult = REGEX.exec(value);

    if (regexResult) {
      const validValue = regexResult[0];
      this.setState({ ...this.state, quantity: validValue });
    }
  };

  buyLicence = () => {
    if (this.state.loading) {
      return;
    }
    this.setState({ ...this.state, loading: true });
    ChannelLicencesState.ActionCreators.doListAction('buy_licences', {
      channel_share: this.props.ownCompanyConnection.get('id'),
      quantity: parseInt(this.state.quantity),
      discount: this.getDiscountFactor()
    })
      .then(r => {
        this.setState({
          ...this.state,
          loading: false,
          purchaseComplete: true
        });
      })
      .catch(r => {
        alert(`There was an error in processing your request,
        please contact support`);
      });
  };

  getDiscountFactor() {
    let discount = 0;
    this.state.volumeMatrix.forEach(d => {
      if (this.state.quantity >= d.quantity) {
        discount = d.discount;
      }
    });
    return discount;
  }

  purchaseCompleteComponent() {
    return (
      <div style={styles.container}>
        <div style={styles.purchaseComplete}>
          <div style={styles.purchaseCompleteTitle}>{t('purchase_request_submitted')}</div>
          <div style={styles.purchaseCompleteContent}>{t('purchase_request_submitted_info')}</div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.loading) return <LoadingSpinner />;
    if (this.state.purchaseComplete) return this.purchaseCompleteComponent();

    const beforeCost = Number(this.state.quantity * this.props.channel.get('price')).toFixed(2);
    const totalCost = Number(beforeCost * (1 - this.getDiscountFactor())).toFixed(2);

    return (
      <div ref={c => (this.myModal = c)} style={styles.container}>
        <div style={styles.title}>{t('buy_licences')}</div>
        <div style={styles.fieldTitle}>{t('quantity')}:</div>
        <Input type="text" value={this.state.quantity} onChange={this.onQuantityChange} />
        <div style={styles.costConainer}>
          <div style={styles.costRow}>
            <div>
              {this.state.quantity || 0} x ${this.props.channel.get('price')}
            </div>
            <div>${beforeCost}</div>
          </div>
          <div style={styles.costRow}>
            <div>{t('volume_discount')}:</div>
            <div>{this.getDiscountFactor() * 100}%</div>
          </div>
          <div style={styles.costRow}>
            <div>{t('total')}:</div>
            <div>
              <b>USD${totalCost}</b>
            </div>
          </div>
        </div>
        <div style={styles.buttonContainer}>
          <PrimaryButton style={styles.buyButton} onClick={() => this.confirmPurchase.show()}>
            {t('next')}
          </PrimaryButton>
        </div>

        <Modal
          ref={c => (this.confirmPurchase = c)}
          header={t('confirm_purchase')}
          content={
            <div>
              <p>{t('confirm_purchase_info')}</p>
              <p>{t('are_you_sure_you_want_to_continue')}</p>
            </div>
          }
          onConfirm={this.buyLicence}
          basic
        />
      </div>
    );
  }
}
