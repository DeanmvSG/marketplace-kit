#!/usr/bin/env node

const program = require('commander'),
  Proxy = require('./lib/proxy').Proxy,
  fs = require('fs'),
  path = require('path'),
  watch = require('node-watch'),
  notifier = require('node-notifier'),
  logger = require('./lib/kit').logger,
  watchFilesExtensions = require('./lib/watch-files-extensions'),
  version = require('./package.json').version;

const shouldBeSynced = (filePath, event) => {
  return fileUpdated(event) && extensionAllowed(ext(filePath)) && !isHiddenFile(filename(filePath));
};

const isHiddenFile = filename => filename.startsWith('.');
const ext = path => path.split('.').pop();
const extensionAllowed = ext => watchFilesExtensions.includes(ext);
const filename = filePath => filePath.split(path.sep).pop();
const fileUpdated = event => event === 'update';
const filePathUnixified = filePath => filePath.replace(/\\/g, '/').replace('marketplace_builder/', '');

const pushFile = (filePath, authData) => {
  logger.Info(`[Sync] ${filePath}`);

  const formData = {
    path: filePathUnixified(filePath), // need path with / separators
    marketplace_builder_file_body: fs.createReadStream(filePath)
  }

  proxy.sync(formData).then(
    body => {
      logger.Success(`[Sync] ${filePath} - done`);
    },
    error => {
      notifier.notify({ title: 'MarkeplaceKit Sync Error', message: error });
      logger.Error(` - ${error}`);
    }
  );
};

program
  .version(version)
  .option('--token <token>', 'authentication token', process.env.MARKETPLACE_TOKEN)
  .option('--url <url>', 'marketplace url', process.env.MARKETPLACE_URL)
  // .option('--files <files>', 'watch files', process.env.FILES || watchFilesExtensions)
  .parse(process.argv);

const checkParams = params => {
  const errors = [];
  if (typeof params.token === 'undefined') {
    errors.push(' no token given! Please add --token token');
  }

  if (typeof params.url === 'undefined') {
    errors.push(' no URL given. Please add --url URL');
  }

  if (errors.length > 0) {
    logger.Error('Missing arguments:');
    logger.Error(errors.join('\n'));
    params.help();
    process.exit(1);
  }
};

checkParams(program);

logger.Info(`Sync mode enabled. [${program.url}] \n ---`);

const proxy = new Proxy(program.url, program.token);

proxy.ping().then(
  () => {
    watch('marketplace_builder', { recursive: true }, (event, file) => {
      shouldBeSynced(file, event) && pushFile(file, program);
    });
  },
  error => {
    logger.Error(error);
    process.exit(1);
  }
);
