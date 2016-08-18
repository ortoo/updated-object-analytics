const Promise = require('bluebird');

const userUtils = require('./user');
const db = require('../db');

exports.updateMembers = updateMembers;
exports.updateGroups = updateGroups;

function updateGroups(groupIds) {
  return db.getGroups(groupIds).then(function(groups) {
    return Promise.all(groups.map((group) => updateMembers(group)));
  });
}

function updateMembers(newGroup, oldGroup) {
  var newMembers = newGroup.members || [];
  var oldMembers = (oldGroup && oldGroup.members) || [];
  var members = new Set([...newMembers.map(String), ...oldMembers.map(String)]);
  return Promise.all([...members].map((userId) => {
    return userUtils.updateUser(userId);
  }));
}
