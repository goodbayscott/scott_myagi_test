import React from 'react';
import Radium from 'radium';
import Style from 'style/index.js';

import { InfiniteScroll } from 'components/common/infinite-scroll';

const styles = {
  containerOuter: {
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    paddingLeft: 15
  },
  container: {
    height: 300,
    overflowY: 'scroll',
    marginLeft: -10
  },
  objectRow: {
    display: 'flex',
    alignItems: 'center',
    padding: 5,
    marginLeft: 10,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {}
  },
  objectRowHover: {
    opacity: 0.7
  },
  circle: {
    height: 30,
    width: 30,
    marginRight: 10,
    borderWidth: 1,
    borderRadius: 100,
    borderStyle: 'solid',
    transition: 'all 0.3s ease'
  },
  selected: {
    backgroundColor: Style.vars.colors.get('green'),
    borderColor: '#0000'
  },
  deselected: {
    backgroundColor: '#fff',
    borderColor: '#aaa'
  },
  changedIndicatorContainer: {
    width: 0
  },
  changedIndicator: {
    width: 10,
    height: 10,
    backgroundColor: '#0000',
    borderRadius: 5,
    marginLeft: -15,
    transition: 'all 0.8s ease'
  },
  changedIndicatorActive: {
    backgroundColor: '#0005'
  },
  tick: {
    marginLeft: 5,
    marginTop: 4
  },
  tickSelected: {
    color: '#fff'
  },
  tickDeselected: {
    color: '#aaa'
  }
};

@Radium
export class SelectObjects extends React.Component {
  show = () => {
    this.refs.modal.show();
  };

  onChange = changes => {
    if (!changes.newSelected) {
      changes.newSelected = {};
    }
    if (!changes.newDeselected) {
      changes.newDeselected = {};
    }
    this.props.onChange(changes);
  };

  select = o => {
    if (this.props.value.newDeselected[o.get('id')]) {
      const newDeselected = { ...this.props.value.newDeselected };
      delete newDeselected[o.get('id')];
      this.onChange({
        ...this.props.value,
        newDeselected
      });
    } else {
      this.onChange({
        ...this.props.value,
        newSelected: {
          ...this.props.value.newSelected,
          [o.get('id')]: o
        }
      });
    }
  };

  deselect = o => {
    if (this.props.value.newSelected[o.get('id')]) {
      const newSelected = { ...this.props.value.newSelected };
      delete newSelected[o.get('id')];
      this.onChange({
        ...this.props.value,
        newSelected
      });
    } else {
      this.onChange({
        ...this.props.value,
        newDeselected: {
          ...this.props.value.newDeselected,
          [o.get('id')]: o
        }
      });
    }
  };

  isSelected = o => {
    if (this.props.value.newSelected[o.get('id')]) {
      return true;
    } else if (this.props.value.newDeselected[o.get('id')]) {
      return false;
    }
    return this.props.isSelected(o);
  };

  isChanged = o => this.props.value.newSelected[o.get('id')] || this.props.value.newDeselected[o.get('id')];

  render() {
    return (
      <div style={styles.containerOuter}>
        <InfiniteScroll
          style={styles.container}
          loadMore={this.props.loadMore}
          moreDataAvailable={this.props.moreDataAvailable}
          dataIsLoading={this.props.dataIsLoading}
          scrollableContainer
        >
          {this.props.objects &&
            this.props.objects.map(o => {
              const selected = this.isSelected(o);
              const changed = this.isChanged(o);
              const hover = Radium.getState(this.state, o.get('id'), ':hover');

              return (
                <div
                  key={o.get('id')}
                  style={{
                    ...styles.objectRow,
                    ...(hover ? styles.objectRowHover : {})
                  }}
                  onClick={selected ? () => this.deselect(o) : () => this.select(o)}
                >
                  <div style={styles.changedIndicatorContainer}>
                    <div
                      style={{
                        ...styles.changedIndicator,
                        ...(changed ? styles.changedIndicatorActive : {})
                      }}
                    />
                  </div>
                  <div
                    style={{
                      ...styles.circle,
                      ...(selected ? styles.selected : styles.deselected),
                      ...(changed ? styles.changed : {})
                    }}
                  >
                    <i
                      style={{
                        ...styles.tick,
                        ...(selected ? styles.tickSelected : styles.tickDeselected)
                      }}
                      className="ui icon checkmark"
                    />
                  </div>
                  {this.props.renderObject(o)}
                </div>
              );
            })}
        </InfiniteScroll>
      </div>
    );
  }
}
