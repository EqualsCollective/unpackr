/**
 * Prevents relative path string from breaking out
 *
 * @param {string}
 * @returns {string}
 */
module.exports = path => path.replace(/\.\.\/?/g, ``) // Parent
                             .replace(/\.\//g, ``)    // Current (this should be handled with path.join)
                             .replace(/~\/?/g, ``)    // Home
                             .replace(/^\//, ``);     // Root