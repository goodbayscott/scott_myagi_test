const {
  extractFromFiles,
  findMissing,
  findUnused,
  findDuplicated,
  flatten
} = require('i18n-extract');
const fs = require('fs');

const MISSING = 'MISSING';
const JSON_SPACING = 4;

function ValidateI18nPlugin(opts) {
  this.localeData = flatten(opts.baseLocaleData);
  this.paths = opts.paths;
  this.functionMarker = opts.functionMarker;
  this.outputResults = opts.outputResults;
  this.outputMissing = opts.outputMissing;
  this.throwError = opts.throwError;
}

ValidateI18nPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', compilation => {
    const keys = extractFromFiles(this.paths, {
      marker: this.functionMarker
    });

    let reports = [];
    reports = reports.concat(findMissing(this.localeData, keys));
    reports = reports.concat(findUnused(this.localeData, keys));

    if (reports.length > 0) {
      if (this.outputResults) {
        fs.writeFileSync(this.outputResults, JSON.stringify(reports, null, JSON_SPACING));
        console.warn(`Issues relating to i18n keys have been logged to ${this.outputResults}`);
      } else {
        console.log(reports);
      }
      if (this.outputMissing) {
        const missing = {};
        reports.forEach(r => {
          if (r.type === MISSING) {
            missing[r.key] = '';
          }
        });
        fs.writeFileSync(this.outputMissing, JSON.stringify(missing, null, JSON_SPACING));
      }
      if (this.throwError) {
        throw new Error('There are some issues relating to i18n keys. Please see previous output.');
      }
    }
  });
};

module.exports = ValidateI18nPlugin;
