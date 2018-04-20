const request = require('request');
const version = require('../../package.json').version;

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

class Proxy {
  constructor(url, token){
    this.url = url;
    this.token = token;
    this.headers = {
      Authorization: `Token ${this.token}`,
      'User-Agent': `marketplace-kit/${version}`
    };
  }

  load(params, query) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: `${this.url}/api/graph`,
          method: 'POST',
          headers: this.headers,
          json: { query: findGraphQLQuery(params, query) }
        },
        (error, resp, body) => {
          if (body.data)
            resolve(body.data);
          else {
            reject(body);
          }
        }
      );
    });
  }

  push(formData) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: `${this.url}api/marketplace_builder/marketplace_releases/sync`,
          method: 'PUT',
          headers: this.headers,
          formData: formData
        },
        (error, resp, body) => {
          resolve(body);
        }
      );
    });
  }
}

module.exports = {
  Proxy: Proxy
};
