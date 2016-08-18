const Promise = require('bluebird');

const groupUtils = require('../utils/group');

function updateGroups(service) {
  if (!service) {
    return;
  }

  var groupIds = [];
  var subLevels = service.subscriberLevels || [];
  for (let subLevel of subLevels) {
    let subs = subLevel.subscribers || [];
    groupIds.push(...subs);
  }

  var groupSet = new Set(groupIds);

  return groupUtils.updateGroups([...groupSet]);
}

// Detect groups added and removed from subscriber levels, plus the service itself.
module.exports = function(userIdMakingChange, time, newService, oldService) {
  // Group Added To Subscriber Level
  // Group Removed From Subscriber Level
  // Group Added To Service
  // Group Removed From Service
  //
  // User Added To Subscriber Level
  // User Removed From Subscriber Level
  // User Added To Service
  // User Removed From Service
  console.log('Updating service');
  return Promise.all([newService, oldService].map(updateGroups));
};
