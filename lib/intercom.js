const Intercom = require('intercom-client');
const config = require('config');

module.exports = new Intercom.Client(config.externalServices.intercom.appId, config.externalServices.intercom.apiKey);
