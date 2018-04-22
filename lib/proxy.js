const request = require('request');
const version = require('../package.json').version;

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

  ping() {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: this.url + 'api/marketplace_builder/logs',
          method: 'GET',
          headers: this.headers
        },
        (error, response, body) => {
          if (error) reject({ status: error });
          else if (response.statusCode != 200)
            reject({
              status: response.statusCode,
              message: response.statusMessage
            });
          else resolve('OK');
        }
      );
    });
  };

  getStatus(id) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: this.url + 'api/marketplace_builder/marketplace_releases/' + id,
          method: 'GET',
          headers: this.headers
        },
        (error, response, body) => {
          if (error)
            reject(error);
          else
            resolve(JSON.parse(body));
        }
      );
    });
  };

  logs({ lastId }) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: this.url + 'api/marketplace_builder/logs',
          qs: { last_id: lastId },
          method: 'GET',
          headers: this.headers
        },
        (error, response, body) => {
          if (error) reject({ status: error });
          else if (response.statusCode != 200)
            reject({
              status: response.statusCode,
              message: response.statusMessage,
              body: body
            });
          else resolve(JSON.parse(body));
        }
      );
    });
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

  sync(formData) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: `${this.url}api/marketplace_builder/marketplace_releases/sync`,
          method: 'PUT',
          headers: this.headers,
          formData: formData
        },
        (error, resp, body) => {
          if (error || body != '{}')
            reject(error || body);
          else
            resolve(body);
        }
      );
    });
  }


  push(formData) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: this.url + 'api/marketplace_builder/marketplace_releases',
          method: 'POST',
          headers: this.headers,
          formData: formData
        },
        (error, resp, body) => {
          if (error)
            reject(error || body);
          else
            resolve(body);
        }
      );
    });
  }
}

module.exports = {
  Proxy: Proxy
};
