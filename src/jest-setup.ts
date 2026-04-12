// Polyfill for util.isNullOrUndefined which was removed in newer Node.js versions
// but is used by @nestjs/typeorm v7
const util = require('util');
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = function (value) {
    return value === null || value === undefined;
  };
}
