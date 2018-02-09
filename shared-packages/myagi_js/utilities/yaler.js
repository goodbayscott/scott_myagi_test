const React = require('react');
const Im = require('immutable');

import PropTypes from 'prop-types';

const _ = require('lodash');

import { assert } from 'utilities/assert';

const FIELD_NAME_SEPARATOR = '.';
const DEFAULT_FIELDS = ['id', 'url'];

function flattenArray(arr) {
  return arr.reduce(
    (flat, toFlatten) =>
      flat.concat(Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten),
    []
  );
}

function makeGetMod(origGet, propName, componentName, requestedFields) {
  return function (field, def) {
    if (!_.includes(requestedFields, field)) {
      throw new Error(`You are attempting to use field "${field}" which was not requested by by the ${componentName} component for the entity "${propName}".`);
    }
    return origGet(field, def);
  };
}

export default {
  getFields(component, entityName, baseFieldName) {
    if (!component.data || !component.data[entityName]) {
      console.error(`\`data\` or \`data.${entityName}\` not specified for component:`, component);
    }
    let requestedFields = component.data[entityName].fields;
    // Flatten `requestedFields` if it includes arrays
    requestedFields = flattenArray(requestedFields);
    if (baseFieldName) {
      requestedFields = requestedFields.map(field => `${baseFieldName}.${field}`);
    }
    return requestedFields;
  },
  _createFullPropCheck(optsForEntity) {
    /* Takes `optsForEntity` and creates
    prop test function that checks that requested fields are on the passed
    prop. */
    return function (props, propName, componentName) {
      // Determine correct React PropTypes for the requested entity.
      let propCheck;
      if (optsForEntity.many) {
        propCheck = PropTypes.instanceOf(Im.List);
      } else {
        propCheck = PropTypes.instanceOf(Im.Map);
      }
      // Assumed to be required unless specified otherwise
      const required = !!(optsForEntity.required === undefined || optsForEntity.required === true);
      if (required) {
        propCheck = propCheck.isRequired;
      }
      let e = propCheck(props, propName, componentName);
      // If react prop test fails, just return error.
      if (e) return e;
      // Validate that requested fields are on the prop.
      const propVal = props[propName];
      if (!propVal) return undefined;
      // If `many` is specified, then this must be a List.
      // In that case, we check fields on first entity in the list.
      const testItem = optsForEntity.many ? propVal.get(0) : propVal;
      if (!testItem) return undefined;
      const fields = flattenArray(optsForEntity.fields);
      _.each(fields, fieldName => {
        if (e) return;
        if (_.includes(fieldName, FIELD_NAME_SEPARATOR)) return;
        if (testItem.get(fieldName) === undefined) {
          e = new Error(`Requested field ${fieldName} on ${propName} not passed to ${componentName}.`);
        }
      });
      return e;
    };
  },

  getPropTypesForData(opts) {
    const pTypes = {};
    _.each(opts, (optsForEntity, entityName) => {
      pTypes[entityName] = this._createFullPropCheck(optsForEntity);
    });
    return pTypes;
  },

  propTypesFromData(component, extra) {
    if (component === undefined) {
      // it seems the vast majority of calls pass in undefined and emit a warning, makes for a noisy console
      return extra;
    }
    // Not passing a component as the first argument is a common mistake
    // if (!_.isFunction(component)) throw new Error('First argument to `propTypesFromData` should be a component');
    return _.extend(
      {
        _yalerData(props, _propName, componentName) {
          if (process.env.NODE_ENV == 'production') {
            return;
          }
          // For react native
          if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
          if (!component.data) {
            console.error(`No data property for component: '${component.toString()}'`);
          }
          if (!component.__cachedPropTypes) {
            component.__cachedPropTypes = Yaler.getPropTypesForData(component.data);
          }
          let error;
          _.each(component.__cachedPropTypes, (propTest, propName) => {
            if (error) return;
            const result = propTest(props, propName, componentName);
            if (result) error = result;
          });
          return error;
        }
      },
      extra
    );
  },

  getData(component, entityName, overrideOpts) {
    const componentData = component.data[entityName];
    if (overrideOpts) {
      return _.extend({}, componentData, overrideOpts);
    }
    return componentData;
  }
};
