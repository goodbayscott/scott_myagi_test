import React from 'react';
import Style from 'style';

import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  channelItem: {
    display: 'flex',
    alignItems: 'center',
    margin: 5,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 50,
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderColor: '#ccc',
    ':hover': {
      borderColor: '#999',
      transform: 'scale(1.05)'
    }
  },
  selectedChannelItem: {
    backgroundColor: Style.vars.colors.get('blue'),
    borderColor: Style.vars.colors.get('blue')
  },
  logo: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'white',
    width: 45,
    height: 45,
    margin: -1,
    borderRadius: '50%',
    border: '1px solid #ccc'
  },
  name: {
    margin: '0px 10px',
    maxWidth: 240
  },
  selectedName: {
    color: 'white'
  }
};

export class ChannelSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {}
    };
  }

  getChannels = () => this.state.selected;

  toggle = c => {
    if (this.state.selected[c.get('id')]) {
      this.remove(c);
    } else {
      this.add(c);
    }
  };

  add = toAdd => {
    this.setState({
      ...this.state,
      selected: {
        ...this.state.selected,
        [toAdd.get('id')]: toAdd
      }
    });
  };

  remove = toRemove => {
    const selected = { ...this.state.selected };
    delete selected[toRemove.get('id')];
    this.setState({ ...this.state, selected });
  };

  render() {
    return (
      <div style={styles.container}>
        {this.props.channels.map(c => (
          <div
            style={{
              ...styles.channelItem,
              ...(this.state.selected[c.get('id')] ? styles.selectedChannelItem : {})
            }}
            key={c.get('id')}
            onClick={() => this.toggle(c)}
          >
            <div
              style={{
                ...styles.logo,
                backgroundImage: `url(${c.get('logo') || PLACEHOLDER_IMAGE})`
              }}
            />
            <div
              style={{
                ...styles.name,
                ...(this.state.selected[c.get('id')] ? styles.selectedName : {})
              }}
            >
              {c.get('name')}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
