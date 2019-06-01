#!/usr/bin/env node
const chalk = require('chalk');
const yargs = require('yargs');
const argv = yargs.usage(`unpackr <repository> <destination> [options]`)
                  .example(`unpackr repo.git dest -b master`, `Unpacks a repository to pathname`)

                  // Branch
                  .alias(`b`, 'branch')
                  .nargs(`b`, 1)
                  .describe(`b`, `Optional repository branch name`)

                  // Tag
                  .alias(`t`, 'tag')
                  .nargs(`t`, 1)
                  .describe(`n`, `Optional repository tag name`)

                  // Help
                  .help(`h`)
                  .alias(`h`, `help`)

                  // Finish up docs
                  .epilog(`Prompts for package dependency installation where applicable`)
                  .argv;

const Unpackr = require('../index');

(() => {
  // Parse arguments
  const destination = argv._[1] || null;
  const repository = argv._[0] || null;
  const branch = argv.branch || argv.b || null;
  const tag = argv.tag || argv.t || null;

  if(!repository) {
    console.log(chalk.red(`Missing repository argument`));
    console.log(`More information: ${chalk.yellow(`unpackr -h`)} or ${chalk.yellow(`unpackr --help`)}`);
    return;
  }

  if(!destination) {
    console.log(chalk.red(`Missing unpack destination argument`));
    console.log(`More information: ${chalk.yellow(`unpackr -h`)} or ${chalk.yellow(`unpackr --help`)}`);
    return;
  }

  process.unpackr_cli_env = true;

  Unpackr(repository, destination, {
    branch: branch,
    tag: tag,
  });
})();