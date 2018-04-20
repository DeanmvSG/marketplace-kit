#!/usr/bin/env node

const fetchAuthData = require('./lib/settings').fetchSettings;
const port = 3333;
const agent = require('request');
const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');
const upload = multer();

const app = express();

const settings = (configFilePath = '.marketplace-kit') => {
  const config = path.resolve(process.cwd(), configFilePath);
  if (fs.existsSync(config)) {
    return JSON.parse(fs.readFileSync(config));
  } else {
    return {};
  }
};

const findGraphQLQuery = ({ name }, { type }) => {
  switch (name) {
    case 'items':
      return `{ items: cms_items(type: ${type}) { results { type name: resource_name data }}}`;
    case 'discovery':
      return '{ itemTypes: cms_discovery { results { name  path  fields  }}}';
    default:
      return '';
  }
};

app.use('/gui', express.static(__dirname + '/gui/public'));

app.get('/api/:environment/:name.json', (request, response) => {
  const authData = settings()[request.params.environment];

  load(authData, request.params, request.query).then(
    body => response.send(body),
    error => response.status(401).send(error.statusText)
  );
});

const load = (authData, params, query) => {
  return new Promise((resolve, reject) => {
    agent(
      {
        uri: `${authData.url}/api/graph`,
        method: 'POST',
        headers: { Authorization: `Token ${authData.token}` },
        json: { query: findGraphQLQuery(params, query) }
      },
      (error, resp, body) => {
        if (body.data) resolve(body.data);
        else {
          reject(body);
        }
      }
    );
  });
};

app.put(
  '/api/:environment/sync',
  upload.fields([{ name: 'path' }, { name: 'marketplace_builder_file_body' }]),
  (request, response) => {
    const authData = settings()[request.params.environment];

    const form = {
      path: request.body.path,
      marketplace_builder_file_body: request.files.marketplace_builder_file_body[0].buffer
    };

    agent(
      {
        uri: `${authData.url}api/marketplace_builder/marketplace_releases/sync`,
        method: 'PUT',
        headers: {
          Authorization: `Token ${authData.token}`,
          'User-Agent': 'marketplace-kit/2.0.1'
        },
        formData: form
      },
      (error, resp, body) => response.send(body)
    );
  }
);

app.listen(port, err => {
  if (err) {
    return console.log('something wrong happened', err);
  }

  console.log(`server is listening on ${port}`);
});
