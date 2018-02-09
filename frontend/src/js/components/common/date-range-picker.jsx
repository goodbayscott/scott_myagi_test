import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import { DateRange, defaultRanges } from 'react-date-range';

import Style from 'style/index.js';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';

const styles = {
  dateDisplay: {
    width: 270,
    border: '1px solid #ddd',
    padding: '9px 15px',
    borderRadius: 4,
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
    ':hover': {
      transform: 'scale(1.01)',
      border: `1px solid ${Style.vars.colors.get('primary')}`
    }
  },
  rangeContainer: {
    zIndex: 10,
    position: 'absolute',
    paddingTop: 20,
    paddingLeft: 10,
    boxShadow: '0px 16px 27px rgba(0,0,0,0.2)'
  },
  buttonContainer: {
    backgroundColor: '#fff',
    padding: '10px 10px 10px 10px',
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    display: 'inline-block',
    marginRight: 10
  },
  predefinedRanges: {
    marginTop: 14,
    width: 95
  },
  predefinedRangesItem: {
    backgroundColor: '#fff',
    padding: '7px 10px'
  }
};

const DEFAULT_DATE_RANGES = {
  ...defaultRanges,
  'Last 60 Days': {
    startDate: now => now.subtract(59, 'days'),
    endDate: now => now
  },
  'This Month': {
    startDate: now => now.startOf('month'),
    endDate: now => now.endOf('month')
  },
  'Last Month': {
    startDate: now => now.subtract(1, 'month').startOf('month'),
    endDate: now => now.subtract(1, 'month').endOf('month')
  }
};

@Radium
export class DateRangePicker extends React.Component {
  static propTypes = {
    // Called when startDate and endData are updated.
    onChange: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const initialStartDate = this.props.initStartDate || moment().subtract(29, 'days');
    const initialEndDate = this.props.initEndDate || moment();
    this.state = {
      initialStartDate,
      initialEndDate,
      startDate: initialStartDate,
      endDate: initialEndDate,
      show: false
    };
  }

  onChange = ({ startDate, endDate }) => {
    this.setState({
      ...this.state,
      startDate,
      endDate
    });
  };

  submit = () => {
    this.setState({ ...this.state, show: false });
    this.props.onChange({
      startDate: this.state.startDate,
      endDate: this.state.endDate
    });
  };

  cancel = () => {
    this.setState({
      ...this.state,
      startDate: this.state.initialStartDate,
      endDate: this.state.initialEndDate,
      show: false
    });
  };

  render() {
    return (
      <div style={this.props.containerStyle || {}}>
        <div
          style={styles.dateDisplay}
          onClick={() => this.setState({ ...this.state, show: !this.state.show })}
        >
          <div>{this.state.startDate.format('Do MMM YYYY')}</div>
          &nbsp;<i className="ui icon angle right" />
          <div>{this.state.endDate.format('Do MMM YYYY')}</div>
        </div>
        {this.state.show && (
          <div style={styles.rangeContainer}>
            <DateRange
              linkedCalendars
              ranges={DEFAULT_DATE_RANGES}
              onChange={this.onChange}
              maxDate={moment()}
              theme={{
                PredefinedRanges: styles.predefinedRanges,
                PredefinedRangesItem: styles.predefinedRangesItem
              }}
            />
            <div style={styles.buttonContainer}>
              <SecondaryButton onClick={this.cancel} style={styles.button}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={this.submit} style={styles.button}>
                Apply
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    );
  }
}
