#!/usr/bin/env node

const port = process.env.PORT || 3333;
const fs = require('fs');

const express = require('express');
const multer = require('multer');
const upload = multer();
const Proxy = require('./lib/proxy').Proxy

const app = express();

const proxy = new Proxy(process.env.MARKETPLACE_URL, process.env.MARKETPLACE_TOKEN);

app.use('/gui', express.static(__dirname + '/gui/public'));

// /api/items
// /api/itemTypes
app.get('/api/:name.json', (request, response) => {
  proxy.load(request.params.name, {type: request.query.type})
    .then(
      body => response.send(body),
      error => response.status(401).send(error.statusText)
    );
});

app.put(
  '/api/sync',
  upload.fields([{ name: 'path' }, { name: 'marketplace_builder_file_body' }]),
  (request, response) => {
    const form = {
      path: request.body.path,
      marketplace_builder_file_body: request.files.marketplace_builder_file_body[0].buffer
    };

    proxy.sync(form).then(
      body => response.send(body),
      error => response.send(error)
    );
  }
);

app.listen(port, err => {
  if (err) {
    return console.log('something wrong happened', err);
  }

  console.log(`server is listening on ${port}`);
});
