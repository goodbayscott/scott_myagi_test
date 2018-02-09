import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import cx from 'classnames';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import Fuse from 'fuse.js';
import Select from 'react-select';

import $ from 'vendor/jquery/semantic';

import Style from 'style';

import { KEY_CODES } from 'core/constants';

import { JQueryComponentMixin } from 'components/common/jquery-component-mixin';

import { t } from 'i18n';

import { TextInput } from 'components/common/form/input';
import { InputMixin } from 'common-mixins/form/input';

import { FormFieldMixin } from 'common-mixins/form/form-field';

import REGION_OPTIONS from './regions';

export const ASYNC_SEARCH_THROTTLE_TIME = 300;
export const ASYNC_MAX_RESULTS = 10;

const styles = {
  errorMsg: {
    color: Style.vars.colors.get('errorRed'),
    marginTop: 5
  }
};

const SelectMixin = {
  /*
    A wrapper for http://semantic-ui.com/modules/dropdown.html#search-dropdown.
    Intended to be used as a select box in forms.
  */
  mixins: [FormFieldMixin, JQueryComponentMixin],

  propTypes: {
    // An array of objects with `value` and `label`
    // attrs.
    options: React.PropTypes.array.isRequired,
    // Placeholder text. If not specified, first
    // option will be automatically selected instead.
    noSelectionText: React.PropTypes.string,
    // Called when new option is selected. Will be passed
    // the `value` for the selected option.
    onChange: React.PropTypes.func,
    required: React.PropTypes.bool,
    // Value for initial selection
    initialSelection(props, propName, componentName) {
      const values = props.options.map(opt => opt.value);
      const val = props[propName];
      if (!val) return undefined;
      if (!_.includes(values, val)) {
        return new Error('`initialSelection` refers to an option which does not exist in `options`');
      }
    }
  },

  getDropdownEl() {
    return $(ReactDOM.findDOMNode(this)).find('#dropdown');
  },

  isValid() {
    if (this.props.required && !this.state.value) {
      this.setState({ errorMsg: 'value_required' });
      return false;
    }
    this.setState({ errorMsg: null });
    return true;
  },

  getSortedOptions() {
    if (this.props.initialSelection !== undefined) {
      const parts = _.partition(
        this.props.options,
        opt => opt.value === this.props.initialSelection
      );
      return [].concat.apply([], parts);
    }
    return this.props.options;
  },

  renderError() {
    if (!this.state || !this.state.errorMsg || !this.props.hasSubmitted) {
      return null;
    }
    return (
      <div style={styles.errorMsg}>
        <p>{t(this.state.errorMsg)}</p>
      </div>
    );
  },

  getNoSelectionEl() {
    return this.props.noSelectionText && this.props.initialSelection === undefined ? (
      <option value=""> {this.props.noSelectionText} </option>
    ) : null;
  },

  onChange(val) {
    // `val` is undefined when input is first loaded inside `InfiniteInputs`,
    // even if it is given an initialSelection.
    if (val === undefined) return;
    if (this.props.onChange) this.props.onChange(val);
    this.setState({ value: val });
  }
};

@reactMixin.decorate(InputMixin)
export class MultiSelect extends React.Component {
  /* Uses https://github.com/JedWatson/react-select to create a searchable multi
     select. Provide an array of objects with `label` and `value`:
     [{label: 'plan 1234', value: 'http://localhost:8000/api/v1/training_plans/7223/'}, ]
  */
  static propTypes = {
    options: React.PropTypes.array.isRequired,
    placeholder: React.PropTypes.string,
    noResultsText: React.PropTypes.string,
    multi: React.PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedItems: props.initialSelection ? props.initialSelection : []
    };
  }

  onChange = data => {
    if (this.props.onChange) this.props.onChange(data);
    const items = data.map(item => item.value);
    this.setState({ selectedItems: items });
  };

  getNameAndValue = () => ({
    [this.props.name]: this.state.selectedItems.map(item => (item instanceof Object ? item.value : item))
  });

  isValid = () => (this.props.required ? this.state.selectedItems.length : true);

  render() {
    return (
      <div>
        {this.getLabelEl(this.props.labelStyle)}
        <Select
          multi
          style={this.props.style}
          arrowRenderer={this.props.arrowRenderer}
          clearable={this.props.clearable}
          valueRenderer={this.props.valueRenderer}
          searchable={this.props.searchable}
          value={this.state.selectedItems}
          options={this.props.options}
          onChange={this.onChange}
          placeholder={this.props.placeholder}
          noResultsText={this.props.noResultsText ? this.props.noResultsText : 'No items found.'}
        />
      </div>
    );
  }
}

@reactMixin.decorate(SelectMixin)
export class SearchableSelect extends React.Component {
  /*
    A wrapper for http://semantic-ui.com/modules/dropdown.html#search-dropdown.
    Intended to be used as a select box in forms.
  */

  manipulateDOMWithJQuery() {
    this.$el = this.getDropdownEl().dropdown(_.extend(
      {
        match: 'text',
        fullTextSearch: true,
        onChange: this.onChange.bind(this)
      },
      this.props.dropdownOpts
    ));
    this.getTextInput().on('input', evt => {
      if (this.props.onSearch) {
        this.props.onSearch(evt.target.value);
      }
    });
  }

  getTextInput() {
    return $(ReactDOM.findDOMNode(this)).find('input.search');
  }

  componentDidUpdate(prevProps) {
    // If options update, then input is destroyed and recreated
    // with the same value.
    if (!_.isEqual(prevProps.options, this.props.options)) {
      const curVal = this.getTextInput().val();
      // This is defined in `JQueryComponentMixin`.
      this.refresh();
      this.getTextInput().val(curVal);
      // Ensure that initialSelection is used if props update.
      if (this.props.initialSelection) {
        this.onChange(this.props.initialSelection);
      }
    }
  }

  renderJQueryControlledContent() {
    const noSelectionEl = this.getNoSelectionEl();
    const opts = this.getSortedOptions();
    const cls = cx('ui', { fluid: this.props.fluid }, 'search', 'dropdown');
    return (
      <div className="field" style={this.props.style.container}>
        {this.getLabelEl(this.props.style.label)}
        <select id="dropdown" className={cls}>
          {noSelectionEl}
          {opts.map(opt => (
            <option key={_.uniqueId('selectopt-')} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

@reactMixin.decorate(SelectMixin)
export class DropdownSelect extends React.Component {
  /*
    A wrapper for http://semantic-ui.com/modules/dropdown.html#search-dropdown.
    Intended to be used as a select box in forms.
  */

  manipulateDOMWithJQuery() {
    this.$el = this.getDropdownEl().dropdown({
      onChange: this.onChange.bind(this)
    });
  }

  renderJQueryControlledContent() {
    const noSelectionEl = this.getNoSelectionEl();
    const opts = this.getSortedOptions();
    return (
      <div className="field" style={this.props.style.container}>
        {this.getLabelEl(this.props.style.label)}
        <select className="ui dropdown" id="dropdown">
          {noSelectionEl}
          {opts.map(opt => (
            <option key={_.uniqueId('selectopt-')} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  renderPostJQueryControlledContent() {
    return this.renderError();
  }
}

export class RegionDropdownSelect extends React.Component {
  isValid() {
    if (!this.dropdown) return true;
    return this.dropdown.isValid();
  }
  getNameAndValue() {
    if (!this.dropdown) return {};
    return this.dropdown.getNameAndValue();
  }
  render() {
    return (
      <DropdownSelect
        ref={el => (this.dropdown = el)}
        options={_.sortBy(REGION_OPTIONS, o => o.label)}
        {...this.props}
      />
    );
  }
}

const smsStyle = {
  optionContainer: {
    position: 'relative',
    float: 'left',
    padding: 10,
    backgroundColor: Style.vars.colors.get('green'),
    color: 'white',
    margin: 3
  },
  container: {
    marginBottom: '1em'
  },
  removeIcon: {
    fontSize: 10,
    position: 'absolute',
    top: 2,
    right: -2,
    cursor: 'pointer'
  }
};

export class SearchableMultiSelect extends React.Component {
  static propTypes = {
    options: React.PropTypes.array.isRequired,
    initialSelections: React.PropTypes.array,
    required: React.PropTypes.bool
  };

  constructor(props) {
    super();
    const valToOptMap = this._createValToOptMap(props.options);
    const selections = {};
    if (props.initialSelections) {
      props.initialSelections.forEach(val => {
        if (valToOptMap[val] === undefined) {
          // TODO: there's probably a better way to handle this.
          console.error('Found initial selection that is absent in options');
        } else {
          selections[val] = valToOptMap[val];
        }
      });
    }
    this.state = {
      selections,
      valToOptMap
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.options, this.props.options)) {
      const valToOptMap = this._createValToOptMap(nextProps.options);
      this.setState({ valToOptMap });
    }
  }

  _createValToOptMap(opts) {
    const valToOptMap = {};
    opts.forEach(opt => {
      if (!opt.value) console.error('Found option with no value');
      valToOptMap[opt.value] = opt;
    });
    return valToOptMap;
  }

  onChange = value => {
    const opt = this.state.valToOptMap[value];
    this.state.selections[opt.value] = opt;
    this.setState({ selections: this.state.selections });
    if (this.props.onChange) this.props.onChange(this.state.selections);
    this.refs.select.refresh();
  };

  removeSelection(val) {
    delete this.state.selections[val];
    this.setState({ selections: this.state.selections });
    if (this.props.onChange) this.props.onChange(this.state.selections);
  }

  renderSelectedOption(opt) {
    if (!opt) return undefined;
    const removeFunc = _.bind(this.removeSelection, this, opt.value);
    return (
      <div key={opt.value} style={smsStyle.optionContainer}>
        <i className="ui remove icon" style={smsStyle.removeIcon} onClick={removeFunc} />
        {opt.label}
      </div>
    );
  }

  getNameAndValue() {
    return {
      [this.props.name]: _.map(this.state.selections, selection => selection.value)
    };
  }

  isValid() {
    if (this.props.required) {
      return Boolean(_.size(this.state.selections));
    }
    return true;
  }

  render() {
    const options = this.props.options.filter(opt => !this.state.selections[opt.value]);
    return (
      <div style={smsStyle.container}>
        <SearchableSelect {...this.props} options={options} onChange={this.onChange} ref="select" />
        {_.map(this.state.selections, this.renderSelectedOption.bind(this))}
        <div style={Style.common.clearBoth} />
      </div>
    );
  }
}

//    ; - )
const assStyles = {
  resultContainerStyle: {
    overflowY: 'scroll',
    maxHeight: 300,
    width: '99%',
    marginLeft: '0.5%'
  },
  itemStyle: {
    textAlign: 'left'
  },
  highlightedItemStyle: {
    backgroundColor: Style.vars.colors.get('xLightGrey')
  }
};

@reactMixin.decorate(FormFieldMixin)
export class AsyncSearchableSelect extends React.Component {
  /*
    Manages fetching and displaying results of store fetch.
    Despite what it's name would suggest, this component is
    implemented quite differently to the standard SearchableSelect
    component. TODO - Could potentially integrate the two.

    Inspired by http://semantic-ui.com/modules/search.html
  */
  static propTypes = {
    // Func which implements fetch for required data
    // from a store.
    fetch: React.PropTypes.func.isRequired,
    // Function which converts fetched entity into
    // a valid, selectable option (i.e. an object
    // with `name` and `value` attributes).
    makeOption: React.PropTypes.func.isRequired,
    onChange: React.PropTypes.func,
    // Should be used instead of `initialValue`
    placeholder: React.PropTypes.string
  };

  constructor(props) {
    super();
    const throttledExecFetch = _.throttle(this.execFetch, ASYNC_SEARCH_THROTTLE_TIME, {
      leading: false,
      trailing: true
    });
    if (props.initialValue) {
      console.warn('Please use `placeholder` instead of `initialValue` for `AsyncSearchableSelect` components.');
    }
    this.state = {
      options: [],
      curSearch: null,
      resultsVisible: false,
      throttledExecFetch,
      highlightedOptionIndex: 0,
      loading: false
    };
  }

  callOnChange(value = null) {
    if (this.props.onChange) this.props.onChange(value);
  }

  resultsToOptions(results) {
    const opts = results.take(ASYNC_MAX_RESULTS).map(this.props.makeOption);
    // Use fuse to order options locally according to
    // how well they match the search term.
    const f = new Fuse(opts.toJS(), {
      keys: ['label'],
      shouldSort: true
    });
    return f.search(this.state.curSearch);
  }

  execFetch = () => {
    const fetch = this.props.fetch(this.state.curSearch);
    if (fetch) {
      this.setState({ loading: true, curFetch: fetch });
      const promise = fetch.toPromise();
      promise.then(results => {
        if (this.state.curFetch !== fetch) return;
        this.setState({ loading: false });
        if (!this.state.curSearch) return;
        const opts = this.resultsToOptions(results);
        const newState = {
          options: opts
        };
        if (!opts.length) {
          newState.resultsVisible = false;
        } else {
          newState.resultsVisible = true;
        }
        this.setState(newState);
      });
    }
  };

  onOptionClick = selectedOption => {
    this.refs.textInput.setValue(selectedOption.label);
    this.setState({
      resultsVisible: false,
      value: selectedOption.value
    });
    this.callOnChange(selectedOption.value);
  };

  onBlur = evt => {
    this.setState({ resultsVisible: false });
    // If not a valid selected result, clear input
    // so user is aware that they didn't properly select anything
    if (this.state.value) return;
    this.refs.textInput.setValue(this.props.initialValue);
  };

  onSearchInputChange = evt => {
    const newVal = evt.target.value;
    if (this.props.onSearchInputChange) this.props.onSearchInputChange(newVal);
    this.setState({
      curSearch: newVal,
      value: null,
      highlightedOptionIndex: 0
    });
    if (!newVal) {
      this.setState({
        results: Im.List(),
        resultsVisible: false,
        loading: false
      });
    } else {
      this.state.throttledExecFetch();
    }
    this.callOnChange();
  };

  onKeyDown = evt => {
    const keyCode = evt.keyCode;
    if (keyCode === KEY_CODES.DOWN) {
      this.setHighlightedOption(this.state.highlightedOptionIndex + 1);
    } else if (keyCode === KEY_CODES.UP) {
      this.setHighlightedOption(this.state.highlightedOptionIndex - 1);
    } else if (keyCode === KEY_CODES.ESCAPE) {
      this.setState({ resultsVisible: false });
    } else if (keyCode === KEY_CODES.ENTER) {
      evt.stopPropagation();
      evt.preventDefault();
      this.selectCurrentlyHighlightedOption();
    }
  };

  setHighlightedOption(newIndex) {
    const resultsCount = this.state.options.length;
    if (newIndex <= -1) newIndex = resultsCount - 1;
    else if (newIndex >= resultsCount) newIndex = 0;
    this.setState({ highlightedOptionIndex: newIndex });
  }

  selectCurrentlyHighlightedOption() {
    const opt = this.state.options[this.state.highlightedOptionIndex];
    if (opt) this.onOptionClick(opt);
  }

  isValid() {
    // Because this component inherits from FormField, value will
    // be set to `initialValue` (which is always just a placeholder).
    // We never want to submit that. Users should use the `placeholder`,
    // settings instead. TODO - Should disable `initialValue` and
    // force usage of `placeholder`. Have added a warning about this
    // in the constructor.
    if (this.props.initialValue && this.state.value === this.props.initialValue) return false;
    if (this.props.required) return Boolean(this.state.value);
    return true;
  }

  render() {
    const resultEls = _.map(this.state.options, (opt, i) => {
      let style = assStyles.itemStyle;
      if (i === this.state.highlightedOptionIndex) {
        style = Style.funcs.merge(style, assStyles.highlightedItemStyle);
      }
      return (
        <div
          key={opt.value}
          className="result"
          style={style}
          onMouseDown={_.partial(this.onOptionClick, opt)}
        >
          <div className="content">
            <div className="title">{opt.label}</div>
          </div>
        </div>
      );
    });
    const resultsClasses = cx('ui', 'results', 'transition', {
      visible: this.state.resultsVisible
    });
    return (
      <div className="ui search focus">
        <TextInput
          onChange={this.onSearchInputChange}
          icon="search"
          ref="textInput"
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
          initialValue={this.props.placeholder || this.props.initialValue}
          loading={this.state.loading}
          fadeInitial={this.props.fadePlaceholder}
          name="search"
        />
        <div className={resultsClasses} style={assStyles.resultContainerStyle}>
          {resultEls}
        </div>
      </div>
    );
  }
}
