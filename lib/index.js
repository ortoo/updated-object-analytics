// If you want to access the pubsub stream you can, using
// var pubsub = require('gcloud')().pubsub();
// Credentials are taken care of already
const Promise = require('bluebird');

const HANDLERS = {
  user: require('./models/user'),
  group: require('./models/group'),
  service: require('./models/service')
};

// `data` and `attributes` are the data and attibutes from the pub/sub message.
// `message` is the raw message if you need it.
module.exports = function(data) {
  const modelType = data.modelType;

  var handler = HANDLERS[modelType];
  if (handler) {
    var prom = handler(data.userId, new Date(data.time), data.diff.newModel, data.diff.oldModel);
    Promise.resolve(prom).catch(function(err) {
      console.error(err.stack);
    });
  }
};
