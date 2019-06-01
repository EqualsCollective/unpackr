const fs = require('fs-extra');

/**
 * Provides read & parse utilities for files if found
 *
 * @param {string} path
 * @returns {object} {path, read(), parseJson()}
 */
module.exports = path => {
  try {
    if(!fs.pathExistsSync(path)) {
      throw Error();
    }

    return {
      path: path,
      read: () => {
        try {
          return fs.readFileSync(path);
        } catch(e) {
          return false;
        }
      },
      parseJson: () => {
        return fs.readJsonSync(path, {throws: false});
      },
    };
  } catch(e) {
    return {
      path: null,
      read: () => false,
      parseJson: () => false,
    };
  }
}