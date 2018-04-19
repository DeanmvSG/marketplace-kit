#!/usr/bin/env node

const fetchAuthData = require('./lib/settings').fetchSettings;
const port = 3333;
const agent = require('request');
const fs = require('fs');

const express = require('express');
const multer = require('multer');
const upload = multer();

const app = express();

const settings = () => {
  if (fs.existsSync(process.env.CONFIG_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(process.env.CONFIG_FILE_PATH));
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

app.use('/gui', express.static(__dirname + '/gui'));

app.get('/api/:environment/:name.json', (request, response) => {
  const authData = settings()[request.params.environment];

  agent(
    {
      uri: `${authData.url}/api/graph`,
      method: 'POST',
      headers: { Authorization: `Token ${authData.token}` },
      json: { query: findGraphQLQuery(request.params, request.query) }
    },
    (error, resp, body) => {
      response.send(body.data);
    }
  );
});

app.listen(port, err => {
  if (err) {
    return console.log('something wrong happened', err);
  }

  console.log(`server is listening on ${port}`);
});

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
          UserTemporaryToken: proces.env.USER_TEMPORARY_TOKEN
        },
        formData: form
      },
      (error, resp, body) => response.send(body)
    );
  }
);
