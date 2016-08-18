const Promise = require('bluebird');

const analytics = require('../analytics');
const intercom = require('../intercom');
const db = require('../db');

exports.getUserTraits = getUserTraits;
exports.updateUser = updateUser;

function updateUser(userId, time) {
  return getUserTraits(userId).then(function(userTraits) {

    var proms = [];
    if (userTraits) {

      // console.log(userTraits);

      if (userTraits.database_only || userTraits.num_groups === 0) {
        // remove from intercom
        console.log('Deleting', String(userId), 'from intercom');
        // proms.push(bulkIntercomDelete(String(userId)).catch((err) => {
        proms.push(intercom.users.delete({user_id: String(userId)}).catch((err) => {
          var data = JSON.parse(err.message);
          try {
            if (data.body.errors[0].message !== 'User Not Found') {
              throw err;
            }
          } catch (ex) {
            throw err;
          }
        }));
      } else {
        // Identify the change
        analytics.identify({
          timestamp: time,
          userId: String(userId),
          traits: userTraits
        });
      }
    }

    return userTraits;
  });
}

function getUserTraits(userId) {
  // Get the user's groups and then services
  return db.getUser(userId).then((user) =>{

    // console.log('Getting user', userId);

    if (!user) {
      console.log('No user', userId);
      return;
    }

    return db.getGroupsForUser(user._id).then((groups) => {
      // console.log('got groups', userId);
      return Promise.all([
        db.getServicesForGroups(groups.map((group) => group._id)),
        isDatabaseOnlyUser(groups)
      ]).then(([services, isDatabaseOnly]) => {
        // console.log('got services', userId);
        var traits = {
          name: user.firstName + ' ' + user.lastName,
          firstName: user.firstName,
          lastName: user.lastName,
          userId: String(user._id),
          email: user.email,
          createdAt: user.created && user.created.getTime(),
          registered: !!(user.passwordHash || user.registered),

          roles: JSON.stringify(getRoles(user, groups)),
          is_admin: isAdmin(user, groups),
          num_groups: groups.length,
          group_ids: JSON.stringify(groups.map(idMapper).sort()),
          group_names: JSON.stringify(groups.map(nameMapper).sort()),
          group_type_ids: JSON.stringify(typeIds(groups)),
          // groupTypeNames,
          num_services: services.length,
          service_ids: JSON.stringify(services.map(idMapper).sort()),
          service_names: JSON.stringify(services.map(nameMapper).sort()),
          service_type_ids: JSON.stringify(typeIds(services)),
          database_only: isDatabaseOnly

          // serviceTypeNames,
          // subscriberLevelIds,
          // subscriberLevelNames,
          // subscriberLevelTypeIds,
          // subscriberLevelTypeNames
        };

        if ((groups.length === 0) || isDatabaseOnly) {
          traits.unsubscribed_from_emails = true;
        }

        return traits;
      });
    });
  });
}

function nameMapper(obj) {
  return obj.name;
}

function idMapper(obj) {
  return String(obj._id);
}

function lowerCaseMapper(obj) {
  return obj.toLowerCase();
}

function typeIds(objs) {
  var set = new Set(objs.map((obj) => String(obj._type)));
  return [...set].sort();
}

function isAdmin(user, groups) {
  var userIdStr = String(user._id);
  return groups.some((group) => {
    var admins = group.admins || [];
    return admins.some((admin) => {
      return String(admin) === userIdStr;
    });
  });
}

function getRoles(user, groups) {
  return groups.reduce((roles, group) => {
    return roles.concat(getRolesForGroup(user, group));
  }, []);
}

function getRolesForGroup(user, group) {
  var userIdStr = String(user._id);
  var roles = [];

  roles = roles.concat(['chair', 'viceChair', 'clerk']
    .filter((role) => String(group[role]) === userIdStr));

  var customRoles = group.customRoles || [];

  customRoles.forEach((role) => {
    var members = role.members || [];
    if (members.some((member) => String(member) === userIdStr)) {
      roles.push(role.name);
    }
  });

  return roles
    .map(lowerCaseMapper) // Lower case
    .sort(); // Alphabeticized
}

function isDatabaseOnlyUser(groups) {
  if (!groups || groups.length === 0) {
    return Promise.resolve(false);
  }

  var groupTypeIds = new Set(groups.map((group) => group._type));
  return db.getGroupTypes([...groupTypeIds]).then(function(groupTypes) {
    // databaseOnly
    // membersDrawnFromParents
    // noWelcomeEmail
    return !groupTypes.some((gt) => {
      return !['databaseOnly', 'membersDrawnFromParents', 'noWelcomeEmail'].some((prop) => gt[prop]);
    });
  });
}
