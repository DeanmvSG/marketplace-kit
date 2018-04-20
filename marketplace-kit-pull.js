#!/usr/bin/env node

const program = require('commander'),
  request = require('request'),
  fs = require('fs'),
  notifier = require('node-notifier'),
  logger = require('./lib/kit').logger,
  fetchAuthData = require('./lib/settings').fetchSettings,
  yaml = require('js-yaml'),
  version = require('./package.json').version;

const fetchData = (type, authData, params) => {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: authData.url + `mp-admin/api/${type}.json`,
        qs: params,
        method: 'GET',
        headers: { UserTemporaryToken: authData.token }
      },
      (error, response, body) => {
        if (error) reject({ status: error });
        else if (response.statusCode != 200) reject({ status: response.statusCode, message: response.statusMessage });
        else resolve(body);
      }
    );
  });
};

program
  .version(version)
  .arguments('<environment>', 'Name of environment. Example: staging')
  .option('-c --config-file <config-file>', 'config file path', '.marketplace-kit')
  .option('-t --type <type>', 'item type - LiquidView', 'Page')
  .action((environment, params) => {
    process.env.CONFIG_FILE_PATH = params.configFile;
    const authData = fetchAuthData(environment);

    fetchData('discovery', authData, {}).then(
      response => {
        const types = JSON.parse(response).itemTypes.results;

        types.forEach(logger.Info);

        fetchData('items', authData, { type: params.type }).then(
          files => {
            JSON.parse(files).items.results.forEach(
              file => {
                console.log(file);
                let type = types.find(t => t.name == file.type);

                const source = new Liquid(file, type);
                fs.writeFileSync(source.path, source.output, logger.Error);
              }
            );
          },
          logger.Error);
      });
  });

const LIQUID_TEMPLATE = '---\nMETADATA---\nCONTENT';

class Liquid {
  constructor(source, type){
    this.source = source;
    this.type = type;
    this.content = source.data.content || source.data.body || '';
  }

  get path(){
    return `marketplace_builder/${this.type.path.base}/${this.source.name}.${this.type.path.ext}`;
  }

  get metadata() {
    const metadata = Object.assign(this.source.data);
    delete metadata.content;
    delete metadata.body;
    return metadata;
  }

  get output(){
    return LIQUID_TEMPLATE
      .replace('METADATA', this.serialize(this.metadata))
      .replace('CONTENT', this.content);
  }

  serialize(obj) {
    return yaml.safeDump(obj);
  }
}

program.parse(process.argv);
if (!program.args.length) {
  program.help();
  process.exit(1);
}
