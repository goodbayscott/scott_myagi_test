import _ from 'lodash';

export default {
  getInitialValues(prop, valsToRetrieve) {
    if (!prop) return {};
    if (!valsToRetrieve) return prop.toJS();
    return _.pick(prop.toJS(), valsToRetrieve);
  }
};
