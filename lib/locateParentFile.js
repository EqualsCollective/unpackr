const path = require('path');
const os = require('os');

const fileRead = require('./fileRead');

/**
 * Locates first instance of a file in any parent directory
 *
 * @param {string} [filename=`package.json`]
 * @param {string} [start_path] Defaults to process.cwd()
 * @returns {fileRead} False if not found
 */
module.exports = (
  filename = `package.json`,
  start_path = null
) => {
  let cwd = start_path || process.cwd();

  // Define maximum search level
  const max_search = (os.platform() === `win32`) ? `${cwd.split(path.sep)[0]}${path.sep}` : path.normalize(`/`);

  // Recursive file search
  const search = () => {
    // Check file exists
    const search_path = path.join(cwd, filename);
    const file = fileRead(search_path);
    if(file) {
      return Object.assign({
        path: search_path,
      }, file);
    }

    // Update current search path
    cwd = path.join(cwd, `..`);

    // Break out of max level search
		if (
      cwd === max_search ||
      cwd === `.` ||
      cwd === `..`
    ) {
			return false;
    }

    return search();
  }

  return search();
}