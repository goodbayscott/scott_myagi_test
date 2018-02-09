import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import Style from 'style/index';

import PublicSubscriptionsState from 'state/public-subscriptions';

const ACCEPTED_CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP'];
const STRIPE_LIVE_KEY = 'pk_live_4GvpBcH9Rg4UDRfA6ZsSR7Mr';
const STRIPE_TEST_KEY = 'pk_test_63KKkBzMPZVCHWr83nzjGBTD';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    textAlign: 'center',
    padding: 60
  },
  img: {
    margin: '12vh auto 15px auto',
    height: 300,
    width: 440,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  info: {
    maxWidth: 800
  },
  paymentBtn: {
    marginTop: 20
  },
  error: {
    color: Style.vars.colors.get('errorRed')
  },
  success: {
    color: Style.vars.colors.get('green')
  }
};

export class Page extends React.Component {
  /*
    Super simple component that's used to process credit card payments.
    A base64 encoded integer representing the number of cents to charge
    must be included in the URL as the `c` argument.
    For example, the url "/public/payments/?c=NTAwMA==" will result in a $50 charge.
  */
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const query = this.props.location.query;
    const amount = query.c ? window.atob(query.c) : 100;
    const subscribe = !!query.subscribe;
    const currency =
      query.currency && ACCEPTED_CURRENCIES.indexOf(query.currency) > -1 ? query.currency : 'USD';
    this.state = {
      amount, // cents
      currency,
      subscribe,
      error: null,
      success: null
    };
  }

  onToken = token => {
    const data = {
      stripeToken: token.id,
      amount: this.state.amount,
      email: token.email,
      currency: this.state.currency,
      subscribe: this.state.subscribe
    };
    PublicSubscriptionsState.ActionCreators.doListAction('charge_stripe', data)
      .then(res => {
        this.setState({
          success: 'Thank you, your payment was successfully processed.'
        });
      })
      .catch(err => {
        this.setState({
          error:
            'Sorry, we were unable to process your payment. Please try again or contact finance@myagi.com.au.'
        });
      });
  };

  render() {
    const stripeKey =
      window.location.hostname.indexOf('myagi.com') > -1 ? STRIPE_LIVE_KEY : STRIPE_TEST_KEY;

    return (
      <div style={styles.container}>
        <div
          style={{
            ...styles.img,
            backgroundImage: 'url(/static/public/images/logo.svg)'
          }}
        />
        <div style={styles.info}>
          <div>
            <span style={{ fontSize: 20 }}>Thanks for signing up for training on Myagi!</span>
            <br />
            <span style={{ lineHeight: 3 }}>
              We just need a little info so we can process your payment and get you started!
            </span>
          </div>
          {this.state.error ? (
            <div style={styles.error}>
              <br />
              {this.state.error}
            </div>
          ) : null}
          {this.state.success ? (
            <div style={styles.success}>
              <br />
              {this.state.success}
            </div>
          ) : (
            <div style={styles.paymentBtn}>
              <StripeCheckout
                stripeKey={stripeKey}
                name="Myagi" // the pop-in header title
                description="Content Subscription" // the pop-in header subtitle
                panelLabel="Subscribe for"
                image="https://s3.amazonaws.com/myagi-random-public/myagi-chopsticks.svg"
                amount={this.state.amount} // cents
                currency={this.state.currency}
                allowRememberMe={false}
                token={this.onToken} // submit callback
                reconfigureOnUpdate={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}
