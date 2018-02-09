const React = require('react');
const _ = require('lodash');

function invokeFetches(component) {
  /*
    Have copied this directly from Marty.
    See https://github.com/jhollingworth/marty/blob/master/lib/createContainer/getFetchResult.js.
  */
  const fetches = {};

  if (_.isFunction(component.fetch)) {
    const result = component.fetch.call(component);

    if (result._isFetchResult) {
      throw new Error('Cannot return a single fetch result. You must return an object ' +
          'literal where the keys map to props and the values can be fetch results');
    }

    _.each(result, (result, key) => {
      fetches[key] = result;
    });
  } else {
    _.each(component.fetch, (getResult, key) => {
      if (!_.isFunction(getResult)) {
        console.warn(`The fetch ${key} was not a function and so ignoring`);
      } else {
        const result = getResult.call(component);
        fetches[key] = result;
      }
    });
  }
  return fetches;
}

export default {
  /*
    Utility functions for use within Marty
    containers.
  */
  noResults(errors) {
    let all404 = true;
    Object.keys(errors).forEach(key => {
      const err = errors[key];
      if (err.status !== 404) {
        all404 = false;
      }
    });
    return all404;
  },
  _getPartialProps(cxt, extraProps) {
    const fetches = invokeFetches(cxt);
    const existingResults = {};
    _.each(fetches, (fetch, key) => {
      if (!fetch) return;
      if (fetch.done) {
        existingResults[key] = fetch.result;
      }
    });
    const innerComponentProps = _.extend({}, cxt.props, existingResults, extraProps);
    return innerComponentProps;
  },
  _getComponentFactory(cxt, innerComponent) {
    // Bit of a hack to monkey patch on the component factory like this, but it reduces
    // boilerplate when using the defaultPending and defaultFailed functions
    cxt._componentFactory = cxt._componentFactory || React.createFactory(innerComponent);
    return cxt._componentFactory;
  },
  getIsLoadingFunc(cxt) {
    return function (prop) {
      // This line is simply so that old views do not break
      if (!prop) return true;
      return Boolean(invokeFetches(cxt)[prop].done);
    };
  },
  defaultDone(cxt, innerComponent, results) {
    /*
      Exactly the same as the MartyJS default done except it
      include the isLoading function as a prop by default
    */
    const factory = this._getComponentFactory(cxt, innerComponent);
    const props = _.extend({}, this.props, results);
    props.isLoading = this.getIsLoadingFunc(cxt);
    return factory(props);
  },
  defaultPending(cxt, innerComponent, extraProps) {
    /*
      Pending function for marty containers which will partially render the supplied
      component. Cxt must have getDefaultProps func.
    */
    const props = this._getPartialProps(cxt, extraProps);
    // Some components take boolean, others take a function
    props.loading = true;
    props.isLoading = this.getIsLoadingFunc(cxt);
    props.ref = 'innerComponent';
    const factory = this._getComponentFactory(cxt, innerComponent);
    return factory(props);
  },
  defaultFailed(cxt, innerComponent, errors) {
    /*
      Failed function for marty containers which will partially render the supplied
      component. Cxt must have getDefaultProps func.
    */
    if (this.noResults(errors)) {
      const props = this._getPartialProps(cxt);
      // Some components take boolean, others take a function
      props.loading = false;
      props.isLoading = () => false;
      const factory = this._getComponentFactory(cxt, innerComponent);
      return factory(props);
    }
    throw errors;
    return <div> An error occurred while loading this page. </div>;
  }
};
