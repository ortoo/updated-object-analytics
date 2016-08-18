const Promise = require('bluebird');

const analytics = require('../analytics');
const intercom = require('../intercom');
const userUtils = require('../utils/user');

// Check for user changes
module.exports = function(userIdMakingChange, time, newUser, oldUser) {
  var userId = (newUser && newUser._id) || (oldUser && oldUser._id);

  if (!userId) {
    return;
  }

  return userUtils.updateUser(userId).then(function(userTraits) {
    var proms = [];

    if (newUser && !oldUser) {
      // User created - log it!
      let user = newUser;
      let timestamp = new Date(user.created || time);
      analytics.track({
        userId: String(user._id),
        event: 'User Created',
        timestamp: timestamp,
        properties: userTraits
      });
    }

    if (oldUser && !newUser) {
      // User removed - log it!
      let user = oldUser;
      // remove from intercom
      proms.push(intercom.users.delete({id: String(userId)}));
      analytics.track({
        userId: userIdMakingChange || 'unknown',
        event: 'User Deleted',
        timestamp: time,
        properties: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          _id: String(user._id)
        }
      });
    }

    if (newUser && oldUser &&
        ((newUser.passwordHash && !oldUser.passwordHash) ||
         (newUser.registered && !oldUser.registered && !oldUser.passwordHash))) {
      // Password set
      let user = newUser;
      analytics.track({
        userId: String(user._id),
        timestamp: time,
        event: 'User Registered',
        properties: userTraits(user)
      });
    }
    return Promise.all(proms);
  });
};
