const chalk = require('chalk');
const execSync = require('child_process').execSync;
const semver = require('semver');
const shellEscape = require('shell-escape');

/**
 * Installs package list with versions via selected package manager
 *
 * @param {array} packages Array of package objects {package, version}
 * @param {string} package_manager (npm, yarn)
 * @param {string} working_directory Directory to install to
 * @returns {array}
 */
module.exports = (packages, package_manager, working_directory) => {
  let command = [];

  // Validate package manager
  switch(package_manager) {
    case `npm`:
      command.push(`npm`);
      command.push(`install`);
      break;

    case `yarn`:
      command.push(`yarn`);
      command.push(`add`);
      break;

    default:
      console.log(`${chalk.red(`Invalid package manager:`)} ${chalk.yellow(package_manager)}`);
      return false;
  }

  // Validate package list
  packages = packages.filter(package => (
      package.hasOwnProperty(`package`) &&
      package.hasOwnProperty(`version`) &&
      semver.valid(package.version)
  )).map(package => `${package.package}@${semver.valid(package.version)}`);

  if(packages.length === 0) {
    console.log(chalk.yellow(`No valid packages available to install`));
    return false;
  }
  command = command.concat(packages);
  packages.map(package => console.log(`Installing: ${chalk.cyan(package)} via ${chalk.cyan(package_manager)}`));

  // Install
  try {
    command = `${shellEscape([`cd`, working_directory])} && ${shellEscape(command)}`;
    execSync(command, {
      stdio: 'inherit',
    });
    return packages;
  } catch(e) {
    console.log(chalk.red(`An error occurred while installing the selected packages`));
    console.log(e.message);
    return false;
  }
}