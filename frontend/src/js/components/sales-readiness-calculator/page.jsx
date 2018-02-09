import React from 'react';
import { StoreReachWidget, TextValueWidget } from './calculator.jsx';
import _ from 'lodash';
import RSVP from 'rsvp';
import Style from 'style';

import { Box, BoxHeader, BoxContent } from 'components/common/box';
import { getWriteHeaders } from 'state/common/utils';
import { SearchableSelect } from 'components/common/form/select';
import PlotlyChart from 'components/common/plotly-container';
import { FormattedNumber } from 'react-intl';
import numeral from 'numeral';
import { PrimaryButton } from 'components/common/buttons';
import { TickCircle } from 'components/common/tick-circle';
import {
  Form,
  TextInput,
  EmailInput,
  SlideToggle,
  NumberInput,
  RangeInput,
  SubmitButton
} from 'components/common/form';

const logoImg = require('img/logo.svg');
const macbookImg = require('img/macbook.png');
const snowsportsImg = require('img/calculator/snowsports.jpg');
const consumerElectronicsImg = require('img/calculator/consumer_electronics.jpg');
const campingImg = require('img/calculator/camping.jpg');
const cosmeticsImg = require('img/calculator/cosmetics.jpg');
const fashionImg = require('img/calculator/fashion.jpg');
const outerwearImg = require('img/calculator/outerwear.jpg');
const footwearImg = require('img/calculator/footwear.jpg');

const productImg = require('img/calculator/product.jpg');
const dataImg = require('img/calculator/data.jpg');
const feedbackImg = require('img/calculator/feedback.jpg');
const use_casesImg = require('img/calculator/use_cases.jpg');
const knowledgeImg = require('img/calculator/knowledge.jpg');
const meImg = require('img/calculator/me.jpg');
const emotionalImg = require('img/calculator/emotional.jpg');

const PLOT_CONFIG = {
  showLink: false,
  displaylogo: false,
  scrollZoom: false,
  displayModeBar: false,
  modeBarButtonsToRemove: ['sendDataToCloud']
};

const INDUSTRY_OPTS = [
  { label: 'Snowsports', value: 'snowsports', image: snowsportsImg },
  { label: 'Electronics', value: 'consumer_electronics', image: consumerElectronicsImg },
  { label: 'Camping', value: 'camping', image: campingImg },
  { label: 'Cosmetics', value: 'cosmetics', image: cosmeticsImg },
  { label: 'Fashion', value: 'fashion', image: fashionImg },
  { label: 'Outerwear', value: 'outerwear', image: outerwearImg },
  { label: 'Footwear', value: 'footwear', image: footwearImg }
];

const MARKETING_IMPACT = [
  { label: 'Product specs & features', value: 'specifications', image: productImg },
  { label: 'Detailed manufacturing data', value: 'manufacturing', image: dataImg },
  { label: 'Feedback from customers', value: 'customer_feedback', image: feedbackImg },
  { label: 'Real life use cases of the product', value: 'use_cases', image: use_casesImg },
  { label: 'Mechanism to test knowledge retention', value: 'knowledge_test', image: knowledgeImg },
  { label: 'A "whats in it for me" pitch aimed at sales associates', value: 'wiifm', image: meImg },
  {
    label: 'Info on how to connect your products with a powerful emotional motivator',
    value: 'emo_triggers',
    image: emotionalImg
  }
];

const styles = {
  boxCommon: {
    background: 'none'
  },
  bgContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    margin: 20,
    background: '#2c3e50',
    textAlign: 'center',
    overflow: 'auto'
  },
  welcomeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    margin: 'auto',
    background: 'none',
    display: 'flex',
    alignItems: 'center'
  },
  header: {
    fontWeight: 700,
    fontSize: 50,
    color: Style.vars.colors.get('white'),
    lineHeight: 1.8
  },
  subtitle: {
    fontWeight: 700,
    fontSize: 25,
    color: Style.vars.colors.get('white'),
    opacity: 0.5,
    marginBottom: 40
  },
  macbookImg: {
    maxWidth: 600,
    margin: 'auto',
    marginTop: -100
  },
  startButton: {
    fontSize: 16,
    padding: '20px 30px 20px 30px',
    letterSpacing: 2,
    lineHeight: 2.5
  },
  sequenceIndex: {
    fontWeight: 700,
    fontSize: 25,
    color: Style.vars.colors.get('white'),
    opacity: 0.5,
    position: 'absolute',
    bottom: 10,
    right: 10
  },
  sequenceBack: {
    fontWeight: 700,
    fontSize: 25,
    color: Style.vars.colors.get('white'),
    opacity: 0.5,
    position: 'absolute',
    bottom: 10,
    left: 10,
    cursor: 'pointer'
  },
  checkCard: {
    height: 200,
    borderRadius: 10,
    marginBottom: 25,
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%'
  },
  labelContainer: {
    position: 'absolute',
    margin: 'auto',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 30,
    paddingRight: 30,
    display: 'flex',
    alignItems: 'center'
  },
  checkLabel: {
    fontSize: 20,
    color: Style.vars.colors.get('white'),
    width: '100%'
  },
  tickCircle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    margin: 'auto'
  },
  question: {
    maxWidth: 500,
    marginTop: 50,
    marginBottom: 50,
    margin: 'auto'
  },
  questionText: {
    fontSize: 25,
    color: Style.vars.colors.get('white'),
    opacity: 0.5,
    marginBottom: 25,
    lineHeight: 1.5
  },
  submitButton: {
    maxWidth: 300,
    height: 50,
    fontSize: 16,
    paddingBottom: 50,
    letterSpacing: 2,
    lineHeight: 2.5,
    textTransform: 'uppercase'
  }
};

class CheckCardCollection extends React.Component {
  static propTypes = {
    dataset: React.PropTypes.array.isRequired
  };

  renderCards(dataset) {
    return dataset.map(data => (
      <div
        key={data.value}
        className="column"
        onClick={this.props.onClick.bind(this, data.value)}
        style={{ cursor: 'pointer' }}
      >
        <div
          style={Style.funcs.merge(styles.checkCard, { backgroundImage: `url('${data.image}')` })}
        />
        <div style={styles.labelContainer}>
          <h4 style={styles.checkLabel}>{data.label}</h4>
          {this.props.multiSelect
            ? this.props.multiData[data.value] === true && (
              <TickCircle style={styles.tickCircle} isSelected />
            )
            : this.props.singleData === data.value && (
              <TickCircle style={styles.tickCircle} isSelected />
            )}
        </div>
      </div>
    ));
  }

  render() {
    return (
      <div className="ui stackable relaxed grid">
        <div className="four column row" style={{ marginLeft: 0 }}>
          {this.renderCards(this.props.dataset)}
        </div>
      </div>
    );
  }
}

export class Page extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stores: 0,
      annual_sales: 0,
      avg_txn_val: 0,
      mthly_stores_reached: 50,
      content_quality: {
        specifications: false,
        manufacturing: false,
        customer_feedback: false,
        use_cases: false,
        knowledge_test: false,
        wiifm: false,
        emo_triggers: false
      },
      industry: null,
      selectedSequence: 0,
      loadedData: false
    };
  }

  resetState = () => {
    // TODO: State changes aren't reflected on the UI
    this.setState({
      stores: 0,
      annual_sales: 0,
      avg_txn_val: 0,
      mthly_stores_reached: 50,
      content_quality: {}
    });
  };

  updateInfo = (ref_id, value) => {
    this.setState({ [ref_id]: Number(value) });
  };

  updateContentScore = ref_id => {
    const cq = this.state.content_quality;
    cq[ref_id] = !this.state.content_quality[ref_id];
    this.setState({ content_quality: cq });
  };

  updateIndustry = selectedIndustry => {
    this.setState({ industry: selectedIndustry });
  };

  changeSequenceIndex = () => {
    this.setState({ selectedSequence: this.state.selectedSequence + 1 });
    if (this.state.selectedSequence === 5) {
      setTimeout(() => {
        this.setState({ loadedData: true });
      }, 3500);
    }
  };

  goBackSequence = () => {
    this.setState({ selectedSequence: this.state.selectedSequence - 1 });
  };

  startSequenceAgain = () => {
    // this.resetState();
    this.setState({ selectedSequence: 0 });
  };

  arrangeData = () => {
    const diffPos = Math.round(this.state.uplift) * 0.3;
    const currPos = Math.round(this.state.annual_sales) * 0.2;
    const diffLabelPos =
      Math.round(this.state.uplift) + Math.round(this.state.annual_sales) - diffPos;
    const currLabelPos = Math.round(this.state.annual_sales) - currPos;

    const data = [
      {
        type: 'bar',
        x: ['sales'],
        y: [this.state.annual_sales],
        marker: {
          color: ['#f44e27']
        },
        name: 'Current sales'
      },
      {
        type: 'bar',
        x: ['sales'],
        y: [this.state.uplift],
        marker: {
          color: ['rgba(244,78,39, 0.4)']
        },
        name: 'Potential sales'
      }
    ];

    const layout = {
      barmode: 'stack',
      xaxis: {
        title: '',
        titlefont: "Montserrat, Arial, 'Open Sans'",
        showticklabels: false,
        linecolor: '#FFFFFF',
        zeroline: false
      },
      yaxis: {
        title: 'Sales',
        titlefont: {
          family: "Montserrat, Arial, 'Open Sans'",
          color: '#AAAAAA',
          size: 18
        },
        zeroline: true,
        zerolinecolor: '#EEEEEE',
        tickprefix: '$'
      },
      showlegend: false,
      legend: {
        x: -0.1,
        y: -0.2
      },
      annotations: [
        {
          x: 'sales',
          y: currLabelPos,
          text: numeral(Math.round(this.state.annual_sales)).format('$0,0'),
          xanchor: 'center',
          yanchor: 'center',
          showarrow: false,
          font: { color: '#FFFFFF', size: 20, family: "Montserrat, Arial, 'Open Sans'" },
          bgcolor: 'rgb(67, 75, 92)'
        },
        {
          x: 'sales',
          y: diffLabelPos,
          text: numeral(Math.round(this.state.uplift)).format('$0,0'),
          xanchor: 'center',
          yanchor: 'center',
          showarrow: false,
          font: { color: '#FFFFFF', size: 20, family: "Montserrat, Arial, 'Open Sans'" },
          bgcolor: 'rgb(67, 75, 92)'
        }
      ]
    };
    return { data, layout, config: PLOT_CONFIG };
  };

  postReq = (path, data) =>
    fetch(path, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });

  submit = () => {
    const url = '/sr-data/';
    this.postReq(url, this.state).then(res => {
      const uplift = res.json().then(uplift => {
        this.setState({ uplift });
      });
      this.changeSequenceIndex();
    });
  };

  onSubmitAndValid = formData => {
    const url = '/sr-submit/';
    const data = Object.assign(formData, this.state);
    this.postReq(url, data).then(() => {
      this.changeSequenceIndex();
    });
  };

  render() {
    const chart_data = this.arrangeData();
    let disBtn = true;
    const { stores, annual_sales, avg_txn_val } = this.state;
    if (stores > 0 && annual_sales > 0 && avg_txn_val > 0) {
      disBtn = false;
    }

    return (
      <div style={styles.bgContainer}>
        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 0 ? 'block' : 'none',
            height: 400
          })}
        >
          <div style={styles.macbookImg}>
            <img src={macbookImg} style={{ maxHeight: 300 }} />
          </div>
          <h1 style={styles.header}>HOW MUCH WILL MY SALES INCREASE?</h1>
          <h4 style={styles.subtitle}>
            Calculate the sales readiness of your associates to see your potential sales uplift
          </h4>
          <PrimaryButton style={styles.startButton} onClick={this.changeSequenceIndex}>
            GET STARTED →
          </PrimaryButton>
        </BoxContent>

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 1 ? 'block' : 'none'
          })}
        >
          <h1 style={styles.header}>What industry are you in?</h1>
          <Box style={styles.boxCommon}>
            <div style={{ marginTop: 50, marginBottom: 50 }}>
              <CheckCardCollection
                dataset={INDUSTRY_OPTS}
                onClick={this.updateIndustry}
                singleData={this.state.industry}
              />
            </div>
            <PrimaryButton
              style={styles.startButton}
              onClick={this.changeSequenceIndex}
              disabled={!this.state.industry}
            >
              NEXT →
            </PrimaryButton>
          </Box>
        </BoxContent>

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 2 ? 'block' : 'none'
          })}
        >
          <h1 style={styles.header}>Distribution</h1>
          <Box style={styles.boxCommon}>
            <div style={styles.question}>
              <div style={styles.questionText}>How many stores do you stock?</div>
              <TextValueWidget
                placeholder="Number of stores ..."
                widgetRef="stores"
                updateData={this.updateInfo}
                startVal={0}
              />
            </div>
            <div style={styles.question}>
              <div style={styles.questionText}>What is your total annual sales figure ($)?</div>
              <TextValueWidget
                placeholder="Sales total ..."
                widgetRef="annual_sales"
                updateData={this.updateInfo}
                startVal={0}
              />
            </div>
            <div style={styles.question}>
              <div style={styles.questionText}>What is your average unit price ($)?</div>
              <TextValueWidget
                placeholder="Unit price ..."
                widgetRef="avg_txn_val"
                updateData={this.updateInfo}
                startVal={0}
              />
            </div>
            <div style={{ marginTop: 50 }}>
              <PrimaryButton
                style={styles.startButton}
                onClick={this.changeSequenceIndex}
                disabled={disBtn}
              >
                NEXT →
              </PrimaryButton>
            </div>
          </Box>
        </BoxContent>

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 3 ? 'block' : 'none'
          })}
        >
          <h1 style={styles.header}>Engagement</h1>
          <Box style={styles.boxCommon}>
            <div style={styles.questionText}>
              What % of your total stores do you get around to educating on your products every
              month?
            </div>
            <StoreReachWidget widgetRef="mthly_stores_reached" updateData={this.updateInfo} />
            <div style={{ marginTop: 100 }}>
              <PrimaryButton
                style={styles.startButton}
                onClick={this.changeSequenceIndex}
                disabled={!this.state.mthly_stores_reached}
              >
                NEXT →
              </PrimaryButton>
            </div>
          </Box>
        </BoxContent>

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 4 ? 'block' : 'none'
          })}
        >
          <h1 style={styles.header}>Impact</h1>
          <Box style={styles.boxCommon}>
            <div style={styles.questionText}>
              Which of these do you include in your marketing / training to sales associates?
            </div>
            <div style={{ marginTop: 50 }}>
              <CheckCardCollection
                dataset={MARKETING_IMPACT}
                multiData={this.state.content_quality}
                onClick={this.updateContentScore}
                multiSelect
              />
            </div>
            <div style={{ marginTop: 50, marginBottom: 50 }}>
              <PrimaryButton style={styles.startButton} onClick={this.submit}>
                SUBMIT →
              </PrimaryButton>
            </div>
          </Box>
        </BoxContent>

        {this.state.uplift && this.state.loadedData ? (
          <BoxContent
            style={Style.funcs.merge(styles.welcomeContainer, {
              display: this.state.selectedSequence === 5 ? 'block' : 'none'
            })}
          >
            <h1 style={styles.header}>Uplift Results</h1>
            <div style={Style.funcs.merge(styles.questionText, { opacity: 1 })}>
              With a couple of tweaks, you can unlock{' '}
              <span style={{ color: '#F44E27' }}>
                <FormattedNumber
                  value={Math.round(this.state.uplift)}
                  style="currency"
                  currency="USD"
                />
              </span>{' '}
              in additional sales from your retailers
            </div>
            <Box>
              <PlotlyChart
                data={chart_data.data}
                layout={chart_data.layout}
                config={chart_data.config}
              />
            </Box>
            <div style={{ marginTop: 50 }}>
              <PrimaryButton style={styles.startButton} onClick={this.changeSequenceIndex}>
                LEARN MORE →
              </PrimaryButton>
            </div>
          </BoxContent>
        ) : (
          this.state.uplift && (
            <BoxContent
              style={Style.funcs.merge(styles.welcomeContainer, {
                display: this.state.selectedSequence === 5 ? 'block' : 'none'
              })}
            >
              <div style={{ textAlign: 'center' }}>
                <div className="loader" style={{ margin: '0 auto 0 auto' }}>
                  <div className="loader__bar" />
                  <div className="loader__bar" />
                  <div className="loader__bar" />
                  <div className="loader__bar" />
                  <div className="loader__bar" />
                  <div className="loader__ball" />
                </div>
                <span style={{ color: '#FFFFFF', textAlign: 'center', marginTop: '15px' }}>
                  {'Unleashing the data monkeys ...'}
                </span>
              </div>
            </BoxContent>
          )
        )}

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 6 ? 'block' : 'none',
            height: 500
          })}
        >
          <h1 style={styles.header}>See how you compare</h1>
          <Box style={styles.boxCommon}>
            <div style={styles.questionText}>
              Get the full report of how you compare against your industry and your personalised
              guide on how to improve your sales metrics
            </div>
            <Form onSubmitAndValid={this.onSubmitAndValid}>
              <div className="two fields">
                <div className="field">
                  <TextInput name="name" placeholder="Your Name" style={{ height: 50 }} />
                </div>
                <div className="field">
                  <TextInput name="company" placeholder="Company Name" style={{ height: 50 }} />
                </div>
              </div>
              <div className="field">
                <EmailInput
                  name="email"
                  placeholder="Your Email..."
                  style={{ height: 50 }}
                  required
                />
              </div>
              <SubmitButton style={styles.submitButton}>SUBMIT →</SubmitButton>
            </Form>
          </Box>
        </BoxContent>

        <BoxContent
          style={Style.funcs.merge(styles.welcomeContainer, {
            display: this.state.selectedSequence === 7 ? 'block' : 'none',
            height: 500
          })}
        >
          <h1 style={styles.header}>Thank You!</h1>
          <Box style={styles.boxCommon}>
            <div style={styles.questionText}>
              We will get back to you shortly. <br />In the mean time, feel free to test out the
              calculator again by clicking
              <a style={{ cursor: 'pointer' }} href="https://myagi.com/public/sales-readiness/">
                {' '}
                here
              </a>.
            </div>
            <a href="https://myagi.com/">
              <img src={logoImg} style={{ height: 70, marginTop: 50 }} />
            </a>
          </Box>
        </BoxContent>

        <div
          style={Style.funcs.merge(styles.sequenceBack, {
            display: this.state.selectedSequence === 5 ? 'block' : 'none',
            bottom: 4,
            left: 45
          })}
          onClick={this.startSequenceAgain}
        >
          <i className="repeat icon" />
        </div>
        <div
          style={Style.funcs.merge(styles.sequenceBack, {
            display:
              this.state.selectedSequence !== 0 && this.state.selectedSequence < 7
                ? 'block'
                : 'none'
          })}
          onClick={this.goBackSequence}
        >
          ←
        </div>
        <div
          style={Style.funcs.merge(styles.sequenceIndex, {
            display: this.state.selectedSequence < 7 ? 'block' : 'none'
          })}
        >
          {this.state.selectedSequence}/6
        </div>
      </div>
    );
  }
}
