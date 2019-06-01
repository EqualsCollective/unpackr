const chalk = require('chalk');
const crypto = require('crypto');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const rimraf = require('rimraf');
const semver = require('semver');
const shellEscape = require('shell-escape');

const copyFiles = require('./lib/copyFiles');
const fileRead = require('./lib/fileRead');
const installPackages = require('./lib/installPackages');
const locateParentFile = require('./lib/locateParentFile');

/**
 * Unpacks repository contents to new destination directory with optional
 * dependency installation and unpack configuration
 *
 * @param {string} repository Repository to clone and unpack
 * @param {string} destination Clone destination
 * @param {object} [options]
 * @param {string} [options.branch] Clone repository branch name (branch cannot be used with tag)
 * @param {string} [options.tag] Clone repository tag name (tag cannot be used with branch)
 * @param {string} [options.installDependencies] Dependency installation package manager (npm, yarn)
 * @returns {void}
 */
module.exports = (repository, destination, options = {}) => {
  options = Object.assign({
    branch: null,
    tag: null,
    installDependencies: false,
  }, options);
  destination = path.resolve(process.cwd(), destination);


  // Make sure branch and tag aren't simultaneously specified.
  if(options.branch && options.tag) {
    console.log(chalk.red(`Cannot checkout with both branch and tag simultaneously.`));
    console.log(chalk.red(`Please try again specifying only branch or tag.`));
    return;
  } else {
    options.clone_branch_target = options.branch || options.tag;
  }


  console.log(chalk.green(`Unpacking files...`));
  console.log(`From: ${chalk.cyan(repository)}`);
  if(options.branch) {
    console.log(chalk.gray(`        (branch ${chalk.magenta(options.branch)})`));
  }else if(options.tag) {
    console.log(chalk.gray(`        (tag ${chalk.magenta(options.tag)})`));
  }
  console.log(`To:   ${chalk.cyan(destination)}`);


  // Prevent destination overwrite
  try {
    if(fs.pathExistsSync(destination)) {
      console.log(chalk.red(`Destination directory exists: ${chalk.cyan(destination)}`));
      return;
    }
  } catch (e) {}


  // Manage directory names
  const hash = crypto.createHash(`md5`)
                     .update(`${repository}${options.branch}${Date.now()}`)
                     .digest(`hex`);
  const clone_dirname = `unpackr-tmp-${hash}`;
  const clone_dirpath = path.join(process.cwd(), clone_dirname);


  // Clone repository to temporary location
  try {
    console.log(`\nCreating temporary files...`);
    let command = [`git`, `clone`, `--depth`, 1, repository, clone_dirpath];
    if(options.clone_branch_target) {
      command = [`git`, `clone`, `-b`, options.clone_branch_target.replace(/\s\.;&/g, ``), `--depth`, 1, repository, clone_dirpath];
    }
    execSync(shellEscape(command), {
      // stdio: `inherit`,
    });
  } catch(e) {
    console.log(chalk.red(`\nAn error occurred while cloning repository`));
    console.log(e.message);
    return;
  }


  // Locate unpackr.config.json
  let unpackr_config = fileRead(path.join(clone_dirpath, `unpackr.config.json`));
  let unpack_all = false;

  if(unpackr_config) {
    unpackr_config = unpackr_config.parseJson();
    if(!unpackr_config.files) {
      unpack_all = true;
      console.log(chalk.yellow(`\nInvalid unpackr.config.json in target repository root`));
    } else {
      console.log(chalk.green(`\nunpackr.config.json located and parsed`));
    }
  } else {
    unpack_all = true;
    console.log(chalk.yellow(`\nunpackr.config.json not found in repository root`));
  }


  // Cache cloned package.json
  const clone_package = locateParentFile(`package.json`, clone_dirpath).parseJson();


  // Unpack files
  if(unpack_all) {
    // Unpack ALL files
    console.log(`\nUnpacking all files...`);
    fs.copySync(clone_dirpath, destination);
    console.log(`All files unpacked to ${chalk.cyan(destination)}`);

    // Clean up
    console.log(`\nRemoving temporary files...`);
    rimraf.sync(path.join(destination, `.git`));
    rimraf.sync(clone_dirpath);
    console.log(`Removed temporary files`);
  } else {
    // Unpack config files
    unpackr_config.files.map(src => copyFiles(
      src,
      clone_dirpath,
      destination
    ));

    // Clean up
    console.log(`\nRemoving temporary files...`);
    rimraf.sync(clone_dirpath);
    console.log(`Removed temporary files`);
  }


  // Check unpacked files for package.json
  if(!clone_package || !clone_package.dependencies) {
    console.log(`\nNo unpacked package dependencies found`);
    console.log(chalk.green(`\nUnpack complete`));
    return;
  }


  // Parse local package
  const local_package_path = locateParentFile(`package.json`, path.join(destination, `..`)).path;
  const local_package = locateParentFile(`package.json`, path.join(destination, `..`)).parseJson();
  if(!local_package) {
    // No local package
    console.log(chalk.yellow(`\nNo local package.json found`));
    console.log(`Consider manually installing the following unpacked dependencies:`);
    Object.keys(clone_package.dependencies).forEach((key, i, a) => {
      console.log(`${i !== a.length - 1 ? `├` : `└`}── ${key}@${semver.valid(semver.coerce(clone_package.dependencies[key]))}`);
    });
    console.log(chalk.green(`\nUnpack complete`));
    return;
  }
  local_package.dependencies = local_package.dependencies || {};


  // Generate dependency installation options
  const dependency_options = Object.keys(clone_package.dependencies).map(key => {
    const clone_version = semver.valid(semver.coerce(clone_package.dependencies[key]));
    const local_version = semver.valid(semver.coerce(local_package.dependencies[key]));

    let option = `${key} - ${clone_version}`;
    if(local_package.dependencies.hasOwnProperty(key)) {
      // Currently installed
      option += chalk.yellow(` (currently installed - ${local_version})`);
    }

    return {
      name: option,
      value: {
        package: key,
        version: clone_version,
      },
    };
  });


  // Dependency installation
  if(process.unpackr_cli_env) {

    // Prompt for dependency installation
    console.log(`\nUnpacked package.json contains dependencies`);
    inquirer.prompt([{
      type: `checkbox`,
      name: `dependencies`,
      choices: dependency_options,
      message: `Please select the dependencies to install`,
    }]).then(({dependencies}) => {
      if(dependencies.length === 0) {
        console.log(`No dependencies selected`);
        console.log(chalk.green(`\nUnpack complete`));
        return;
      }

      // Prompt for installation method
      inquirer.prompt([{
        type: `list`,
        name: `package_manager`,
        choices: [
          `npm`,
          `yarn`,
        ],
        message: `Please select the required installation package manager`,
      }]).then(({package_manager}) => {
        if(installPackages(dependencies, package_manager, path.dirname(local_package_path))) {
          console.log(chalk.green(`\nUnpack complete`));
        }
      });
    });

  } else if(options.installDependencies) {

    // Install all
    if(installPackages(
      dependency_options.map(v => v.value),
      options.installDependencies,
      path.dirname(local_package_path))
    ) {
      console.log(chalk.green(`\nUnpack complete`));
    }

  } else {

    // Dependencies available but not requested
    console.log(chalk.yellow(`Unpacked dependencies located but installDependencies was not specified`));
    console.log(`Consider manually installing the following unpacked dependencies:`);
    Object.keys(clone_package.dependencies).forEach((key, i, a) => {
      console.log(`${i !== a.length - 1 ? `├` : `└`}── ${key}@${semver.valid(semver.coerce(clone_package.dependencies[key]))}`);
    });
    console.log(chalk.green(`\nUnpack complete`));

  }

  return;
}