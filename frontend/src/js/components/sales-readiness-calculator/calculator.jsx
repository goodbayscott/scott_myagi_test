import React from 'react';
import { SlideToggle, NumberInput, RangeInput } from 'components/common/form';

export class TextValueWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    this.props.updateData(this.props.widgetRef, event.target.value);
  }

  render() {
    return (
      <div className="field">
        <NumberInput
          placeholder={this.props.placeholder}
          value={this.state.value}
          onChange={this.handleChange}
          style={{ height: 50, fontSize: 16 }}
        />
      </div>
    );
  }
}

export class StoreReachWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mthly_stores_reached: 50
    };
  }

  handleChange = e => {
    this.setState({ mthly_stores_reached: e.target.value });
    this.props.updateData(this.props.widgetRef, e.target.value);
  };

  render() {
    return (
      <div className="field">
        <RangeInput
          type="range"
          min={1}
          max={100}
          name="calculator-range"
          onChange={this.handleChange}
          style={{
            height: 50,
            fontSize: 16,
            background: 'none',
            border: 'none'
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              backgroundColor: 'rgb(67, 75, 92)',
              color: '#FFFFFF',
              fontSize: '23px',
              padding: '10px'
            }}
          >
            {this.state.mthly_stores_reached}%
          </span>
        </div>
      </div>
    );
  }
}
