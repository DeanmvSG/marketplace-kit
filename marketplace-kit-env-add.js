#!/usr/bin/env node

const program = require('commander'),
  fs = require('fs'),
  rl = require('readline'),
  request = require('request'),
  Proxy = require('./lib/proxy').Proxy,
  logger = require('./lib/kit').logger,
  version = require('./package.json').version;

const checkParams = params => {
  if (!params.args.length) {
    params.help();
    process.exit(1);
  }
  if (typeof params.email === 'undefined') {
    logger.Error('no email given!');
    process.exit(1);
  }
  if (typeof params.url === 'undefined') {
    logger.Error('no URL given!');
    process.exit(1);
  }

  if (params.url.slice(-1) != '/') {
    params.url = params.url + '/';
  }
};

// turn to promise
const getPassword = () => {
  return new Promise((resolve, reject) => {
    const reader = rl.createInterface({ input: process.stdin, output: process.stdout });
    reader.stdoutMuted = true;
    reader.question('Password: ', password => {
      reader.close();
      resolve(password);
    });

    reader._writeToOutput = stringToWrite => {
      (reader.stdoutMuted && reader.output.write('*')) || reader.output.write(stringToWrite);
    };
  });
};

const storeEnvironment = settings => {
  const environmentSettings = {
    [settings.endpoint]: {
      url: settings.url,
      token: settings.token,
      email: settings.email
    }
  };
  saveFile(Object.assign(existingSettings(), environmentSettings));
};

const saveFile = settings => {
  fs.writeFileSync(process.env.CONFIG_FILE_PATH, JSON.stringify(settings, null, 2), err => {
    if (err) throw err;
  });
};

const existingSettings = () => {
  if (fs.existsSync(process.env.CONFIG_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(process.env.CONFIG_FILE_PATH));
  } else {
    return {};
  }
};

program
  .version(version)
  .arguments('<environment>', 'name of environment. Example: staging')
  .option('--email <email>', 'admin account email. Example: admin@example.com')
  .option('--url <url>', 'marketplace url. Example: https://example.com')
  .option('-c --config-file <config-file>', 'config file path', '.marketplace-kit')
  .action((environment, params) => {
    process.env.CONFIG_FILE_PATH = params.configFile;
    checkParams(params);
    const proxy = new Proxy(params.url);
    getPassword().then(password => {
      proxy.login(params.email, password).then(
        body => {
          if (body.token) {
            const settings = { url: params.url, endpoint: environment, email: params.email };
            storeEnvironment(Object.assign(settings, { token: body.token }));
          } else {
            logger.Error('Error: response from server invalid, token is missing');
            process.exit(1);
          }
        }, error => {
          logger.Print('\n');
          logger.Error(error);
          process.exit(1);
        }
      );
    });
  });

program.parse(process.argv);
if (!program.args.length) {
  program.help();
  process.exit(1);
}
