const config = require('config');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

// var Logger = require('mongodb').Logger;
// Logger.setLevel('info');

const dbProm = MongoClient.connect(config.mongo.dbUri);

exports.getGroupsForUser = getGroupsForUser;
exports.getServicesForGroups = getServicesForGroups;
exports.getUser = getUser;
exports.getGroupTypes = getGroupTypes;
exports.getGroups = getGroups;

function getGroups(groupIds) {
  if (!Array.isArray(groupIds)) {
    groupIds = [groupIds];
  }

  return dbProm.then((db) => {
    const groups = db.collection('groups');
    return groups.find({_id: {$in: groupIds.map((id) => new ObjectId(id))}}).toArray();
  });
}

function getGroupsForUser(userId) {
  return dbProm.then((db) => {
    const groups = db.collection('groups');
    return groups.find({members: new ObjectId(userId)}).toArray();
  });
}

function getServicesForGroups(groupIds) {

  if (!Array.isArray(groupIds)) {
    groupIds = [groupIds];
  }

  return dbProm.then((db) => {
    const services = db.collection('services');
    return services.find({
      'subscriberLevels.subscribers': {
        $in: groupIds.map((id) => new ObjectId(id))
      }
    }).toArray();
  });
}

function getGroupTypes(groupTypeIds) {
  return dbProm.then((db) => {
    const groupTypes = db.collection('grouptypes');
    return groupTypes.find({
      _id: {$in: groupTypeIds.map((id) => new ObjectId(id))}
    }).toArray();
  });
}

function getUser(userId) {
  return dbProm.then((db) => {
    const users = db.collection('users');
    return users.findOne({_id: new ObjectId(userId)});
  });
}
