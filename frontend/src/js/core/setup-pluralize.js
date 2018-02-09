const pluralize = require('pluralize');

export const setupPluralize = function () {
  // Add any extra pluralization rules here.
  pluralize.addPluralRule('company', 'companies');
};
