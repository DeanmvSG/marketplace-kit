#!/usr/bin/env node

const program = require('commander'),
  updateNotifier = require('update-notifier'),
  pkg = require('./package.json'),
  version = pkg.version;

program
  .version(version)
  .command('deploy <environment>', 'deploy code to environment')
  .alias('d')
  .command('env', 'manage environments')
  .command('sync <environment>', 'update environment on file change')
  .command('logs <environment>', 'attach to environment log streams')
  .command('init', 'initialize required directory structure')
  .command('gui', 'open gui')
  .parse(process.argv);

updateNotifier({
  pkg
}).notify();

if (!program.args.length) program.help();
