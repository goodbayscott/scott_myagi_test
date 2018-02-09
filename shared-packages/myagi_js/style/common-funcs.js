import _ from 'lodash';

export default {
  merge() {
    if (arguments.length <= 1) {
      return arguments[0];
    }
    const asArray = Array.prototype.slice.call(arguments);
    asArray.unshift({});
    return _.extend.apply(this, asArray);
  },
  mergeIf(bool, baseStyle, ...otherStyles) {
    // If bool is true, merge baseStyle and all subsequence arguments.
    // Otherwise, just return baseStyle.
    if (bool) return this.merge.apply(this, [baseStyle].concat(otherStyles));
    return baseStyle;
  }
};
