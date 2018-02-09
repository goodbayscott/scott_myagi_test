import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

export const LoadingContainerMixin = {
  /*
    Shortcut for instantiating a component or loading spinner
    depending on whether data has loaded. `createComponent`
    is a func to instantiate the desired component. If any
    prop in `loadingProps` is falsey, then it is assumed that
    it is still loading (and loading spinner will be displayed).
    If prop is not null, but has no count (it is assumed that
    each prop is an Immutable.js structure), then `noDataText`
    is displayed. Otherwise, createComponent is used to generate
    the component.
  */
  propTypes: {
    createComponent: PropTypes.func.isRequired,
    loadingProps: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    // Text to display if there is no data available.
    noDataText: PropTypes.string,
    // Use this instead of `noDataText` prop if
    // more control is needed over styling/nature
    // of the no data element.
    createNoDataComponent: PropTypes.func,
    // Can be used to determine whether the
    // `NoData` el should be rendered or not.
    shouldRenderNoData: PropTypes.func
  },
  getDefaultProps() {
    return {
      noDataText: 'No data available',
      shouldRenderNoData(props) {
        // By default, only render no data el if all of the loading props are empty.
        const dataWithNoCount = _.filter(props, (v, k) => !(v ? v.count() : false));
        let length;
        if (_.isObject(props)) length = _.keys(props).length;
        else length = props.length;
        return dataWithNoCount.length >= length;
      }
    };
  },
  getInnerComponent() {
    return this.refs.innerComponent;
  },
  render() {
    let el;
    const dataStillLoading = _.filter(this.props.loadingProps, (v, k) => !v);
    const spinnerComponentFactory = this.getSpinnerComponentFactory();
    const noDataComponentFactory = this.getNoDataComponentFactory();
    if (dataStillLoading.length) {
      if (this.props.createLoadingComponent) {
        el = this.props.createLoadingComponent();
      } else {
        el = spinnerComponentFactory(this.props.spinnerProps);
      }
    } else if (this.props.shouldRenderNoData(this.props.loadingProps)) {
      if (this.props.createNoDataComponent) {
        el = this.props.createNoDataComponent();
      } else {
        el = noDataComponentFactory({}, this.props.noDataText);
      }
    } else {
      el = this.props.createComponent(this.props.loadingProps);
    }
    return el;
  }
};
