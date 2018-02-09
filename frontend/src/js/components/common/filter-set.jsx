import React from 'react';
import cx from 'classnames';
import _ from 'lodash';
import { t } from 'i18n';
import reactMixin from 'react-mixin';
import Radium from 'radium';

import Style from 'style/index.js';

import { Dropdown } from 'components/common/dropdown.jsx';

class FilterSetMixin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curFilter: this.props.initial || this.props.filterNames[0]
    };
  }
  componentWillUpdate = nextProps => {
    if (!_.isEqual(nextProps.filterNames, this.props.filterNames)) {
      this.setState({ curFilter: nextProps.filterNames[0] });
    }
  };
  setFilter = filterName => {
    if (!filterName) return;
    this.setState({ curFilter: filterName });
    this.props.setFilter(filterName);
  };
}

const styles = {
  button: {
    boxShadow: 'none',
    margin: '5px 5px 5px 0',
    padding: '9px 13px',
    display: 'inline-block',
    cursor: 'pointer',
    color: Style.vars.colors.get('darkGrey'),
    border: `1px solid ${Style.vars.colors.get('darkGrey')}`,
    borderRadius: 40,
    ...Style.funcs.makeTransitionAll(),
    ':hover': {
      color: Style.vars.colors.get('primary'),
      border: {
        toString() {
          return `1px solid ${Style.vars.colors.get('primary')}`;
        }
      }
    }
  },
  indicator: {
    marginLeft: '1em'
  },
  get activeButton() {
    return this.button[':hover'];
  }
};

@Radium
export class FilterItem extends React.Component {
  renderFilterName() {
    const { filterName } = this.props;
    if (this.props.renderFilterName) {
      // Mainly used to allow translation of filter names
      return this.props.renderFilterName(filterName);
    }
    return filterName;
  }
  render() {
    const {
      isActive, filterName, showIndicator, style
    } = this.props;
    const props = {
      key: filterName,
      onClick: () => this.props.setFilter(filterName),
      style: Style.funcs.merge(
        Style.funcs.mergeIf(isActive, styles.button, styles.activeButton),
        style
      )
    };
    return (
      <div {...props}>
        {t(this.renderFilterName())}
        {showIndicator && (
          <div className="ui orange empty circular mini label" style={styles.indicator} />
        )}
      </div>
    );
  }
}

const fsStyle = {
  container: {}
};

@reactMixin.decorate(FilterSetMixin)
export class FilterSet extends FilterSetMixin {
  /*
    A set of adjacent buttons which are designed to be used
    as filters for collections of content.
  */
  static propTypes = {
    filterNames: React.PropTypes.array.isRequired,
    setFilter: React.PropTypes.func.isRequired,
    createButton: React.PropTypes.func
  };

  getButtonEl = filterName => {
    const isActive = filterName === this.state.curFilter;
    const props = {
      key: filterName,
      setFilter: this.setFilter,
      showIndicator: this.props.indicators && this.props.indicators.includes(filterName),
      filterName,
      isActive
    };
    if (this.props.createButton) {
      return this.props.createButton(props);
    }
    return <FilterItem {...props} />;
  };

  render() {
    const cStyle = Style.funcs.merge(fsStyle.container, this.props.containerStyle);
    return <div style={cStyle}>{_.map(this.props.filterNames, this.getButtonEl)}</div>;
  }
}

@reactMixin.decorate(FilterSetMixin)
export class DropdownFilterSet extends FilterSetMixin {
  /*
    A dropdown which is designed to be used to filter
    collections of content.
  */
  static propTypes = {
    filterNames: React.PropTypes.array.isRequired,
    setFilter: React.PropTypes.func.isRequired
  };

  getItemEl = filterName => (
    <div key={filterName} data-value={filterName} className="item">
      {t(filterName)}
    </div>
  );

  render() {
    const cStyle = this.props.containerStyle;
    return (
      <Dropdown style={cStyle} className="ui dropdown" dropdownOpts={{ onChange: this.setFilter }}>
        <i className="filter icon" />
        <div className="text">{this.state.curFilter}</div>
        <i className="dropdown icon" />
        <div className="menu" style={{ zIndex: 9999 }}>
          {_.map(this.props.filterNames, this.getItemEl)}
        </div>
      </Dropdown>
    );
  }
}
