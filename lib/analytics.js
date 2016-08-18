const Analytics = require('analytics-node');
const config = require('config');
module.exports = new Analytics(config.externalServices.segment.writeKey);
