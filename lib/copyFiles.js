const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const sanitizeRelativePath = require('./sanitizeRelativePath');

/**
 * Copy files from relative path with source and destination root paths
 *
 * @example
 *   copyFiles(`file`, `/from/path`, `/to/path`);
 *   // /from/path/file -> /to/path/file
 *
 * @example
 *   copyFiles([`other/file`, `newname`], `/from/path`, `/to/path`);
 *   // /from/path/other/file -> /to/path/newname
 *
 * @param {string|array} src Relative path or path mapping array
 * @param {string} src_root Absolute source root path
 * @param {string} dest_root Absolute destination root path
 */
module.exports = (src, src_root, dest_root) => {
  let from;
  let to;
  let src_label;

  if(src instanceof Array) {

    // Mapping array
    src = src.map(v => sanitizeRelativePath(v));
    if(src.length < 2) { return false; }
    src_label = src[0];
    from = path.join(src_root, src[0]);
    to = path.join(dest_root, src[1]);

  } else {

    // Single path
    src = sanitizeRelativePath(src);
    src_label = src;
    from = path.join(src_root, src);
    to = path.join(dest_root, src);

  }

  // Copy
  try {
    fs.copySync(from, to);
    console.log(`Unpacked ${chalk.cyan(src_label)} to ${chalk.cyan(to)}`);
    return true;
  } catch(e) {
    console.log(`${chalk.red(`Error copying:`)} ${chalk.cyan(src_label)}`);
    return false;
  }
}