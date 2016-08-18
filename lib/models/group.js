const Promise = require('bluebird');
const _ = require('lodash');
const analytics = require('../analytics');
const groupUtils = require('../utils/group');

function groupTraits(group) {
  return {
    _id: group._id,
    _type: group._type,
    name: group.name,
    machineName: group.machineName,
    members: group.members,
    admins: group.admins,
    num_members: group.members ? group.members.length : 0,
    num_admins: group.admins ? group.admins.length : 0
  };
}

function memberChanges(field, newGroup, oldGroup) {
  var oldArray = oldGroup[field] || [];
  var newArray = newGroup[field] || [];

  oldArray = oldArray.map((val) => String(val));
  newArray = newArray.map((val) => String(val));

  var added = _.difference(newArray, oldArray);
  var removed = _.difference(oldArray, newArray);

  return {added, removed};
}

// Check for user changes
module.exports = function(userIdMakingChange, time, newGroup, oldGroup) {

  var proms = [];
  // Update the user traits of all members (in case anything has changed)
  proms.push(groupUtils.updateMembers(newGroup, oldGroup));

  if (!userIdMakingChange) {
    userIdMakingChange = 'unknown';
  }

  if (newGroup && oldGroup) {
    // Check for member and admin changes
    let members = memberChanges('members', newGroup, oldGroup);
    let admins = memberChanges('admins', newGroup, oldGroup);

    let events = {
      'Member Added': members.added,
      'Member Removed': members.removed,
      'Admin Added': admins.added,
      'Admin Removed': admins.removed
    };

    for (let eventName in events) {
      let arr = events[eventName];

      for (let usr of arr) {
        console.log(eventName);
        analytics.track({
          userId: usr,
          event: eventName,
          timestamp: new Date(time),
          properties: {
            group: groupTraits(newGroup),
            userId: usr
          }
        });
      }
    }
  }

  return Promise.all(proms);
};
