#!/usr/bin/env node

const program = require('commander'),
      Proxy = require('./lib/proxy').Proxy,
      fs = require('fs'),
      logger = require('./lib/kit').logger,
      version = require('./package.json').version;

const getDeploymentStatus = (id) => {
  return new Promise((resolve, reject) => {
    (getStatus = () => {
      proxy.getStatus(id).then(
        response => {
          if (response.status === 'ready_for_import') {
            logger.Print('.');
            setTimeout(getStatus, 1500);
          } else if (response.status === 'error')
            reject(response);
          else
            resolve(response);
        },
        error => reject(error)
      );
    })();
  });
};

program
  .version(version)
  .option('--token <token>', 'authentication token', process.env.MARKETPLACE_TOKEN)
  .option('--url <url>', 'marketplace url', process.env.MARKETPLACE_URL);

program.parse(process.argv);

if (typeof program.token === 'undefined') {
  logger.Error('no TOKEN given!');
  process.exit(1);
}
if (typeof program.url === 'undefined') {
  logger.Error('no URL given!');
  process.exit(1);
}

logger.Info(`Deploying to: ${program.url}`);

const proxy = new Proxy(program.url, program.token);

const formData = {
  'marketplace_builder[force_mode]': process.env.FORCE || 'false',
  'marketplace_builder[zip_file]': fs.createReadStream('./tmp/marketplace-release.zip')
};

proxy
  .push(formData)
  .then(
    body => {
      const responseBody = JSON.parse(body);

      getDeploymentStatus(responseBody.id).then(
        response => logger.Success('\nDONE'),
        error =>{
          logger.Print('\n');
          logger.Error(error.error);
        }
      )
    },
    error => {
      logger.Info('\n');
      logger.Error(error);
      process.exit(1);
    }
  );
